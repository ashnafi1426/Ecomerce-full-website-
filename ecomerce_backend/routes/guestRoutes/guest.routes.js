const express = require('express');
const router = express.Router();
const guestController = require('../../controllers/guestControllers/guest.controller');

// ==========================================
// GUEST CART MANAGEMENT (NO AUTH REQUIRED)
// ==========================================

// Create new guest cart session
router.post('/cart/create', guestController.createGuestCart);

// Get guest cart by session ID
router.get('/cart/:sessionId', guestController.getGuestCart);

// Add product to guest cart
router.post('/cart/:sessionId/add', guestController.addToGuestCart);

// Update cart item quantity
router.patch('/cart/:sessionId/update', guestController.updateGuestCartItem);

// Remove product from cart
router.delete('/cart/:sessionId/remove/:productId', guestController.removeFromGuestCart);

// Clear entire cart
router.delete('/cart/:sessionId/clear', guestController.clearGuestCart);

// ==========================================
// GUEST CHECKOUT FLOW
// ==========================================

// Step 1: Validate guest email
router.post('/checkout/validate-email', guestController.validateGuestEmail);

// Step 2: Create guest user (shadow account)
router.post('/checkout/create-guest-user', guestController.createGuestUser);

// Step 3: Save shipping address
router.post('/checkout/save-address', guestController.saveGuestAddress);

// Step 4: Place order
router.post('/checkout/place-order', guestController.placeGuestOrder);

// ==========================================
// GUEST ORDER TRACKING
// ==========================================

// Track order via email+orderId or magic link token
// Query params: ?email=x&orderId=y OR ?token=xyz
router.get('/orders/track', guestController.trackGuestOrder);

// Send tracking link to email
router.post('/orders/send-tracking-link', guestController.sendTrackingLink);

// ==========================================
// GUEST TO REGISTERED CONVERSION
// ==========================================

// Convert guest account to registered account
router.post('/convert-to-registered', guestController.convertGuestToRegistered);

// ==========================================
// UTILITY ENDPOINTS
// ==========================================

// Cleanup expired guest carts (can be called via cron job)
router.post('/cleanup-expired-carts', guestController.cleanupExpiredCarts);

module.exports = router;
