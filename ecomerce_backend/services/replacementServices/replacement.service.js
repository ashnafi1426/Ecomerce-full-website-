/**
 * REPLACEMENT SERVICE
 * 
 * Business logic layer for product replacement operations.
 * Handles replacement request creation, approval workflow, shipment tracking, and analytics.
 * 
 * Requirements: 4.1, 4.2, 4.6, 4.7, 4.8, 4.18, 4.22
 */

const supabase = require('../../config/supabase');
const variantInventoryService = require('../variantServices/variantInventory.service');
const inventoryService = require('../inventoryServices/inventory.service');

/**
 * Create replacement request
 * @param {String} orderId - Order UUID
 * @param {String} customerId - Customer UUID
 * @param {Object} requestData - Reason, images, product details
 * @returns {Promise<Object>} Created replacement request
 */
async function createReplacementRequest(orderId, customerId, requestData) {
  // Validate required fields
  if (!requestData.product_id) {
    throw new Error('Product ID is required');
  }
  
  if (!requestData.reason_category) {
    throw new Error('Reason category is required');
  }
  
  if (!requestData.reason_description) {
    throw new Error('Reason description is required');
  }
  
  // Validate reason category
  const validReasons = ['defective_product', 'wrong_item', 'damaged_shipping', 'missing_parts', 'other'];
  if (!validReasons.includes(requestData.reason_category)) {
    throw new Error('Invalid reason category');
  }
  
  // Validate image limit (max 5)
  if (requestData.images && requestData.images.length > 5) {
    throw new Error('Maximum 5 images allowed');
  }
  
  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, seller_id, status, created_at, basket')
    .eq('id', orderId)
    .single();
  
  if (orderError || !order) {
    throw new Error('Order not found');
  }
  
  // Verify customer owns the order
  if (order.user_id !== customerId) {
    throw new Error('Unauthorized to create replacement request for this order');
  }
  
  // Verify order is delivered
  if (order.status !== 'delivered') {
    throw new Error('Can only request replacement for delivered orders');
  }
  
  // Check 30-day window
  const orderDate = new Date(order.created_at);
  const now = new Date();
  const daysSinceOrder = (now - orderDate) / (1000 * 60 * 60 * 24);
  
  if (daysSinceOrder > 30) {
    throw new Error('Replacement request window has expired (30 days from delivery)');
  }
  
  // Get product details
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, title, seller_id, is_returnable')
    .eq('id', requestData.product_id)
    .single();
  
  if (productError || !product) {
    throw new Error('Product not found');
  }
  
  // Check if product is returnable
  if (product.is_returnable === false) {
    throw new Error('This product is marked as final sale and cannot be replaced');
  }
  
  // Determine seller_id
  let sellerId = product.seller_id || order.seller_id;
  
  // If variant_id provided, validate it
  if (requestData.variant_id) {
    const { data: variant } = await supabase
      .from('product_variants')
      .select('id, product_id')
      .eq('id', requestData.variant_id)
      .single();
    
    if (!variant || variant.product_id !== requestData.product_id) {
      throw new Error('Invalid variant for this product');
    }
  }
  
  // Create replacement request
  const { data: replacement, error: replacementError } = await supabase
    .from('replacement_requests')
    .insert([{
      order_id: orderId,
      customer_id: customerId,
      seller_id: sellerId,
      product_id: requestData.product_id,
      variant_id: requestData.variant_id || null,
      quantity: requestData.quantity || 1,
      reason_category: requestData.reason_category,
      reason_description: requestData.reason_description,
      images: requestData.images || [],
      status: 'pending'
    }])
    .select(`
      *,
      product:products(id, title, image_url),
      customer:users!replacement_requests_customer_id_fkey(id, full_name, email),
      seller:users!replacement_requests_seller_id_fkey(id, full_name, email)
    `)
    .single();
  
  if (replacementError) throw replacementError;
  
  return replacement;
}

/**
 * Get replacement request by ID
 * @param {String} requestId - Request UUID
 * @returns {Promise<Object|null>} Replacement request object
 */
async function getReplacementRequest(requestId) {
  const { data, error } = await supabase
    .from('replacement_requests')
    .select(`
      *,
      product:products(id, title, image_url, price),
      variant:product_variants(id, variant_name, sku, attributes),
      customer:users!replacement_requests_customer_id_fkey(id, full_name, email),
      seller:users!replacement_requests_seller_id_fkey(id, full_name, email),
      shipment:replacement_shipments(*)
    `)
    .eq('id', requestId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
}

/**
 * Approve replacement request (Manager)
 * @param {String} requestId - Request UUID
 * @param {String} managerId - Manager UUID
 * @returns {Promise<Object>} Updated request object
 */
async function approveReplacement(requestId, managerId) {
  // Get replacement request
  const replacement = await getReplacementRequest(requestId);
  
  if (!replacement) {
    throw new Error('Replacement request not found');
  }
  
  if (replacement.status !== 'pending') {
    throw new Error(`Cannot approve replacement with status: ${replacement.status}`);
  }
  
  // Reserve inventory for replacement
  try {
    await reserveReplacementInventory(requestId);
  } catch (error) {
    throw new Error(`Cannot approve replacement: ${error.message}`);
  }
  
  // Update replacement status
  const { data, error } = await supabase
    .from('replacement_requests')
    .update({
      status: 'approved',
      reviewed_by: managerId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select(`
      *,
      product:products(id, title, image_url),
      customer:users!replacement_requests_customer_id_fkey(id, full_name, email),
      seller:users!replacement_requests_seller_id_fkey(id, full_name, email)
    `)
    .single();
  
  if (error) throw error;
  
  return data;
}

/**
 * Reject replacement request (Manager)
 * @param {String} requestId - Request UUID
 * @param {String} managerId - Manager UUID
 * @param {String} reason - Rejection reason
 * @returns {Promise<Object>} Updated request object
 */
async function rejectReplacement(requestId, managerId, reason) {
  // Get replacement request
  const replacement = await getReplacementRequest(requestId);
  
  if (!replacement) {
    throw new Error('Replacement request not found');
  }
  
  if (replacement.status !== 'pending') {
    throw new Error(`Cannot reject replacement with status: ${replacement.status}`);
  }
  
  if (!reason) {
    throw new Error('Rejection reason is required');
  }
  
  // Update replacement status
  const { data, error } = await supabase
    .from('replacement_requests')
    .update({
      status: 'rejected',
      reviewed_by: managerId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select(`
      *,
      product:products(id, title, image_url),
      customer:users!replacement_requests_customer_id_fkey(id, full_name, email),
      seller:users!replacement_requests_seller_id_fkey(id, full_name, email)
    `)
    .single();
  
  if (error) throw error;
  
  return data;
}

/**
 * Update replacement shipment tracking
 * @param {String} requestId - Request UUID
 * @param {Object} shipmentData - Tracking info
 * @returns {Promise<Object>} Updated shipment object
 */
async function updateReplacementShipment(requestId, shipmentData) {
  // Get replacement request
  const replacement = await getReplacementRequest(requestId);
  
  if (!replacement) {
    throw new Error('Replacement request not found');
  }
  
  if (replacement.status !== 'approved' && replacement.status !== 'shipped') {
    throw new Error('Can only update shipment for approved replacements');
  }
  
  // Check if shipment record exists
  const { data: existingShipment } = await supabase
    .from('replacement_shipments')
    .select('id')
    .eq('replacement_request_id', requestId)
    .single();
  
  let shipment;
  
  if (existingShipment) {
    // Update existing shipment
    const { data, error } = await supabase
      .from('replacement_shipments')
      .update({
        tracking_number: shipmentData.tracking_number || null,
        carrier: shipmentData.carrier || null,
        shipped_at: shipmentData.shipped_at || new Date().toISOString(),
        estimated_delivery: shipmentData.estimated_delivery || null,
        delivered_at: shipmentData.delivered_at || null,
        notes: shipmentData.notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('replacement_request_id', requestId)
      .select()
      .single();
    
    if (error) throw error;
    shipment = data;
  } else {
    // Create new shipment record
    const { data, error } = await supabase
      .from('replacement_shipments')
      .insert([{
        replacement_request_id: requestId,
        tracking_number: shipmentData.tracking_number || null,
        carrier: shipmentData.carrier || null,
        shipped_at: shipmentData.shipped_at || new Date().toISOString(),
        estimated_delivery: shipmentData.estimated_delivery || null,
        delivered_at: shipmentData.delivered_at || null,
        notes: shipmentData.notes || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    shipment = data;
  }
  
  // Update replacement status to shipped if tracking number provided
  if (shipmentData.tracking_number && replacement.status === 'approved') {
    await supabase
      .from('replacement_requests')
      .update({
        status: 'shipped',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
  }
  
  // Update to completed if delivered
  if (shipmentData.delivered_at) {
    await supabase
      .from('replacement_requests')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
  }
  
  return shipment;
}

/**
 * Get replacement analytics
 * @param {Object} filters - Date range, seller, status
 * @returns {Promise<Object>} Analytics data
 */
async function getReplacementAnalytics(filters = {}) {
  let query = supabase
    .from('replacement_requests')
    .select('*');
  
  if (filters.sellerId) {
    query = query.eq('seller_id', filters.sellerId);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  
  const { data: replacements, error } = await query;
  
  if (error) throw error;
  
  if (!replacements || replacements.length === 0) {
    return {
      total_requests: 0,
      pending_count: 0,
      approved_count: 0,
      rejected_count: 0,
      completed_count: 0,
      common_reasons: {}
    };
  }
  
  // Calculate statistics
  const totalRequests = replacements.length;
  const pendingCount = replacements.filter(r => r.status === 'pending').length;
  const approvedCount = replacements.filter(r => r.status === 'approved').length;
  const rejectedCount = replacements.filter(r => r.status === 'rejected').length;
  const completedCount = replacements.filter(r => r.status === 'completed').length;
  
  // Count reasons
  const reasonCounts = {};
  replacements.forEach(r => {
    reasonCounts[r.reason_category] = (reasonCounts[r.reason_category] || 0) + 1;
  });
  
  return {
    total_requests: totalRequests,
    pending_count: pendingCount,
    approved_count: approvedCount,
    rejected_count: rejectedCount,
    completed_count: completedCount,
    approval_rate: ((approvedCount / totalRequests) * 100).toFixed(1),
    rejection_rate: ((rejectedCount / totalRequests) * 100).toFixed(1),
    common_reasons: reasonCounts
  };
}

/**
 * Reserve inventory for approved replacement
 * @param {String} requestId - Request UUID
 * @returns {Promise<void>}
 */
async function reserveReplacementInventory(requestId) {
  const replacement = await getReplacementRequest(requestId);
  
  if (!replacement) {
    throw new Error('Replacement request not found');
  }
  
  // Reserve inventory based on whether it's a variant or regular product
  if (replacement.variant_id) {
    await variantInventoryService.reserveInventory(replacement.variant_id, replacement.quantity);
  } else {
    await inventoryService.reserveInventory(replacement.product_id, replacement.quantity);
  }
}

module.exports = {
  createReplacementRequest,
  getReplacementRequest,
  approveReplacement,
  rejectReplacement,
  updateReplacementShipment,
  getReplacementAnalytics,
  reserveReplacementInventory
};