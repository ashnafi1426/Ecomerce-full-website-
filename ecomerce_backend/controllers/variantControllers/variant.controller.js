/**
 * PRODUCT VARIANT CONTROLLER
 * 
 * HTTP request handlers for product variant operations.
 * Handles variant creation, retrieval, updates, and inventory management.
 * 
 * Requirements: 1.1, 1.3, 1.4, 1.12
 */

const variantService = require('../../services/variantServices/variant.service');
const supabase = require('../../config/supabase');

/**
 * Create a new product variant
 * POST /api/variants
 * Body: { productId, attributes, price, compareAtPrice, images, sku, isAvailable, initialQuantity, lowStockThreshold }
 */
const createVariant = async (req, res, next) => {
  try {
    const { 
      productId, 
      attributes, 
      price, 
      compareAtPrice, 
      images, 
      sku,
      isAvailable,
      initialQuantity,
      lowStockThreshold
    } = req.body;

    // Validate required fields
    if (!productId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product ID is required'
      });
    }

    if (!attributes || typeof attributes !== 'object' || Object.keys(attributes).length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'At least one variant attribute is required'
      });
    }

    if (price === undefined || price === null) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Price is required'
      });
    }

    if (price < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Price must be non-negative'
      });
    }

    // Check if user is authorized (seller must own the product)
    if (req.user.role === 'seller') {
      const { data: product } = await supabase
        .from('products')
        .select('seller_id')
        .eq('id', productId)
        .single();

      if (!product || product.seller_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only create variants for your own products'
        });
      }
    }

    const variantData = {
      attributes,
      price,
      compareAtPrice,
      images: images || [],
      sku,
      isAvailable,
      initialQuantity: initialQuantity || 0,
      lowStockThreshold: lowStockThreshold || 10
    };

    const variant = await variantService.createVariant(productId, variantData);

    res.status(201).json({
      message: 'Variant created successfully',
      variant
    });
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message
      });
    }
    if (error.message.includes('not found') || error.message.includes('required')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }
    next(error);
  }
};


/**
 * Get all variants for a product
 * GET /api/products/:productId/variants
 * Query params: isAvailable (boolean), attributes (object)
 */
const getProductVariants = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const filters = {};

    // Parse isAvailable filter
    if (req.query.isAvailable !== undefined) {
      filters.isAvailable = req.query.isAvailable === 'true';
    }

    // Parse attributes filter (if provided as JSON string)
    if (req.query.attributes) {
      try {
        filters.attributes = JSON.parse(req.query.attributes);
      } catch (e) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid attributes format. Must be valid JSON.'
        });
      }
    }

    // Check if user is authorized to view variants
    if (req.user && req.user.role === 'seller') {
      const { data: product } = await supabase
        .from('products')
        .select('seller_id')
        .eq('id', productId)
        .single();

      if (!product || product.seller_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only view variants for your own products'
        });
      }
    }

    const variants = await variantService.getProductVariants(productId, filters);

    res.json({
      count: variants.length,
      variants
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific variant by ID
 * GET /api/variants/:variantId
 */
const getVariant = async (req, res, next) => {
  try {
    const { variantId } = req.params;

    const variant = await variantService.getVariantById(variantId);

    if (!variant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Variant not found'
      });
    }

    // Check if user is authorized to view this variant
    if (req.user && req.user.role === 'seller') {
      if (variant.product.seller_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only view variants for your own products'
        });
      }
    }

    res.json(variant);
  } catch (error) {
    next(error);
  }
};


/**
 * Update variant details
 * PUT /api/variants/:variantId
 * Body: { price, compareAtPrice, images, attributes, sku, isAvailable }
 */
const updateVariant = async (req, res, next) => {
  try {
    const { variantId } = req.params;

    // Get existing variant to check authorization
    const existing = await variantService.getVariantById(variantId);
    
    if (!existing) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Variant not found'
      });
    }

    // Check if user is authorized (seller must own the product)
    if (req.user.role === 'seller') {
      if (existing.product.seller_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update variants for your own products'
        });
      }
    }

    const updates = {};

    // Validate and prepare updates
    if (req.body.price !== undefined) {
      if (req.body.price < 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Price must be non-negative'
        });
      }
      updates.price = req.body.price;
    }

    if (req.body.compareAtPrice !== undefined) {
      updates.compareAtPrice = req.body.compareAtPrice;
    }

    if (req.body.images !== undefined) {
      updates.images = req.body.images;
    }

    if (req.body.attributes !== undefined) {
      if (typeof req.body.attributes !== 'object' || Object.keys(req.body.attributes).length === 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'At least one variant attribute is required'
        });
      }
      updates.attributes = req.body.attributes;
    }

    if (req.body.sku !== undefined) {
      updates.sku = req.body.sku;
    }

    if (req.body.isAvailable !== undefined) {
      updates.isAvailable = req.body.isAvailable;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'No valid fields to update'
      });
    }

    const variant = await variantService.updateVariant(variantId, updates);

    res.json({
      message: 'Variant updated successfully',
      variant
    });
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message
      });
    }
    if (error.message.includes('not found') || error.message.includes('required')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }
    next(error);
  }
};


/**
 * Delete variant
 * DELETE /api/variants/:variantId
 */
const deleteVariant = async (req, res, next) => {
  try {
    const { variantId } = req.params;

    // Get existing variant to check authorization
    const existing = await variantService.getVariantById(variantId);
    
    if (!existing) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Variant not found'
      });
    }

    // Check if user is authorized (seller must own the product)
    if (req.user.role === 'seller') {
      if (existing.product.seller_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only delete variants for your own products'
        });
      }
    }

    await variantService.deleteVariant(variantId);

    res.json({
      message: 'Variant deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get variant inventory
 * GET /api/variants/:variantId/inventory
 */
const getVariantInventory = async (req, res, next) => {
  try {
    const { variantId } = req.params;

    const variant = await variantService.getVariantById(variantId);

    if (!variant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Variant not found'
      });
    }

    // Check if user is authorized
    if (req.user && req.user.role === 'seller') {
      if (variant.product.seller_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only view inventory for your own products'
        });
      }
    }

    if (!variant.inventory) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Variant inventory not found'
      });
    }

    res.json({
      variantId: variant.id,
      inventory: {
        quantity: variant.inventory.quantity,
        reservedQuantity: variant.inventory.reserved_quantity,
        availableQuantity: variant.availableQuantity,
        lowStockThreshold: variant.inventory.low_stock_threshold,
        isLowStock: variant.availableQuantity <= variant.inventory.low_stock_threshold,
        lastRestockedAt: variant.inventory.last_restocked_at
      }
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Update variant inventory
 * PUT /api/variants/:variantId/inventory
 * Body: { quantity } - Sets absolute quantity
 */
const updateVariantInventory = async (req, res, next) => {
  try {
    const { variantId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Quantity is required'
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Quantity must be non-negative'
      });
    }

    // Get existing variant to check authorization
    const existing = await variantService.getVariantById(variantId);
    
    if (!existing) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Variant not found'
      });
    }

    // Check if user is authorized (seller must own the product)
    if (req.user.role === 'seller') {
      if (existing.product.seller_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update inventory for your own products'
        });
      }
    }

    // Update inventory in database
    const { data: inventory, error } = await supabase
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

    const availableQuantity = inventory.quantity - inventory.reserved_quantity;

    res.json({
      message: 'Inventory updated successfully',
      inventory: {
        variantId: variantId,
        quantity: inventory.quantity,
        reservedQuantity: inventory.reserved_quantity,
        availableQuantity: availableQuantity,
        lowStockThreshold: inventory.low_stock_threshold,
        isLowStock: availableQuantity <= inventory.low_stock_threshold,
        lastRestockedAt: inventory.last_restocked_at
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVariant,
  getProductVariants,
  getVariant,
  updateVariant,
  deleteVariant,
  getVariantInventory,
  updateVariantInventory
};
