const express = require('express');
const router = express.Router();
const sellerBalanceController = require('../../controllers/sellerBalanceControllers/sellerBalance.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireSeller, requireAdmin } = require('../../middlewares/role.middleware');

// Seller routes
router.get('/api/seller/balance', authenticate, requireSeller, sellerBalanceController.getOwnBalance);
router.get('/api/seller/balance/history', authenticate, requireSeller, sellerBalanceController.getBalanceHistory);

// Admin routes
router.get('/api/admin/seller-balances', authenticate, requireAdmin, sellerBalanceController.getAllBalances);
router.get('/api/admin/seller-balances/:sellerId', authenticate, requireAdmin, sellerBalanceController.getSellerBalance);

module.exports = router;
