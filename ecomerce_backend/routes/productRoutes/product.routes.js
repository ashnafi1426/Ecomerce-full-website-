/**
 * PRODUCT ROUTES
 * 
 * Routes for product browsing, seller management, and manager approval.
 * Phase 3: Multi-vendor product management
 */

const express = require('express');
const router = express.Router();
const productController = require('../../controllers/productControllers/product.controller');
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware');
const { requireSeller, requireManager, requireMinRole } = require('../../middlewares/role.middleware');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Browse products (only approved products visible)
router.get('/products', optionalAuthenticate, productController.getAllProducts);

// Search products (role-based visibility with optional auth)
router.get('/products/search', optionalAuthenticate, productController.searchProducts);

// Get product details (only approved products visible)
router.get('/products/:id', optionalAuthenticate, productController.getProductById);

// ============================================
// SELLER ROUTES (Seller authentication required)
// ============================================

// Get seller's own products
router.get('/seller/products', authenticate, requireSeller, productController.getSellerProducts);

// Create new product (pending approval)
router.post('/seller/products', authenticate, requireSeller, productController.createProduct);

// Update own product (triggers re-approval if approved)
router.put('/seller/products/:id', authenticate, requireSeller, productController.updateProduct);

// Delete own product
router.delete('/seller/products/:id', authenticate, requireSeller, productController.deleteProduct);

// ============================================
// MANAGER ROUTES (Manager/Admin authentication required)
// ============================================

// Get product approval queue (pending products)
router.get('/manager/products/pending', authenticate, requireMinRole('manager'), productController.getApprovalQueue);

// Approve product
router.post('/manager/products/:id/approve', authenticate, requireMinRole('manager'), productController.approveProduct);

// Reject product
router.post('/manager/products/:id/reject', authenticate, requireMinRole('manager'), productController.rejectProduct);

module.exports = router;
