/**
 * DELIVERY RATING ROUTES
 * 
 * API routes for delivery rating operations.
 * Handles rating submission, retrieval, and analytics with role-based access control.
 * 
 * Requirements: 3.1, 3.6, 3.9, 3.12
 */

const express = require('express');
const router = express.Router();
const deliveryRatingController = require('../../controllers/deliveryRatingControllers/deliveryRating.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const { ratingSubmissionLimiter } = require('../../middlewares/rateLimiter.middleware');

// Submit delivery rating (Customer only)
router.post(
  '/',
  authenticate,
  roleMiddleware.requireRole('customer'),
  ratingSubmissionLimiter,
  deliveryRatingController.submitDeliveryRating
);

// Get delivery rating for order (Authenticated users)
router.get(
  '/orders/:orderId',
  authenticate,
  deliveryRatingController.getOrderDeliveryRating
);

// Get seller delivery metrics (Public - visible to all)
router.get(
  '/sellers/:sellerId/metrics',
  deliveryRatingController.getSellerDeliveryMetrics
);

// Get seller rating distribution (Public - visible to all)
router.get(
  '/sellers/:sellerId/distribution',
  deliveryRatingController.getSellerRatingDistribution
);

// Get delivery rating analytics (Manager and Admin only)
router.get(
  '/analytics',
  authenticate,
  roleMiddleware.requireAnyRole(['manager', 'admin']),
  deliveryRatingController.getDeliveryRatingAnalytics
);

// Get flagged ratings (Manager and Admin only)
router.get(
  '/flagged',
  authenticate,
  roleMiddleware.requireAnyRole(['manager', 'admin']),
  deliveryRatingController.getFlaggedRatings
);

// Flag a rating for review (Manager and Admin only)
router.put(
  '/:ratingId/flag',
  authenticate,
  roleMiddleware.requireAnyRole(['manager', 'admin']),
  deliveryRatingController.flagRating
);

module.exports = router;
