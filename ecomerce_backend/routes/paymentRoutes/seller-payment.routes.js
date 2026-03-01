const express = require('express');
const { 
  getSellerEarnings,
  requestPayout,
  getSellerPayouts,
  getAllPayouts,
  approvePayout,
  rejectPayout,
  getCommissionSettings,
  updateCommissionSettings,
  getPayoutSettings,
  updatePayoutSettings
} = require('../../controllers/paymentControllers/seller-payment.controller.js');
const { authenticate } = require('../../middlewares/auth.middleware.js');
const { requireAnyRole } = require('../../middlewares/role.middleware.js');

const router = express.Router();

/**
 * SELLER PAYMENT ROUTES
 * =====================
 * Routes for sellers to manage their earnings and payouts
 */

// Get seller earnings dashboard
router.get('/earnings', authenticate, requireAnyRole(['seller']), getSellerEarnings);

// Request payout
router.post('/payouts/request', authenticate, requireAnyRole(['seller']), requestPayout);

// Get seller payouts
router.get('/payouts', authenticate, requireAnyRole(['seller']), getSellerPayouts);

/**
 * ADMIN PAYMENT ROUTES
 * ====================
 * Routes for admins to manage the payment system
 */

// Get all payouts (admin only)
router.get('/admin/payouts', authenticate, requireAnyRole(['admin']), getAllPayouts);

// Approve payout (admin only)
router.post('/admin/payouts/:id/approve', authenticate, requireAnyRole(['admin']), approvePayout);

// Reject payout (admin only)
router.post('/admin/payouts/:id/reject', authenticate, requireAnyRole(['admin']), rejectPayout);

// Get commission settings (admin only)
router.get('/admin/commission-settings', authenticate, requireAnyRole(['admin']), getCommissionSettings);

// Update commission settings (admin only)
router.put('/admin/commission-settings', authenticate, requireAnyRole(['admin']), updateCommissionSettings);

// Get payout settings (admin only)
router.get('/admin/payout-settings', authenticate, requireAnyRole(['admin']), getPayoutSettings);

// Update payout settings (admin only)
router.put('/admin/payout-settings', authenticate, requireAnyRole(['admin']), updatePayoutSettings);

module.exports = router;