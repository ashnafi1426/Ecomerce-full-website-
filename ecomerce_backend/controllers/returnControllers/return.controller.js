/**
 * RETURN CONTROLLER
 * 
 * Handles HTTP requests for return/refund operations.
 */

const returnService = require('../../services/returnServices/return.service');

/**
 * Get all returns (Admin only)
 * GET /api/returns
 */
const getAllReturns = async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;
    const returns = await returnService.findAll({
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
    res.json(returns);
  } catch (error) {
    next(error);
  }
};

/**
 * Get return by ID
 * GET /api/returns/:id
 */
const getReturnById = async (req, res, next) => {
  try {
    const returnRequest = await returnService.findById(req.params.id);
    
    if (!returnRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Return request not found'
      });
    }

    // Check authorization - users can only view their own returns
    if (req.user.role !== 'admin' && returnRequest.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }
    
    res.json(returnRequest);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's returns (AMAZON-STYLE: CLEAN RETURNS LIST)
 * GET /api/returns/user/me
 */
const getMyReturns = async (req, res, next) => {
  try {
    const { status, limit } = req.query;
    const returns = await returnService.findByUserId(req.user.id, {
      status,
      limit: limit ? parseInt(limit) : undefined
    });
    res.json({
      success: true,
      returns: returns
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get returns by order ID
 * GET /api/returns/order/:orderId
 */
const getReturnsByOrder = async (req, res, next) => {
  try {
    const returns = await returnService.findByOrderId(req.params.orderId);
    
    // Check authorization - users can only view returns for their own orders
    if (req.user.role !== 'admin' && returns.length > 0 && returns[0].user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }
    
    res.json(returns);
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent returns (Admin only)
 * GET /api/returns/recent
 */
const getRecentReturns = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const returns = await returnService.getRecent(
      limit ? parseInt(limit) : 10
    );
    res.json(returns);
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending returns count (Admin only)
 * GET /api/returns/stats/pending-count
 */
const getPendingCount = async (req, res, next) => {
  try {
    const count = await returnService.getPendingCount();
    res.json({ pendingCount: count });
  } catch (error) {
    next(error);
  }
};

/**
 * Get return statistics (Admin only)
 * GET /api/returns/stats
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await returnService.getStatistics();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Create return request
 * POST /api/returns
 */
const createReturn = async (req, res, next) => {
  try {
    const { orderId, reason, refundAmount } = req.body;

    if (!orderId || !reason) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Order ID and reason are required'
      });
    }

    const returnRequest = await returnService.create({
      orderId,
      userId: req.user.id,
      reason,
      refundAmount
    });

    res.status(201).json({
      message: 'Return request created successfully',
      return: returnRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update return status (Admin only)
 * PATCH /api/returns/:id/status
 */
const updateReturnStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const returnRequest = await returnService.updateStatus(
      req.params.id,
      status,
      req.user.id
    );

    res.json({
      message: 'Return status updated successfully',
      return: returnRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve return (Admin only)
 * POST /api/returns/:id/approve
 */
const approveReturn = async (req, res, next) => {
  try {
    const { refundAmount } = req.body;

    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid refund amount is required'
      });
    }

    const returnRequest = await returnService.approve(
      req.params.id,
      req.user.id,
      refundAmount
    );

    res.json({
      message: 'Return approved successfully',
      return: returnRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject return (Admin only)
 * POST /api/returns/:id/reject
 */
const rejectReturn = async (req, res, next) => {
  try {
    const returnRequest = await returnService.reject(
      req.params.id,
      req.user.id
    );

    res.json({
      message: 'Return rejected successfully',
      return: returnRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete return (Admin only)
 * POST /api/returns/:id/complete
 */
const completeReturn = async (req, res, next) => {
  try {
    const returnRequest = await returnService.complete(
      req.params.id,
      req.user.id
    );

    res.json({
      message: 'Return completed successfully',
      return: returnRequest
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllReturns,
  getReturnById,
  getMyReturns,
  getReturnsByOrder,
  getRecentReturns,
  getPendingCount,
  getStatistics,
  createReturn,
  updateReturnStatus,
  approveReturn,
  rejectReturn,
  completeReturn
};

