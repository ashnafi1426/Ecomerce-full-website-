const express = require('express');
const router = express.Router();
const reviewController = require('../../controllers/reviewControllers/review.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

/**
 * Review Routes
 * All routes for product reviews and ratings
 */

// Public routes (no authentication required)
router.get('/product/:productId', reviewController.getProductReviews);
router.get('/product/:productId/summary', reviewController.getReviewSummary);

// Protected routes (authentication required)
router.post('/product/:productId', authenticate, reviewController.createReview);
router.put('/:reviewId', authenticate, reviewController.updateReview);
router.delete('/:reviewId', authenticate, reviewController.deleteReview);
router.post('/:reviewId/helpful', authenticate, reviewController.markReviewHelpful);
router.get('/product/:productId/can-review', authenticate, reviewController.canReviewProduct);

module.exports = router;
