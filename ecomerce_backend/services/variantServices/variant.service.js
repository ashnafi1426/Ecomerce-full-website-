/**
 * VARIANT SERVICE
 * 
 * Business logic layer for product variant operations.
 * Handles variant creation, management, SKU generation, and attribute validation.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.6
 */

const supabase = require('../../config/supabase');
const crypto = require('crypto');
const cache = require('../../utils/cache');

/**
 * Generate unique SKU for variant
 * @param {String} productId - Product UUID
 * @param {Object} attributes - Variant attributes (e.g., {size: "L", color: "Blue"})
 * @returns {String} Generated SKU
 */
function generateSKU(productId, attributes) {
  // Create a short hash from product ID (first 8 chars)
  const productHash = productId.substring(0, 8).toUpperCase();
  
  // Create attribute string sorted by keys for consistency
  const attrKeys = Object.keys(attributes).sort();
  const attrString = attrKeys
    .map(key => `${key.substring(0, 3).toUpperCase()}-${attributes[key].substring(0, 3).toUpperCase()}`)
    .join('-');
  
  // Add timestamp component for uniqueness
  const timestamp = Date.now().toString(36).toUpperCase();
  
  // Add random component for additional uniqueness
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  // Combine: PROD-HASH-ATTR-TIMESTAMP-RANDOM
  return `${productHash}-${attrString}-${timestamp}-${random}`;
}

/**
 * Validate variant attribute combination is unique for product
 * @param {String} productId - Product UUID
 * @param {Object} attributes - Variant attributes
 * @param {String} excludeVariantId - Optional variant ID to exclude (for updates)
 * @returns {Promise<Boolean>} True if unique, false if duplicate exists
 */
async function validateUniqueAttributes(productId, attributes, excludeVariantId = null) {
  let query = supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', productId)
    .eq('attributes', JSON.stringify(attributes));
  
  if (excludeVariantId) {
    query = query.neq('id', excludeVariantId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Return true if no duplicates found
  return !data || data.length === 0;
}

/**
 * Create a new product variant
 * @param {String} productId - Parent product UUID
 * @param {Object} variantData - Variant attributes, price, SKU, images
 * @returns {Promise<Object>} Created variant object with inventory
 */
async function createVariant(productId, variantData) {
  // Validate required fields
  if (!variantData.attributes || Object.keys(variantData.attributes).length === 0) {
    throw new Error('At least one variant attribute is required');
  }
  
  if (variantData.price === undefined || variantData.price === null) {
    throw new Error('Variant price is required');
  }
  
  if (variantData.price < 0) {
    throw new Error('Variant price must be non-negative');
  }
  
  // Check if product exists
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, title, seller_id')
    .eq('id', productId)
    .single();
  
  if (productError || !product) {
    throw new Error('Product not found');
  }
  
  // Validate unique attributes
  const isUnique = await validateUniqueAttributes(productId, variantData.attributes);
  if (!isUnique) {
    throw new Error('Variant with these attributes already exists for this product');
  }
  
  // Generate SKU if not provided
  const sku = variantData.sku || generateSKU(productId, variantData.attributes);
  
  // Check SKU uniqueness
  const { data: existingSku } = await supabase
    .from('product_variants')
    .select('id')
    .eq('sku', sku)
    .single();
  
  if (existingSku) {
    throw new Error('SKU already exists');
  }
  
  // Generate variant name from attributes
  const variantName = Object.entries(variantData.attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  
  // Create variant
  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .insert([{
      product_id: productId,
      variant_name: variantName,
      sku: sku,
      price: variantData.price,
      compare_at_price: variantData.compareAtPrice || null,
      attributes: variantData.attributes,
      images: variantData.images || [],
      is_available: variantData.isAvailable !== undefined ? variantData.isAvailable : true
    }])
    .select(`
      *,
      product:products(id, title, seller_id)
    `)
    .single();
  
  if (variantError) {
    if (variantError.code === '23505') { // Unique constraint violation
      throw new Error('SKU already exists or duplicate variant attributes');
    }
    throw variantError;
  }
  
  // Create inventory record for the variant
  const { data: inventory, error: inventoryError } = await supabase
    .from('variant_inventory')
    .insert([{
      variant_id: variant.id,
      quantity: variantData.initialQuantity || 0,
      reserved_quantity: 0,
      low_stock_threshold: variantData.lowStockThreshold || 10
    }])
    .select()
    .single();
  
  if (inventoryError) {
    // Rollback: delete the variant if inventory creation fails
    await supabase.from('product_variants').delete().eq('id', variant.id);
    throw inventoryError;
  }
  
  // Return variant with inventory
  return {
    ...variant,
    inventory: inventory
  };
}

/**
 * Get all variants for a product with optional attribute filtering
 * @param {String} productId - Product UUID
 * @param {Object} filters - Optional filters (attributes, isAvailable)
 * @returns {Promise<Array>} Array of variant objects with inventory
 */
async function getProductVariants(productId, filters = {}) {
  // Check cache first (10-minute TTL)
  const cacheKey = `variants_${productId}_${JSON.stringify(filters)}`;
  let variants = cache.get(cacheKey, 'medium');
  
  if (variants) {
    return variants;
  }
  
  let query = supabase
    .from('product_variants')
    .select(`
      *,
      inventory:variant_inventory(*),
      product:products(id, title, seller_id)
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: true });
  
  // Filter by availability if specified
  if (filters.isAvailable !== undefined) {
    query = query.eq('is_available', filters.isAvailable);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  variants = data || [];
  
  // Filter by attributes if specified
  if (filters.attributes && Object.keys(filters.attributes).length > 0) {
    variants = variants.filter(variant => {
      // Check if all filter attributes match
      return Object.entries(filters.attributes).every(([key, value]) => {
        return variant.attributes[key] === value;
      });
    });
  }
  
  // Calculate available quantity for each variant
  variants = variants.map(variant => {
    const inv = variant.inventory && variant.inventory.length > 0 ? variant.inventory[0] : null;
    return {
      ...variant,
      inventory: inv,
      availableQuantity: inv ? (inv.quantity - inv.reserved_quantity) : 0
    };
  });
  
  // Cache for 10 minutes
  cache.set(cacheKey, variants, 'medium');
  
  return variants;
}

/**
 * Get variant by ID
 * @param {String} variantId - Variant UUID
 * @returns {Promise<Object|null>} Variant object with inventory or null
 */
async function getVariantById(variantId) {
  const { data, error } = await supabase
    .from('product_variants')
    .select(`
      *,
      inventory:variant_inventory(*),
      product:products(id, title, seller_id)
    `)
    .eq('id', variantId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  // Calculate available quantity
  const inv = data.inventory && data.inventory.length > 0 ? data.inventory[0] : null;
  return {
    ...data,
    inventory: inv,
    availableQuantity: inv ? (inv.quantity - inv.reserved_quantity) : 0
  };
}

/**
 * Update variant details
 * @param {String} variantId - Variant UUID
 * @param {Object} updateData - Updated fields
 * @returns {Promise<Object>} Updated variant object
 */
async function updateVariant(variantId, updateData) {
  // Get existing variant
  const existing = await getVariantById(variantId);
  if (!existing) {
    throw new Error('Variant not found');
  }
  
  const updates = {};
  
  // Validate and prepare updates
  if (updateData.price !== undefined) {
    if (updateData.price < 0) {
      throw new Error('Variant price must be non-negative');
    }
    updates.price = updateData.price;
  }
  
  if (updateData.compareAtPrice !== undefined) {
    updates.compare_at_price = updateData.compareAtPrice;
  }
  
  if (updateData.images !== undefined) {
    updates.images = updateData.images;
  }
  
  if (updateData.isAvailable !== undefined) {
    updates.is_available = updateData.isAvailable;
  }
  
  // Handle attribute updates
  if (updateData.attributes !== undefined) {
    if (Object.keys(updateData.attributes).length === 0) {
      throw new Error('At least one variant attribute is required');
    }
    
    // Validate unique attributes (excluding current variant)
    const isUnique = await validateUniqueAttributes(
      existing.product_id,
      updateData.attributes,
      variantId
    );
    
    if (!isUnique) {
      throw new Error('Variant with these attributes already exists for this product');
    }
    
    updates.attributes = updateData.attributes;
    
    // Regenerate variant name
    updates.variant_name = Object.entries(updateData.attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }
  
  // Handle SKU updates
  if (updateData.sku !== undefined) {
    // Check SKU uniqueness
    const { data: existingSku } = await supabase
      .from('product_variants')
      .select('id')
      .eq('sku', updateData.sku)
      .neq('id', variantId)
      .single();
    
    if (existingSku) {
      throw new Error('SKU already exists');
    }
    
    updates.sku = updateData.sku;
  }
  
  if (Object.keys(updates).length === 0) {
    return existing; // No updates needed
  }
  
  updates.updated_at = new Date().toISOString();
  
  // Perform update
  const { data, error } = await supabase
    .from('product_variants')
    .update(updates)
    .eq('id', variantId)
    .select(`
      *,
      inventory:variant_inventory(*),
      product:products(id, title, seller_id)
    `)
    .single();
  
  if (error) {
    if (error.code === '23505') {
      throw new Error('SKU already exists or duplicate variant attributes');
    }
    throw error;
  }
  
  // Calculate available quantity
  const inv = data.inventory && data.inventory.length > 0 ? data.inventory[0] : null;
  return {
    ...data,
    inventory: inv,
    availableQuantity: inv ? (inv.quantity - inv.reserved_quantity) : 0
  };
}

/**
 * Delete variant
 * @param {String} variantId - Variant UUID
 * @returns {Promise<void>}
 */
async function deleteVariant(variantId) {
  const { error } = await supabase
    .from('product_variants')
    .delete()
    .eq('id', variantId);
  
  if (error) throw error;
}

/**
 * Get variant by SKU
 * @param {String} sku - Variant SKU
 * @returns {Promise<Object|null>} Variant object or null
 */
async function getVariantBySKU(sku) {
  const { data, error } = await supabase
    .from('product_variants')
    .select(`
      *,
      inventory:variant_inventory(*),
      product:products(id, title, seller_id)
    `)
    .eq('sku', sku)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  // Calculate available quantity
  const inv = data.inventory && data.inventory.length > 0 ? data.inventory[0] : null;
  return {
    ...data,
    inventory: inv,
    availableQuantity: inv ? (inv.quantity - inv.reserved_quantity) : 0
  };
}

/**
 * Check if product has variants
 * @param {String} productId - Product UUID
 * @returns {Promise<Boolean>} True if product has variants
 */
async function hasVariants(productId) {
  const { data, error } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', productId)
    .limit(1);
  
  if (error) throw error;
  
  return data && data.length > 0;
}

/**
 * Check if variant has sufficient inventory
 * @param {String} variantId - Variant UUID
 * @param {Number} requestedQuantity - Requested quantity
 * @returns {Promise<Boolean>} True if sufficient inventory available
 */
async function checkVariantAvailability(variantId, requestedQuantity) {
  const { data, error } = await supabase
    .from('variant_inventory')
    .select('quantity, reserved_quantity')
    .eq('variant_id', variantId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return false; // No inventory record
    throw error;
  }
  
  const availableQuantity = data.quantity - data.reserved_quantity;
  return availableQuantity >= requestedQuantity;
}

/**
 * Get variant inventory details
 * @param {String} variantId - Variant UUID
 * @returns {Promise<Object|null>} Inventory object or null
 */
async function getVariantInventory(variantId) {
  const { data, error } = await supabase
    .from('variant_inventory')
    .select('*')
    .eq('variant_id', variantId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return {
    ...data,
    availableQuantity: data.quantity - data.reserved_quantity
  };
}

module.exports = {
  createVariant,
  getProductVariants,
  getVariantById,
  updateVariant,
  deleteVariant,
  getVariantBySKU,
  hasVariants,
  checkVariantAvailability,
  getVariantInventory,
  generateSKU,
  validateUniqueAttributes
};
