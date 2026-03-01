const guestService = require('../../services/guestServices/guest.service');
const { v4: uuidv4 } = require('uuid');

// ==========================================
// GUEST CART MANAGEMENT
// ==========================================

exports.createGuestCart = async (req, res) => {
  try {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const cart = await guestService.createGuestCart(sessionId, expiresAt);
    
    res.status(201).json({
      success: true,
      message: 'Guest cart created successfully',
      data: {
        sessionId: cart.session_id,
        expiresAt: cart.expires_at,
        items: cart.cart_data
      }
    });
  } catch (error) {
    console.error('Create guest cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create guest cart'
    });
  }
};

exports.getGuestCart = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const cart = await guestService.getGuestCart(sessionId);
    
    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found or expired' 
      });
    }
    
    res.json({ 
      success: true, 
      data: {
        sessionId: cart.session_id,
        items: cart.cart_data,
        expiresAt: cart.expires_at
      }
    });
  } catch (error) {
    console.error('Get guest cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get guest cart'
    });
  }
};

exports.addToGuestCart = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { productId, quantity } = req.body;
    
    if (!sessionId || !productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, product ID, and quantity are required'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }
    
    const cart = await guestService.addToGuestCart(sessionId, productId, parseInt(quantity));
    
    res.json({ 
      success: true,
      message: 'Product added to cart',
      data: {
        sessionId: cart.session_id,
        items: cart.cart_data
      }
    });
  } catch (error) {
    console.error('Add to guest cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to add to cart'
    });
  }
};

exports.updateGuestCartItem = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { productId, quantity } = req.body;
    
    if (!sessionId || !productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, product ID, and quantity are required'
      });
    }
    
    const cart = await guestService.updateGuestCartItem(sessionId, productId, parseInt(quantity));
    
    res.json({ 
      success: true,
      message: 'Cart updated successfully',
      data: {
        sessionId: cart.session_id,
        items: cart.cart_data
      }
    });
  } catch (error) {
    console.error('Update guest cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update cart'
    });
  }
};

exports.removeFromGuestCart = async (req, res) => {
  try {
    const { sessionId, productId } = req.params;
    
    if (!sessionId || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and product ID are required'
      });
    }
    
    const cart = await guestService.removeFromGuestCart(sessionId, productId);
    
    res.json({ 
      success: true,
      message: 'Product removed from cart',
      data: {
        sessionId: cart.session_id,
        items: cart.cart_data
      }
    });
  } catch (error) {
    console.error('Remove from guest cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to remove from cart'
    });
  }
};

exports.clearGuestCart = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    const cart = await guestService.clearGuestCart(sessionId);
    
    res.json({ 
      success: true,
      message: 'Cart cleared successfully',
      data: {
        sessionId: cart.session_id,
        items: []
      }
    });
  } catch (error) {
    console.error('Clear guest cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to clear cart'
    });
  }
};

// ==========================================
// GUEST CHECKOUT
// ==========================================

exports.validateGuestEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    const existingUser = await guestService.findUserByEmail(email);
    
    if (existingUser && existingUser.user_type === 'registered') {
      return res.status(200).json({
        success: false,
        message: 'Email already registered. Please login.',
        requiresLogin: true
      });
    }
    
    res.json({
      success: true,
      message: 'Email is available for guest checkout',
      requiresLogin: false
    });
  } catch (error) {
    console.error('Validate email error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to validate email'
    });
  }
};

exports.createGuestUser = async (req, res) => {
  try {
    const { email, fullName, phone } = req.body;
    
    if (!email || !fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email, full name, and phone are required'
      });
    }
    
    const guestUser = await guestService.createGuestUser(email, fullName, phone);
    
    res.status(201).json({
      success: true,
      message: 'Guest user created successfully',
      data: {
        userId: guestUser.id,
        email: guestUser.email,
        userType: guestUser.user_type
      }
    });
  } catch (error) {
    console.error('Create guest user error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create guest user'
    });
  }
};

exports.saveGuestAddress = async (req, res) => {
  try {
    const addressData = req.body;
    
    if (!addressData.guestEmail || !addressData.fullName || !addressData.phone || 
        !addressData.addressLine1 || !addressData.city || !addressData.state || 
        !addressData.postalCode) {
      return res.status(400).json({
        success: false,
        message: 'All required address fields must be provided'
      });
    }
    
    const address = await guestService.saveGuestAddress(addressData);
    
    res.status(201).json({
      success: true,
      message: 'Address saved successfully',
      data: address
    });
  } catch (error) {
    console.error('Save guest address error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to save address'
    });
  }
};

exports.placeGuestOrder = async (req, res) => {
  try {
    const {
      sessionId,
      guestEmail,
      guestPhone,
      shippingAddress,
      paymentMethod,
      items
    } = req.body;
    
    if (!guestEmail || !guestPhone || !shippingAddress || !paymentMethod || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All order fields are required'
      });
    }
    
    // Generate tracking token
    const trackingToken = uuidv4();
    
    const order = await guestService.placeGuestOrder({
      sessionId,
      guestEmail,
      guestPhone,
      shippingAddress,
      paymentMethod,
      items,
      trackingToken
    });
    
    // Send confirmation email
    await guestService.sendOrderConfirmation(guestEmail, order, trackingToken);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId: order.id,
        trackingToken,
        trackingUrl: `${frontendUrl}/track-order?token=${trackingToken}`,
        total: order.total_amount,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Place guest order error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to place order'
    });
  }
};

// ==========================================
// GUEST ORDER TRACKING
// ==========================================

exports.trackGuestOrder = async (req, res) => {
  try {
    const { email, orderId, token } = req.query;
    
    let order;
    
    if (token) {
      // Track via magic link token
      order = await guestService.getOrderByToken(token);
    } else if (email && orderId) {
      // Track via email + order ID
      order = await guestService.getOrderByEmailAndId(email, orderId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either token or email+orderId'
      });
    }
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: order 
    });
  } catch (error) {
    console.error('Track guest order error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to track order'
    });
  }
};

exports.sendTrackingLink = async (req, res) => {
  try {
    const { email, orderId } = req.body;
    
    if (!email || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Email and order ID are required'
      });
    }
    
    const order = await guestService.getOrderByEmailAndId(email, orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    await guestService.sendTrackingLink(email, orderId, order.order_tracking_token);
    
    res.json({
      success: true,
      message: 'Tracking link sent to your email'
    });
  } catch (error) {
    console.error('Send tracking link error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to send tracking link'
    });
  }
};

// ==========================================
// GUEST TO REGISTERED CONVERSION
// ==========================================

exports.convertGuestToRegistered = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and full name are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    const user = await guestService.convertGuestToRegistered(email, password, fullName);
    
    res.json({
      success: true,
      message: 'Account created successfully! You can now login.',
      data: {
        userId: user.id,
        email: user.email,
        userType: user.user_type
      }
    });
  } catch (error) {
    console.error('Convert guest error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create account'
    });
  }
};

// ==========================================
// UTILITY ENDPOINTS
// ==========================================

exports.cleanupExpiredCarts = async (req, res) => {
  try {
    await guestService.cleanupExpiredCarts();
    
    res.json({
      success: true,
      message: 'Expired carts cleaned up successfully'
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to cleanup carts'
    });
  }
};
