/**
 * CATEGORY SERVICE
 * 
 * Business logic layer for category operations.
 * Supports hierarchical categories (parent-child relationships).
 */

const supabase = require('../../config/supabase');

/**
 * Find category by ID
 * @param {String} id - Category UUID
 * @returns {Promise<Object|null>} Category object or null
 */
const findById = async (id) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Find category by name
 * @param {String} name - Category name
 * @returns {Promise<Object|null>} Category object or null
 */
const findByName = async (name) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('name', name)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Get all categories
 * @returns {Promise<Array>} Array of category objects
 */
const findAll = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get root categories (no parent)
 * @returns {Promise<Array>} Array of root category objects
 */
const getRootCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('name');
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get subcategories of a parent category
 * @param {String} parentId - Parent category UUID
 * @returns {Promise<Array>} Array of subcategory objects
 */
const getSubcategories = async (parentId) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', parentId)
    .order('name');
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get category hierarchy (tree structure)
 * @returns {Promise<Array>} Array of root categories with nested children
 */
const getHierarchy = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw error;

  // Build hierarchy tree
  const categories = data || [];
  const categoryMap = {};
  const rootCategories = [];

  // Create map
  categories.forEach(cat => {
    categoryMap[cat.id] = { ...cat, children: [] };
  });

  // Build tree
  categories.forEach(cat => {
    if (cat.parent_id) {
      if (categoryMap[cat.parent_id]) {
        categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
      }
    } else {
      rootCategories.push(categoryMap[cat.id]);
    }
  });

  return rootCategories;
};

/**
 * Create new category
 * @param {Object} categoryData - Category data
 * @returns {Promise<Object>} Created category object
 */
const create = async (categoryData) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{
      name: categoryData.name,
      description: categoryData.description || null,
      parent_id: categoryData.parentId || null
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Update category
 * @param {String} id - Category UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated category object
 */
const update = async (id, updates) => {
  const updateData = {};
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;

  const { data, error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Delete category
 * @param {String} id - Category UUID
 * @returns {Promise<void>}
 */
const deleteCategory = async (id) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

/**
 * Get products in category
 * @param {String} categoryId - Category UUID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of product objects
 */
const getProducts = async (categoryId, options = {}) => {
  let query = supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

module.exports = {
  findById,
  findByName,
  findAll,
  getRootCategories,
  getSubcategories,
  getHierarchy,
  create,
  update,
  deleteCategory,
  getProducts
};
