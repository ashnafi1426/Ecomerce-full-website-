/**
 * SUB-ORDER CONTROLLER
 * 
 * Handles HTTP requests for sub-order operations.
 */

const subOrderService = require('../../services/subOrderServices/subOrder.service');

/**
 * Get sub-orders for a parent order
 */
const getSubOrdersByParentOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    const subOrders = await subOrderService.findByParentOrder(orderId);
    
    res.status(200).json({
      success: true,
      count: subOrders.length,
      subOrders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller's sub-orders
 */
const getSellerSubOrders = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { fulfillmentStatus, payoutStatus, limit } = req.query;
    
    const filters = {};
    if (fulfillmentStatus) filters.fulfillmentStatus = fulfillmentStatus;
    if (payoutStatus) filters.payoutStatus = payoutStatus;
    if (limit) filters.limit = parseInt(limit);
    
    const subOrders = await subOrderService.findBySeller(sellerId, filters);
    
    res.status(200).json({
      success: true,
      count: subOrders.length,
      subOrders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sub-order by ID
 */
const getSubOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const subOrder = await subOrderService.findById(id);
    
    if (!subOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sub-order not found'
      });
    }
    
    // Check authorization
    if (req.user.role === 'seller' && subOrder.seller_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this sub-order'
      });
    }
    
    res.status(200).json({
      success: true,
      subOrder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update sub-order fulfillment status (seller only)
 */
const updateFulfillmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Fulfillment status is required'
      });
    }
    
    // Check if seller owns this sub-order
    const subOrder = await subOrderService.findById(id);
    if (!subOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sub-order not found'
      });
    }
    
    if (subOrder.seller_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this sub-order'
      });
    }
    
    const updatedSubOrder = await subOrderService.updateFulfillmentStatus(id, status);
    
    res.status(200).json({
      success: true,
      message: 'Sub-order fulfillment status updated',
      subOrder: updatedSubOrder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update sub-order payout status (admin only)
 */
const updatePayoutStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Payout status is required'
      });
    }
    
    const updatedSubOrder = await subOrderService.updatePayoutStatus(id, status);
    
    res.status(200).json({
      success: true,
      message: 'Sub-order payout status updated',
      subOrder: updatedSubOrder
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubOrdersByParentOrder,
  getSellerSubOrders,
  getSubOrderById,
  updateFulfillmentStatus,
  updatePayoutStatus
};
