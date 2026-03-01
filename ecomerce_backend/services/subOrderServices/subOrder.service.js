/**
 * SUB-ORDER SERVICE
 * 
 * Manages sub-orders for multi-vendor orders.
 * Splits orders by seller for better tracking and fulfillment.
 */

const supabase = require('../../config/supabase');

/**
 * Create sub-orders from a parent order
 * @param {String} parentOrderId - Parent order UUID
 * @param {Array} basket - Order basket items
 * @returns {Promise<Array>} Created sub-orders
 */
const createSubOrders = async (parentOrderId, basket) => {
  // Group items by seller
  const sellerGroups = {};
  
  for (const item of basket) {
    if (item.seller_id) {
      if (!sellerGroups[item.seller_id]) {
        sellerGroups[item.seller_id] = [];
      }
      sellerGroups[item.seller_id].push(item);
    }
  }

  // Create sub-orders for each seller
  const subOrders = [];
  
  for (const [sellerId, items] of Object.entries(sellerGroups)) {
    // Calculate sub-order amount
    let subOrderAmount = 0;
    for (const item of items) {
      subOrderAmount += item.price * item.quantity;
    }

    const { data, error } = await supabase
      .from('sub_orders')
      .insert([{
        parent_order_id: parentOrderId,
        seller_id: sellerId,
        items: items,
        subtotal: subOrderAmount,
        total_amount: subOrderAmount,
        fulfillment_status: 'pending',
        payout_status: 'pending'
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    subOrders.push(data);
  }

  return subOrders;
};

/**
 * Find sub-orders by parent order ID
 * @param {String} parentOrderId - Parent order UUID
 * @returns {Promise<Array>} Array of sub-orders
 */
const findByParentOrder = async (parentOrderId) => {
  const { data, error } = await supabase
    .from('sub_orders')
    .select(`
      *,
      seller:seller_id (
        id,
        display_name,
        business_name,
        email
      )
    `)
    .eq('parent_order_id', parentOrderId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Find sub-orders by seller ID
 * @param {String} sellerId - Seller UUID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of sub-orders
 */
const findBySeller = async (sellerId, filters = {}) => {
  let query = supabase
    .from('sub_orders')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (filters.fulfillmentStatus) {
    query = query.eq('fulfillment_status', filters.fulfillmentStatus);
  }

  if (filters.payoutStatus) {
    query = query.eq('payout_status', filters.payoutStatus);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Update sub-order fulfillment status
 * @param {String} id - Sub-order UUID
 * @param {String} status - New fulfillment status
 * @returns {Promise<Object>} Updated sub-order
 */
const updateFulfillmentStatus = async (id, status) => {
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid fulfillment status: ${status}`);
  }

  const updateData = {
    fulfillment_status: status,
    updated_at: new Date().toISOString()
  };

  if (status === 'shipped' || status === 'delivered') {
    updateData.fulfilled_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('sub_orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Update sub-order payout status
 * @param {String} id - Sub-order UUID
 * @param {String} status - New payout status
 * @returns {Promise<Object>} Updated sub-order
 */
const updatePayoutStatus = async (id, status) => {
  const validStatuses = ['pending', 'ready', 'processing', 'completed'];
  
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid payout status: ${status}`);
  }

  const { data, error } = await supabase
    .from('sub_orders')
    .update({
      payout_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Get sub-order by ID
 * @param {String} id - Sub-order UUID
 * @returns {Promise<Object|null>} Sub-order object or null
 */
const findById = async (id) => {
  const { data, error } = await supabase
    .from('sub_orders')
    .select(`
      *,
      seller:seller_id (
        id,
        display_name,
        business_name,
        email
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

module.exports = {
  createSubOrders,
  findByParentOrder,
  findBySeller,
  updateFulfillmentStatus,
  updatePayoutStatus,
  findById
};
