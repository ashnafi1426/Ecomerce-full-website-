/**
 * MANAGER CONTROLLER
 * 
 * Handles HTTP requests for manager operations.
 */

const managerService = require('../../services/managerServices/manager.service');

/**
 * Get manager dashboard stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    console.log('🎯 Manager controller: getDashboardStats called');
    console.log('👤 User:', req.user?.id, req.user?.role);
    
    const stats = await managerService.getDashboardStats();
    
    console.log('✅ Manager controller: Stats retrieved successfully');
    
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Manager controller error:', error);
    next(error);
  }
};

/**
 * Get pending products for approval
 */
const getPendingProducts = async (req, res, next) => {
  try {
    const { limit } = req.query;
    
    const filters = {};
    if (limit) filters.limit = parseInt(limit);
    
    const products = await managerService.getPendingProducts(filters);
    
    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('❌ Error in getPendingProducts:', error.message);
    res.status(200).json({
      success: false,
      count: 0,
      products: [],
      error: error.message
    });
  }
};

/**
 * Approve product
 */
const approveProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { comments } = req.body;
    const managerId = req.user.id;
    
    const product = await managerService.approveProduct(productId, managerId, comments);
    
    res.status(200).json({
      success: true,
      message: 'Product approved successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject product
 */
const rejectProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;
    const managerId = req.user.id;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const product = await managerService.rejectProduct(productId, managerId, reason);
    
    res.status(200).json({
      success: true,
      message: 'Product rejected',
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request product revision
 */
const requestProductRevision = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { comments } = req.body;
    const managerId = req.user.id;
    
    if (!comments) {
      return res.status(400).json({
        success: false,
        message: 'Revision comments are required'
      });
    }
    
    const product = await managerService.requestProductRevision(productId, managerId, comments);
    
    res.status(200).json({
      success: true,
      message: 'Revision requested',
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending sellers
 */
const getPendingSellers = async (req, res, next) => {
  try {
    const sellers = await managerService.getPendingSellers();
    
    res.status(200).json({
      success: true,
      count: sellers.length,
      sellers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve seller
 */
const approveSeller = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const managerId = req.user.id;
    
    const seller = await managerService.approveSeller(sellerId, managerId);
    
    res.status(200).json({
      success: true,
      message: 'Seller approved successfully',
      seller
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject seller
 */
const rejectSeller = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const { reason } = req.body;
    const managerId = req.user.id;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const seller = await managerService.rejectSeller(sellerId, managerId, reason);
    
    res.status(200).json({
      success: true,
      message: 'Seller rejected',
      seller
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { status, limit } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (limit) filters.limit = parseInt(limit);
    
    const orders = await managerService.getAllOrders(filters);
    
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders with issues
 */
const getOrdersWithIssues = async (req, res, next) => {
  try {
    const orders = await managerService.getOrdersWithIssues();
    
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolve order issue
 */
const resolveOrderIssue = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { resolution } = req.body;
    const managerId = req.user.id;
    
    if (!resolution) {
      return res.status(400).json({
        success: false,
        message: 'Resolution details are required'
      });
    }
    
    const order = await managerService.resolveOrderIssue(orderId, managerId, resolution);
    
    res.status(200).json({
      success: true,
      message: 'Order issue resolved',
      order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending disputes
 */
const getPendingDisputes = async (req, res, next) => {
  try {
    const disputes = await managerService.getPendingDisputes();
    
    res.status(200).json({
      success: true,
      count: disputes.length,
      disputes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all disputes
 */
const getDisputes = async (req, res, next) => {
  try {
    const disputes = await managerService.getDisputes();
    
    res.status(200).json({
      success: true,
      count: disputes.length,
      disputes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolve dispute
 */
const resolveDispute = async (req, res, next) => {
  try {
    const { disputeId } = req.params;
    const { resolution, comments } = req.body;
    const managerId = req.user.id;
    
    if (!resolution || !comments) {
      return res.status(400).json({
        success: false,
        message: 'Resolution and comments are required'
      });
    }
    
    const dispute = await managerService.resolveDispute(disputeId, managerId, resolution, comments);
    
    res.status(200).json({
      success: true,
      message: 'Dispute resolved',
      dispute
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Escalate dispute
 */
const escalateDispute = async (req, res, next) => {
  try {
    const { disputeId } = req.params;
    const { reason } = req.body;
    const managerId = req.user.id;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Escalation reason is required'
      });
    }
    
    const dispute = await managerService.escalateDispute(disputeId, managerId, reason);
    
    res.status(200).json({
      success: true,
      message: 'Dispute escalated to admin',
      dispute
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending returns
 */
const getPendingReturns = async (req, res, next) => {
  try {
    const returns = await managerService.getPendingReturns();
    
    res.status(200).json({
      success: true,
      count: returns.length,
      returns
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve return
 */
const approveReturn = async (req, res, next) => {
  try {
    const { returnId } = req.params;
    const { comments } = req.body;
    const managerId = req.user.id;
    
    const returnData = await managerService.approveReturn(returnId, managerId, comments);
    
    res.status(200).json({
      success: true,
      message: 'Return approved',
      return: returnData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject return
 */
const rejectReturn = async (req, res, next) => {
  try {
    const { returnId } = req.params;
    const { reason } = req.body;
    const managerId = req.user.id;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const returnData = await managerService.rejectReturn(returnId, managerId, reason);
    
    res.status(200).json({
      success: true,
      message: 'Return rejected',
      return: returnData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get activity log
 */
const getActivityLog = async (req, res, next) => {
  try {
    const managerId = req.user.id;
    const { limit } = req.query;
    
    const activities = await managerService.getActivityLog(managerId, limit ? parseInt(limit) : 50);
    
    res.status(200).json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending refunds
 */
const getPendingRefunds = async (req, res, next) => {
  try {
    const refunds = await managerService.getPendingRefunds();
    
    res.status(200).json({
      success: true,
      count: refunds.length,
      refunds
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process refund
 */
const processRefund = async (req, res, next) => {
  try {
    const { refundId } = req.params;
    const managerId = req.user.id;
    
    const refund = await managerService.processRefund(refundId, managerId);
    
    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      refund
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get support tickets
 */
const getSupportTickets = async (req, res, next) => {
  try {
    const tickets = await managerService.getSupportTickets();
    
    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Respond to support ticket
 */
const respondToTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { response } = req.body;
    const managerId = req.user.id;
    
    if (!response) {
      return res.status(400).json({
        success: false,
        message: 'Response is required'
      });
    }
    
    const ticket = await managerService.respondToTicket(ticketId, managerId, response);
    
    res.status(200).json({
      success: true,
      message: 'Response sent successfully',
      ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Close support ticket
 */
const closeTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const managerId = req.user.id;
    
    const ticket = await managerService.closeTicket(ticketId, managerId);
    
    res.status(200).json({
      success: true,
      message: 'Ticket closed successfully',
      ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get escalations
 */
const getEscalations = async (req, res, next) => {
  try {
    const escalations = await managerService.getEscalations();
    
    res.status(200).json({
      success: true,
      count: escalations.length,
      escalations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign escalation
 */
const assignEscalation = async (req, res, next) => {
  try {
    const { escalationId } = req.params;
    const { assignee } = req.body;
    const managerId = req.user.id;
    
    if (!assignee) {
      return res.status(400).json({
        success: false,
        message: 'Assignee is required'
      });
    }
    
    const escalation = await managerService.assignEscalation(escalationId, managerId, assignee);
    
    res.status(200).json({
      success: true,
      message: 'Escalation assigned successfully',
      escalation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get performance metrics
 */
const getPerformanceMetrics = async (req, res, next) => {
  try {
    const managerId = req.user.id;
    const metrics = await managerService.getPerformanceMetrics(managerId);
    
    res.status(200).json({
      success: true,
      ...metrics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller performance
 */
const getSellerPerformance = async (req, res, next) => {
  try {
    const sellers = await managerService.getSellerPerformance();
    
    res.status(200).json({
      success: true,
      count: sellers.length,
      sellers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get flagged reviews
 */
const getFlaggedReviews = async (req, res, next) => {
  try {
    const reviews = await managerService.getFlaggedReviews();
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve review
 */
const approveReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const managerId = req.user.id;
    
    const review = await managerService.approveReview(reviewId, managerId);
    
    res.status(200).json({
      success: true,
      message: 'Review approved',
      review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove review
 */
const removeReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const managerId = req.user.id;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Removal reason is required'
      });
    }
    
    const review = await managerService.removeReview(reviewId, managerId, reason);
    
    res.status(200).json({
      success: true,
      message: 'Review removed',
      review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer feedback
 */
const getCustomerFeedback = async (req, res, next) => {
  try {
    const feedback = await managerService.getCustomerFeedback();
    
    res.status(200).json({
      success: true,
      count: feedback.length,
      feedback
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// MANAGER CRUD OPERATIONS (Admin only)
// ============================================

/**
 * Get all managers (admin only)
 */
const getAllManagers = async (req, res, next) => {
  try {
    const { search, status, department, limit, offset } = req.query;
    
    const supabase = require('../../config/supabase');
    
    let query = supabase
      .from('users')
      .select('*')
      .eq('role', 'manager');
    
    // Apply filters
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (department && department !== 'all') {
      query = query.eq('manager_department', department);
    }
    
    // Apply pagination
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    if (offset) {
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit || 20) - 1);
    }
    
    // Order by created date
    query = query.order('created_at', { ascending: false });
    
    const { data: managers, error } = await query;
    
    if (error) throw error;
    
    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'manager');
    
    res.status(200).json({
      success: true,
      count: managers?.length || 0,
      totalCount: totalCount || 0,
      managers: managers || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get manager by ID (admin only)
 */
const getManagerById = async (req, res, next) => {
  try {
    const { managerId } = req.params;
    
    const supabase = require('../../config/supabase');
    
    const { data: manager, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', managerId)
      .eq('role', 'manager')
      .single();
    
    if (error || !manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }
    
    res.status(200).json({
      success: true,
      manager
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new manager (admin only)
 */
const createManager = async (req, res, next) => {
  try {
    const { 
      email, 
      password, 
      displayName, 
      phone,
      department,
      permissions = []
    } = req.body;
    
    // Validation
    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and display name are required'
      });
    }
    
    // Check if user already exists
    const supabase = require('../../config/supabase');
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create manager user
    const { data: manager, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: passwordHash,
        role: 'manager',
        display_name: displayName,
        phone,
        manager_department: department,
        manager_permissions: permissions,
        status: 'active'
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({
      success: true,
      message: 'Manager created successfully',
      manager
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update manager (admin only)
 */
const updateManager = async (req, res, next) => {
  try {
    const { managerId } = req.params;
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updates.password_hash;
    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;
    delete updates.role; // Don't allow role changes through this endpoint
    
    // Map frontend field names to database column names
    const fieldMapping = {
      displayName: 'display_name',
      department: 'manager_department',
      permissions: 'manager_permissions'
    };
    
    // Convert field names
    const dbUpdates = {};
    Object.keys(updates).forEach(key => {
      const dbColumn = fieldMapping[key] || key;
      // Only include columns that exist and are allowed to be updated
      const allowedColumns = [
        'display_name', 'phone', 'manager_department', 'manager_permissions', 'status'
      ];
      
      if (allowedColumns.includes(dbColumn)) {
        dbUpdates[dbColumn] = updates[key];
      }
    });
    
    if (Object.keys(dbUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    const supabase = require('../../config/supabase');
    
    const { data: manager, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', managerId)
      .eq('role', 'manager')
      .select()
      .single();
    
    if (error) throw error;
    
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Manager updated successfully',
      manager
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete manager (admin only)
 */
const deleteManager = async (req, res, next) => {
  try {
    const { managerId } = req.params;
    
    const supabase = require('../../config/supabase');
    
    // Check if manager exists
    const { data: manager, error: checkError } = await supabase
      .from('users')
      .select('id, email, display_name')
      .eq('id', managerId)
      .eq('role', 'manager')
      .single();
    
    if (checkError || !manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }
    
    // Check if manager has active responsibilities (optional - can be implemented later)
    // For now, we'll allow deletion
    
    // Soft delete by updating email to mark as deleted
    const deletedEmail = `deleted_${Date.now()}_${manager.email}`;
    
    const { error: deleteError } = await supabase
      .from('users')
      .update({ 
        email: deletedEmail,
        status: 'deleted'
      })
      .eq('id', managerId);
    
    if (deleteError) throw deleteError;
    
    res.status(200).json({
      success: true,
      message: 'Manager deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update manager status (admin only)
 */
const updateManagerStatus = async (req, res, next) => {
  try {
    const { managerId } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['active', 'blocked', 'deleted'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
      });
    }
    
    const supabase = require('../../config/supabase');
    
    const { data: manager, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', managerId)
      .eq('role', 'manager')
      .select()
      .single();
    
    if (error) throw error;
    
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Manager status updated to ${status}`,
      manager
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
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
  getActivityLog,
  // Manager CRUD operations
  getAllManagers,
  getManagerById,
  createManager,
  updateManager,
  deleteManager,
  updateManagerStatus
};
