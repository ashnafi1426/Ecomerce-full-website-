/**
 * ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
 * 
 * Enhanced 4-role RBAC system for FastShop multi-vendor platform.
 * Supports: admin, manager, seller, customer
 * Must be used after authenticate middleware.
 * 
 * Phase 2 Enhancement: Added manager and seller roles with permission matrix
 */

/**
 * Permission Matrix
 * Defines what each role can do
 */
const PERMISSIONS = {
  admin: [
    '*', // All permissions
    'manage_users',
    'manage_managers',
    'manage_sellers',
    'approve_sellers',
    'manage_products',
    'approve_products',
    'manage_orders',
    'manage_payments',
    'resolve_disputes',
    'manage_returns',
    'view_analytics',
    'configure_system'
  ],
  manager: [
    'approve_products',
    'reject_products',
    'manage_orders',
    'resolve_disputes',
    'manage_returns',
    'approve_returns',
    'view_analytics',
    'view_sellers',
    'view_customers'
  ],
  seller: [
    'manage_own_products',
    'create_products',
    'update_own_products',
    'delete_own_products',
    'view_own_orders',
    'fulfill_orders',
    'manage_inventory',
    'view_own_analytics',
    'respond_to_reviews'
  ],
  customer: [
    'browse_products',
    'place_orders',
    'view_own_orders',
    'cancel_own_orders',
    'submit_reviews',
    'request_returns',
    'create_disputes',
    'manage_profile'
  ]
};

/**
 * Role hierarchy (higher roles inherit lower role permissions)
 */
const ROLE_HIERARCHY = {
  admin: 4,
  manager: 3,
  seller: 2,
  customer: 1
};

/**
 * Require specific role
 * @param {String} role - Required role ('admin', 'manager', 'seller', or 'customer')
 * @returns {Function} Express middleware
 */
const requireRole = (role) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    // Check if user has required role
    if (req.user.role !== role) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Access denied. ${role} role required.`,
        requiredRole: role,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Require admin role
 * Shorthand for requireRole('admin')
 */
const requireAdmin = requireRole('admin');

/**
 * Require manager role
 * Shorthand for requireRole('manager')
 */
const requireManager = requireRole('manager');

/**
 * Require seller role
 * Shorthand for requireRole('seller')
 */
const requireSeller = requireRole('seller');

/**
 * Require customer role
 * Shorthand for requireRole('customer')
 */
const requireCustomer = requireRole('customer');

/**
 * Allow multiple roles
 * @param {Array<String>} roles - Array of allowed roles
 * @returns {Function} Express middleware
 */
const requireAnyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Access denied. One of these roles required: ${roles.join(', ')}`,
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Require minimum role level (role hierarchy)
 * @param {String} minRole - Minimum required role
 * @returns {Function} Express middleware
 */
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Access denied. Minimum role required: ${minRole}`,
        requiredRole: minRole,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Require specific permission
 * @param {String} permission - Required permission
 * @returns {Function} Express middleware
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    const userPermissions = PERMISSIONS[req.user.role] || [];
    
    // Admin has all permissions
    if (userPermissions.includes('*')) {
      return next();
    }

    // Check if user has specific permission
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Access denied. Permission required: ${permission}`,
        requiredPermission: permission,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Require any of the specified permissions
 * @param {Array<String>} permissions - Array of permissions (user needs at least one)
 * @returns {Function} Express middleware
 */
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    const userPermissions = PERMISSIONS[req.user.role] || [];
    
    // Admin has all permissions
    if (userPermissions.includes('*')) {
      return next();
    }

    // Check if user has any of the required permissions
    const hasPermission = permissions.some(p => userPermissions.includes(p));
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Access denied. One of these permissions required: ${permissions.join(', ')}`,
        requiredPermissions: permissions,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Check if user has specific permission (utility function)
 * @param {String} role - User role
 * @param {String} permission - Permission to check
 * @returns {Boolean} True if user has permission
 */
const hasPermission = (role, permission) => {
  const rolePermissions = PERMISSIONS[role] || [];
  return rolePermissions.includes('*') || rolePermissions.includes(permission);
};

/**
 * Get all permissions for a role (utility function)
 * @param {String} role - User role
 * @returns {Array<String>} Array of permissions
 */
const getRolePermissions = (role) => {
  return PERMISSIONS[role] || [];
};

module.exports = {
  // Role-based middleware
  requireRole,
  requireAdmin,
  requireManager,
  requireSeller,
  requireCustomer,
  requireAnyRole,
  requireMinRole,
  
  // Permission-based middleware
  requirePermission,
  requireAnyPermission,
  
  // Utility functions
  hasPermission,
  getRolePermissions,
  
  // Constants
  PERMISSIONS,
  ROLE_HIERARCHY
};
