/**
 * SUB-ORDER ROUTES
 * 
 * Routes for sub-order operations.
 */

const express = require('express');
const router = express.Router();
const subOrderController = require('../../controllers/subOrderControllers/subOrder.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireSeller, requireAdmin } = require('../../middlewares/role.middleware');

// ============================================
// SUB-ORDER ROUTES
// ============================================

// Get sub-orders for a parent order (customer, seller, admin)
router.get('/api/orders/:orderId/sub-orders', authenticate, subOrderController.getSubOrdersByParentOrder);

// Get seller's sub-orders
router.get('/api/seller/sub-orders', authenticate, requireSeller, subOrderController.getSellerSubOrders);

// Get sub-order by ID
router.get('/api/sub-orders/:id', authenticate, subOrderController.getSubOrderById);

// Update sub-order fulfillment status (seller only)
router.patch('/api/seller/sub-orders/:id/fulfillment', authenticate, requireSeller, subOrderController.updateFulfillmentStatus);

// Update sub-order payout status (admin only)
router.patch('/api/admin/sub-orders/:id/payout', authenticate, requireAdmin, subOrderController.updatePayoutStatus);

module.exports = router;
