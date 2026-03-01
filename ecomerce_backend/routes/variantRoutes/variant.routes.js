/**
 * PRODUCT VARIANT ROUTES
 * 
 * API endpoints for product variant management.
 * Requirements: 1.1, 1.3, 1.4, 1.12
 */

const express = require('express');
const router = express.Router();
const variantController = require('../../controllers/variantControllers/variant.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { variantCreationLimiter } = require('../../middlewares/rateLimiter.middleware');

// ============================================================================
// VARIANT CREATION AND MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/variants
 * @desc    Create a new product variant
 * @access  Seller (own products), Manager, Admin
 * @body    { productId, attributes, price, compareAtPrice, images, sku, isAvailable, initialQuantity, lowStockThreshold }
 */
router.post(
  '/',
  authenticate,
  requireRole(['seller', 'manager', 'admin']),
  variantCreationLimiter,
  variantController.createVariant
);

/**
 * @route   GET /api/variants/products/:productId
 * @desc    Get all variants for a product
 * @access  Public (customers see available only), Seller (own products - all), Manager/Admin (all)
 * @query   isAvailable (boolean), attributes (JSON string)
 */
router.get(
  '/products/:productId',
  variantController.getProductVariants
);

/**
 * @route   GET /api/variants/:variantId
 * @desc    Get specific variant by ID
 * @access  Public (if available), Seller (own products), Manager/Admin (all)
 */
router.get(
  '/:variantId',
  variantController.getVariant
);

/**
 * @route   PUT /api/variants/:variantId
 * @desc    Update variant details
 * @access  Seller (own products), Manager, Admin
 * @body    { price, compareAtPrice, images, attributes, sku, isAvailable }
 */
router.put(
  '/:variantId',
  authenticate,
  requireRole(['seller', 'manager', 'admin']),
  variantController.updateVariant
);

/**
 * @route   DELETE /api/variants/:variantId
 * @desc    Delete variant
 * @access  Seller (own products), Manager, Admin
 */
router.delete(
  '/:variantId',
  authenticate,
  requireRole(['seller', 'manager', 'admin']),
  variantController.deleteVariant
);

// ============================================================================
// VARIANT INVENTORY MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/variants/:variantId/inventory
 * @desc    Get variant inventory details
 * @access  Public (basic info), Seller (own products - full details), Manager/Admin (all)
 */
router.get(
  '/:variantId/inventory',
  variantController.getVariantInventory
);

/**
 * @route   PUT /api/variants/:variantId/inventory
 * @desc    Update variant inventory quantity
 * @access  Seller (own products), Manager, Admin
 * @body    { quantity }
 */
router.put(
  '/:variantId/inventory',
  authenticate,
  requireRole(['seller', 'manager', 'admin']),
  variantController.updateVariantInventory
);

module.exports = router;
