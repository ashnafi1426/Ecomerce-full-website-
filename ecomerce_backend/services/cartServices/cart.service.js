/**
 * SHOPPING CART SERVICE
 * 
 * Business logic layer for shopping cart operations.
 * Handles cart items, persistence, and inventory validation.
 */

const supabase = require('../../config/supabase');
const inventoryService = require('../inventoryServices/inventory.service');

/**
 * Get user's cart
 * @param {String} userId - User UUID
 * @returns {Promise<Array>} Array of cart items with product details
 */
const getCart = async (userId) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      product:products(
        id,
        title,
        description,
        price,
        image_url,
        status
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get cart item by product
 * @param {String} userId - User UUID
 * @param {String} productId - Product UUID
 * @param {String} variantId - Optional Variant UUID
 * @returns {Promise<Object|null>} Cart item or null
 */
const getCartItem = async (userId, productId, variantId = null) => {
  let query = supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId);
  
  if (variantId) {
    query = query.eq('variant_id', variantId);
  } else {
    query = query.is('variant_id', null);
  }
  
  const { data, error } = await query.single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Add item to cart
 * @param {String} userId - User UUID
 * @param {String} productId - Product UUID
 * @param {Number} quantity - Quantity to add
 * @param {String} variantId - Optional Variant UUID
 * @returns {Promise<Object>} Cart item
 */
const addItem = async (userId, productId, quantity = 1, variantId = null) => {
  // Check if product exists and is active
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, title, price, status')
    .eq('id', productId)
    .single();
  
  if (productError || !product) {
    throw new Error('Product not found');
  }

  if (product.status !== 'active') {
    throw new Error('Product is not available');
  }

  // If variant is specified, check variant availability
  if (variantId) {
    const variantService = require('../variantServices/variant.service');
    const variant = await variantService.getVariantById(variantId);
    
    if (!variant || !variant.is_active) {
      throw new Error('Variant not found or not available');
    }

    const hasStock = await variantService.checkVariantAvailability(variantId, quantity);
    if (!hasStock) {
      throw new Error('Insufficient stock available for this variant');
    }
  } else {
    // Check regular product inventory
    const hasStock = await inventoryService.hasStock(productId, quantity);
    if (!hasStock) {
      throw new Error('Insufficient stock available');
    }
  }

  // Check if item already in cart
  const existingItem = await getCartItem(userId, productId, variantId);

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + quantity;
    
    // Validate new quantity against inventory
    if (variantId) {
      const variantService = require('../variantServices/variant.service');
      const hasStockForNew = await variantService.checkVariantAvailability(variantId, newQuantity);
      if (!hasStockForNew) {
        throw new Error('Insufficient stock for requested quantity');
      }
    } else {
      const hasStockForNew = await inventoryService.hasStock(productId, newQuantity);
      if (!hasStockForNew) {
        throw new Error('Insufficient stock for requested quantity');
      }
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ 
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingItem.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Create new cart item
    const insertData = {
      user_id: userId,
      product_id: productId,
      quantity
    };
    
    if (variantId) {
      insertData.variant_id = variantId;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .insert([insertData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

/**
 * Update cart item quantity
 * @param {String} userId - User UUID
 * @param {String} productId - Product UUID
 * @param {Number} quantity - New quantity
 * @param {String} variantId - Optional Variant UUID
 * @returns {Promise<Object>} Updated cart item
 */
const updateQuantity = async (userId, productId, quantity, variantId = null) => {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  // Check inventory availability
  if (variantId) {
    const variantService = require('../variantServices/variant.service');
    const hasStock = await variantService.checkVariantAvailability(variantId, quantity);
    if (!hasStock) {
      throw new Error('Insufficient stock for requested quantity');
    }
  } else {
    const hasStock = await inventoryService.hasStock(productId, quantity);
    if (!hasStock) {
      throw new Error('Insufficient stock for requested quantity');
    }
  }

  let query = supabase
    .from('cart_items')
    .update({ 
      quantity,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('product_id', productId);
  
  if (variantId) {
    query = query.eq('variant_id', variantId);
  } else {
    query = query.is('variant_id', null);
  }

  const { data, error } = await query
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Remove item from cart
 * @param {String} userId - User UUID
 * @param {String} productId - Product UUID
 * @param {String} variantId - Optional Variant UUID
 * @returns {Promise<void>}
 */
const removeItem = async (userId, productId, variantId = null) => {
  let query = supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  
  if (variantId) {
    query = query.eq('variant_id', variantId);
  } else {
    query = query.is('variant_id', null);
  }
  
  const { error } = await query;
  
  if (error) throw error;
};

/**
 * Clear entire cart
 * @param {String} userId - User UUID
 * @returns {Promise<void>}
 */
const clearCart = async (userId) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);
  
  if (error) throw error;
};

/**
 * Get cart summary (total items, total price)
 * @param {String} userId - User UUID
 * @returns {Promise<Object>} Cart summary
 */
const getCartSummary = async (userId) => {
  const cartItems = await getCart(userId);
  
  let totalItems = 0;
  let totalPrice = 0;

  cartItems.forEach(item => {
    if (item.product && item.product.status === 'active') {
      totalItems += item.quantity;
      
      // Calculate price: use variant price if variant exists, otherwise use product price
      let itemPrice = item.product.price;
      
      if (item.variant_id && item.variant && item.variant.is_active) {
        // Variant has its own price, not a price adjustment
        itemPrice = item.variant.price || item.product.price;
      }
      
      totalPrice += item.quantity * itemPrice;
    }
  });

  return {
    totalItems,
    totalPrice: parseFloat(totalPrice.toFixed(2)),
    itemCount: cartItems.length
  };
};

/**
 * Validate cart before checkout
 * Checks inventory availability for all items
 * @param {String} userId - User UUID
 * @returns {Promise<Object>} Validation result
 */
const validateCart = async (userId) => {
  const cartItems = await getCart(userId);
  
  if (cartItems.length === 0) {
    return {
      valid: false,
      errors: ['Cart is empty']
    };
  }

  const errors = [];
  const validItems = [];

  for (const item of cartItems) {
    // Check if product exists and is active
    if (!item.product) {
      errors.push(`Product ${item.product_id} not found`);
      continue;
    }

    if (item.product.status !== 'active') {
      errors.push(`${item.product.title} is no longer available`);
      continue;
    }

    // Check variant availability if variant is specified
    if (item.variant_id) {
      // Check if variant exists and is active
      if (!item.variant || !item.variant.is_active) {
        errors.push(`${item.product.title} - Selected variant is no longer available`);
        continue;
      }

      // Check variant inventory
      const variantService = require('../variantServices/variant.service');
      const hasStock = await variantService.checkVariantAvailability(item.variant_id, item.quantity);
      
      if (!hasStock) {
        const variantInventory = await variantService.getVariantInventory(item.variant_id);
        const available = variantInventory ? variantInventory.availableQuantity : 0;
        const variantName = item.variant.variant_name || 'variant';
        errors.push(`${item.product.title} (${variantName}): Only ${available} available (requested ${item.quantity})`);
        continue;
      }
    } else {
      // Check regular product inventory
      const hasStock = await inventoryService.hasStock(item.product_id, item.quantity);
      if (!hasStock) {
        const available = await inventoryService.getAvailable(item.product_id);
        errors.push(`${item.product.title}: Only ${available} available (requested ${item.quantity})`);
        continue;
      }
    }

    validItems.push(item);
  }

  return {
    valid: errors.length === 0,
    errors,
    validItems,
    invalidCount: errors.length
  };
};

/**
 * Get cart item count
 * @param {String} userId - User UUID
 * @returns {Promise<Number>} Total items in cart
 */
const getCartCount = async (userId) => {
  const { count, error } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  if (error) throw error;
  
  return count || 0;
};

/**
 * Format cart items for display with variant attributes
 * @param {Array} cartItems - Raw cart items from database
 * @returns {Array} Formatted cart items with display-ready data
 */
const formatCartItemsForDisplay = (cartItems) => {
  return cartItems.map(item => {
    const formatted = {
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: item.quantity,
      product: item.product,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };

    // Add variant information if present
    if (item.variant_id && item.variant) {
      formatted.variant = {
        id: item.variant.id,
        name: item.variant.variant_name,
        sku: item.variant.sku,
        price: item.variant.price,
        attributes: item.variant.attributes,
        images: item.variant.images,
        isAvailable: item.variant.is_available
      };

      // Format attributes for display (e.g., "Size: L, Color: Blue")
      formatted.variantDisplay = Object.entries(item.variant.attributes || {})
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');

      // Use variant price if available
      formatted.itemPrice = item.variant.price || item.product.price;
      
      // Use variant images if available, otherwise fall back to product image
      formatted.displayImage = (item.variant.images && item.variant.images.length > 0) 
        ? item.variant.images[0] 
        : item.product.image_url;
    } else {
      // No variant, use product data
      formatted.itemPrice = item.product.price;
      formatted.displayImage = item.product.image_url;
      formatted.variantDisplay = null;
    }

    // Calculate line total
    formatted.lineTotal = formatted.itemPrice * item.quantity;

    return formatted;
  });
};

module.exports = {
  getCart,
  getCartItem,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  getCartSummary,
  validateCart,
  getCartCount,
  formatCartItemsForDisplay
};