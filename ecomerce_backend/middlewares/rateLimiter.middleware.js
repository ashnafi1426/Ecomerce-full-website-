/**
 * Rate Limiter Middleware
 * 
 * Provides rate limiting for various API endpoints to prevent abuse
 * and ensure fair usage across all users.
 */

const rateLimit = require('express-rate-limit');

/**
 * Variant creation rate limiter
 * Limit: 100 requests per hour per seller
 */
const variantCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many variant creation requests. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Coupon application rate limiter
 * Limit: 10 requests per minute per customer
 */
const couponApplicationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many coupon application attempts. Please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rating submission rate limiter
 * Limit: 5 requests per minute per customer
 */
const ratingSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many rating submissions. Please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Image upload rate limiter
 * Limit: 20 requests per hour per user
 */
const imageUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many image upload requests. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Login attempt rate limiter
 * Limit: 1000 requests per minute per IP (disabled for testing)
 */
const loginAttemptLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

/**
 * General API rate limiter
 * Limit: 100 requests per minute per user
 */
const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many requests. Please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  variantCreationLimiter,
  couponApplicationLimiter,
  ratingSubmissionLimiter,
  imageUploadLimiter,
  loginAttemptLimiter,
  generalApiLimiter
};
