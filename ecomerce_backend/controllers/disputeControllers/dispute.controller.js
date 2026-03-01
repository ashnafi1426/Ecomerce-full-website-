/**
 * DISPUTE CONTROLLER
 * 
 * Handles HTTP requests for dispute operations.
 */

const disputeService = require('../../services/disputeServices/dispute.service');

/**
 * Create dispute
 */
const createDispute = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { orderId, reason, description, requestedResolution, evidence } = req.body;
    
    if (!orderId || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, reason, and description are required'
      });
    }
    
    const dispute = await disputeService.createDispute(customerId, {
      orderId,
      reason,
      description,
      requestedResolution,
      evidence
    });
    
    res.status(201).json({
      success: true,
      message: 'Dispute created successfully',
      dispute
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dispute by ID
 */
const getDisputeById = async (req, res, next) => {
  try {
    const { disputeId } = req.params;
    
    const dispute = await disputeService.findById(disputeId);
    
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }
    
    // Check authorization
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'admin' && userRole !== 'manager') {
      if (dispute.customer_id !== userId && dispute.seller_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this dispute'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      dispute
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user disputes
 */
const getUserDisputes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, limit } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (limit) filters.limit = parseInt(limit);
    
    let disputes;
    
    if (userRole === 'seller') {
      disputes = await disputeService.getSellerDisputes(userId, filters);
    } else if (userRole === 'customer') {
      disputes = await disputeService.getCustomerDisputes(userId, filters);
    } else if (userRole === 'admin' || userRole === 'manager') {
      disputes = await disputeService.getAllDisputes(filters);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
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
 * Add comment to dispute
 */
const addComment = async (req, res, next) => {
  try {
    const { disputeId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    
    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }
    
    const dispute = await disputeService.addComment(disputeId, userId, comment);
    
    res.status(200).json({
      success: true,
      message: 'Comment added',
      dispute
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dispute statistics (admin only)
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await disputeService.getStatistics();
    
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDispute,
  getDisputeById,
  getUserDisputes,
  addComment,
  getStatistics
};
