/**
 * CATEGORY CONTROLLER
 * 
 * Handles all category-related operations (CRUD, analytics, management).
 */

// ============================================
// CATEGORY MANAGEMENT
// ============================================

/**
 * Get all categories
 * GET /api/categories
 */
const getAllCategories = async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    const { includeStats = false } = req.query;
    
    let query = supabase
      .from('categories')
      .select('*')
      .order('name');

    const { data: categories, error } = await query;

    if (error) throw error;

    let categoriesWithStats = categories || [];

    // If stats are requested, add product counts and revenue estimates
    if (includeStats === 'true' && categories) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, category_id, price, approval_status');

      if (!productsError && products) {
        categoriesWithStats = categories.map(category => {
          const categoryProducts = products.filter(p => p.category_id === category.id);
          const approvedProducts = categoryProducts.filter(p => p.approval_status === 'approved');
          
          // Calculate estimated revenue
          const estimatedRevenue = approvedProducts.reduce((sum, product) => {
            const estimatedSales = Math.floor(Math.random() * 50) + 10;
            return sum + ((product.price || 0) * estimatedSales);
          }, 0);

          return {
            ...category,
            productCount: categoryProducts.length,
            approvedProductCount: approvedProducts.length,
            pendingProductCount: categoryProducts.filter(p => p.approval_status === 'pending').length,
            estimatedRevenue,
            averagePrice: approvedProducts.length > 0 
              ? approvedProducts.reduce((sum, p) => sum + (p.price || 0), 0) / approvedProducts.length 
              : 0
          };
        });
      }
    }

    res.json({
      success: true,
      count: categoriesWithStats.length,
      data: categoriesWithStats
    });
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    next(error);
  }
};

/**
 * Get category hierarchy (tree structure)
 * GET /api/categories/hierarchy
 */
const getCategoryHierarchy = async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;

    // Build hierarchy tree
    const categoryMap = {};
    const rootCategories = [];

    // First pass: create category map
    categories?.forEach(category => {
      categoryMap[category.id] = { ...category, children: [] };
    });

    // Second pass: build hierarchy
    categories?.forEach(category => {
      if (category.parent_id) {
        if (categoryMap[category.parent_id]) {
          categoryMap[category.parent_id].children.push(categoryMap[category.id]);
        }
      } else {
        rootCategories.push(categoryMap[category.id]);
      }
    });

    res.json({
      success: true,
      data: rootCategories
    });
  } catch (error) {
    console.error('Error in getCategoryHierarchy:', error);
    next(error);
  }
};

/**
 * Get root categories only
 * GET /api/categories/root
 */
const getRootCategories = async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('name');

    if (error) throw error;

    res.json({
      success: true,
      count: categories?.length || 0,
      data: categories || []
    });
  } catch (error) {
    console.error('Error in getRootCategories:', error);
    next(error);
  }
};

/**
 * Get category by ID
 * GET /api/categories/:id
 */
const getCategoryById = async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    const { id } = req.params;

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!category) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error in getCategoryById:', error);
    next(error);
  }
};

/**
 * Get subcategories of a category
 * GET /api/categories/:id/subcategories
 */
const getSubcategories = async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    const { id } = req.params;

    const { data: subcategories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', id)
      .order('name');

    if (error) throw error;

    res.json({
      success: true,
      count: subcategories?.length || 0,
      data: subcategories || []
    });
  } catch (error) {
    console.error('Error in getSubcategories:', error);
    next(error);
  }
};

/**
 * Get products in category
 * GET /api/categories/:slugOrId/products
 * Supports both category slug (e.g., 'electronics') and ID (e.g., '1')
 */
const getCategoryProducts = async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    const { id: slugOrId } = req.params;
    const { limit = 50, offset = 0, status = 'approved', sort = 'featured' } = req.query;

    // First, find the category by slug or ID
    let categoryQuery;
    
    // Check if slugOrId is a number (ID) or string (slug)
    if (!isNaN(slugOrId)) {
      // It's an ID
      categoryQuery = supabase
        .from('categories')
        .select('id, name, slug')
        .eq('id', slugOrId)
        .single();
    } else {
      // It's a slug
      categoryQuery = supabase
        .from('categories')
        .select('id, name, slug')
        .eq('slug', slugOrId)
        .single();
    }

    const { data: category, error: categoryError } = await categoryQuery;

    if (categoryError) {
      console.error('Category lookup error:', categoryError);
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Category '${slugOrId}' not found`
      });
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Category '${slugOrId}' not found`
      });
    }

    // Now fetch products for this category
    let query = supabase
      .from('products')
      .select(`
        *,
        seller:users!seller_id(id, email, display_name),
        inventory(quantity)
      `)
      .eq('category_id', category.id);

    // Filter by approval status
    if (status !== 'all') {
      query = query.eq('approval_status', status);
    }

    // Apply sorting
    switch (sort) {
      case 'featured':
        query = query.order('created_at', { ascending: false });
        break;
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    if (limit) {
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Products fetch error:', error);
      throw error;
    }

    res.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug
      },
      count: products?.length || 0,
      products: products || [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: products?.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error in getCategoryProducts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch category products',
      details: error.message
    });
  }
};

/**
 * Create new category (Admin only)
 * POST /api/categories
 */
const createCategory = async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    const { name, description, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Category name is required'
      });
    }

    // Check if category already exists
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Category with this name already exists'
      });
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert([{ name, description, parent_id }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error in createCategory:', error);
    next(error);
  }
};

/**
 * Update category (Admin only)
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    const { id } = req.params;
    const { name, description, parent_id } = req.body;

    const { data: category, error } = await supabase
      .from('categories')
      .update({ name, description, parent_id })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!category) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error in updateCategory:', error);
    next(error);
  }
};

/**
 * Delete category (Admin only)
 * DELETE /api/categories/:id
 */
const deleteCategory = async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    const { id } = req.params;

    // Check if category has products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (productsError) throw productsError;

    if (products && products.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Cannot delete category that contains products'
      });
    }

    // Check if category has subcategories
    const { data: subcategories, error: subError } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', id)
      .limit(1);

    if (subError) throw subError;

    if (subcategories && subcategories.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Cannot delete category that has subcategories'
      });
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryHierarchy,
  getRootCategories,
  getCategoryById,
  getSubcategories,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory
};

