/**
 * MANAGER SERVICE
 * 
 * Business logic for manager-specific operations including:
 * - Product approval workflow
 * - Seller verification
 * - Dispute resolution
 * - Return/refund approval
 * - Platform oversight
 */

const supabase = require('../../config/supabase');

/**
 * Log manager action
 * 
 * @param {String} managerId - Manager UUID
 * @param {String} actionType - Type of action
 * @param {String} entityType - Entity type (product, seller, order, etc.)
 * @param {String} entityId - Entity UUID
 * @param {Object} details - Additional details
 * @returns {Promise<Object>} Created action log
 */
const logAction = async (managerId, actionType, entityType, entityId, details = {}) => {
  const { data, error } = await supabase
    .from('manager_actions')
    .insert([{
      manager_id: managerId,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      details
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Get pending products for approval
 * 
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of pending products
 */
const getPendingProducts = async (filters = {}) => {
  let query = supabase
    .from('products')
    .select(`
      *,
      users:seller_id (id, display_name, business_name, email)
    `)
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: true });
  
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Approve product
 * 
 * @param {String} productId - Product UUID
 * @param {String} managerId - Manager UUID
 * @param {String} comments - Approval comments (optional)
 * @returns {Promise<Object>} Updated product
 */
const approveProduct = async (productId, managerId, comments = null) => {
  // Update product status
  const { data: product, error } = await supabase
    .from('products')
    .update({
      approval_status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: managerId,
      status: 'active' // Make product active when approved
    })
    .eq('id', productId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log approval
  await supabase
    .from('product_approvals')
    .insert([{
      product_id: productId,
      reviewer_id: managerId,
      action: 'approved',
      comments
    }]);
  
  // Log manager action
  await logAction(managerId, 'approve_product', 'product', productId, { comments });
  
  // Notify seller
  await supabase.rpc('create_notification', {
    p_user_id: product.seller_id,
    p_type: 'product_approved',
    p_title: 'Product Approved',
    p_message: `Your product "${product.title}" has been approved and is now live.`,
    p_data: { product_id: productId },
    p_priority: 'normal'
  });
  
  return product;
};

/**
 * Reject product
 * 
 * @param {String} productId - Product UUID
 * @param {String} managerId - Manager UUID
 * @param {String} reason - Rejection reason
 * @returns {Promise<Object>} Updated product
 */
const rejectProduct = async (productId, managerId, reason) => {
  // Update product status
  const { data: product, error } = await supabase
    .from('products')
    .update({
      approval_status: 'rejected',
      approved_at: new Date().toISOString(),
      approved_by: managerId,
      rejection_reason: reason,
      status: 'inactive' // Make product inactive when rejected
    })
    .eq('id', productId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log rejection
  await supabase
    .from('product_approvals')
    .insert([{
      product_id: productId,
      reviewer_id: managerId,
      action: 'rejected',
      comments: reason
    }]);
  
  // Log manager action
  await logAction(managerId, 'reject_product', 'product', productId, { reason });
  
  // Notify seller
  await supabase.rpc('create_notification', {
    p_user_id: product.seller_id,
    p_type: 'product_rejected',
    p_title: 'Product Rejected',
    p_message: `Your product "${product.title}" was rejected. Reason: ${reason}`,
    p_data: { product_id: productId },
    p_priority: 'high'
  });
  
  return product;
};

/**
 * Request product revision
 * 
 * @param {String} productId - Product UUID
 * @param {String} managerId - Manager UUID
 * @param {String} comments - Revision comments
 * @returns {Promise<Object>} Updated product
 */
const requestProductRevision = async (productId, managerId, comments) => {
  // Update product status
  const { data: product, error } = await supabase
    .from('products')
    .update({
      approval_status: 'revision_requested',
      approved_by: managerId,
      rejection_reason: comments
    })
    .eq('id', productId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log revision request
  await supabase
    .from('product_approvals')
    .insert([{
      product_id: productId,
      reviewer_id: managerId,
      action: 'revision_requested',
      comments
    }]);
  
  // Log manager action
  await logAction(managerId, 'request_revision', 'product', productId, { comments });
  
  // Notify seller
  await supabase.rpc('create_notification', {
    p_user_id: product.seller_id,
    p_type: 'product_revision',
    p_title: 'Product Revision Requested',
    p_message: `Revision requested for "${product.title}". Comments: ${comments}`,
    p_data: { product_id: productId },
    p_priority: 'normal'
  });
  
  return product;
};

/**
 * Get pending seller verifications
 * 
 * @returns {Promise<Array>} Array of pending sellers
 */
const getPendingSellers = async () => {
  const { data, error} = await supabase
    .from('users')
    .select(`
      *,
      seller_documents!seller_documents_seller_id_fkey (*)
    `)
    .eq('role', 'seller')
    .eq('seller_verification_status', 'pending')
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get all orders for oversight
 * 
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of orders
 */
const getAllOrders = async (filters = {}) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      users:user_id (id, display_name, email)
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
 * Get pending disputes
 * 
 * @returns {Promise<Array>} Array of pending disputes
 */
const getPendingDisputes = async () => {
  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      users:customer_id (id, display_name, email),
      orders (id, amount)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Resolve dispute
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
  
  // Log manager action
  await logAction(managerId, 'resolve_dispute', 'dispute', disputeId, { resolution, comments });
  
  // Notify customer
  await supabase.rpc('create_notification', {
    p_user_id: data.customer_id,
    p_type: 'dispute_resolved',
    p_title: 'Dispute Resolved',
    p_message: `Your dispute has been resolved. Resolution: ${resolution}`,
    p_data: { dispute_id: disputeId },
    p_priority: 'high'
  });
  
  return data;
};

/**
 * Get pending returns
 * 
 * @returns {Promise<Array>} Array of pending returns
 */
const getPendingReturns = async () => {
  const { data, error } = await supabase
    .from('returns')
    .select(`
      *,
      users:user_id (id, display_name, email),
      orders (id, amount)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Approve return
 * 
 * @param {String} returnId - Return UUID
 * @param {String} managerId - Manager UUID
 * @param {String} comments - Approval comments
 * @returns {Promise<Object>} Updated return
 */
const approveReturn = async (returnId, managerId, comments = null) => {
  const { data, error } = await supabase
    .from('returns')
    .update({
      status: 'approved',
      approved_by: managerId,
      approved_at: new Date().toISOString(),
      admin_notes: comments
    })
    .eq('id', returnId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log manager action
  await logAction(managerId, 'approve_return', 'return', returnId, { comments });
  
  // Notify customer
  await supabase.rpc('create_notification', {
    p_user_id: data.user_id,
    p_type: 'return_approved',
    p_title: 'Return Approved',
    p_message: 'Your return request has been approved. Refund will be processed shortly.',
    p_data: { return_id: returnId },
    p_priority: 'normal'
  });
  
  return data;
};

/**
 * Reject return
 * 
 * @param {String} returnId - Return UUID
 * @param {String} managerId - Manager UUID
 * @param {String} reason - Rejection reason
 * @returns {Promise<Object>} Updated return
 */
const rejectReturn = async (returnId, managerId, reason) => {
  const { data, error } = await supabase
    .from('returns')
    .update({
      status: 'rejected',
      approved_by: managerId,
      approved_at: new Date().toISOString(),
      admin_notes: reason
    })
    .eq('id', returnId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log manager action
  await logAction(managerId, 'reject_return', 'return', returnId, { reason });
  
  // Notify customer
  await supabase.rpc('create_notification', {
    p_user_id: data.user_id,
    p_type: 'return_rejected',
    p_title: 'Return Rejected',
    p_message: `Your return request was rejected. Reason: ${reason}`,
    p_data: { return_id: returnId },
    p_priority: 'high'
  });
  
  return data;
};

/**
 * Get manager dashboard stats
 * 
 * @returns {Promise<Object>} Dashboard statistics
 */
const getDashboardStats = async () => {
  try {
    console.log('🔍 Manager service: Getting dashboard stats...');
    
    // Simple stats with error handling for each query
    const stats = {
      pendingProducts: 0,
      pendingSellers: 0,
      activeDisputes: 0,
      pendingReturns: 0,
      ordersWithIssues: 0,
      pendingRefunds: 0,
      openTickets: 0,
      escalations: 0,
      recentActivity: []
    };

    try {
      // Pending products
      const { count: pendingProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');
      stats.pendingProducts = pendingProducts || 0;
      console.log('✅ Pending products:', stats.pendingProducts);
    } catch (err) {
      console.warn('⚠️ Error getting pending products:', err.message);
    }

    try {
      // Pending sellers
      const { count: pendingSellers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'seller')
        .eq('seller_verification_status', 'pending');
      stats.pendingSellers = pendingSellers || 0;
      console.log('✅ Pending sellers:', stats.pendingSellers);
    } catch (err) {
      console.warn('⚠️ Error getting pending sellers:', err.message);
    }

    try {
      // Active disputes (check if disputes table exists)
      const { count: activeDisputes } = await supabase
        .from('disputes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      stats.activeDisputes = activeDisputes || 0;
      console.log('✅ Active disputes:', stats.activeDisputes);
    } catch (err) {
      console.warn('⚠️ Error getting disputes (table may not exist):', err.message);
    }

    try {
      // Pending returns
      const { count: pendingReturns } = await supabase
        .from('returns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      stats.pendingReturns = pendingReturns || 0;
      console.log('✅ Pending returns:', stats.pendingReturns);
    } catch (err) {
      console.warn('⚠️ Error getting returns:', err.message);
    }

    try {
      // Orders with issues
      const { count: ordersWithIssues } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['cancelled', 'refunded', 'disputed']);
      stats.ordersWithIssues = ordersWithIssues || 0;
      console.log('✅ Orders with issues:', stats.ordersWithIssues);
    } catch (err) {
      console.warn('⚠️ Error getting orders with issues:', err.message);
    }

    // Add some mock recent activity
    stats.recentActivity = [
      {
        icon: '✅',
        description: 'Product approval completed',
        time: '2 hours ago'
      },
      {
        icon: '🏪',
        description: 'New seller verification pending',
        time: '4 hours ago'
      },
      {
        icon: '📦',
        description: 'Return request processed',
        time: '6 hours ago'
      }
    ];

    console.log('✅ Manager dashboard stats compiled successfully:', stats);
    return stats;
    
  } catch (error) {
    console.error('❌ Error in getDashboardStats:', error);
    // Return default stats instead of throwing error
    return {
      pendingProducts: 0,
      pendingSellers: 0,
      activeDisputes: 0,
      pendingReturns: 0,
      ordersWithIssues: 0,
      pendingRefunds: 0,
      openTickets: 0,
      escalations: 0,
      recentActivity: [
        {
          icon: '⚠️',
          description: 'Error loading dashboard data',
          time: 'Just now'
        }
      ]
    };
  }
};

/**
 * Get manager activity log
 * 
 * @param {String} managerId - Manager UUID
 * @param {Number} limit - Number of records to retrieve
 * @returns {Promise<Array>} Array of manager actions
 */
const getActivityLog = async (managerId, limit = 50) => {
  const { data, error } = await supabase
    .from('manager_actions')
    .select('*')
    .eq('manager_id', managerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Approve seller
 */
const approveSeller = async (sellerId, managerId) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      seller_verification_status: 'approved',
      seller_verified_at: new Date().toISOString(),
      seller_verified_by: managerId
    })
    .eq('id', sellerId)
    .select()
    .single();
  
  if (error) throw error;
  
  await logAction(managerId, 'approve_seller', 'seller', sellerId);
  
  return data;
};

/**
 * Reject seller
 */
const rejectSeller = async (sellerId, managerId, reason) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      seller_verification_status: 'rejected',
      seller_verified_at: new Date().toISOString(),
      seller_verified_by: managerId,
      seller_rejection_reason: reason
    })
    .eq('id', sellerId)
    .select()
    .single();
  
  if (error) throw error;
  
  await logAction(managerId, 'reject_seller', 'seller', sellerId, { reason });
  
  return data;
};

/**
 * Get orders with issues
 */
const getOrdersWithIssues = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .in('status', ['cancelled', 'refunded', 'disputed'])
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Resolve order issue
 */
const resolveOrderIssue = async (orderId, managerId, resolution) => {
  const { data, error } = await supabase
    .from('orders')
    .update({
      manager_notes: resolution,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single();
  
  if (error) throw error;
  
  await logAction(managerId, 'resolve_order_issue', 'order', orderId, { resolution });
  
  return data;
};

/**
 * Get all disputes
 */
const getDisputes = async () => {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Escalate dispute
 */
const escalateDispute = async (disputeId, managerId, reason) => {
  const { data, error } = await supabase
    .from('disputes')
    .update({
      status: 'escalated',
      escalated_by: managerId,
      escalated_at: new Date().toISOString(),
      escalation_reason: reason
    })
    .eq('id', disputeId)
    .select()
    .single();
  
  if (error) throw error;
  
  await logAction(managerId, 'escalate_dispute', 'dispute', disputeId, { reason });
  
  return data;
};

/**
 * Get pending refunds
 */
const getPendingRefunds = async () => {
  // Mock data for now - implement with actual refunds table
  return [];
};

/**
 * Process refund
 */
const processRefund = async (refundId, managerId) => {
  // Mock implementation - implement with actual refunds table
  await logAction(managerId, 'process_refund', 'refund', refundId);
  return { id: refundId, status: 'processed' };
};

/**
 * Get support tickets
 */
const getSupportTickets = async () => {
  // Mock data for now - implement with actual support_tickets table
  return [];
};

/**
 * Respond to ticket
 */
const respondToTicket = async (ticketId, managerId, response) => {
  // Mock implementation - implement with actual support_tickets table
  await logAction(managerId, 'respond_to_ticket', 'ticket', ticketId, { response });
  return { id: ticketId, status: 'responded' };
};

/**
 * Close ticket
 */
const closeTicket = async (ticketId, managerId) => {
  // Mock implementation - implement with actual support_tickets table
  await logAction(managerId, 'close_ticket', 'ticket', ticketId);
  return { id: ticketId, status: 'closed' };
};

/**
 * Get escalations
 */
const getEscalations = async () => {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .eq('status', 'escalated')
    .order('escalated_at', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Assign escalation
 */
const assignEscalation = async (escalationId, managerId, assignee) => {
  // Mock implementation - implement with actual escalations table
  await logAction(managerId, 'assign_escalation', 'escalation', escalationId, { assignee });
  return { id: escalationId, assignee };
};

/**
 * Get performance metrics
 */
const getPerformanceMetrics = async (managerId) => {
  // Mock data for now - implement with actual metrics
  return {
    tasksCompleted: 45,
    avgResponseTime: '2.3h',
    resolutionRate: '94.5',
    satisfaction: '4.8'
  };
};

/**
 * Get seller performance
 */
const getSellerPerformance = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'seller')
    .eq('seller_verification_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get flagged reviews
 */
const getFlaggedReviews = async () => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_flagged', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Approve review
 */
const approveReview = async (reviewId, managerId) => {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      is_flagged: false,
      moderated_by: managerId,
      moderated_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .select()
    .single();
  
  if (error) throw error;
  
  await logAction(managerId, 'approve_review', 'review', reviewId);
  
  return data;
};

/**
 * Remove review
 */
const removeReview = async (reviewId, managerId, reason) => {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      is_deleted: true,
      deleted_by: managerId,
      deleted_at: new Date().toISOString(),
      deletion_reason: reason
    })
    .eq('id', reviewId)
    .select()
    .single();
  
  if (error) throw error;
  
  await logAction(managerId, 'remove_review', 'review', reviewId, { reason });
  
  return data;
};

/**
 * Get customer feedback
 */
const getCustomerFeedback = async () => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (error) throw error;
  
  return data || [];
};

module.exports = {
  logAction,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  requestProductRevision,
  getPendingSellers,
  approveSeller,
  rejectSeller,
  getAllOrders,
  getOrdersWithIssues,
  resolveOrderIssue,
  getPendingDisputes,
  getDisputes,
  resolveDispute,
  escalateDispute,
  getPendingReturns,
  approveReturn,
  rejectReturn,
  getPendingRefunds,
  processRefund,
  getSupportTickets,
  respondToTicket,
  closeTicket,
  getEscalations,
  assignEscalation,
  getPerformanceMetrics,
  getSellerPerformance,
  getFlaggedReviews,
  approveReview,
  removeReview,
  getCustomerFeedback,
  getDashboardStats,
  getActivityLog
};
