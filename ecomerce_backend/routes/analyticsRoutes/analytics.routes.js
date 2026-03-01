/**
 * ANALYTICS ROUTES
 * 
 * Routes for reports and analytics.
 * REQUIREMENT 5: All endpoints are admin-only.
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/analyticsControllers/analytics.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// ============================================
// ADMIN-ONLY ANALYTICS ROUTES
// All routes require authentication + admin role
// ============================================

// Dashboard - Comprehensive overview
router.get('/api/admin/analytics/dashboard', authenticate, requireAdmin, analyticsController.getDashboardData);

// ============================================
// SALES REPORTS
// ============================================

// Sales overview
router.get('/api/admin/analytics/sales/overview', authenticate, requireAdmin, analyticsController.getSalesOverview);

// Sales by date (daily, weekly, monthly)
router.get('/api/admin/analytics/sales/by-date', authenticate, requireAdmin, analyticsController.getSalesByDate);

// Top selling products
router.get('/api/admin/analytics/sales/top-products', authenticate, requireAdmin, analyticsController.getTopSellingProducts);

// ============================================
// REVENUE REPORTS
// ============================================

// Revenue overview
router.get('/api/admin/analytics/revenue/overview', authenticate, requireAdmin, analyticsController.getRevenueOverview);

// Revenue by category
router.get('/api/admin/analytics/revenue/by-category', authenticate, requireAdmin, analyticsController.getRevenueByCategory);

// Revenue trends (month over month)
router.get('/api/admin/analytics/revenue/trends', authenticate, requireAdmin, analyticsController.getRevenueTrends);

// ============================================
// CUSTOMER BEHAVIOR ANALYTICS
// ============================================

// Customer statistics
router.get('/api/admin/analytics/customers/statistics', authenticate, requireAdmin, analyticsController.getCustomerStatistics);

// Customer segmentation
router.get('/api/admin/analytics/customers/segmentation', authenticate, requireAdmin, analyticsController.getCustomerSegmentation);

// Customer retention
router.get('/api/admin/analytics/customers/retention', authenticate, requireAdmin, analyticsController.getCustomerRetention);

// ============================================
// INVENTORY REPORTS
// ============================================

// Inventory overview
router.get('/api/admin/analytics/inventory/overview', authenticate, requireAdmin, analyticsController.getInventoryOverview);

// Low stock products
router.get('/api/admin/analytics/inventory/low-stock', authenticate, requireAdmin, analyticsController.getLowStockProducts);

// Inventory turnover
router.get('/api/admin/analytics/inventory/turnover', authenticate, requireAdmin, analyticsController.getInventoryTurnover);

module.exports = router;