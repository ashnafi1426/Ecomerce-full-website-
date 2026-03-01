const supabase = require('../../config/supabase');

/**
 * Coupon Service
 * Handles coupon creation, validation, and usage tracking
 * Implements Requirements 2.1, 2.2, 2.3, 2.4, 2.7, 2.8
 */
class CouponService {
  /**
   * Create a new coupon
   * @param {Object} couponData - Coupon details
   * @returns {Promise<Object>} Created coupon
   */
  async createCoupon(couponData) {
    try {
      const {
        code,
        discount_type,
        discount_value,
        min_purchase_amount = 0,
        max_discount_amount,
        usage_limit,
        usage_limit_per_customer = 1,
        start_date,
        end_date,
        is_active = true,
        applicable_to = {},
        allow_stacking = false,
        created_by
      } = couponData;

      // Validate coupon code format (uppercase alphanumeric)
      const codeRegex = /^[A-Z0-9]+$/;
      if (!codeRegex.test(code)) {
        throw new Error('Coupon code must be uppercase alphanumeric characters only');
      }

      // Validate discount type
      const validDiscountTypes = ['percentage', 'fixed_amount', 'free_shipping'];
      if (!validDiscountTypes.includes(discount_type)) {
        throw new Error('Invalid discount type. Must be: percentage, fixed_amount, or free_shipping');
      }

      // Validate percentage discount
      if (discount_type === 'percentage' && (discount_value < 0 || discount_value > 100)) {
        throw new Error('Percentage discount must be between 0 and 100');
      }

      // Validate fixed amount discount
      if (discount_type === 'fixed_amount' && discount_value <= 0) {
        throw new Error('Fixed amount discount must be greater than 0');
      }

      // Validate dates
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }

      // Insert coupon
      const { data, error } = await supabase
        .from('coupons')
        .insert([{
          code: code.toUpperCase(),
          discount_type,
          discount_value,
          min_purchase_amount,
          max_discount_amount,
          usage_limit,
          usage_limit_per_customer,
          times_used: 0,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active,
          applicable_to: typeof applicable_to === 'object' ? applicable_to : {},
          allow_stacking,
          created_by
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('Coupon code already exists');
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating coupon:', error);
      throw error;
    }
  }

  /**
   * Get coupon by code
   * @param {string} code - Coupon code
   * @returns {Promise<Object|null>} Coupon details or null
   */
  async getCouponByCode(code) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting coupon by code:', error);
      throw error;
    }
  }

  /**
   * Get coupon by ID
   * @param {string} couponId - Coupon ID
   * @returns {Promise<Object>} Coupon details
   */
  async getCouponById(couponId) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', couponId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting coupon by ID:', error);
      throw error;
    }
  }

  /**
   * Validate coupon for a user and cart
   * Implements Requirements 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
   * @param {string} code - Coupon code
   * @param {string} customerId - Customer ID
   * @param {Object} orderData - Order data with total and items
   * @returns {Promise<Object>} Validation result with discount amount
   */
  async validateCoupon(code, customerId, orderData) {
    try {
      const { cartTotal, cartItems = [] } = orderData;

      // Get coupon
      const coupon = await this.getCouponByCode(code);
      
      if (!coupon) {
        return {
          isValid: false,
          message: 'Invalid coupon code',
          discountAmount: 0
        };
      }

      // Check if active
      if (!coupon.is_active) {
        return {
          isValid: false,
          message: 'Coupon is not active',
          discountAmount: 0
        };
      }

      // Check validity dates
      const now = new Date();
      const startDate = new Date(coupon.start_date);
      const endDate = new Date(coupon.end_date);

      if (now < startDate) {
        return {
          isValid: false,
          message: 'Coupon is not yet valid',
          discountAmount: 0
        };
      }

      if (now > endDate) {
        return {
          isValid: false,
          message: 'Coupon has expired',
          discountAmount: 0
        };
      }

      // Check total usage limit
      if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
        return {
          isValid: false,
          message: 'Coupon usage limit reached',
          discountAmount: 0
        };
      }

      // Check per-customer usage limit
      const usageLimitReached = await this.isUsageLimitReached(coupon.id, customerId);
      if (usageLimitReached) {
        return {
          isValid: false,
          message: 'You have already used this coupon the maximum number of times',
          discountAmount: 0
        };
      }

      // Check minimum purchase amount
      if (cartTotal < coupon.min_purchase_amount) {
        return {
          isValid: false,
          message: `Minimum purchase amount of $${coupon.min_purchase_amount} required`,
          discountAmount: 0
        };
      }

      // Check applicable items (if specific to category/product)
      if (coupon.applicable_to && Object.keys(coupon.applicable_to).length > 0 && cartItems.length > 0) {
        const applicableTo = typeof coupon.applicable_to === 'string' 
          ? JSON.parse(coupon.applicable_to) 
          : coupon.applicable_to;

        const productIds = applicableTo.product_ids || [];
        const categoryIds = applicableTo.category_ids || [];

        if (productIds.length > 0 || categoryIds.length > 0) {
          let hasApplicableItem = false;

          for (const item of cartItems) {
            if (productIds.includes(item.product_id) || categoryIds.includes(item.category_id)) {
              hasApplicableItem = true;
              break;
            }
          }

          if (!hasApplicableItem) {
            return {
              isValid: false,
              message: 'Coupon not applicable to items in your cart',
              discountAmount: 0
            };
          }
        }
      }

      // Calculate discount
      const discountAmount = this.calculateDiscount(coupon, cartTotal);

      return {
        isValid: true,
        message: 'Coupon is valid',
        discountAmount,
        couponId: coupon.id,
        couponType: coupon.discount_type,
        allowStacking: coupon.allow_stacking,
        couponDetails: coupon
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      throw error;
    }
  }

  /**
   * Calculate discount amount for coupon
   * Implements Requirement 2.7
   * @param {Object} coupon - Coupon object
   * @param {number} orderTotal - Order total amount
   * @returns {number} Discount amount
   */
  calculateDiscount(coupon, orderTotal) {
    let discountAmount = 0;

    if (coupon.discount_type === 'percentage') {
      discountAmount = (orderTotal * coupon.discount_value) / 100;
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
      }
    } else if (coupon.discount_type === 'fixed_amount') {
      discountAmount = Math.min(coupon.discount_value, orderTotal);
    } else if (coupon.discount_type === 'free_shipping') {
      discountAmount = 0; // Shipping discount handled separately
    }

    // Round to 2 decimal places
    return Math.round(discountAmount * 100) / 100;
  }

  /**
   * Check if coupon usage limit reached
   * Implements Requirement 2.3
   * @param {string} couponId - Coupon UUID
   * @param {string} customerId - Customer UUID (optional)
   * @returns {Promise<boolean>} True if limit reached
   */
  async isUsageLimitReached(couponId, customerId = null) {
    try {
      if (!customerId) {
        // Check total usage limit
        const coupon = await this.getCouponById(couponId);
        return coupon.usage_limit && coupon.times_used >= coupon.usage_limit;
      }

      // Check per-customer usage limit
      const coupon = await this.getCouponById(couponId);
      const { data: userUsage, error } = await supabase
        .from('coupon_usage')
        .select('id')
        .eq('coupon_id', couponId)
        .eq('customer_id', customerId);

      if (error) throw error;

      return userUsage && userUsage.length >= coupon.usage_limit_per_customer;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      throw error;
    }
  }

  /**
   * Apply coupon to an order
   * Implements Requirement 2.7
   * @param {string} code - Coupon code
   * @param {string} customerId - Customer UUID
   * @param {string} orderId - Order UUID
   * @returns {Promise<Object>} Applied coupon record
   */
  async applyCoupon(code, customerId, orderId) {
    try {
      const coupon = await this.getCouponByCode(code);
      if (!coupon) {
        throw new Error('Coupon not found');
      }

      // Get order to calculate discount
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('amount')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const discountAmount = this.calculateDiscount(coupon, order.amount);

      const { data, error } = await supabase
        .from('coupon_usage')
        .insert([{
          coupon_id: coupon.id,
          customer_id: customerId,
          order_id: orderId,
          discount_amount: discountAmount
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error applying coupon:', error);
      throw error;
    }
  }

  /**
   * Get coupon usage statistics
   * Implements Requirement 2.10
   * @param {string} couponId - Coupon ID
   * @returns {Promise<Object>} Usage statistics
   */
  async getCouponUsage(couponId) {
    try {
      const { data, error } = await supabase
        .from('coupon_usage')
        .select(`
          *,
          users:customer_id (email, display_name),
          orders:order_id (id, amount, created_at)
        `)
        .eq('coupon_id', couponId)
        .order('used_at', { ascending: false });

      if (error) throw error;

      // Calculate statistics
      const totalUsage = data.length;
      const totalDiscount = data.reduce((sum, usage) => sum + parseFloat(usage.discount_amount), 0);
      const uniqueUsers = new Set(data.map(usage => usage.customer_id)).size;

      return {
        usage: data,
        statistics: {
          totalUsage,
          totalDiscount: Math.round(totalDiscount * 100) / 100,
          uniqueUsers
        }
      };
    } catch (error) {
      console.error('Error getting coupon usage:', error);
      throw error;
    }
  }

  /**
   * Update coupon
   * @param {string} couponId - Coupon ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated coupon
   */
  async updateCoupon(couponId, updates) {
    try {
      // Validate code format if updating code
      if (updates.code) {
        const codeRegex = /^[A-Z0-9]+$/;
        if (!codeRegex.test(updates.code)) {
          throw new Error('Coupon code must be uppercase alphanumeric characters only');
        }
        updates.code = updates.code.toUpperCase();
      }

      // Validate dates if updating
      if (updates.start_date && updates.end_date) {
        const startDate = new Date(updates.start_date);
        const endDate = new Date(updates.end_date);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }

      const { data, error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', couponId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating coupon:', error);
      throw error;
    }
  }

  /**
   * Deactivate coupon
   * Implements Requirement 2.17
   * @param {string} couponId - Coupon ID
   * @returns {Promise<Object>} Updated coupon
   */
  async deactivateCoupon(couponId) {
    try {
      return await this.updateCoupon(couponId, { is_active: false });
    } catch (error) {
      console.error('Error deactivating coupon:', error);
      throw error;
    }
  }

  /**
   * Delete coupon
   * @param {string} couponId - Coupon ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteCoupon(couponId) {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting coupon:', error);
      throw error;
    }
  }

  /**
   * Get all active coupons
   * @returns {Promise<Array>} Active coupons
   */
  async getActiveCoupons() {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active coupons:', error);
      throw error;
    }
  }

  /**
   * Get all coupons (with pagination)
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated coupons
   */
  async getAllCoupons(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('coupons')
        .select('*, users:created_by(email, display_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        coupons: data || [],
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Error getting all coupons:', error);
      throw error;
    }
  }

  /**
   * Get available coupons for a user
   * @param {string} customerId - Customer ID
   * @returns {Promise<Array>} Available coupons
   */
  async getUserAvailableCoupons(customerId) {
    try {
      const now = new Date().toISOString();
      
      // Get all active coupons
      const { data: allCoupons, error: couponsError } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);

      if (couponsError) throw couponsError;

      // Get user's coupon usage
      const { data: userUsage, error: usageError } = await supabase
        .from('coupon_usage')
        .select('coupon_id')
        .eq('customer_id', customerId);

      if (usageError) throw usageError;

      // Count usage per coupon
      const usageCount = {};
      userUsage.forEach(usage => {
        usageCount[usage.coupon_id] = (usageCount[usage.coupon_id] || 0) + 1;
      });

      // Filter available coupons
      const availableCoupons = allCoupons.filter(coupon => {
        // Check if usage limit reached
        if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
          return false;
        }
        
        // Check if user has reached per-user limit
        const userCouponUsage = usageCount[coupon.id] || 0;
        if (userCouponUsage >= coupon.usage_limit_per_customer) {
          return false;
        }

        return true;
      });

      return availableCoupons;
    } catch (error) {
      console.error('Error getting user available coupons:', error);
      throw error;
    }
  }

  /**
   * Get coupon analytics
   * Implements Requirement 2.18
   * @param {Object} filters - Optional filters (date range, etc.)
   * @returns {Promise<Object>} Analytics data
   */
  async getCouponAnalytics(filters = {}) {
    try {
      let query = supabase
        .from('coupon_usage')
        .select(`
          *,
          coupons:coupon_id (code, discount_type, discount_value),
          orders:order_id (amount)
        `);

      // Apply date filters if provided
      if (filters.startDate) {
        query = query.gte('used_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('used_at', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate analytics
      const totalUsage = data.length;
      const totalDiscount = data.reduce((sum, usage) => sum + parseFloat(usage.discount_amount), 0);
      const totalRevenue = data.reduce((sum, usage) => sum + parseFloat(usage.orders.amount), 0);
      const revenueImpact = totalRevenue - totalDiscount;

      // Group by coupon
      const couponStats = {};
      data.forEach(usage => {
        const code = usage.coupons.code;
        if (!couponStats[code]) {
          couponStats[code] = {
            code,
            usageCount: 0,
            totalDiscount: 0,
            uniqueCustomers: new Set()
          };
        }
        couponStats[code].usageCount++;
        couponStats[code].totalDiscount += parseFloat(usage.discount_amount);
        couponStats[code].uniqueCustomers.add(usage.customer_id);
      });

      // Convert to array and sort by usage
      const mostPopularCoupons = Object.values(couponStats)
        .map(stat => ({
          ...stat,
          uniqueCustomers: stat.uniqueCustomers.size
        }))
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10);

      return {
        totalUsage,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        revenueImpact: Math.round(revenueImpact * 100) / 100,
        mostPopularCoupons,
        usageRate: totalUsage > 0 ? (totalUsage / totalRevenue * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Error getting coupon analytics:', error);
      throw error;
    }
  }
}

module.exports = new CouponService();
