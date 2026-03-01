/**
 * DISPUTE ROUTES
 * 
 * Routes for dispute operations.
 */

const express = require('express');
const router = express.Router();
const disputeController = require('../../controllers/disputeControllers/dispute.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// Customer/Seller dispute routes
router.post('/api/disputes', authenticate, disputeController.createDispute);
router.get('/api/disputes', authenticate, disputeController.getUserDisputes);
router.get('/api/disputes/:disputeId', authenticate, disputeController.getDisputeById);
router.post('/api/disputes/:disputeId/comment', authenticate, disputeController.addComment);

// Admin routes
router.get('/api/disputes/stats', authenticate, requireAdmin, disputeController.getStatistics);

module.exports = router;
