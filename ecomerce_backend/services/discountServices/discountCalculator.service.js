const couponService = require('../couponServices/coupon.service');
const promotionService = require('../promotionServices/promotion.service');

/**
 * Discount Calculator Service
 * Orchestrates discount calculations (promotions + coupons)
 * Implements Requirements 2.13, 2.14, 2.15
 */
class DiscountCalculatorService {
  /**
   * Calculate total discounts for order
   * Implements Requirements 2.13, 2.14, 2.15
   * @param {Object} orderData - Order items, totals, coupon code
   * @param {string} customerId - Customer UUID
   * @returns {Promise<Object>} Discount breakdown and final total
   */
  async calculateOrderDiscounts(orderData, customerId) {
    try {
      const { items, subtotal, couponCode } = orderData;

      let promotionalDiscount = 0;
      let couponDiscount = 0;
      let couponDetails = null;
      let allowStacking = false;

      // Step 1: Calculate promotional discounts for each item
      const itemsWithPromotions = await Promise.all(
        items.map(async (item) => {
          let itemPromotionalPrice = item.price;
          let itemPromotionalDiscount = 0;

          // Check for variant promotion first
          if (item.variant_id) {
            const variantPromoPrice = await promotionService.getPromotionalPriceForVariant(
              item.variant_id,
              item.price
            );
            if (variantPromoPrice < item.price) {
              itemPromotionalPrice = variantPromoPrice;
              itemPromotionalDiscount = (item.price - variantPromoPrice) * item.quantity;
            }
          } 
          // Check for product promotion if no variant promotion
          else if (item.product_id) {
            const productPromoPrice = await promotionService.getPromotionalPrice(
              item.product_id,
              item.price
            );
            if (productPromoPrice < item.price) {
              itemPromotionalPrice = productPromoPrice;
              itemPromotionalDiscount = (item.price - productPromoPrice) * item.quantity;
            }
          }

          promotionalDiscount += itemPromotionalDiscount;

          return {
            ...item,
            originalPrice: item.price,
            promotionalPrice: itemPromotionalPrice,
            promotionalDiscount: itemPromotionalDiscount,
            subtotalAfterPromotion: itemPromotionalPrice * item.quantity
          };
        })
      );

      // Calculate subtotal after promotional discounts
      const subtotalAfterPromotions = subtotal - promotionalDiscount;

      // Step 2: Validate and calculate coupon discount
      if (couponCode) {
        const validation = await couponService.validateCoupon(couponCode, customerId, {
          cartTotal: subtotalAfterPromotions,
          cartItems: itemsWithPromotions
        });

        if (validation.isValid) {
          couponDiscount = validation.discountAmount;
          couponDetails = validation.couponDetails;
          allowStacking = validation.allowStacking;
        } else {
          // Return validation error
          return {
            success: false,
            error: validation.message,
            originalSubtotal: subtotal,
            promotionalDiscount: 0,
            couponDiscount: 0,
            finalTotal: subtotal,
            breakdown: null
          };
        }
      }

      // Step 3: Apply stacking rules
      const finalDiscount = this.applyStackingRules(
        promotionalDiscount,
        couponDiscount,
        allowStacking
      );

      // Calculate final total
      const finalTotal = Math.max(subtotal - finalDiscount, 0);

      // Step 4: Generate discount breakdown
      const breakdown = this.generateDiscountBreakdown({
        originalSubtotal: subtotal,
        promotionalDiscount: allowStacking ? promotionalDiscount : (couponDiscount > 0 ? 0 : promotionalDiscount),
        couponDiscount: allowStacking ? couponDiscount : (couponDiscount > promotionalDiscount ? couponDiscount : 0),
        finalTotal,
        items: itemsWithPromotions,
        couponCode,
        allowStacking
      });

      return {
        success: true,
        originalSubtotal: subtotal,
        promotionalDiscount: breakdown.promotionalDiscount,
        couponDiscount: breakdown.couponDiscount,
        totalDiscount: breakdown.totalDiscount,
        finalTotal,
        breakdown,
        couponDetails,
        itemsWithPromotions
      };
    } catch (error) {
      console.error('Error calculating order discounts:', error);
      throw error;
    }
  }

  /**
   * Apply discount stacking rules
   * Implements Requirement 2.13, 2.14
   * @param {number} promotionalDiscount - Promo discount amount
   * @param {number} couponDiscount - Coupon discount amount
   * @param {boolean} stackingAllowed - Whether stacking is allowed
   * @returns {number} Final discount amount
   */
  applyStackingRules(promotionalDiscount, couponDiscount, stackingAllowed) {
    if (stackingAllowed) {
      // Both discounts apply
      return promotionalDiscount + couponDiscount;
    } else {
      // Only the larger discount applies
      return Math.max(promotionalDiscount, couponDiscount);
    }
  }

  /**
   * Generate discount breakdown for display
   * Implements Requirement 2.15
   * @param {Object} discounts - Calculated discounts
   * @returns {Object} Formatted breakdown
   */
  generateDiscountBreakdown(discounts) {
    const {
      originalSubtotal,
      promotionalDiscount,
      couponDiscount,
      finalTotal,
      items,
      couponCode,
      allowStacking
    } = discounts;

    const totalDiscount = promotionalDiscount + couponDiscount;

    return {
      originalPrice: Math.round(originalSubtotal * 100) / 100,
      promotionalDiscount: Math.round(promotionalDiscount * 100) / 100,
      couponDiscount: Math.round(couponDiscount * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      finalPrice: Math.round(finalTotal * 100) / 100,
      savingsPercentage: originalSubtotal > 0 
        ? Math.round((totalDiscount / originalSubtotal) * 100) 
        : 0,
      appliedCoupon: couponCode || null,
      stackingApplied: allowStacking,
      itemBreakdown: items.map(item => ({
        productId: item.product_id,
        variantId: item.variant_id,
        name: item.name || item.title,
        quantity: item.quantity,
        originalPrice: Math.round(item.originalPrice * 100) / 100,
        promotionalPrice: item.promotionalPrice 
          ? Math.round(item.promotionalPrice * 100) / 100 
          : Math.round(item.originalPrice * 100) / 100,
        promotionalDiscount: item.promotionalDiscount 
          ? Math.round(item.promotionalDiscount * 100) / 100 
          : 0,
        subtotal: Math.round(item.subtotalAfterPromotion * 100) / 100
      }))
    };
  }

  /**
   * Calculate discount for a single product/variant
   * @param {string} productId - Product UUID
   * @param {string} variantId - Variant UUID (optional)
   * @param {number} price - Original price
   * @param {number} quantity - Quantity
   * @returns {Promise<Object>} Discount details
   */
  async calculateProductDiscount(productId, variantId, price, quantity) {
    try {
      let promotionalPrice = price;
      let promotionalDiscount = 0;

      // Check for promotion
      if (variantId) {
        promotionalPrice = await promotionService.getPromotionalPriceForVariant(variantId, price);
      } else {
        promotionalPrice = await promotionService.getPromotionalPrice(productId, price);
      }

      if (promotionalPrice < price) {
        promotionalDiscount = (price - promotionalPrice) * quantity;
      }

      return {
        originalPrice: price,
        promotionalPrice,
        promotionalDiscount,
        subtotal: promotionalPrice * quantity,
        savingsPercentage: price > 0 ? Math.round(((price - promotionalPrice) / price) * 100) : 0
      };
    } catch (error) {
      console.error('Error calculating product discount:', error);
      throw error;
    }
  }

  /**
   * Validate if coupon can be applied with current promotions
   * @param {string} couponCode - Coupon code
   * @param {number} promotionalDiscount - Current promotional discount
   * @param {number} subtotalAfterPromotions - Subtotal after promotions
   * @returns {Promise<Object>} Validation result
   */
  async validateCouponWithPromotions(couponCode, promotionalDiscount, subtotalAfterPromotions) {
    try {
      const coupon = await couponService.getCouponByCode(couponCode);
      
      if (!coupon) {
        return {
          canApply: false,
          reason: 'Coupon not found'
        };
      }

      if (!coupon.allow_stacking && promotionalDiscount > 0) {
        return {
          canApply: false,
          reason: 'This coupon cannot be combined with promotional pricing'
        };
      }

      return {
        canApply: true,
        allowStacking: coupon.allow_stacking,
        coupon
      };
    } catch (error) {
      console.error('Error validating coupon with promotions:', error);
      throw error;
    }
  }

  /**
   * Get best discount option for customer
   * @param {Object} orderData - Order data
   * @param {string} customerId - Customer UUID
   * @param {Array} availableCoupons - Available coupon codes
   * @returns {Promise<Object>} Best discount option
   */
  async getBestDiscountOption(orderData, customerId, availableCoupons = []) {
    try {
      const discountOptions = [];

      // Option 1: Promotional discount only
      const promoOnly = await this.calculateOrderDiscounts(orderData, customerId);
      discountOptions.push({
        type: 'promotional_only',
        totalDiscount: promoOnly.promotionalDiscount,
        finalTotal: promoOnly.finalTotal,
        details: promoOnly
      });

      // Option 2-N: Each available coupon
      for (const couponCode of availableCoupons) {
        const withCoupon = await this.calculateOrderDiscounts(
          { ...orderData, couponCode },
          customerId
        );
        
        if (withCoupon.success) {
          discountOptions.push({
            type: 'with_coupon',
            couponCode,
            totalDiscount: withCoupon.totalDiscount,
            finalTotal: withCoupon.finalTotal,
            details: withCoupon
          });
        }
      }

      // Sort by total discount (highest first)
      discountOptions.sort((a, b) => b.totalDiscount - a.totalDiscount);

      return {
        bestOption: discountOptions[0],
        allOptions: discountOptions
      };
    } catch (error) {
      console.error('Error getting best discount option:', error);
      throw error;
    }
  }
}

module.exports = new DiscountCalculatorService();
