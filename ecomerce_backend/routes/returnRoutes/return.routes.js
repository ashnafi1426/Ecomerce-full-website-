/**
 * RETURN ROUTES
 * 
 * Routes for return/refund operations.
 */

const express = require('express');
const router = express.Router();
const returnController = require('../../controllers/returnControllers/return.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// ============================================
// CUSTOMER ROUTES (Authenticated)
// ============================================

// Get user's returns (must come before /api/returns to avoid conflict)
router.get('/api/returns/user/me', authenticate, returnController.getMyReturns);

// Get returns by order ID (must come before /api/returns/:id)
router.get('/api/returns/order/:orderId', authenticate, returnController.getReturnsByOrder);

// Create return request
router.post('/api/returns', authenticate, returnController.createReturn);

// Get return by ID
router.get('/api/returns/:id', authenticate, returnController.getReturnById);

// ============================================
// ADMIN ROUTES
// ============================================

// Get all returns (admin only - comes after specific routes)
router.get('/api/returns', authenticate, requireAdmin, returnController.getAllReturns);

// Get recent returns
router.get('/api/returns/recent', authenticate, requireAdmin, returnController.getRecentReturns);

// Get pending returns count
router.get('/api/returns/stats/pending-count', authenticate, requireAdmin, returnController.getPendingCount);

// Get return statistics
router.get('/api/returns/stats', authenticate, requireAdmin, returnController.getStatistics);

// Update return status
router.patch('/api/returns/:id/status', authenticate, requireAdmin, returnController.updateReturnStatus);

// Approve return
router.post('/api/returns/:id/approve', authenticate, requireAdmin, returnController.approveReturn);

// Reject return
router.post('/api/returns/:id/reject', authenticate, requireAdmin, returnController.rejectReturn);

// Complete return
router.post('/api/returns/:id/complete', authenticate, requireAdmin, returnController.completeReturn);

module.exports = router;
