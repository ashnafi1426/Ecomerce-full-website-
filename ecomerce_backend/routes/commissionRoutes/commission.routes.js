const express = require('express');
const router = express.Router();
const { 
  getCommissionSettings,
  updateCommissionSettings,
  getCommissionAnalytics,
  getSellerCommissionDetails
} = require('../../controllers/commissionControllers/commission.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

/**
 * COMMISSION ROUTES
 * =================
 * 
 * Admin Routes:
 * - GET /api/admin/commission-settings - Get commission configuration
 * - PUT /api/admin/commission-settings - Update commission rates and tiers
 * - GET /api/admin/commission-analytics - Get commission analytics and reports
 * 
 * Seller Routes:
 * - GET /api/seller/commission-details - Get seller's commission info and tier
 */

// ==========================================
// ADMIN COMMISSION ROUTES
// ==========================================

/**
 * @route   GET /api/admin/commission-settings
 * @desc    Get current commission settings and tier configuration
 * @access  Admin only
 */
router.get('/admin/commission-settings', 
  authenticate, 
  requireRole('admin'), 
  getCommissionSettings
);

/**
 * @route   PUT /api/admin/commission-settings
 * @desc    Update commission rates, tiers, and thresholds
 * @access  Admin only
 * @body    {
 *            default_rate: number,
 *            category_rates: object,
 *            seller_tier_rates: {
 *              bronze: number,
 *              silver: number,
 *              gold: number,
 *              platinum: number
 *            },
 *            tier_thresholds: {
 *              bronze: { min: number, max: number },
 *              silver: { min: number, max: number },
 *              gold: { min: number, max: number },
 *              platinum: { min: number, max: null }
 *            }
 *          }
 */
router.put('/admin/commission-settings', 
  authenticate, 
  requireRole('admin'), 
  updateCommissionSettings
);

/**
 * @route   GET /api/admin/commission-analytics
 * @desc    Get commission analytics and reporting data
 * @access  Admin only
 * @query   period: '7days' | '30days' | '90days' | '1year'
 */
router.get('/admin/commission-analytics', 
  authenticate, 
  requireRole('admin'), 
  getCommissionAnalytics
);

// ==========================================
// SELLER COMMISSION ROUTES
// ==========================================

/**
 * @route   GET /api/seller/commission-details
 * @desc    Get seller's commission details, tier info, and earnings history
 * @access  Seller only
 */
router.get('/seller/commission-details', 
  authenticate, 
  requireRole('seller'), 
  getSellerCommissionDetails
);

module.exports = router;