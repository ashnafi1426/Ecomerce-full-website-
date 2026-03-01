const supabase = require('../../config/supabase');
const cache = require('../../utils/cache');

/**
 * Promotion Service
 * Handles promotional pricing creation, management, and time-based activation
 * Implements Requirements 2.11, 2.12
 */
class PromotionService {
  /**
   * Create a new promotional pricing
   * Implements Requirement 2.11
   * @param {Object} promotionData - Promotion details
   * @returns {Promise<Object>} Created promotion
   */
  async createPromotion(promotionData) {
    try {
      const {
        product_id,
        variant_id = null,
        promotional_price,
        start_date,
        end_date,
        is_active = false, // Default to false, will be activated by schedule
        created_by
      } = promotionData;

      // Validate that either product_id or variant_id is provided, not both
      if ((product_id && variant_id) || (!product_id && !variant_id)) {
        throw new Error('Must provide either product_id or variant_id, not both');
      }

      // Validate dates
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }

      // Validate promotional price is positive
      if (promotional_price <= 0) {
        throw new Error('Promotional price must be greater than 0');
      }

      // Get product/variant to validate promotional price is less than regular price
      if (product_id) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('price')
          .eq('id', product_id)
          .single();

        if (productError) throw new Error('Product not found');

        if (promotional_price >= product.price) {
          throw new Error('Promotional price must be less than regular price');
        }
      }

      if (variant_id) {
        const { data: variant, error: variantError } = await supabase
          .from('product_variants')
          .select('price, product_id')
          .eq('id', variant_id)
          .single();

        if (variantError) throw new Error('Variant not found');

        if (promotional_price >= variant.price) {
          throw new Error('Promotional price must be less than variant price');
        }
      }

      // Insert promotion
      const { data, error } = await supabase
        .from('promotional_pricing')
        .insert([{
          product_id,
          variant_id,
          promotional_price,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active,
          created_by
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating promotion:', error);
      throw error;
    }
  }

  /**
   * Get active promotions for product
   * Implements Requirement 2.12
   * @param {string} productId - Product UUID
   * @returns {Promise<Array>} Array of active promotion objects
   */
  async getActivePromotions(productId) {
    try {
      // Check cache first (1-minute TTL)
      const cacheKey = `active_promotions_${productId}`;
      let promotions = cache.get(cacheKey, 'short');
      
      if (promotions) {
        return promotions;
      }
      
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('promotional_pricing')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('promotional_price', { ascending: true });

      if (error) throw error;
      
      promotions = data || [];
      
      // Cache for 1 minute
      cache.set(cacheKey, promotions, 'short');
      
      return promotions;
    } catch (error) {
      console.error('Error getting active promotions:', error);
      throw error;
    }
  }

  /**
   * Get active promotions for variant
   * @param {string} variantId - Variant UUID
   * @returns {Promise<Array>} Array of active promotion objects
   */
  async getActivePromotionsForVariant(variantId) {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('promotional_pricing')
        .select('*')
        .eq('variant_id', variantId)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('promotional_price', { ascending: true});

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active promotions for variant:', error);
      throw error;
    }
  }

  /**
   * Activate/deactivate promotions based on schedule
   * Implements Requirement 2.12
   * @returns {Promise<Object>} Activation results
   */
  async processScheduledPromotions() {
    try {
      const now = new Date().toISOString();
      
      // Activate promotions that should be active
      const { data: activated, error: activateError } = await supabase
        .from('promotional_pricing')
        .update({ is_active: true })
        .eq('is_active', false)
        .lte('start_date', now)
        .gte('end_date', now)
        .select();

      if (activateError) throw activateError;

      // Deactivate expired promotions
      const { data: deactivated, error: deactivateError } = await supabase
        .from('promotional_pricing')
        .update({ is_active: false })
        .eq('is_active', true)
        .lt('end_date', now)
        .select();

      if (deactivateError) throw deactivateError;

      return {
        activated: activated ? activated.length : 0,
        deactivated: deactivated ? deactivated.length : 0,
        activatedPromotions: activated || [],
        deactivatedPromotions: deactivated || []
      };
    } catch (error) {
      console.error('Error processing scheduled promotions:', error);
      throw error;
    }
  }

  /**
   * Calculate promotional price for product
   * Implements Requirement 2.11
   * @param {string} productId - Product UUID
   * @param {number} originalPrice - Original price
   * @returns {Promise<number>} Promotional price or original if no promo
   */
  async getPromotionalPrice(productId, originalPrice) {
    try {
      const promotions = await this.getActivePromotions(productId);
      
      if (promotions.length === 0) {
        return originalPrice;
      }

      // Return the lowest promotional price
      return promotions[0].promotional_price;
    } catch (error) {
      console.error('Error getting promotional price:', error);
      throw error;
    }
  }

  /**
   * Calculate promotional price for variant
   * @param {string} variantId - Variant UUID
   * @param {number} originalPrice - Original price
   * @returns {Promise<number>} Promotional price or original if no promo
   */
  async getPromotionalPriceForVariant(variantId, originalPrice) {
    try {
      const promotions = await this.getActivePromotionsForVariant(variantId);
      
      if (promotions.length === 0) {
        return originalPrice;
      }

      // Return the lowest promotional price
      return promotions[0].promotional_price;
    } catch (error) {
      console.error('Error getting promotional price for variant:', error);
      throw error;
    }
  }

  /**
   * Get promotion analytics
   * Implements Requirement 2.18
   * @param {string} promotionId - Promotion UUID
   * @returns {Promise<Object>} Analytics data
   */
  async getPromotionAnalytics(promotionId) {
    try {
      // Get promotion details
      const promotion = await this.getPromotionById(promotionId);
      
      if (!promotion) {
        throw new Error('Promotion not found');
      }

      // Get orders that used this promotional price
      // This is a simplified version - in production, you'd track this more explicitly
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, amount, created_at')
        .eq('product_id', promotion.product_id || promotion.variant_id)
        .gte('created_at', promotion.start_date)
        .lte('created_at', promotion.end_date);

      if (error) throw error;

      const totalOrders = orders ? orders.length : 0;
      const totalRevenue = orders ? orders.reduce((sum, order) => sum + parseFloat(order.amount), 0) : 0;
      const originalPrice = promotion.products ? promotion.products.price : promotion.variants.price;
      const discountPerOrder = originalPrice - promotion.promotional_price;
      const totalDiscount = totalOrders * discountPerOrder;

      return {
        promotionId: promotion.id,
        productId: promotion.product_id,
        variantId: promotion.variant_id,
        promotionalPrice: promotion.promotional_price,
        originalPrice,
        discountAmount: discountPerOrder,
        discountPercentage: Math.round((discountPerOrder / originalPrice) * 100),
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        startDate: promotion.start_date,
        endDate: promotion.end_date,
        isActive: promotion.is_active
      };
    } catch (error) {
      console.error('Error getting promotion analytics:', error);
      throw error;
    }
  }

  /**
   * Get promotion by ID
   * @param {string} promotionId - Promotion ID
   * @returns {Promise<Object>} Promotion details
   */
  async getPromotionById(promotionId) {
    try {
      const { data, error } = await supabase
        .from('promotional_pricing')
        .select(`
          *,
          products:product_id (id, title, price),
          variants:variant_id (id, sku, price)
        `)
        .eq('id', promotionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting promotion by ID:', error);
      throw error;
    }
  }

  /**
   * Update promotion
   * @param {string} promotionId - Promotion ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated promotion
   */
  async updatePromotion(promotionId, updates) {
    try {
      // Validate dates if updating
      if (updates.start_date && updates.end_date) {
        const startDate = new Date(updates.start_date);
        const endDate = new Date(updates.end_date);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }

      // Validate promotional price if updating
      if (updates.promotional_price !== undefined) {
        if (updates.promotional_price <= 0) {
          throw new Error('Promotional price must be greater than 0');
        }

        // Get current promotion to check product
        const currentPromotion = await this.getPromotionById(promotionId);
        
        if (currentPromotion.product_id) {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('price')
            .eq('id', currentPromotion.product_id)
            .single();

          if (productError) throw new Error('Product not found');

          if (updates.promotional_price >= product.price) {
            throw new Error('Promotional price must be less than regular price');
          }
        }

        if (currentPromotion.variant_id) {
          const { data: variant, error: variantError } = await supabase
            .from('product_variants')
            .select('price')
            .eq('id', currentPromotion.variant_id)
            .single();

          if (variantError) throw new Error('Variant not found');

          if (updates.promotional_price >= variant.price) {
            throw new Error('Promotional price must be less than variant price');
          }
        }
      }

      const { data, error } = await supabase
        .from('promotional_pricing')
        .update(updates)
        .eq('id', promotionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating promotion:', error);
      throw error;
    }
  }

  /**
   * Delete promotion
   * @param {string} promotionId - Promotion ID
   * @returns {Promise<boolean>} Success status
   */
  async deletePromotion(promotionId) {
    try {
      const { error } = await supabase
        .from('promotional_pricing')
        .delete()
        .eq('id', promotionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting promotion:', error);
      throw error;
    }
  }

  /**
   * Get all promotions (with pagination)
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated promotions
   */
  async getAllPromotions(page = 1, limit = 20, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let query = supabase
        .from('promotional_pricing')
        .select(`
          *,
          products:product_id (id, title, price),
          variants:variant_id (id, sku, price),
          users:created_by (email, display_name)
        `, { count: 'exact' });

      // Apply filters
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      if (filters.active_only) {
        const now = new Date().toISOString();
        query = query
          .eq('is_active', true)
          .lte('start_date', now)
          .gte('end_date', now);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        promotions: data || [],
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Error getting all promotions:', error);
      throw error;
    }
  }

  /**
   * Get promotions by product
   * @param {string} productId - Product ID
   * @returns {Promise<Array>} All promotions for the product
   */
  async getPromotionsByProduct(productId) {
    try {
      const { data, error } = await supabase
        .from('promotional_pricing')
        .select(`
          *,
          variants:variant_id (id, sku, price)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false});

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting promotions by product:', error);
      throw error;
    }
  }

  /**
   * Get products with active promotions
   * @param {number} limit - Number of products to return
   * @returns {Promise<Array>} Products with promotional pricing
   */
  async getProductsWithPromotions(limit = 10) {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('promotional_pricing')
        .select(`
          *,
          products:product_id (
            id,
            title,
            description,
            price,
            image_url,
            category_id,
            categories:category_id (name)
          )
        `)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .is('variant_id', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Remove duplicates and format response
      const uniqueProducts = [];
      const seenProductIds = new Set();

      for (const promo of data || []) {
        if (!seenProductIds.has(promo.product_id)) {
          seenProductIds.add(promo.product_id);
          uniqueProducts.push({
            ...promo.products,
            promotional_price: promo.promotional_price,
            discount_percentage: Math.round(((promo.products.price - promo.promotional_price) / promo.products.price) * 100),
            promotion_end_date: promo.end_date
          });
        }
      }

      return uniqueProducts;
    } catch (error) {
      console.error('Error getting products with promotions:', error);
      throw error;
    }
  }

  /**
   * Bulk create promotions
   * @param {Array} promotions - Array of promotion data
   * @returns {Promise<Array>} Created promotions
   */
  async bulkCreatePromotions(promotions) {
    try {
      const validatedPromotions = [];

      for (const promo of promotions) {
        // Validate dates
        const startDate = new Date(promo.start_date);
        const endDate = new Date(promo.end_date);
        if (endDate <= startDate) {
          throw new Error(`Invalid dates for product ${promo.product_id || promo.variant_id}`);
        }

        validatedPromotions.push({
          ...promo,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: promo.is_active !== undefined ? promo.is_active : false
        });
      }

      const { data, error } = await supabase
        .from('promotional_pricing')
        .insert(validatedPromotions)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error bulk creating promotions:', error);
      throw error;
    }
  }
}

module.exports = new PromotionService();
