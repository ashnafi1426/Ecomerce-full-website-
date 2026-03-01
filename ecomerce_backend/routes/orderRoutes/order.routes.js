/**
 * ORDER ROUTES
 * 
 * Routes for order creation and management.
 */

const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/orderControllers/order.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireCustomer, requireAdmin } = require('../../middlewares/role.middleware');

// ============================================
// CUSTOMER ROUTES
// ============================================

// Create order from cart
router.post('/api/orders', authenticate, requireCustomer, orderController.createOrder);

// Get customer's orders
router.get('/api/orders', authenticate, requireCustomer, orderController.getMyOrders);

// Get order by ID
router.get('/api/orders/:id', authenticate, orderController.getOrderById);

// Cancel order
router.post('/api/orders/:id/cancel', authenticate, requireCustomer, orderController.cancelOrder);

// Get invoice
router.get('/api/orders/:id/invoice', authenticate, orderController.getInvoice);

// Get order refund history
router.get('/api/orders/:id/refunds', authenticate, orderController.getOrderRefunds);

// Get order with refund details
router.get('/api/orders/:id/with-refunds', authenticate, orderController.getOrderWithRefunds);

// Check refund eligibility
router.get('/api/orders/:id/refund-eligibility', authenticate, orderController.checkRefundEligibility);

// NOTE: Admin order routes are now in adminRoutes/admin.routes.js
// This prevents route conflicts and keeps admin routes centralized

module.exports = router;
