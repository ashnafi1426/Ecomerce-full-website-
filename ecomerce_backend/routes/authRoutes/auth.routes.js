/**
 * AUTHENTICATION ROUTES
 * 
 * Routes for user registration, login, and profile management.
 * Includes input validation and sanitization.
 * 
 * Phase 2: Added seller registration routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authControllers/auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  sanitizeInput
} = require('../../middlewares/validation.middleware');
const { loginAttemptLimiter } = require('../../middlewares/rateLimiter.middleware');

// Public routes (with validation)
router.post(
  '/register',
  sanitizeInput,
  validateRegistration,
  authController.register
);

// Phase 2: Seller registration
router.post(
  '/register/seller',
  sanitizeInput,
  authController.registerSeller
);

router.post(
  '/login',
  loginAttemptLimiter,
  sanitizeInput,
  validateLogin,
  authController.login
);

// Protected routes (require authentication)
router.get('/me', authenticate, authController.getProfile);

router.put(
  '/profile',
  authenticate,
  sanitizeInput,
  validateProfileUpdate,
  authController.updateProfile
);

// Phase 2: Seller status check
router.get('/seller/status', authenticate, authController.getSellerStatus);

module.exports = router;
