const express = require('express');
const router = express.Router();
const wishlistController = require('../../controllers/wishlistControllers/wishlist.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// Apply authentication middleware to all wishlist routes
router.use(authenticate);

// Wishlist routes
router.get('/', wishlistController.getWishlist);
router.get('/count', wishlistController.getWishlistCount);
router.post('/', wishlistController.addToWishlist);
router.delete('/clear', wishlistController.clearWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);
router.get('/check/:productId', wishlistController.checkWishlistStatus);

module.exports = router;