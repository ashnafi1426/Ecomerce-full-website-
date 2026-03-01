/**
 * APPROVAL SERVICE
 * 
 * Business logic for Amazon-style product approval workflow
 */

const supabase = require('../../config/supabase');

/**
 * Get manager's approval queue
 * Only shows products from stores they manage with PENDING_APPROVAL status
 * 
 * @param {String} managerId - Manager UUID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Pending products
 */
const getManagerApprovalQueue = async (managerId, filters = {}) => {
  try {
    // Get stores managed by this manager
    const { data: managedStores, error: storesError } = await supabase
      .from('store_managers')
      .select('store_id')
      .eq('manager_id', managerId)
      .eq('status', 'active')
      .eq('can_approve_products', true);
    
    if (storesError) throw storesError;
    
    if (!managedStores || managedStores.length === 0) {
      return [];
    }
    
    const storeIds = managedStores.map(sm => sm.store_id);
    
    // Get pending products from managed stores
    let query = supabase
      .from('products')
      .select(`
        *,
        stores!inner (
          id,
          store_name,
          seller_id,
          users!stores_seller_id_fkey (
            email,
            display_name
          )
        )
      `)
      .in('store_id', storeIds)
      .eq('approval_status', 'PENDING_APPROVAL')
      .order('submitted_at', { ascending: true });
    
    // Apply filters
    if (filters.limit) {
      query = query.limit(parseInt(filters.limit));
    }
    
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }
    
    const { data: products, error } = await query;
    
    if (error) throw error;
    
    // Calculate time pending for each product
    const productsWithMetrics = (products || []).map(product => ({
      ...product,
      hours_pending: product.submitted_at 
        ? Math.floor((Date.now() - new Date(product.submitted_at).getTime()) / (1000 * 60 * 60))
        : 0,
      seller_name: product.stores?.users?.display_name || 'Unknown',
      seller_email: product.stores?.users?.email || 'Unknown',
      store_name: product.stores?.store_name || 'Unknown'
    }));
    
    return productsWithMetrics;
  } catch (error) {
    console.error('Error getting manager approval queue:', error);
    throw error;
  }
};

/**
 * Approve product
 * 
 * @param {String} productId - Product UUID
 * @param {String} managerId - Manager UUID
 * @param {Object} data - Approval data
 * @returns {Promise<Object>} Updated product
 */
const approveProduct = async (productId, managerId, data = {}) => {
  try {
    // Get product with store info
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, stores!inner(id, seller_id)')
      .eq('id', productId)
      .single();
    
    if (productError) throw productError;
    if (!product) throw new Error('Product not found');
    
    // Verify manager has permission for this store
    const { data: managerAssignment, error: assignmentError } = await supabase
      .from('store_managers')
      .select('*')
      .eq('manager_id', managerId)
      .eq('store_id', product.store_id)
      .eq('status', 'active')
      .eq('can_approve_products', true)
      .single();
    
    if (assignmentError || !managerAssignment) {
      throw new Error('You do not have permission to approve products for this store');
    }
    
    // Update product status
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        approval_status: 'APPROVED',
        approved_by: managerId,
        approved_at: new Date().toISOString(),
        status: 'active', // Make product active
        rejection_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Log approval action
    await supabase.rpc('log_approval_action', {
      p_product_id: productId,
      p_store_id: product.store_id,
      p_action: 'APPROVED',
      p_previous_status: product.approval_status,
      p_new_status: 'APPROVED',
      p_performed_by: managerId,
      p_performer_role: 'manager',
      p_notes: data.notes || null,
      p_ip_address: data.ipAddress || null
    });
    
    // Send notification to seller
    await supabase.rpc('send_approval_notification', {
      p_product_id: productId,
      p_approval_id: null,
      p_recipient_id: product.stores.seller_id,
      p_recipient_role: 'seller',
      p_notification_type: 'PRODUCT_APPROVED',
      p_title: 'Product Approved',
      p_message: `Your product "${product.title}" has been approved and is now live!`
    });
    
    return updatedProduct;
  } catch (error) {
    console.error('Error approving product:', error);
    throw error;
  }
};

/**
 * Reject product
 * 
 * @param {String} productId - Product UUID
 * @param {String} managerId - Manager UUID
 * @param {Object} data - Rejection data
 * @returns {Promise<Object>} Updated product
 */
const rejectProduct = async (productId, managerId, data) => {
  try {
    if (!data.reason) {
      throw new Error('Rejection reason is required');
    }
    
    // Get product with store info
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, stores!inner(id, seller_id)')
      .eq('id', productId)
      .single();
    
    if (productError) throw productError;
    if (!product) throw new Error('Product not found');
    
    // Verify manager has permission for this store
    const { data: managerAssignment, error: assignmentError } = await supabase
      .from('store_managers')
      .select('*')
      .eq('manager_id', managerId)
      .eq('store_id', product.store_id)
      .eq('status', 'active')
      .eq('can_reject_products', true)
      .single();
    
    if (assignmentError || !managerAssignment) {
      throw new Error('You do not have permission to reject products for this store');
    }
    
    // Update product status
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        approval_status: 'REJECTED',
        rejection_reason: data.reason,
        status: 'inactive', // Make product inactive
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Log rejection action
    await supabase.rpc('log_approval_action', {
      p_product_id: productId,
      p_store_id: product.store_id,
      p_action: 'REJECTED',
      p_previous_status: product.approval_status,
      p_new_status: 'REJECTED',
      p_performed_by: managerId,
      p_performer_role: 'manager',
      p_reason: data.reason,
      p_notes: data.notes || null,
      p_ip_address: data.ipAddress || null
    });
    
    // Send notification to seller
    await supabase.rpc('send_approval_notification', {
      p_product_id: productId,
      p_approval_id: null,
      p_recipient_id: product.stores.seller_id,
      p_recipient_role: 'seller',
      p_notification_type: 'PRODUCT_REJECTED',
      p_title: 'Product Rejected',
      p_message: `Your product "${product.title}" was rejected. Reason: ${data.reason}`
    });
    
    return updatedProduct;
  } catch (error) {
    console.error('Error rejecting product:', error);
    throw error;
  }
};

/**
 * Request changes on product
 * 
 * @param {String} productId - Product UUID
 * @param {String} managerId - Manager UUID
 * @param {Object} data - Changes request data
 * @returns {Promise<Object>} Updated product
 */
const requestChanges = async (productId, managerId, data) => {
  try {
    if (!data.reason) {
      throw new Error('Change request reason is required');
    }
    
    // Get product with store info
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, stores!inner(id, seller_id)')
      .eq('id', productId)
      .single();
    
    if (productError) throw productError;
    if (!product) throw new Error('Product not found');
    
    // Verify manager has permission
    const { data: managerAssignment, error: assignmentError } = await supabase
      .from('store_managers')
      .select('*')
      .eq('manager_id', managerId)
      .eq('store_id', product.store_id)
      .eq('status', 'active')
      .single();
    
    if (assignmentError || !managerAssignment) {
      throw new Error('You do not have permission to manage products for this store');
    }
    
    // Update product status
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        approval_status: 'CHANGES_REQUESTED',
        rejection_reason: data.reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Log action
    await supabase.rpc('log_approval_action', {
      p_product_id: productId,
      p_store_id: product.store_id,
      p_action: 'CHANGES_REQUESTED',
      p_previous_status: product.approval_status,
      p_new_status: 'CHANGES_REQUESTED',
      p_performed_by: managerId,
      p_performer_role: 'manager',
      p_reason: data.reason,
      p_notes: data.notes || null,
      p_ip_address: data.ipAddress || null
    });
    
    // Send notification to seller
    await supabase.rpc('send_approval_notification', {
      p_product_id: productId,
      p_approval_id: null,
      p_recipient_id: product.stores.seller_id,
      p_recipient_role: 'seller',
      p_notification_type: 'CHANGES_REQUESTED',
      p_title: 'Changes Requested',
      p_message: `Changes requested for "${product.title}". Reason: ${data.reason}`
    });
    
    return updatedProduct;
  } catch (error) {
    console.error('Error requesting changes:', error);
    throw error;
  }
};

/**
 * Get approval history for a product
 * 
 * @param {String} productId - Product UUID
 * @returns {Promise<Array>} Approval history
 */
const getApprovalHistory = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('product_approvals')
      .select(`
        *,
        users!product_approvals_performed_by_fkey (
          email,
          display_name
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting approval history:', error);
    throw error;
  }
};

/**
 * Get approval statistics for manager
 * 
 * @param {String} managerId - Manager UUID
 * @returns {Promise<Object>} Statistics
 */
const getManagerApprovalStats = async (managerId) => {
  try {
    // Get managed stores
    const { data: managedStores } = await supabase
      .from('store_managers')
      .select('store_id')
      .eq('manager_id', managerId)
      .eq('status', 'active');
    
    if (!managedStores || managedStores.length === 0) {
      return {
        pending_count: 0,
        approved_today: 0,
        rejected_today: 0,
        avg_approval_time_hours: 0
      };
    }
    
    const storeIds = managedStores.map(sm => sm.store_id);
    
    // Get pending count
    const { count: pendingCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .in('store_id', storeIds)
      .eq('approval_status', 'PENDING_APPROVAL');
    
    // Get today's approvals
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: approvedToday } = await supabase
      .from('product_approvals')
      .select('*', { count: 'exact', head: true })
      .in('store_id', storeIds)
      .eq('action', 'APPROVED')
      .eq('performed_by', managerId)
      .gte('created_at', today.toISOString());
    
    const { count: rejectedToday } = await supabase
      .from('product_approvals')
      .select('*', { count: 'exact', head: true })
      .in('store_id', storeIds)
      .eq('action', 'REJECTED')
      .eq('performed_by', managerId)
      .gte('created_at', today.toISOString());
    
    return {
      pending_count: pendingCount || 0,
      approved_today: approvedToday || 0,
      rejected_today: rejectedToday || 0,
      managed_stores_count: managedStores.length
    };
  } catch (error) {
    console.error('Error getting manager approval stats:', error);
    throw error;
  }
};

/**
 * Admin: Get all pending products across all stores
 * 
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} All pending products
 */
const getAllPendingProducts = async (filters = {}) => {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        stores!inner (
          id,
          store_name,
          seller_id,
          users!stores_seller_id_fkey (
            email,
            display_name
          )
        )
      `)
      .eq('approval_status', 'PENDING_APPROVAL')
      .order('submitted_at', { ascending: true });
    
    if (filters.limit) {
      query = query.limit(parseInt(filters.limit));
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting all pending products:', error);
    throw error;
  }
};

module.exports = {
  getManagerApprovalQueue,
  approveProduct,
  rejectProduct,
  requestChanges,
  getApprovalHistory,
  getManagerApprovalStats,
  getAllPendingProducts
};
