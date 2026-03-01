/**
 * APPROVAL CONTROLLER
 * 
 * HTTP request handlers for Amazon-style product approval workflow
 */

const approvalService = require('../../services/approvalServices/approval.service');

/**
 * Get manager's approval queue
 * GET /api/manager/approvals/queue
 */
const getApprovalQueue = async (req, res, next) => {
  try {
    const managerId = req.user.id;
    const { limit, offset } = req.query;

    const filters = {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    };

    const products = await approvalService.getManagerApprovalQueue(managerId, filters);

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error getting approval queue:', error);
    next(error);
  }
};

/**
 * Approve product
 * POST /api/manager/approvals/:productId/approve
 */
const approveProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const managerId = req.user.id;
    const { notes } = req.body;

    const data = {
      notes,
      ipAddress: req.ip
    };

    const product = await approvalService.approveProduct(productId, managerId, data);

    res.json({
      message: 'Product approved successfully',
      product
    });
  } catch (error) {
    console.error('Error approving product:', error);
    
    if (error.message.includes('permission')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Reject product
 * POST /api/manager/approvals/:productId/reject
 */
const rejectProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const managerId = req.user.id;
    const { reason, notes } = req.body;

    if (!reason) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Rejection reason is required'
      });
    }

    const data = {
      reason,
      notes,
      ipAddress: req.ip
    };

    const product = await approvalService.rejectProduct(productId, managerId, data);

    res.json({
      message: 'Product rejected',
      product
    });
  } catch (error) {
    console.error('Error rejecting product:', error);
    
    if (error.message.includes('permission')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Request changes on product
 * POST /api/manager/approvals/:productId/request-changes
 */
const requestChanges = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const managerId = req.user.id;
    const { reason, notes } = req.body;

    if (!reason) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Change request reason is required'
      });
    }

    const data = {
      reason,
      notes,
      ipAddress: req.ip
    };

    const product = await approvalService.requestChanges(productId, managerId, data);

    res.json({
      message: 'Changes requested',
      product
    });
  } catch (error) {
    console.error('Error requesting changes:', error);
    
    if (error.message.includes('permission')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Get approval history for a product
 * GET /api/manager/approvals/:productId/history
 */
const getApprovalHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const history = await approvalService.getApprovalHistory(productId);

    res.json({
      count: history.length,
      history
    });
  } catch (error) {
    console.error('Error getting approval history:', error);
    next(error);
  }
};

/**
 * Get manager approval statistics
 * GET /api/manager/approvals/stats
 */
const getApprovalStats = async (req, res, next) => {
  try {
    const managerId = req.user.id;

    const stats = await approvalService.getManagerApprovalStats(managerId);

    res.json({
      data: stats
    });
  } catch (error) {
    console.error('Error getting approval stats:', error);
    next(error);
  }
};

/**
 * Admin: Get all pending products
 * GET /api/admin/approvals/all-pending
 */
const getAllPendingProducts = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const filters = {
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0
    };

    const products = await approvalService.getAllPendingProducts(filters);

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error getting all pending products:', error);
    next(error);
  }
};

module.exports = {
  getApprovalQueue,
  approveProduct,
  rejectProduct,
  requestChanges,
  getApprovalHistory,
  getApprovalStats,
  getAllPendingProducts
};
