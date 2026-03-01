/**
 * VARIANT INVENTORY SERVICE
 * 
 * Business logic layer for variant inventory operations.
 * Handles inventory tracking, reservation, fulfillment, and restoration.
 * 
 * Requirements: 1.7, 1.11, 1.12
 */

const supabase = require('../../config/supabase');

/**
 * Get inventory for specific variant
 * @param {String} variantId - Variant UUID
 * @returns {Promise<Object>} Inventory object with quantity
 */
async function getInventory(variantId) {
  const { data, error } = await supabase
    .from('variant_inventory')
    .select('*')
    .eq('variant_id', variantId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Inventory record not found for variant');
    }
    throw error;
  }
  
  return {
    ...data,
    availableQuantity: data.quantity - data.reserved_quantity
  };
}

/**
 * Update variant inventory quantity
 * @param {String} variantId - Variant UUID
 * @param {Number} quantity - New quantity
 * @returns {Promise<Object>} Updated inventory object
 */
async function updateInventory(variantId, quantity) {
  if (quantity < 0) {
    throw new Error('Inventory quantity cannot be negative');
  }
  
  const { data, error } = await supabase
    .from('variant_inventory')
    .update({
      quantity: quantity,
      last_restocked_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('variant_id', variantId)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    ...data,
    availableQuantity: data.quantity - data.reserved_quantity
  };
}

/**
 * Reserve inventory for order (atomic operation)
 * @param {String} variantId - Variant UUID
 * @param {Number} quantity - Quantity to reserve
 * @returns {Promise<Object>} Updated inventory object
 * @throws {Error} If insufficient inventory
 */
async function reserveInventory(variantId, quantity) {
  if (quantity <= 0) {
    throw new Error('Reserve quantity must be positive');
  }
  
  // Get current inventory with row lock
  const { data: current, error: fetchError } = await supabase
    .from('variant_inventory')
    .select('*')
    .eq('variant_id', variantId)
    .single();
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new Error('Inventory record not found for variant');
    }
    throw fetchError;
  }
  
  // Check if sufficient inventory available
  const availableQuantity = current.quantity - current.reserved_quantity;
  if (availableQuantity < quantity) {
    throw new Error(`Insufficient inventory. Available: ${availableQuantity}, Requested: ${quantity}`);
  }
  
  // Reserve inventory
  const { data, error } = await supabase
    .from('variant_inventory')
    .update({
      reserved_quantity: current.reserved_quantity + quantity,
      updated_at: new Date().toISOString()
    })
    .eq('variant_id', variantId)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    ...data,
    availableQuantity: data.quantity - data.reserved_quantity
  };
}

/**
 * Release reserved inventory (for cancelled orders)
 * @param {String} variantId - Variant UUID
 * @param {Number} quantity - Quantity to release
 * @returns {Promise<Object>} Updated inventory object
 */
async function releaseInventory(variantId, quantity) {
  if (quantity <= 0) {
    throw new Error('Release quantity must be positive');
  }
  
  // Get current inventory
  const { data: current, error: fetchError } = await supabase
    .from('variant_inventory')
    .select('*')
    .eq('variant_id', variantId)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Calculate new reserved quantity (ensure it doesn't go negative)
  const newReservedQuantity = Math.max(0, current.reserved_quantity - quantity);
  
  // Release inventory
  const { data, error } = await supabase
    .from('variant_inventory')
    .update({
      reserved_quantity: newReservedQuantity,
      updated_at: new Date().toISOString()
    })
    .eq('variant_id', variantId)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    ...data,
    availableQuantity: data.quantity - data.reserved_quantity
  };
}

/**
 * Fulfill reserved inventory (convert reservation to actual reduction)
 * @param {String} variantId - Variant UUID
 * @param {Number} quantity - Quantity to fulfill
 * @returns {Promise<Object>} Updated inventory object
 */
async function fulfillInventory(variantId, quantity) {
  if (quantity <= 0) {
    throw new Error('Fulfill quantity must be positive');
  }
  
  // Get current inventory
  const { data: current, error: fetchError } = await supabase
    .from('variant_inventory')
    .select('*')
    .eq('variant_id', variantId)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Validate sufficient reserved quantity
  if (current.reserved_quantity < quantity) {
    throw new Error(`Insufficient reserved inventory. Reserved: ${current.reserved_quantity}, Requested: ${quantity}`);
  }
  
  // Fulfill inventory (reduce both quantity and reserved_quantity)
  const { data, error } = await supabase
    .from('variant_inventory')
    .update({
      quantity: current.quantity - quantity,
      reserved_quantity: current.reserved_quantity - quantity,
      updated_at: new Date().toISOString()
    })
    .eq('variant_id', variantId)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    ...data,
    availableQuantity: data.quantity - data.reserved_quantity
  };
}

/**
 * Restore inventory (for returns/refunds)
 * @param {String} variantId - Variant UUID
 * @param {Number} quantity - Quantity to restore
 * @returns {Promise<Object>} Updated inventory object
 */
async function restoreInventory(variantId, quantity) {
  if (quantity <= 0) {
    throw new Error('Restore quantity must be positive');
  }
  
  // Get current inventory
  const { data: current, error: fetchError } = await supabase
    .from('variant_inventory')
    .select('*')
    .eq('variant_id', variantId)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Restore inventory
  const { data, error } = await supabase
    .from('variant_inventory')
    .update({
      quantity: current.quantity + quantity,
      updated_at: new Date().toISOString()
    })
    .eq('variant_id', variantId)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    ...data,
    availableQuantity: data.quantity - data.reserved_quantity
  };
}

/**
 * Adjust inventory (direct quantity change with reason)
 * @param {String} variantId - Variant UUID
 * @param {Number} adjustment - Quantity adjustment (positive or negative)
 * @param {String} reason - Reason for adjustment
 * @returns {Promise<Object>} Updated inventory object
 */
async function adjustInventory(variantId, adjustment, reason = 'manual_adjustment') {
  // Get current inventory
  const { data: current, error: fetchError } = await supabase
    .from('variant_inventory')
    .select('*')
    .eq('variant_id', variantId)
    .single();
  
  if (fetchError) throw fetchError;
  
  const newQuantity = current.quantity + adjustment;
  
  if (newQuantity < 0) {
    throw new Error('Adjustment would result in negative inventory');
  }
  
  // Adjust inventory
  const { data, error } = await supabase
    .from('variant_inventory')
    .update({
      quantity: newQuantity,
      updated_at: new Date().toISOString()
    })
    .eq('variant_id', variantId)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    ...data,
    availableQuantity: data.quantity - data.reserved_quantity,
    adjustment: adjustment,
    reason: reason
  };
}

/**
 * Check if variant has sufficient inventory
 * @param {String} variantId - Variant UUID
 * @param {Number} requestedQuantity - Requested quantity
 * @returns {Promise<Boolean>} True if sufficient
 */
async function checkAvailability(variantId, requestedQuantity) {
  const { data, error } = await supabase
    .from('variant_inventory')
    .select('quantity, reserved_quantity')
    .eq('variant_id', variantId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return false;
    throw error;
  }
  
  const availableQuantity = data.quantity - data.reserved_quantity;
  return availableQuantity >= requestedQuantity;
}

/**
 * Get low stock variants for a product
 * @param {String} productId - Product UUID
 * @returns {Promise<Array>} Array of low stock variants
 */
async function getLowStockVariants(productId) {
  const { data, error } = await supabase
    .from('variant_inventory')
    .select(`
      *,
      variant:product_variants!inner(
        id,
        product_id,
        variant_name,
        sku,
        attributes
      )
    `)
    .eq('variant.product_id', productId);
  
  if (error) throw error;
  
  // Filter variants where available quantity is at or below threshold
  const lowStockVariants = (data || []).filter(inv => {
    const availableQuantity = inv.quantity - inv.reserved_quantity;
    return availableQuantity <= inv.low_stock_threshold;
  });
  
  return lowStockVariants.map(inv => ({
    ...inv.variant,
    inventory: {
      ...inv,
      availableQuantity: inv.quantity - inv.reserved_quantity
    }
  }));
}

/**
 * Bulk update inventory for multiple variants
 * @param {Array} updates - Array of {variantId, quantity} objects
 * @returns {Promise<Array>} Array of updated inventory objects
 */
async function bulkUpdateInventory(updates) {
  const results = [];
  
  for (const update of updates) {
    try {
      const result = await updateInventory(update.variantId, update.quantity);
      results.push({ success: true, variantId: update.variantId, data: result });
    } catch (error) {
      results.push({ success: false, variantId: update.variantId, error: error.message });
    }
  }
  
  return results;
}

/**
 * Get inventory for all variants of a product
 * @param {String} productId - Product UUID
 * @returns {Promise<Array>} Array of inventory objects with variant details
 */
async function getInventoryByProduct(productId) {
  const { data, error } = await supabase
    .from('variant_inventory')
    .select(`
      *,
      variant:product_variants!inner(
        id,
        product_id,
        variant_name,
        sku,
        attributes,
        price
      )
    `)
    .eq('variant.product_id', productId);
  
  if (error) throw error;
  
  return (data || []).map(inv => ({
    ...inv.variant,
    inventory: {
      ...inv,
      availableQuantity: inv.quantity - inv.reserved_quantity
    }
  }));
}

module.exports = {
  getInventory,
  updateInventory,
  reserveInventory,
  releaseInventory,
  fulfillInventory,
  restoreInventory,
  adjustInventory,
  checkAvailability,
  getLowStockVariants,
  bulkUpdateInventory,
  getInventoryByProduct
};
