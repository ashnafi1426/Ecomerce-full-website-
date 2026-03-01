/**
 * INVENTORY SERVICE
 * 
 * Business logic layer for inventory/stock management.
 * Handles stock tracking, reservations, and fulfillment.
 */

const supabase = require('../../config/supabase');

/**
 * Find inventory by product ID
 * @param {String} productId - Product UUID
 * @returns {Promise<Object|null>} Inventory object or null
 */
const findByProductId = async (productId) => {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('product_id', productId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Get all inventory records
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of inventory objects
 */
const findAll = async (filters = {}) => {
  let query = supabase
    .from('inventory')
    .select(`
      *,
      product:products(id, title, price, status)
    `)
    .order('updated_at', { ascending: false });

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Create inventory record
 * @param {Object} inventoryData - Inventory data
 * @returns {Promise<Object>} Created inventory object
 */
const create = async (inventoryData) => {
  const { data, error } = await supabase
    .from('inventory')
    .insert([{
      product_id: inventoryData.productId,
      quantity: inventoryData.quantity || 0,
      reserved_quantity: 0,
      low_stock_threshold: inventoryData.lowStockThreshold || 10
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Update inventory quantity
 * @param {String} productId - Product UUID
 * @param {Number} quantity - New quantity
 * @returns {Promise<Object>} Updated inventory object
 */
const updateQuantity = async (productId, quantity) => {
  const { data, error } = await supabase
    .from('inventory')
    .update({ 
      quantity,
      updated_at: new Date().toISOString()
    })
    .eq('product_id', productId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Adjust inventory quantity (add or subtract)
 * @param {String} productId - Product UUID
 * @param {Number} adjustment - Amount to add (positive) or subtract (negative)
 * @returns {Promise<Object>} Updated inventory object
 */
const adjustQuantity = async (productId, adjustment) => {
  // Get current inventory
  const inventory = await findByProductId(productId);
  
  if (!inventory) {
    throw new Error('Inventory not found for product');
  }

  const newQuantity = inventory.quantity + adjustment;

  if (newQuantity < 0) {
    throw new Error('Insufficient inventory');
  }

  return await updateQuantity(productId, newQuantity);
};

/**
 * Reserve inventory for an order
 * @param {String} productId - Product UUID
 * @param {Number} quantity - Quantity to reserve
 * @returns {Promise<Object>} Updated inventory object
 */
const reserve = async (productId, quantity) => {
  // Get current inventory
  const inventory = await findByProductId(productId);
  
  if (!inventory) {
    throw new Error('Inventory not found for product');
  }

  const availableQuantity = inventory.quantity - inventory.reserved_quantity;

  if (availableQuantity < quantity) {
    throw new Error('Insufficient available inventory');
  }

  const { data, error } = await supabase
    .from('inventory')
    .update({ 
      reserved_quantity: inventory.reserved_quantity + quantity,
      updated_at: new Date().toISOString()
    })
    .eq('product_id', productId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Release reserved inventory
 * @param {String} productId - Product UUID
 * @param {Number} quantity - Quantity to release
 * @returns {Promise<Object>} Updated inventory object
 */
const release = async (productId, quantity) => {
  const inventory = await findByProductId(productId);
  
  if (!inventory) {
    throw new Error('Inventory not found for product');
  }

  const newReserved = Math.max(0, inventory.reserved_quantity - quantity);

  const { data, error } = await supabase
    .from('inventory')
    .update({ 
      reserved_quantity: newReserved,
      updated_at: new Date().toISOString()
    })
    .eq('product_id', productId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Fulfill reserved inventory (decrease both quantity and reserved)
 * @param {String} productId - Product UUID
 * @param {Number} quantity - Quantity to fulfill
 * @returns {Promise<Object>} Updated inventory object
 */
const fulfill = async (productId, quantity) => {
  const inventory = await findByProductId(productId);
  
  if (!inventory) {
    throw new Error('Inventory not found for product');
  }

  if (inventory.reserved_quantity < quantity) {
    throw new Error('Insufficient reserved inventory');
  }

  const { data, error } = await supabase
    .from('inventory')
    .update({ 
      quantity: inventory.quantity - quantity,
      reserved_quantity: inventory.reserved_quantity - quantity,
      updated_at: new Date().toISOString()
    })
    .eq('product_id', productId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Get available quantity (total - reserved)
 * @param {String} productId - Product UUID
 * @returns {Promise<Number>} Available quantity
 */
const getAvailable = async (productId) => {
  const inventory = await findByProductId(productId);
  
  if (!inventory) return 0;
  
  return inventory.quantity - inventory.reserved_quantity;
};

/**
 * Check if product has sufficient stock
 * @param {String} productId - Product UUID
 * @param {Number} requiredQuantity - Required quantity
 * @returns {Promise<Boolean>} True if sufficient stock
 */
const hasStock = async (productId, requiredQuantity) => {
  const available = await getAvailable(productId);
  return available >= requiredQuantity;
};

/**
 * Get low stock products
 * @returns {Promise<Array>} Array of low stock inventory records
 */
const getLowStock = async () => {
  // Fetch all inventory records with product details
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      *,
      product:products(id, title, price, status)
    `)
    .order('quantity', { ascending: true });
  
  if (error) throw error;
  
  // Filter where quantity <= low_stock_threshold
  const lowStockItems = (data || []).filter(item => 
    item.quantity <= item.low_stock_threshold
  );
  
  return lowStockItems;
};

/**
 * Get out of stock products
 * @returns {Promise<Array>} Array of out of stock inventory records
 */
const getOutOfStock = async () => {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      *,
      product:products(id, title, price, status)
    `)
    .eq('quantity', 0)
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Update low stock threshold
 * @param {String} productId - Product UUID
 * @param {Number} threshold - New threshold
 * @returns {Promise<Object>} Updated inventory object
 */
const updateThreshold = async (productId, threshold) => {
  const { data, error } = await supabase
    .from('inventory')
    .update({ 
      low_stock_threshold: threshold,
      updated_at: new Date().toISOString()
    })
    .eq('product_id', productId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

module.exports = {
  findByProductId,
  findAll,
  create,
  updateQuantity,
  adjustQuantity,
  reserve,
  release,
  fulfill,
  getAvailable,
  hasStock,
  getLowStock,
  getOutOfStock,
  updateThreshold
};
