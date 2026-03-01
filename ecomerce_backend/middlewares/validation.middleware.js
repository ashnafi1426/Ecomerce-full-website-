/**
 * VALIDATION MIDDLEWARE
 * 
 * Input validation for authentication and other endpoints.
 * Provides reusable validation functions.
 */

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const validatePasswordStrength = (password) => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true };
};

/**
 * Validate registration input
 */
const validateRegistration = (req, res, next) => {
  const { email, password, displayName } = req.body;

  // Check required fields
  if (!email || !password) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Email and password are required'
    });
  }

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid email format'
    });
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({
      error: 'Validation Error',
      message: passwordValidation.message
    });
  }

  // Validate display name length (if provided)
  if (displayName && displayName.length > 255) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Display name must be less than 255 characters'
    });
  }

  next();
};

/**
 * Validate login input
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  // Check required fields
  if (!email || !password) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Email and password are required'
    });
  }

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid email format'
    });
  }

  next();
};

/**
 * Validate profile update input
 */
const validateProfileUpdate = (req, res, next) => {
  const { displayName, phone } = req.body;

  // At least one field must be provided
  if (!displayName && !phone) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'At least one field (displayName or phone) must be provided'
    });
  }

  // Validate display name length
  if (displayName && displayName.length > 255) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Display name must be less than 255 characters'
    });
  }

  // Validate phone format (basic validation)
  if (phone && phone.length > 20) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Phone number must be less than 20 characters'
    });
  }

  next();
};

/**
 * Sanitize input (remove extra whitespace)
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};

module.exports = {
  validateEmail,
  validatePasswordStrength,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  sanitizeInput
};
