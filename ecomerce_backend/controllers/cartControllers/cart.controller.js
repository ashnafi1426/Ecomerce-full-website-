/**
 * SHOPPING CART CONTROLLER
 * 
 * Handles HTTP requests for shopping cart operations.
 */

const cartService = require('../../services/cartServices/cart.service');

/**
 * Get user's cart
 * GET /api/cart
 */
const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    
    // Format cart items for display with variant attributes
    const formattedCart = cartService.formatCartItemsForDisplay(cart);
    
    res.json(formattedCart);
  } catch (error) {
    next(error);
  }
};

/**
 * Get cart summary
 * GET /api/cart/summary
 */
const getCartSummary = async (req, res, next) => {
  try {
    const summary = await cartService.getCartSummary(req.user.id);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

/**
 * Get cart item count
 * GET /api/cart/count
 */
const getCartCount = async (req, res, next) => {
  try {
    const count = await cartService.getCartCount(req.user.id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to cart
 * POST /api/cart/items
 */
const addItem = async (req, res, next) => {
  try {
    const { productId, quantity, variantId } = req.body;

    if (!productId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product ID is required'
      });
    }

    const qty = quantity || 1;

    if (qty <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Quantity must be greater than 0'
      });
    }

    const cartItem = await cartService.addItem(req.user.id, productId, qty, variantId || null);

    res.status(201).json({
      message: 'Item added to cart successfully',
      cartItem
    });
  } catch (error) {
    if (error.message === 'Product not found' || error.message.includes('Variant')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    if (error.message.includes('stock') || error.message.includes('available')) {
      return res.status(400).json({
        error: 'Insufficient Stock',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Update cart item quantity
 * PUT /api/cart/items/:productId
 */
const updateQuantity = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity, variantId } = req.body;

    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid quantity is required'
      });
    }

    const cartItem = await cartService.updateQuantity(
      req.user.id, 
      productId, 
      quantity, 
      variantId || null
    );

    res.json({
      message: 'Cart item updated successfully',
      cartItem
    });
  } catch (error) {
    if (error.message.includes('stock') || error.message.includes('Quantity')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Remove item from cart
 * DELETE /api/cart/items/:productId
 */
const removeItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { variantId } = req.query; // Get variantId from query params
    
    await cartService.removeItem(req.user.id, productId, variantId || null);

    res.json({
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear entire cart
 * DELETE /api/cart
 */
const clearCart = async (req, res, next) => {
  try {
    await cartService.clearCart(req.user.id);

    res.json({
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate cart before checkout
 * POST /api/cart/validate
 */
const validateCart = async (req, res, next) => {
  try {
    const validation = await cartService.validateCart(req.user.id);

    if (!validation.valid) {
      return res.status(400).json({
        valid: false,
        errors: validation.errors,
        invalidCount: validation.invalidCount
      });
    }

    res.json({
      valid: true,
      message: 'Cart is valid for checkout',
      validItems: validation.validItems
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  getCartSummary,
  getCartCount,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  validateCart
};
