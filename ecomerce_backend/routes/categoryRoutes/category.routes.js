/**
 * CATEGORY ROUTES
 * 
 * Routes for category operations.
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/categoryControllers/category.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// ============================================
// PUBLIC ROUTES
// ============================================

// Get all categories
router.get('/', categoryController.getAllCategories);

// Get category hierarchy (tree structure)
router.get('/hierarchy', categoryController.getCategoryHierarchy);

// Get root categories
router.get('/root', categoryController.getRootCategories);

// Get category by ID
router.get('/:id', categoryController.getCategoryById);

// Get subcategories of a category
router.get('/:id/subcategories', categoryController.getSubcategories);

// Get products in category
router.get('/:id/products', categoryController.getCategoryProducts);

// ============================================
// ADMIN ROUTES
// ============================================

// Create new category
router.post('/', authenticate, requireAdmin, categoryController.createCategory);

// Update category
router.put('/:id', authenticate, requireAdmin, categoryController.updateCategory);

// Delete category
router.delete('/:id', authenticate, requireAdmin, categoryController.deleteCategory);

module.exports = router;
