/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * Verifies JWT token and attaches user info to request object.
 * Protects routes that require authentication.
 */

const { verifyToken } = require('../config/jwt');
const userService = require('../services/userServices/user.service');

/**
 * Authenticate user by verifying JWT token
 * 
 * Expects token in Authorization header: "Bearer <token>"
 * Attaches user object to req.user if valid
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No token provided' 
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await userService.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User not found' 
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Account is not active' 
      });
    }

    // Attach user to request object with role-specific fields
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name
    };

    // Add seller-specific fields
    if (user.role === 'seller') {
      req.user.businessName = user.business_name;
      req.user.verificationStatus = user.verification_status;
    }

    // Add manager-specific fields (if any in future)
    if (user.role === 'manager') {
      req.user.managerLevel = user.manager_level || 'standard';
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token expired' 
      });
    }

    next(error);
  }
};

/**
 * Optional authentication middleware
 * 
 * Attempts to authenticate user if token is provided,
 * but continues without error if no token is present.
 * Useful for routes that have different behavior for authenticated vs. unauthenticated users.
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    // If no token, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      // Verify token
      const decoded = verifyToken(token);

      // Get user from database
      const user = await userService.findById(decoded.userId);

      if (user && user.status === 'active') {
        // Attach user to request object with role-specific fields
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          displayName: user.display_name
        };

        // Add seller-specific fields
        if (user.role === 'seller') {
          req.user.businessName = user.business_name;
          req.user.verificationStatus = user.verification_status;
        }

        // Add manager-specific fields
        if (user.role === 'manager') {
          req.user.managerLevel = user.manager_level || 'standard';
        }
      }
    } catch (tokenError) {
      // Invalid token - continue without authentication
      // Don't throw error, just proceed as unauthenticated
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate
};
