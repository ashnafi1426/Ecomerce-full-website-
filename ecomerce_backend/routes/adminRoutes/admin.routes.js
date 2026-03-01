/**
 * ADMIN ROUTES
 * 
 * Routes for admin-only operations (product management, order management, etc.).
 * All routes require authentication and admin role.
 */

const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminControllers/admin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// All admin routes require authentication and admin role
// Dashboard
router.get('/dashboard', authenticate, requireAdmin, adminController.getDashboard);
router.get('/dashboard/stats', authenticate, requireAdmin, adminController.getDashboard);

// Product Management - IMPORTANT: Specific routes MUST come before generic routes
router.get('/products/pending', authenticate, requireAdmin, adminController.getPendingProducts);
router.get('/products/approvals', authenticate, requireAdmin, adminController.getPendingProducts); // Alias for pending
router.get('/products/low-stock', authenticate, requireAdmin, adminController.getLowStockProducts);
router.get('/products', authenticate, requireAdmin, adminController.getAllProducts);
router.post('/products', authenticate, requireAdmin, adminController.createProduct);
router.put('/products/:id', authenticate, requireAdmin, adminController.updateProduct);
router.delete('/products/:id', authenticate, requireAdmin, adminController.deleteProduct);
router.put('/products/:id/inventory', authenticate, requireAdmin, adminController.updateInventory);

// Product Approvals - Support both POST and PUT for compatibility
router.post('/products/:id/approve', authenticate, requireAdmin, adminController.approveProduct);
router.put('/products/:id/approve', authenticate, requireAdmin, adminController.approveProduct);
router.post('/products/:id/reject', authenticate, requireAdmin, adminController.rejectProduct);
router.put('/products/:id/reject', authenticate, requireAdmin, adminController.rejectProduct);

// Order Management
router.get('/orders', authenticate, requireAdmin, adminController.getAllOrders);
router.put('/orders/:id/status', authenticate, requireAdmin, adminController.updateOrderStatus);
router.get('/orders/statistics', authenticate, requireAdmin, adminController.getOrderStatistics);

// User Management
router.get('/users/export', authenticate, requireAdmin, adminController.exportUsers);
router.get('/users/:id', authenticate, requireAdmin, adminController.getUserById);
router.get('/users', authenticate, requireAdmin, adminController.getAllUsers);
router.post('/users', authenticate, requireAdmin, adminController.createUser);
router.put('/users/bulk', authenticate, requireAdmin, adminController.bulkUpdateUsers);
router.put('/users/:id', authenticate, requireAdmin, adminController.updateUser);
router.put('/users/:id/status', authenticate, requireAdmin, adminController.updateUserStatus);
router.delete('/users/:id', authenticate, requireAdmin, adminController.deleteUser);

// Seller Management
router.get('/sellers', authenticate, requireAdmin, adminController.getAllSellers);

// Manager Management
router.get('/managers', authenticate, requireAdmin, adminController.getAllManagers);

// Customer Management
router.get('/customers/export-pdf', authenticate, requireAdmin, adminController.exportCustomersPDF);
router.get('/customers', authenticate, requireAdmin, adminController.getAllCustomers);

// Category Management
router.get('/categories', authenticate, requireAdmin, adminController.getAllCategories);
router.post('/categories', authenticate, requireAdmin, adminController.createCategory);
router.put('/categories/:id', authenticate, requireAdmin, adminController.updateCategory);
router.delete('/categories/:id', authenticate, requireAdmin, adminController.deleteCategory);

// Role Management
router.get('/roles', authenticate, requireAdmin, adminController.getRoles);
router.post('/roles', authenticate, requireAdmin, adminController.createRole);
router.put('/roles/:id', authenticate, requireAdmin, adminController.updateRole);
router.delete('/roles/:id', authenticate, requireAdmin, adminController.deleteRole);

// Audit Logs
router.get('/logs', authenticate, requireAdmin, adminController.getAuditLogs);

// Refunds
router.get('/refunds', authenticate, requireAdmin, adminController.getAllRefunds);
router.post('/refunds/:id/approve', authenticate, requireAdmin, adminController.approveRefund);
router.post('/refunds/:id/reject', authenticate, requireAdmin, adminController.rejectRefund);

// Payment Management
router.get('/payments', authenticate, requireAdmin, adminController.getAllPayments);
router.post('/payments/:id/refund', authenticate, requireAdmin, adminController.processRefund);
router.get('/payments/statistics', authenticate, requireAdmin, adminController.getPaymentStatistics);

// Payout Management
router.post('/payouts', authenticate, requireAdmin, adminController.processPayout);

// Revenue Analytics
router.get('/revenue', authenticate, requireAdmin, adminController.getRevenueAnalytics);

// Settings
router.get('/settings', authenticate, requireAdmin, adminController.getSettings);
router.put('/settings', authenticate, requireAdmin, adminController.updateSettings);

// Analytics PDF Export
router.get('/analytics/export', authenticate, requireAdmin, adminController.exportAnalyticsReport);

module.exports = router;
