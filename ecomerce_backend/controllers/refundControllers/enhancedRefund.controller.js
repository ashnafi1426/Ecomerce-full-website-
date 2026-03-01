const enhancedRefundService = require('../../services/refundServices/enhancedRefund.service');

/**
 * Enhanced Refund Controller
 * Handles HTTP requests for refund operations
 * Implements Requirements 5.1, 5.2, 5.10, 5.16
 */

/**
 * Create refund request
 * POST /api/v1/refunds
 * Implements Requirement 5.1
 */
const createRefundRequest = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { order_id, refund_amount, reason_category, reason_description, images } = req.body;

    // Validation
    if (!order_id || !refund_amount || !reason_category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: order_id, refund_amount, reason_category'
      });
    }

    const refund = await enhancedRefundService.createRefundRequest(
      order_id,
      customerId,
      { refund_amount, reason_category, reason_description, images }
    );

    res.status(201).json({
      success: true,
      message: 'Refund request created successfully',
      data: refund
    });
  } catch (error) {
    console.error('Error in createRefundRequest:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create refund request'
    });
  }
};

/**
 * Process partial refund
 * POST /api/v1/refunds/:id/process-partial
 * Implements Requirement 5.2 (Manager only)
 */
const processPartialRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const managerId = req.user.id;
    const { amount, reason } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount is required'
      });
    }

    const refund = await enhancedRefundService.processPartialRefund(
      id,
      managerId,
      amount,
      reason
    );

    res.status(200).json({
      success: true,
      message: 'Partial refund processed successfully',
      data: refund
    });
  } catch (error) {
    console.error('Error in processPartialRefund:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process partial refund'
    });
  }
};

/**
 * Process full refund
 * POST /api/v1/refunds/:id/process-full
 * Implements Requirement 5.2 (Manager only)
 */
const processFullRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const managerId = req.user.id;

    const refund = await enhancedRefundService.processFullRefund(id, managerId);

    res.status(200).json({
      success: true,
      message: 'Full refund processed successfully',
      data: refund
    });
  } catch (error) {
    console.error('Error in processFullRefund:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process full refund'
    });
  }
};

/**
 * Get refund request by ID
 * GET /api/v1/refunds/:id
 */
const getRefundRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const refund = await enhancedRefundService.getRefundById(id);

    // Authorization check
    if (userRole !== 'manager' && userRole !== 'admin') {
      if (refund.customer_id !== userId && refund.seller_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this refund'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: refund
    });
  } catch (error) {
    console.error('Error in getRefundRequest:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get refund request'
    });
  }
};

/**
 * Get all refunds with filters
 * GET /api/v1/refunds
 */
const getAllRefunds = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page, limit, status } = req.query;

    const filters = { page, limit, status };

    // Role-based filtering
    if (userRole === 'customer') {
      filters.customerId = userId;
    } else if (userRole === 'seller') {
      filters.sellerId = userId;
    }
    // Managers and admins can see all refunds

    const result = await enhancedRefundService.getAllRefunds(filters);

    res.status(200).json({
      success: true,
      data: result.refunds,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getAllRefunds:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get refunds'
    });
  }
};

/**
 * Get refund analytics
 * GET /api/v1/refunds/analytics
 * Implements Requirement 5.10 (Manager only)
 */
const getRefundAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, sellerId, reason } = req.query;

    const analytics = await enhancedRefundService.getRefundAnalytics({
      startDate,
      endDate,
      sellerId,
      reason
    });

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error in getRefundAnalytics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get refund analytics'
    });
  }
};

/**
 * Issue goodwill refund
 * POST /api/v1/refunds/goodwill
 * Implements Requirement 5.16 (Manager only)
 */
const issueGoodwillRefund = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { order_id, amount, reason } = req.body;

    if (!order_id || !amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: order_id, amount, reason'
      });
    }

    const refund = await enhancedRefundService.issueGoodwillRefund(
      order_id,
      managerId,
      amount,
      reason
    );

    res.status(201).json({
      success: true,
      message: 'Goodwill refund issued successfully',
      data: refund
    });
  } catch (error) {
    console.error('Error in issueGoodwillRefund:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to issue goodwill refund'
    });
  }
};

/**
 * Reject refund request
 * POST /api/v1/refunds/:id/reject
 * (Manager only)
 */
const rejectRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const managerId = req.user.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const refund = await enhancedRefundService.rejectRefund(id, managerId, reason);

    res.status(200).json({
      success: true,
      message: 'Refund request rejected',
      data: refund
    });
  } catch (error) {
    console.error('Error in rejectRefund:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject refund'
    });
  }
};

module.exports = {
  createRefundRequest,
  processPartialRefund,
  processFullRefund,
  getRefundRequest,
  getAllRefunds,
  getRefundAnalytics,
  issueGoodwillRefund,
  rejectRefund
};
