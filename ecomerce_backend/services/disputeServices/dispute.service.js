/**
 * DISPUTE SERVICE
 * 
 * Handles dispute creation and resolution for orders.
 * Customers and sellers can create disputes, managers resolve them.
 */

const supabase = require('../../config/supabase');

/**
 * Create dispute
 * 
 * @param {String} customerId - Customer UUID
 * @param {Object} disputeData - Dispute data
 * @returns {Promise<Object>} Created dispute
 */
const createDispute = async (customerId, disputeData) => {
  // Verify order belongs to customer
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', disputeData.orderId)
    .eq('user_id', customerId)
    .single();
  
  if (!order) {
    throw new Error('Order not found or does not belong to you');
  }
  
  const { data, error } = await supabase
    .from('disputes')
    .insert([{
      customer_id: customerId,
      order_id: disputeData.orderId,
      seller_id: order.seller_id,
      reason: disputeData.reason,
      description: disputeData.description,
      requested_resolution: disputeData.requestedResolution,
      evidence: disputeData.evidence || null
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  // Notify seller if exists
  if (order.seller_id) {
    await supabase.rpc('create_notification', {
      p_user_id: order.seller_id,
      p_type: 'dispute_created',
      p_title: 'New Dispute Filed',
      p_message: `A customer has filed a dispute for order #${order.id.substring(0, 8)}`,
      p_data: { dispute_id: data.id, order_id: order.id },
      p_priority: 'high'
    });
  }
  
  return data;
};

/**
 * Get dispute by ID
 * 
 * @param {String} disputeId - Dispute UUID
 * @returns {Promise<Object|null>} Dispute object or null
 */
const findById = async (disputeId) => {
  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      customer:customer_id (id, display_name, email),
      seller:seller_id (id, display_name, business_name, email),
      order:order_id (id, amount, status)
    `)
    .eq('id', disputeId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Get customer disputes
 * 
 * @param {String} customerId - Customer UUID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of disputes
 */
const getCustomerDisputes = async (customerId, filters = {}) => {
  let query = supabase
    .from('disputes')
    .select(`
      *,
      order:order_id (id, amount, status)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get seller disputes
 * 
 * @param {String} sellerId - Seller UUID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of disputes
 */
const getSellerDisputes = async (sellerId, filters = {}) => {
  let query = supabase
    .from('disputes')
    .select(`
      *,
      customer:customer_id (id, display_name, email),
      order:order_id (id, amount, status)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get all disputes (manager/admin only)
 * 
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of disputes
 */
const getAllDisputes = async (filters = {}) => {
  let query = supabase
    .from('disputes')
    .select(`
      *,
      customer:customer_id (id, display_name, email),
      seller:seller_id (id, display_name, business_name, email),
      order:order_id (id, amount, status)
    `)
    .order('created_at', { ascending: false });
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Update dispute status
 * 
 * @param {String} disputeId - Dispute UUID
 * @param {String} status - New status
 * @returns {Promise<Object>} Updated dispute
 */
const updateStatus = async (disputeId, status) => {
  const { data, error } = await supabase
    .from('disputes')
    .update({ status })
    .eq('id', disputeId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Resolve dispute (manager only)
 * 
 * @param {String} disputeId - Dispute UUID
 * @param {String} managerId - Manager UUID
 * @param {String} resolution - Resolution decision
 * @param {String} comments - Resolution comments
 * @returns {Promise<Object>} Updated dispute
 */
const resolveDispute = async (disputeId, managerId, resolution, comments) => {
  const { data, error } = await supabase
    .from('disputes')
    .update({
      status: 'resolved',
      resolution,
      resolution_comments: comments,
      resolved_by: managerId,
      resolved_at: new Date().toISOString()
    })
    .eq('id', disputeId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Notify customer
  await supabase.rpc('create_notification', {
    p_user_id: data.customer_id,
    p_type: 'dispute_resolved',
    p_title: 'Dispute Resolved',
    p_message: `Your dispute has been resolved. Resolution: ${resolution}`,
    p_data: { dispute_id: disputeId },
    p_priority: 'high'
  });
  
  // Notify seller if exists
  if (data.seller_id) {
    await supabase.rpc('create_notification', {
      p_user_id: data.seller_id,
      p_type: 'dispute_resolved',
      p_title: 'Dispute Resolved',
      p_message: `A dispute has been resolved. Resolution: ${resolution}`,
      p_data: { dispute_id: disputeId },
      p_priority: 'high'
    });
  }
  
  return data;
};

/**
 * Add comment to dispute
 * 
 * @param {String} disputeId - Dispute UUID
 * @param {String} userId - User UUID
 * @param {String} comment - Comment text
 * @returns {Promise<Object>} Updated dispute
 */
const addComment = async (disputeId, userId, comment) => {
  // Get current dispute
  const dispute = await findById(disputeId);
  if (!dispute) {
    throw new Error('Dispute not found');
  }
  
  // Add comment to evidence/comments array
  const comments = dispute.evidence?.comments || [];
  comments.push({
    user_id: userId,
    comment,
    timestamp: new Date().toISOString()
  });
  
  const { data, error } = await supabase
    .from('disputes')
    .update({
      evidence: {
        ...dispute.evidence,
        comments
      }
    })
    .eq('id', disputeId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Get dispute statistics
 * 
 * @returns {Promise<Object>} Dispute statistics
 */
const getStatistics = async () => {
  const { data: disputes, error } = await supabase
    .from('disputes')
    .select('status');
  
  if (error) throw error;
  
  const stats = {
    total: disputes.length,
    pending: 0,
    in_review: 0,
    resolved: 0,
    closed: 0
  };
  
  disputes.forEach(dispute => {
    if (dispute.status === 'pending') stats.pending++;
    else if (dispute.status === 'in_review') stats.in_review++;
    else if (dispute.status === 'resolved') stats.resolved++;
    else if (dispute.status === 'closed') stats.closed++;
  });
  
  return stats;
};

module.exports = {
  createDispute,
  findById,
  getCustomerDisputes,
  getSellerDisputes,
  getAllDisputes,
  updateStatus,
  resolveDispute,
  addComment,
  getStatistics
};
