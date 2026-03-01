/**
 * AUDIT LOG ROUTES
 * 
 * Routes for audit log operations (Admin only).
 */

const express = require('express');
const router = express.Router();
const auditLogController = require('../../controllers/auditLogControllers/auditLog.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// ============================================
// ADMIN ROUTES (All audit log routes require admin)
// ============================================

// Get recent audit logs
router.get('/api/audit-logs/recent', authenticate, requireAdmin, auditLogController.getRecentLogs);

// Get audit statistics
router.get('/api/audit-logs/stats', authenticate, requireAdmin, auditLogController.getStatistics);

// Get logs by table name
router.get('/api/audit-logs/table/:tableName', authenticate, requireAdmin, auditLogController.getLogsByTable);

// Get logs by user ID
router.get('/api/audit-logs/user/:userId', authenticate, requireAdmin, auditLogController.getLogsByUser);

// Get logs by operation type
router.get('/api/audit-logs/operation/:operation', authenticate, requireAdmin, auditLogController.getLogsByOperation);

// Get logs by date range
router.get('/api/audit-logs/date-range', authenticate, requireAdmin, auditLogController.getLogsByDateRange);

// Search audit logs
router.post('/api/audit-logs/search', authenticate, requireAdmin, auditLogController.searchLogs);

// Create audit log entry (internal use)
router.post('/api/audit-logs', authenticate, requireAdmin, auditLogController.createLog);

// Cleanup old logs
router.delete('/api/audit-logs/cleanup', authenticate, requireAdmin, auditLogController.cleanupLogs);

module.exports = router;
