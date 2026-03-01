/**
 * PRODUCT CONTROLLER
 * 
 * Handles product-related operations for all roles.
 * Phase 3: Multi-vendor product management with approval workflow
 */

const productService = require('../../services/productServices/product.service');

/**
 * Get all products (role-based visibility)
 * GET /api/products
 * 
 * Visibility rules:
 * - Customers: Only approved products
 * - Sellers: Only their own products (all statuses)
 * - Managers/Admins: All products
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { status, categoryId, limit, offset, approvalStatus } = req.query;
    const user = req.user; // May be undefined for public access

    const filters = {
      categoryId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };

    // Apply role-based visibility
    if (!user) {
      // Public access - only approved products
      filters.approvalStatus = 'approved';
      filters.status = 'active';
    } else if (user.role === 'customer') {
      // Customers - only approved products
      filters.approvalStatus = 'approved';
      filters.status = status || 'active';
    } else if (user.role === 'seller') {
      // Sellers - only their own products (all statuses)
      filters.sellerId = user.id;
      if (status) filters.status = status;
      if (approvalStatus) filters.approvalStatus = approvalStatus;
    } else if (user.role === 'manager' || user.role === 'admin') {
      // Managers/Admins - all products
      if (status) filters.status = status;
      if (approvalStatus) filters.approvalStatus = approvalStatus;
    }

    const products = await productService.findAll(filters);

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID (role-based visibility)
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const product = await productService.findById(id);

    if (!product) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Product not found' 
      });
    }

    // Apply visibility rules
    if (!user || user.role === 'customer') {
      // Public/Customer - only approved products
      if (product.approval_status !== 'approved') {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Product not found' 
        });
      }
    } else if (user.role === 'seller') {
      // Sellers - only their own products
      if (product.seller_id !== user.id) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You can only view your own products' 
        });
      }
    }
    // Managers/Admins can view all products

    res.json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * Search products (role-based visibility)
 * GET /api/products/search?q=laptop
 */
const searchProducts = async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;
    const user = req.user;

    if (!q) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Search query is required' 
      });
    }

    const filters = {
      searchTerm: q,
      limit: parseInt(limit)
    };

    // Apply role-based visibility
    if (!user || user.role === 'customer') {
      filters.approvalStatus = 'approved';
    } else if (user.role === 'seller') {
      filters.sellerId = user.id;
    }
    // Managers/Admins can search all products

    const products = await productService.search(filters);

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create product (Seller only)
 * POST /api/seller/products
 */
const createProduct = async (req, res, next) => {
  try {
    console.log('📦 Create product request from seller:', req.user?.id);
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📦 Request headers:', JSON.stringify(req.headers, null, 2));
    
    const { title, description, price, imageUrl, categoryId, initialQuantity, lowStockThreshold } = req.body;
    const sellerId = req.user?.id;

    // Enhanced validation
    if (!sellerId) {
      console.log('❌ Validation failed: no seller ID in request');
      return res.status(401).json({ 
        error: 'Authentication Error',
        message: 'Seller ID not found in request. Please login again.' 
      });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      console.log('❌ Validation failed: invalid title');
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Title is required and must be a non-empty string' 
      });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      console.log('❌ Validation failed: invalid description');
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Description is required and must be a non-empty string' 
      });
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      console.log('❌ Validation failed: invalid price:', price);
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Price is required and must be a positive number' 
      });
    }

    // Prepare product data with safe parsing
    const productData = {
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : null,
      categoryId: categoryId || null,
      sellerId: sellerId,
      initialQuantity: initialQuantity ? parseInt(initialQuantity) : 0,
      lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 10,
      status: 'active',
      approvalStatus: 'pending' // New products require approval (lowercase for database constraint)
    };

    console.log('📦 Creating product with processed data:', JSON.stringify(productData, null, 2));

    const product = await productService.create(productData);

    console.log('✅ Product created successfully:', product.id);

    res.status(201).json({
      success: true,
      message: 'Product created successfully. Pending manager approval.',
      product
    });
  } catch (error) {
    console.error('❌ Error in createProduct controller:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    
    // Send appropriate error response
    if (error.message && error.message.includes('Missing required fields')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }
    
    if (error.message && error.message.includes('Price must be')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }
    
    // Database constraint errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        error: 'Conflict Error',
        message: 'A product with similar details already exists'
      });
    }
    
    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({
        error: 'Reference Error',
        message: 'Invalid reference to seller, category, or store'
      });
    }
    
    if (error.code === '23514') { // Check constraint violation
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Data does not meet database constraints'
      });
    }
    
    // Generic server error
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create product. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update product (Seller only - own products)
 * PUT /api/seller/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, price, imageUrl, categoryId, status } = req.body;
    const sellerId = req.user.id;

    // Check if product exists and belongs to seller
    const product = await productService.findById(id);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Product not found' 
      });
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only update your own products' 
      });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) {
      if (price <= 0) {
        return res.status(400).json({ 
          error: 'Validation Error',
          message: 'Price must be greater than 0' 
        });
      }
      updates.price = price;
    }
    if (imageUrl !== undefined) updates.image_url = imageUrl;
    if (categoryId !== undefined) updates.category_id = categoryId;
    if (status !== undefined) updates.status = status;

    // If product was approved and seller makes changes, reset to pending
    if (product.approval_status === 'approved' && Object.keys(updates).length > 0) {
      updates.approval_status = 'pending';
      updates.approved_by = null;
      updates.approved_at = null;
    }

    const updatedProduct = await productService.update(id, updates);

    const message = updates.approval_status === 'pending' 
      ? 'Product updated successfully. Pending manager re-approval.'
      : 'Product updated successfully.';

    res.json({
      message,
      product: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product (Seller only - own products)
 * DELETE /api/seller/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    // Check if product exists and belongs to seller
    const product = await productService.findById(id);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Product not found' 
      });
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only delete your own products' 
      });
    }

    await productService.deleteProduct(id);

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller's own products
 * GET /api/seller/products
 */
const getSellerProducts = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { status, approvalStatus, limit, offset } = req.query;

    const filters = {
      sellerId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };

    if (status) filters.status = status;
    if (approvalStatus) filters.approvalStatus = approvalStatus;

    const products = await productService.findAll(filters);

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product approval queue (Manager/Admin only)
 * GET /api/manager/products/pending
 */
const getApprovalQueue = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const filters = {
      approvalStatus: 'pending',
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };

    const products = await productService.findAll(filters);

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve product (Manager/Admin only)
 * POST /api/manager/products/:id/approve
 */
const approveProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const managerId = req.user.id;

    const product = await productService.findById(id);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Product not found' 
      });
    }

    if (product.approval_status === 'approved') {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Product is already approved' 
      });
    }

    const updatedProduct = await productService.approveProduct(id, managerId);

    // TODO: Send notification to seller
    // await notificationService.notifySellerProductApproved(product.seller_id, id);

    res.json({
      message: 'Product approved successfully',
      product: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject product (Manager/Admin only)
 * POST /api/manager/products/:id/reject
 */
const rejectProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const managerId = req.user.id;

    if (!reason) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Rejection reason is required' 
      });
    }

    const product = await productService.findById(id);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Product not found' 
      });
    }

    if (product.approval_status === 'rejected') {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Product is already rejected' 
      });
    }

    const updatedProduct = await productService.rejectProduct(id, managerId, reason);

    // TODO: Send notification to seller
    // await notificationService.notifySellerProductRejected(product.seller_id, id, reason);

    res.json({
      message: 'Product rejected',
      product: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  getApprovalQueue,
  approveProduct,
  rejectProduct
};

