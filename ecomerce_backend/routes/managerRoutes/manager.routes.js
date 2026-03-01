/**
 * MANAGER ROUTES
 * 
 * Routes for manager-specific operations.
 */

const express = require('express');
const router = express.Router();
const managerController = require('../../controllers/managerControllers/manager.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAnyRole } = require('../../middlewares/role.middleware');

// Manager dashboard
router.get('/api/manager/dashboard', authenticate, requireAnyRole(['admin', 'manager']), managerController.getDashboardStats);
router.get('/api/manager/dashboard/stats', authenticate, requireAnyRole(['admin', 'manager']), managerController.getDashboardStats);

// Product approval workflow
router.get('/api/manager/products/pending', authenticate, requireAnyRole(['admin', 'manager']), managerController.getPendingProducts);
router.post('/api/manager/products/:productId/approve', authenticate, requireAnyRole(['admin', 'manager']), managerController.approveProduct);
router.post('/api/manager/products/:productId/reject', authenticate, requireAnyRole(['admin', 'manager']), managerController.rejectProduct);
router.post('/api/manager/products/:productId/revision', authenticate, requireAnyRole(['admin', 'manager']), managerController.requestProductRevision);

// Seller verification
router.get('/api/manager/sellers/pending', authenticate, requireAnyRole(['admin', 'manager']), managerController.getPendingSellers);
router.post('/api/manager/sellers/:sellerId/approve', authenticate, requireAnyRole(['admin', 'manager']), managerController.approveSeller);
router.post('/api/manager/sellers/:sellerId/reject', authenticate, requireAnyRole(['admin', 'manager']), managerController.rejectSeller);

// Order oversight
router.get('/api/manager/orders', authenticate, requireAnyRole(['admin', 'manager']), managerController.getAllOrders);
router.get('/api/manager/orders/issues', authenticate, requireAnyRole(['admin', 'manager']), managerController.getOrdersWithIssues);
router.post('/api/manager/orders/:orderId/resolve', authenticate, requireAnyRole(['admin', 'manager']), managerController.resolveOrderIssue);

// Dispute management
router.get('/api/manager/disputes', authenticate, requireAnyRole(['admin', 'manager']), managerController.getDisputes);
router.get('/api/manager/disputes/pending', authenticate, requireAnyRole(['admin', 'manager']), managerController.getPendingDisputes);
router.post('/api/manager/disputes/:disputeId/resolve', authenticate, requireAnyRole(['admin', 'manager']), managerController.resolveDispute);
router.post('/api/manager/disputes/:disputeId/escalate', authenticate, requireAnyRole(['admin', 'manager']), managerController.escalateDispute);

// Return management
router.get('/api/manager/returns/pending', authenticate, requireAnyRole(['admin', 'manager']), managerController.getPendingReturns);
router.post('/api/manager/returns/:returnId/approve', authenticate, requireAnyRole(['admin', 'manager']), managerController.approveReturn);
router.post('/api/manager/returns/:returnId/reject', authenticate, requireAnyRole(['admin', 'manager']), managerController.rejectReturn);

// Refund management
router.get('/api/manager/refunds/pending', authenticate, requireAnyRole(['admin', 'manager']), managerController.getPendingRefunds);
router.post('/api/manager/refunds/:refundId/process', authenticate, requireAnyRole(['admin', 'manager']), managerController.processRefund);

// Support tickets
router.get('/api/manager/support/tickets', authenticate, requireAnyRole(['admin', 'manager']), managerController.getSupportTickets);
router.post('/api/manager/support/tickets/:ticketId/respond', authenticate, requireAnyRole(['admin', 'manager']), managerController.respondToTicket);
router.post('/api/manager/support/tickets/:ticketId/close', authenticate, requireAnyRole(['admin', 'manager']), managerController.closeTicket);

// Escalations
router.get('/api/manager/escalations', authenticate, requireAnyRole(['admin', 'manager']), managerController.getEscalations);
router.post('/api/manager/escalations/:escalationId/assign', authenticate, requireAnyRole(['admin', 'manager']), managerController.assignEscalation);

// Performance metrics
router.get('/api/manager/performance', authenticate, requireAnyRole(['admin', 'manager']), managerController.getPerformanceMetrics);
router.get('/api/manager/performance/sellers', authenticate, requireAnyRole(['admin', 'manager']), managerController.getSellerPerformance);

// Review moderation
router.get('/api/manager/reviews/flagged', authenticate, requireAnyRole(['admin', 'manager']), managerController.getFlaggedReviews);
router.post('/api/manager/reviews/:reviewId/approve', authenticate, requireAnyRole(['admin', 'manager']), managerController.approveReview);
router.post('/api/manager/reviews/:reviewId/remove', authenticate, requireAnyRole(['admin', 'manager']), managerController.removeReview);

// Customer feedback
router.get('/api/manager/feedback/customers', authenticate, requireAnyRole(['admin', 'manager']), managerController.getCustomerFeedback);

// Activity log
router.get('/api/manager/activity', authenticate, requireAnyRole(['admin', 'manager']), managerController.getActivityLog);

// ============================================
// MANAGER CRUD OPERATIONS (Admin only)
// ============================================

// Admin routes for manager management
router.get('/api/managers', authenticate, requireAnyRole(['admin']), managerController.getAllManagers);
router.get('/api/managers/:managerId', authenticate, requireAnyRole(['admin']), managerController.getManagerById);
router.post('/api/managers', authenticate, requireAnyRole(['admin']), managerController.createManager);
router.put('/api/managers/:managerId', authenticate, requireAnyRole(['admin']), managerController.updateManager);
router.delete('/api/managers/:managerId', authenticate, requireAnyRole(['admin']), managerController.deleteManager);
router.put('/api/managers/:managerId/status', authenticate, requireAnyRole(['admin']), managerController.updateManagerStatus);

module.exports = router;
