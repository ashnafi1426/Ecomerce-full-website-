/**
 * SELLER ORDER CONTROLLER
 * 
 * Handles HTTP requests for seller order management
 */

const sellerOrderService = require('../../services/sellerServices/seller-order.service');

/**
 * Get all orders for seller
 * GET /api/seller/orders
 */
const getOrders = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { fulfillment_status, limit, offset } = req.query;
    
    const filters = {
      fulfillment_status,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    };
    
    const orders = await sellerOrderService.getSellerOrders(sellerId, filters);
    
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
 * Get single order details
 * GET /api/seller/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;
    
    const order = await sellerOrderService.getOrderDetails(sellerId, id);
    
    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    if (error.message === 'Order not found or access denied') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Update order status
 * PUT /api/seller/orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const updatedOrder = await sellerOrderService.updateOrderStatus(sellerId, id, status);
    
    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder
    });
  } catch (error) {
    if (error.message.includes('Invalid status') || error.message.includes('Cannot transition')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === 'Order not found or access denied') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Add shipping information
 * PUT /api/seller/orders/:id/shipping
 */
const addShippingInfo = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;
    const { tracking_number, carrier, estimated_delivery } = req.body;
    
    if (!tracking_number || !carrier) {
      return res.status(400).json({
        success: false,
        message: 'Tracking number and carrier are required'
      });
    }
    
    const shippingInfo = {
      tracking_number,
      carrier,
      estimated_delivery
    };
    
    const updatedOrder = await sellerOrderService.addShippingInfo(sellerId, id, shippingInfo);
    
    res.status(200).json({
      success: true,
      message: 'Shipping information added successfully',
      order: updatedOrder
    });
  } catch (error) {
    if (error.message === 'Tracking number and carrier are required') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === 'Order not found or access denied') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  addShippingInfo
};
