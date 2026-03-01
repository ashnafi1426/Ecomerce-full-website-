/**
 * SHOPPING CART ROUTES
 * 
 * Routes for shopping cart operations.
 * All routes require authentication (customer only).
 */

const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/cartControllers/cart.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireCustomer } = require('../../middlewares/role.middleware');

// ============================================
// CUSTOMER ROUTES (Authentication Required)
// ============================================

// Get user's cart
router.get('/', authenticate, requireCustomer, cartController.getCart);

// Get cart summary (total items, total price)
router.get('/summary', authenticate, requireCustomer, cartController.getCartSummary);

// Get cart item count
router.get('/count', authenticate, requireCustomer, cartController.getCartCount);

// Add item to cart
router.post('/items', authenticate, requireCustomer, cartController.addItem);

// Update cart item quantity
router.put('/items/:productId', authenticate, requireCustomer, cartController.updateQuantity);

// Remove item from cart
router.delete('/items/:productId', authenticate, requireCustomer, cartController.removeItem);

// Clear entire cart
router.delete('/', authenticate, requireCustomer, cartController.clearCart);

// Validate cart before checkout
router.post('/validate', authenticate, requireCustomer, cartController.validateCart);

module.exports = router;
