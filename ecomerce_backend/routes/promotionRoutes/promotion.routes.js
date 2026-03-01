const express = require('express');
const router = express.Router();
const promotionController = require('../../controllers/promotionControllers/promotion.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAnyRole } = require('../../middlewares/role.middleware');

/**
 * Promotion Routes
 * Implements Requirements 2.11, 2.12
 */

/**
 * @route   GET /api/v1/promotions/active
 * @desc    Get active promotions for a product/variant
 * @access  Public (authenticated)
 * @query   productId or variantId
 */
router.get('/active', authenticate, promotionController.getActivePromotions);

/**
 * @route   GET /api/v1/promotions/price
 * @desc    Get promotional price for a product/variant
 * @access  Public (authenticated)
 * @query   productId or variantId, originalPrice
 */
router.get('/price', authenticate, promotionController.getPromotionalPrice);

/**
 * @route   GET /api/v1/promotions/products-with-promotions
 * @desc    Get products with active promotions
 * @access  Public (authenticated)
 */
router.get('/products-with-promotions', authenticate, promotionController.getProductsWithPromotions);

/**
 * @route   GET /api/v1/promotions/product/:productId
 * @desc    Get all promotions for a product
 * @access  Public (authenticated)
 */
router.get('/product/:productId', authenticate, promotionController.getPromotionsByProduct);

// Manager-only routes
/**
 * @route   POST /api/v1/promotions
 * @desc    Create a new promotion
 * @access  Manager
 */
router.post(
  '/',
  authenticate,
  requireAnyRole(['manager', 'admin']),
  promotionController.createPromotion
);

/**
 * @route   POST /api/v1/promotions/bulk
 * @desc    Bulk create promotions
 * @access  Manager
 */
router.post(
  '/bulk',
  authenticate,
  requireAnyRole(['manager', 'admin']),
  promotionController.bulkCreatePromotions
);

/**
 * @route   POST /api/v1/promotions/process-scheduled
 * @desc    Process scheduled promotions (activate/deactivate)
 * @access  Manager
 */
router.post(
  '/process-scheduled',
  authenticate,
  requireAnyRole(['manager', 'admin']),
  promotionController.processScheduledPromotions
);

/**
 * @route   GET /api/v1/promotions
 * @desc    Get all promotions (paginated)
 * @access  Manager
 */
router.get(
  '/',
  authenticate,
  requireAnyRole(['manager', 'admin']),
  promotionController.getAllPromotions
);

/**
 * @route   GET /api/v1/promotions/:id
 * @desc    Get promotion by ID
 * @access  Manager
 */
router.get(
  '/:id',
  authenticate,
  requireAnyRole(['manager', 'admin']),
  promotionController.getPromotionById
);

/**
 * @route   GET /api/v1/promotions/:id/analytics
 * @desc    Get promotion analytics
 * @access  Manager
 */
router.get(
  '/:id/analytics',
  authenticate,
  requireAnyRole(['manager', 'admin']),
  promotionController.getPromotionAnalytics
);

/**
 * @route   PUT /api/v1/promotions/:id
 * @desc    Update a promotion
 * @access  Manager
 */
router.put(
  '/:id',
  authenticate,
  requireAnyRole(['manager', 'admin']),
  promotionController.updatePromotion
);

/**
 * @route   DELETE /api/v1/promotions/:id
 * @desc    Delete a promotion
 * @access  Manager
 */
router.delete(
  '/:id',
  authenticate,
  requireAnyRole(['manager', 'admin']),
  promotionController.deletePromotion
);

module.exports = router;
