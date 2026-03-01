/**
 * AUTHENTICATION CONTROLLER
 * 
 * Handles user registration, login, and authentication logic.
 */

const userService = require('../../services/userServices/user.service');
const { hashPassword, comparePassword } = require('../../utils/hash');
const { generateToken } = require('../../config/jwt');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

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
      role: 'customer',
      displayName: displayName || null
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      role: user.role
    });

    // Return user and token
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await userService.findByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication Failed',
        message: 'Invalid email or password' 
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Account is not active' 
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Authentication Failed',
        message: 'Invalid email or password' 
      });
    }

    // Update last login
    await userService.updateLastLogin(user.id);

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      role: user.role
    });

    // Return user and token
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getProfile = async (req, res, next) => {
  try {
    // User is already attached to req by authenticate middleware
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'User not found' 
      });
    }

    // Return user profile (without password hash)
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
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
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
 * Register new seller
 * POST /api/auth/register/seller
 */
const registerSeller = async (req, res, next) => {
  try {
    const { email, password, displayName, businessName, businessInfo, phone } = req.body;

    // Validation
    if (!email || !password || !businessName) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Email, password, and business name are required' 
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

    // Validate business name
    if (businessName.length < 3) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Business name must be at least 3 characters' 
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

    // Create seller account
    const seller = await userService.createSeller({
      email,
      passwordHash,
      displayName: displayName || businessName,
      businessName,
      businessInfo: businessInfo || {},
      phone: phone || null
    });

    // Generate JWT token
    const token = generateToken({
      userId: seller.id,
      role: seller.role
    });

    // Return seller and token
    res.status(201).json({
      message: 'Seller account created successfully. Pending admin approval.',
      token,
      seller: {
        id: seller.id,
        email: seller.email,
        role: seller.role,
        displayName: seller.display_name,
        businessName: seller.business_name,
        verificationStatus: seller.verification_status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller verification status
 * GET /api/auth/seller/status
 */
const getSellerStatus = async (req, res, next) => {
  try {
    // User must be authenticated and be a seller
    if (req.user.role !== 'seller') {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Only sellers can check verification status' 
      });
    }

    const seller = await userService.findSellerById(req.user.id);

    if (!seller) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Seller not found' 
      });
    }

    res.json({
      verificationStatus: seller.verification_status,
      businessName: seller.business_name,
      message: seller.verification_status === 'pending' 
        ? 'Your seller account is pending admin approval'
        : seller.verification_status === 'verified'
        ? 'Your seller account is verified'
        : 'Your seller account was rejected'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  // Phase 2: Seller registration
  registerSeller,
  getSellerStatus
};
