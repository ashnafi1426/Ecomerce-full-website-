/**
 * USER ROUTES
 * 
 * Routes for user management operations.
 * Customers can manage their own profile.
 * Admins can manage all users.
 * 
 * Phase 2: Added manager and seller management routes
 */

const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userControllers/user.controller');
const userSearchController = require('../../controllers/userControllers/user-search.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin, requireAnyRole } = require('../../middlewares/role.middleware');

// ============================================
// CUSTOMER ROUTES (Own Profile)
// ============================================

// Get own profile
router.get('/api/users/me', authenticate, userController.getMyProfile);

// Update own profile
router.put('/api/users/me', authenticate, userController.updateMyProfile);

// Get own statistics
router.get('/api/users/me/statistics', authenticate, userController.getMyStatistics);

// Delete own account
router.delete('/api/users/me', authenticate, userController.deleteMyAccount);

// ============================================
// SHARED ROUTES (Authenticated Users)
// ============================================

// Search users for chat (all authenticated users can search)
router.get('/api/users/search', authenticate, userSearchController.searchUsersForChat);

// Get user profile by ID (for chat - limited info)
router.get('/api/users/:id', authenticate, userController.getUserProfileForChat);

// ============================================
// ADMIN ROUTES (All Users)
// ============================================

// Admin search users (more detailed)
router.get('/api/admin/users/search', authenticate, requireAdmin, userController.searchUsers);

// Get all users
router.get('/api/users', authenticate, requireAdmin, userController.getAllUsers);

// Create user - DISABLED: Using admin routes instead
// router.post('/api/users', authenticate, requireAdmin, userController.createUser);

// Get user by ID (admin full access)
router.get('/api/admin/users/:id', authenticate, requireAdmin, userController.getUserById);

// Update user
router.put('/api/users/:id', authenticate, requireAdmin, userController.updateUser);

// Delete user
router.delete('/api/users/:id', authenticate, requireAdmin, userController.deleteUser);

// Get user statistics
router.get('/api/users/:id/statistics', authenticate, requireAdmin, userController.getUserStatistics);

// Update user status
router.patch('/api/users/:id/status', authenticate, requireAdmin, userController.updateUserStatus);

// Block user
router.post('/api/users/:id/block', authenticate, requireAdmin, userController.blockUser);

// Unblock user
router.post('/api/users/:id/unblock', authenticate, requireAdmin, userController.unblockUser);

// Assign role
router.patch('/api/users/:id/role', authenticate, requireAdmin, userController.assignRole);

// ============================================
// PHASE 2: MANAGER & SELLER ROUTES
// ============================================

// Create manager (Admin only)
router.post('/api/admin/users/manager', authenticate, requireAdmin, userController.createManager);

// Get all managers (Admin only)
router.get('/api/admin/managers', authenticate, requireAdmin, userController.getAllManagers);

// Get seller by ID (Admin/Manager)
router.get('/api/admin/sellers/:id', authenticate, requireAnyRole(['admin', 'manager']), userController.getSellerById);

// Update seller verification status (Admin only)
router.put('/api/admin/sellers/:id/status', authenticate, requireAdmin, userController.updateSellerVerificationStatus);

// Approve seller (Admin only)
router.post('/api/admin/sellers/:id/approve', authenticate, requireAdmin, userController.approveSeller);

// Reject seller (Admin only)
router.post('/api/admin/sellers/:id/reject', authenticate, requireAdmin, userController.rejectSeller);

module.exports = router;
