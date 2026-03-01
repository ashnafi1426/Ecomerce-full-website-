/**
 * USER CONTROLLER
 * 
 * Handles user management operations.
 * Customers can manage their own profile.
 * Admins can manage all users.
 */

const userService = require('../../services/userServices/user.service');
const { hashPassword } = require('../../utils/hash');

// ============================================
// CUSTOMER OPERATIONS (Own Profile)
// ============================================

/**
 * Get own profile
 * GET /api/users/me
 */
const getMyProfile = async (req, res, next) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name,
      phone: user.phone,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      status: user.status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update own profile
 * PUT /api/users/me
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const { displayName, phone } = req.body;

    const updates = {};
    if (displayName !== undefined) updates.display_name = displayName;
    if (phone !== undefined) updates.phone = phone;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'No fields to update'
      });
    }

    const updatedUser = await userService.update(req.user.id, updates);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        displayName: updatedUser.display_name,
        phone: updatedUser.phone
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get own statistics
 * GET /api/users/me/statistics
 */
const getMyStatistics = async (req, res, next) => {
  try {
    const stats = await userService.getStatistics(req.user.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete own account (soft delete)
 * DELETE /api/users/me
 */
const deleteMyAccount = async (req, res, next) => {
  try {
    await userService.updateStatus(req.user.id, 'deleted');

    res.json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// SHARED OPERATIONS (Authenticated Users)
// ============================================

/**
 * Get user profile for chat (limited info)
 * GET /api/users/:id
 * Available to all authenticated users for chat functionality
 */
const getUserProfileForChat = async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Return only public profile information for chat
    res.json({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      role: user.role,
      phone: user.phone,
      is_online: user.is_online || false,
      last_seen_at: user.last_seen_at
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ADMIN OPERATIONS (All Users)
// ============================================

/**
 * Get all users (Admin only)
 * GET /api/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, limit, offset, search } = req.query;

    let users;

    if (search) {
      users = await userService.search(search, limit ? parseInt(limit) : 20);
    } else {
      users = await userService.findAll({
        role,
        status,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
      });
    }

    res.json({
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (Admin only)
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Don't return password hash
    const { password_hash, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics (Admin only)
 * GET /api/users/:id/statistics
 */
const getUserStatistics = async (req, res, next) => {
  try {
    const stats = await userService.getStatistics(req.params.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Create user (Admin only)
 * POST /api/users
 */
const createUser = async (req, res, next) => {
  try {
    const { email, password, role, displayName } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 8 characters'
      });
    }

    // Validate role
    const validRoles = ['customer', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid role. Must be customer or admin'
      });
    }

    // Check if user already exists
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await userService.create({
      email,
      passwordHash,
      role: role || 'customer',
      displayName: displayName || null
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user (Admin only)
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { displayName, phone, role } = req.body;

    const updates = {};
    if (displayName !== undefined) updates.display_name = displayName;
    if (phone !== undefined) updates.phone = phone;
    if (role !== undefined) {
      // Validate role
      const validRoles = ['customer', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid role. Must be customer or admin'
        });
      }
      updates.role = role;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'No fields to update'
      });
    }

    const updatedUser = await userService.update(req.params.id, updates);

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        displayName: updatedUser.display_name,
        phone: updatedUser.phone,
        status: updatedUser.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status (Admin only)
 * PATCH /api/users/:id/status
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['active', 'blocked', 'deleted'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const user = await userService.updateStatus(req.params.id, status);

    res.json({
      message: 'User status updated successfully',
      user: {
        id: user.id,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Block user (Admin only)
 * POST /api/users/:id/block
 */
const blockUser = async (req, res, next) => {
  try {
    const user = await userService.updateStatus(req.params.id, 'blocked');

    res.json({
      message: 'User blocked successfully',
      user: {
        id: user.id,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unblock user (Admin only)
 * POST /api/users/:id/unblock
 */
const unblockUser = async (req, res, next) => {
  try {
    const user = await userService.updateStatus(req.params.id, 'active');

    res.json({
      message: 'User unblocked successfully',
      user: {
        id: user.id,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign role to user (Admin only)
 * PATCH /api/users/:id/role
 */
const assignRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    const validRoles = ['customer', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    const user = await userService.update(req.params.id, { role });

    res.json({
      message: 'Role assigned successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (Admin only - soft delete)
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search users (Admin only)
 * GET /api/users/search?q=john
 */
const searchUsers = async (req, res, next) => {
  try {
    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Search query (q) is required'
      });
    }

    const users = await userService.search(q, limit ? parseInt(limit) : 20);

    res.json({
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// PHASE 2: MANAGER & SELLER OPERATIONS
// ============================================

/**
 * Create manager account (Admin only)
 * POST /api/admin/users/manager
 */
const createManager = async (req, res, next) => {
  try {
    const { email, password, displayName, phone } = req.body;

    // Validation
    if (!email || !password || !displayName) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email, password, and display name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 8 characters'
      });
    }

    // Check if user already exists
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create manager account
    const manager = await userService.createManager({
      email,
      passwordHash,
      displayName,
      phone: phone || null
    });

    res.status(201).json({
      message: 'Manager account created successfully',
      manager: {
        id: manager.id,
        email: manager.email,
        role: manager.role,
        displayName: manager.display_name,
        phone: manager.phone,
        status: manager.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all sellers (Admin/Manager)
 * GET /api/admin/sellers
 */
const getAllSellers = async (req, res, next) => {
  try {
    const { verificationStatus, status, limit, offset } = req.query;

    const sellers = await userService.findAllSellers({
      verificationStatus,
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({
      count: sellers.length,
      sellers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller by ID (Admin/Manager)
 * GET /api/admin/sellers/:id
 */
const getSellerById = async (req, res, next) => {
  try {
    const seller = await userService.findSellerById(req.params.id);

    if (!seller) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Seller not found'
      });
    }

    res.json(seller);
  } catch (error) {
    next(error);
  }
};

/**
 * Update seller verification status (Admin only)
 * PUT /api/admin/sellers/:id/status
 */
const updateSellerVerificationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'verified', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const seller = await userService.updateSellerStatus(req.params.id, status);

    res.json({
      message: `Seller ${status} successfully`,
      seller: {
        id: seller.id,
        email: seller.email,
        businessName: seller.business_name,
        verificationStatus: seller.verification_status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve seller (Admin only)
 * POST /api/admin/sellers/:id/approve
 */
const approveSeller = async (req, res, next) => {
  try {
    const seller = await userService.updateSellerStatus(req.params.id, 'verified');

    res.json({
      message: 'Seller approved successfully',
      seller: {
        id: seller.id,
        email: seller.email,
        businessName: seller.business_name,
        verificationStatus: seller.verification_status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject seller (Admin only)
 * POST /api/admin/sellers/:id/reject
 */
const rejectSeller = async (req, res, next) => {
  try {
    const seller = await userService.updateSellerStatus(req.params.id, 'rejected');

    res.json({
      message: 'Seller rejected',
      seller: {
        id: seller.id,
        email: seller.email,
        businessName: seller.business_name,
        verificationStatus: seller.verification_status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all managers (Admin only)
 * GET /api/admin/managers
 */
const getAllManagers = async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;

    const managers = await userService.findAllManagers({
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({
      count: managers.length,
      managers
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Customer operations
  getMyProfile,
  updateMyProfile,
  getMyStatistics,
  deleteMyAccount,

  // Shared operations (authenticated users)
  getUserProfileForChat,

  // Admin operations
  getAllUsers,
  getUserById,
  getUserStatistics,
  createUser,
  updateUser,
  updateUserStatus,
  blockUser,
  unblockUser,
  assignRole,
  deleteUser,
  searchUsers,

  // Phase 2: Manager & Seller operations
  createManager,
  getAllSellers,
  getSellerById,
  updateSellerVerificationStatus,
  approveSeller,
  rejectSeller,
  getAllManagers
};
