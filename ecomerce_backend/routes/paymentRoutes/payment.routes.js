const express = require('express');
const router = express.Router();
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// Import payment controller functions
// Note: These are ES6 modules, so we need to use dynamic import
let paymentController;

// Load the ES6 module controller
(async () => {
  paymentController = await import('../../controllers/paymentControllers/payment.controller.js');
})();

// ============================================
// CUSTOMER/GUEST PAYMENT ROUTES
// ============================================

// Create payment intent (can be guest or authenticated)
// Use optionalAuthenticate to attach user if logged in, but allow guests
router.post('/create-intent', optionalAuthenticate, async (req, res) => {
  if (!paymentController) {
    return res.status(503).json({ error: 'Service initializing, please try again' });
  }
  return paymentController.createPaymentIntent(req, res);
});

// Create order after payment success (no webhooks)
// Use optionalAuthenticate to attach user if logged in, but allow guests
router.post('/create-order', optionalAuthenticate, async (req, res) => {
  if (!paymentController) {
    return res.status(503).json({ error: 'Service initializing, please try again' });
  }
  return paymentController.createOrderAfterPayment(req, res);
});

// Get payment status
router.get('/:paymentIntentId', async (req, res) => {
  if (!paymentController) {
    return res.status(503).json({ error: 'Service initializing, please try again' });
  }
  return paymentController.getPaymentStatus(req, res);
});

// Cancel payment (requires authentication)
router.post('/:paymentIntentId/cancel', authenticate, async (req, res) => {
  if (!paymentController) {
    return res.status(503).json({ error: 'Service initializing, please try again' });
  }
  return paymentController.cancelPayment(req, res);
});

// ============================================
// ADMIN PAYMENT ROUTES
// ============================================

// Get all payments (admin only)
router.get('/admin/payments', authenticate, requireAdmin, async (req, res) => {
  if (!paymentController) {
    return res.status(503).json({ error: 'Service initializing, please try again' });
  }
  return paymentController.getAllPayments(req, res);
});

// Get payment statistics (admin only)
router.get('/admin/payments/statistics', authenticate, requireAdmin, async (req, res) => {
  if (!paymentController) {
    return res.status(503).json({ error: 'Service initializing, please try again' });
  }
  return paymentController.getPaymentStatistics(req, res);
});

// Process refund (admin only)
router.post('/admin/payments/:id/refund', authenticate, requireAdmin, async (req, res) => {
  if (!paymentController) {
    return res.status(503).json({ error: 'Service initializing, please try again' });
  }
  return paymentController.processRefund(req, res);
});

module.exports = router;
