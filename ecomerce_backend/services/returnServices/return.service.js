/**
 * RETURN SERVICE
 * 
 * Business logic layer for return/refund operations.
 * Handles return requests and processing.
 */

const supabase = require('../../config/supabase');

/**
 * Find return by ID
 * @param {String} id - Return UUID
 * @returns {Promise<Object|null>} Return object or null
 */
const findById = async (id) => {
  const { data, error } = await supabase
    .from('returns')
    .select(`
      *,
      order:orders(id, amount, created_at),
      user:users(email, display_name)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Find returns by user ID (AMAZON-STYLE: CLEAN RETURNS LIST)
 * @param {String} userId - User UUID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of return objects with order details
 */
const findByUserId = async (userId, filters = {}) => {
  let query = supabase
    .from('returns')
    .select(`
      *,
      order:orders(id, amount, created_at, order_number)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  
  if (error) {
    // If returns table doesn't exist or user_id column missing, return empty array
    console.error('Returns query error:', error.message);
    return [];
  }
  
  return data || [];
};

/**
 * Find returns by order ID
 * @param {String} orderId - Order UUID
 * @returns {Promise<Array>} Array of return objects
 */
const findByOrderId = async (orderId) => {
  const { data, error } = await supabase
    .from('returns')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get all returns (admin only)
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of return objects
 */
const findAll = async (filters = {}) => {
  let query = supabase
    .from('returns')
    .select(`
      *,
      order:orders(id, amount, created_at),
      user:users(email, display_name),
      processor:users!processed_by(display_name)
    `)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Create return request
 * @param {Object} returnData - Return data
 * @returns {Promise<Object>} Created return object
 */
const create = async (returnData) => {
  const { data, error } = await supabase
    .from('returns')
    .insert([{
      order_id: returnData.orderId,
      user_id: returnData.userId,
      reason: returnData.reason,
      status: 'pending',
      refund_amount: returnData.refundAmount || null
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Update return status
 * @param {String} id - Return UUID
 * @param {String} status - New status
 * @param {String} adminId - Admin user ID (optional)
 * @returns {Promise<Object>} Updated return object
 */
const updateStatus = async (id, status, adminId = null) => {
  const updateData = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'approved' || status === 'rejected' || status === 'completed') {
    updateData.processed_at = new Date().toISOString();
    if (adminId) {
      updateData.processed_by = adminId;
    }
  }

  const { data, error } = await supabase
    .from('returns')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Approve return
 * @param {String} id - Return UUID
 * @param {String} adminId - Admin user ID
 * @param {Number} refundAmount - Refund amount
 * @returns {Promise<Object>} Updated return object
 */
const approve = async (id, adminId, refundAmount) => {
  const { data, error } = await supabase
    .from('returns')
    .update({
      status: 'approved',
      refund_amount: refundAmount,
      processed_at: new Date().toISOString(),
      processed_by: adminId
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Reject return
 * @param {String} id - Return UUID
 * @param {String} adminId - Admin user ID
 * @returns {Promise<Object>} Updated return object
 */
const reject = async (id, adminId) => {
  return await updateStatus(id, 'rejected', adminId);
};

/**
 * Complete return (refund processed)
 * @param {String} id - Return UUID
 * @param {String} adminId - Admin user ID
 * @returns {Promise<Object>} Updated return object
 */
const complete = async (id, adminId) => {
  return await updateStatus(id, 'completed', adminId);
};

/**
 * Get pending returns count
 * @returns {Promise<Number>} Count of pending returns
 */
const getPendingCount = async () => {
  const { count, error } = await supabase
    .from('returns')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  
  if (error) throw error;
  
  return count || 0;
};

/**
 * Get return statistics
 * @returns {Promise<Object>} Return statistics
 */
const getStatistics = async () => {
  const { data: returns, error } = await supabase
    .from('returns')
    .select('status, refund_amount');
  
  if (error) throw error;
  
  const stats = {
    total_returns: returns.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    total_refund_amount: 0
  };

  returns.forEach(ret => {
    if (ret.status === 'pending') stats.pending++;
    else if (ret.status === 'approved') stats.approved++;
    else if (ret.status === 'rejected') stats.rejected++;
    else if (ret.status === 'completed') stats.completed++;
    
    if (ret.refund_amount) {
      stats.total_refund_amount += ret.refund_amount;
    }
  });
  
  return stats;
};

/**
 * Get recent returns
 * @param {Number} limit - Number of returns to retrieve
 * @returns {Promise<Array>} Array of recent returns
 */
const getRecent = async (limit = 10) => {
  const { data, error } = await supabase
    .from('returns')
    .select(`
      *,
      order:orders(id, amount),
      user:users(email, display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return data || [];
};

module.exports = {
  findById,
  findByUserId,
  findByOrderId,
  findAll,
  create,
  updateStatus,
  approve,
  reject,
  complete,
  getPendingCount,
  getStatistics,
  getRecent
};
