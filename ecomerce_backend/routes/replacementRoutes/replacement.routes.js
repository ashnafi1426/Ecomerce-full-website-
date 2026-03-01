const express = require('express');
const router = express.Router();
const replacementController = require('../../controllers/replacementControllers/replacement.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

/**
 * Replacement Routes
 * Implements Requirements 4.1, 4.6, 4.7, 4.8, 4.16, 4.17
 */

/**
 * @route   POST /api/v1/replacements
 * @desc    Create replacement request
 * @access  Customer
 */
router.post(
  '/',
  authenticate,
  roleMiddleware.requireRole('customer'),
  replacementController.createReplacementRequest
);

/**
 * @route   GET /api/v1/replacements
 * @desc    Get all replacement requests (filtered by role)
 * @access  Customer/Seller/Manager
 */
router.get(
  '/',
  authenticate,
  replacementController.getReplacementRequests
);

/**
 * @route   GET /api/v1/replacements/analytics
 * @desc    Get replacement analytics
 * @access  Manager
 */
router.get(
  '/analytics',
  authenticate,
  roleMiddleware.requireAnyRole(['manager', 'admin']),
  replacementController.getReplacementAnalytics
);

/**
 * @route   GET /api/v1/replacements/:id
 * @desc    Get replacement request by ID
 * @access  Customer/Seller/Manager
 */
router.get(
  '/:id',
  authenticate,
  replacementController.getReplacementRequest
);

/**
 * @route   PUT /api/v1/replacements/:id/approve
 * @desc    Approve replacement request
 * @access  Manager
 */
router.put(
  '/:id/approve',
  authenticate,
  roleMiddleware.requireAnyRole(['manager', 'admin']),
  replacementController.approveReplacement
);

/**
 * @route   PUT /api/v1/replacements/:id/reject
 * @desc    Reject replacement request
 * @access  Manager
 */
router.put(
  '/:id/reject',
  authenticate,
  roleMiddleware.requireAnyRole(['manager', 'admin']),
  replacementController.rejectReplacement
);

/**
 * @route   PUT /api/v1/replacements/:id/shipment
 * @desc    Update replacement shipment tracking
 * @access  Seller
 */
router.put(
  '/:id/shipment',
  authenticate,
  roleMiddleware.requireRole('seller'),
  replacementController.updateReplacementShipment
);

/**
 * @route   PUT /api/v1/replacements/:id/return-tracking
 * @desc    Update return tracking number
 * @access  Customer
 */
router.put(
  '/:id/return-tracking',
  authenticate,
  roleMiddleware.requireRole('customer'),
  replacementController.updateReturnTracking
);

/**
 * @route   PUT /api/v1/replacements/:id/confirm-return
 * @desc    Confirm return received
 * @access  Seller
 */
router.put(
  '/:id/confirm-return',
  authenticate,
  roleMiddleware.requireRole('seller'),
  replacementController.confirmReturnReceived
);

module.exports = router;
