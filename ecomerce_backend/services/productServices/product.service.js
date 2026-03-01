/**
 * PRODUCT SERVICE
 * 
 * Business logic layer for product operations.
 * Phase 3: Multi-vendor product management with approval workflow
 */

const supabase = require('../../config/supabase');

/**
 * Find product by ID
 * @param {String} id - Product UUID
 * @returns {Promise<Object|null>} Product object or null
 */
const findById = async (id) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      inventory(quantity, reserved_quantity),
      seller:users!products_seller_id_fkey(id, display_name, business_name, email),
      approved_by_user:users!products_approved_by_fkey(id, display_name, email)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Get all products with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of product objects
 */
const findAll = async (filters = {}) => {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      inventory(quantity, reserved_quantity),
      seller:users!products_seller_id_fkey(id, display_name, business_name, email)
    `)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.approvalStatus) {
    query = query.eq('approval_status', filters.approvalStatus);
  }

  if (filters.sellerId) {
    query = query.eq('seller_id', filters.sellerId);
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Search products by title
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} Array of product objects
 */
const search = async (filters) => {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      inventory(quantity),
      seller:users!products_seller_id_fkey(id, display_name, business_name)
    `)
    .ilike('title', `%${filters.searchTerm}%`)
    .limit(filters.limit || 20);

  if (filters.approvalStatus) {
    query = query.eq('approval_status', filters.approvalStatus);
  }

  if (filters.sellerId) {
    query = query.eq('seller_id', filters.sellerId);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Create new product
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product object
 */
const create = async (productData) => {
  try {
    console.log('📦 Creating product with data:', JSON.stringify(productData, null, 2));
    
    // Validate required fields
    if (!productData.title || !productData.description || !productData.price || !productData.sellerId) {
      throw new Error('Missing required fields: title, description, price, and sellerId are required');
    }
    
    // Ensure price is a valid number
    const price = parseFloat(productData.price);
    if (isNaN(price) || price <= 0) {
      throw new Error('Price must be a valid positive number');
    }
    
    // Prepare product data with safe defaults
    const insertData = {
      title: productData.title.trim(),
      description: productData.description.trim(),
      price: price,
      image_url: productData.imageUrl || 'https://via.placeholder.com/400x400/667eea/ffffff?text=Product',
      category_id: productData.categoryId || null,
      seller_id: productData.sellerId,
      status: productData.status || 'active',
      approval_status: productData.approvalStatus || 'pending',
      created_by: productData.sellerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📦 Inserting product data:', JSON.stringify(insertData, null, 2));
    
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([insertData])
      .select(`
        *,
        category:categories(id, name),
        seller:users!products_seller_id_fkey(id, display_name, business_name, email)
      `)
      .single();
    
    if (productError) {
      console.error('❌ Product creation error:', productError);
      console.error('❌ Error details:', {
        message: productError.message,
        details: productError.details,
        hint: productError.hint,
        code: productError.code
      });
      throw new Error(`Product creation failed: ${productError.message}`);
    }

    console.log('✅ Product created successfully:', product.id);

    // Create inventory record with error handling
    try {
      const inventoryData = {
        product_id: product.id,
        quantity: parseInt(productData.initialQuantity) || 0,
        low_stock_threshold: parseInt(productData.lowStockThreshold) || 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📦 Creating inventory with data:', JSON.stringify(inventoryData, null, 2));
      
      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert([inventoryData]);
      
      if (inventoryError) {
        console.error('❌ Inventory creation error:', inventoryError);
        console.error('❌ Inventory error details:', {
          message: inventoryError.message,
          details: inventoryError.details,
          hint: inventoryError.hint,
          code: inventoryError.code
        });
        
        // Don't fail the entire operation if inventory creation fails
        // The product was created successfully
        console.log('⚠️ Product created but inventory creation failed. Continuing...');
      } else {
        console.log('✅ Inventory created for product:', product.id);
      }
    } catch (invError) {
      console.error('❌ Inventory creation exception:', invError.message);
      console.log('⚠️ Product created but inventory creation failed. Continuing...');
    }
    
    return product;
  } catch (error) {
    console.error('❌ Error in product.service.create:', error);
    console.error('❌ Full error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

/**
 * Update product
 * @param {String} id - Product UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated product object
 */
const update = async (id, updates) => {
  const updateData = {};
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.price !== undefined) updateData.price = updates.price;
  if (updates.image_url !== undefined) updateData.image_url = updates.image_url;
  if (updates.category_id !== undefined) updateData.category_id = updates.category_id;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.approval_status !== undefined) updateData.approval_status = updates.approval_status;
  if (updates.approved_by !== undefined) updateData.approved_by = updates.approved_by;
  if (updates.approved_at !== undefined) updateData.approved_at = updates.approved_at;
  if (updates.rejection_reason !== undefined) updateData.rejection_reason = updates.rejection_reason;
  
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      category:categories(id, name),
      seller:users!products_seller_id_fkey(id, display_name, business_name, email),
      approved_by_user:users!products_approved_by_fkey(id, display_name, email)
    `)
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Approve product (Manager/Admin)
 * @param {String} productId - Product UUID
 * @param {String} managerId - Manager/Admin UUID
 * @returns {Promise<Object>} Updated product object
 */
const approveProduct = async (productId, managerId) => {
  return await update(productId, {
    approval_status: 'approved',
    approved_by: managerId,
    approved_at: new Date().toISOString(),
    rejection_reason: null
  });
};

/**
 * Reject product (Manager/Admin)
 * @param {String} productId - Product UUID
 * @param {String} managerId - Manager/Admin UUID
 * @param {String} reason - Rejection reason
 * @returns {Promise<Object>} Updated product object
 */
const rejectProduct = async (productId, managerId, reason) => {
  return await update(productId, {
    approval_status: 'rejected',
    approved_by: managerId,
    approved_at: new Date().toISOString(),
    rejection_reason: reason
  });
};

/**
 * Delete product
 * @param {String} id - Product UUID
 * @returns {Promise<void>}
 */
const deleteProduct = async (id) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

/**
 * Update product inventory
 * @param {String} productId - Product UUID
 * @param {Number} quantity - New quantity
 * @returns {Promise<Object>} Updated inventory object
 */
const updateInventory = async (productId, quantity) => {
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
 * Get low stock products (seller-specific or all)
 * @param {String} sellerId - Optional seller ID filter
 * @returns {Promise<Array>} Array of low stock products
 */
const getLowStock = async (sellerId = null) => {
  let query = supabase
    .from('products')
    .select(`
      *,
      inventory(quantity, low_stock_threshold),
      seller:users!products_seller_id_fkey(id, display_name, business_name)
    `)
    .eq('status', 'active');

  if (sellerId) {
    query = query.eq('seller_id', sellerId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  const lowStockProducts = (data || []).filter(product => {
    // Handle both array and object inventory
    const inv = Array.isArray(product.inventory) 
      ? product.inventory[0] 
      : product.inventory;
    
    if (!inv || typeof inv.quantity === 'undefined') return false;
    return inv.quantity <= (inv.low_stock_threshold || 10);
  });
  
  return lowStockProducts;
};

module.exports = {
  findById,
  findAll,
  search,
  create,
  update,
  approveProduct,
  rejectProduct,
  deleteProduct,
  updateInventory,
  getLowStock
};
