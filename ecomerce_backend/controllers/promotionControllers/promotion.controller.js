const promotionService = require('../../services/promotionServices/promotion.service');

/**
 * Promotion Controller
 * Handles HTTP requests for promotional pricing management
 * Implements Requirements 2.11, 2.12, 2.18
 */
class PromotionController {
  /**
   * Create a new promotion (Manager only)
   * Implements Requirement 2.11
   * POST /api/v1/promotions
   */
  async createPromotion(req, res) {
    try {
      const promotionData = {
        ...req.body,
        created_by: req.user.id
      };

      const promotion = await promotionService.createPromotion(promotionData);

      res.status(201).json({
        success: true,
        message: 'Promotion created successfully',
        data: promotion
      });
    } catch (error) {
      console.error('Error in createPromotion controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create promotion'
      });
    }
  }

  /**
   * Get active promotions for a product
   * Implements Requirement 2.12
   * GET /api/v1/promotions/active
   */
  async getActivePromotions(req, res) {
    try {
      const { productId, variantId } = req.query;

      if (!productId && !variantId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID or Variant ID is required'
        });
      }

      let promotions;
      if (variantId) {
        promotions = await promotionService.getActivePromotionsForVariant(variantId);
      } else {
        promotions = await promotionService.getActivePromotions(productId);
      }

      res.status(200).json({
        success: true,
        data: promotions
      });
    } catch (error) {
      console.error('Error in getActivePromotions controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get active promotions'
      });
    }
  }

  /**
   * Get promotional price for a product/variant
   * GET /api/v1/promotions/price
   */
  async getPromotionalPrice(req, res) {
    try {
      const { productId, variantId, originalPrice } = req.query;

      if (!originalPrice || originalPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid original price is required'
        });
      }

      let promotionalPrice;
      if (variantId) {
        promotionalPrice = await promotionService.getPromotionalPriceForVariant(
          variantId,
          parseFloat(originalPrice)
        );
      } else if (productId) {
        promotionalPrice = await promotionService.getPromotionalPrice(
          productId,
          parseFloat(originalPrice)
        );
      } else {
        return res.status(400).json({
          success: false,
          message: 'Product ID or Variant ID is required'
        });
      }

      const hasPromotion = promotionalPrice < parseFloat(originalPrice);

      res.status(200).json({
        success: true,
        data: {
          originalPrice: parseFloat(originalPrice),
          promotionalPrice,
          hasPromotion,
          discount: hasPromotion ? parseFloat(originalPrice) - promotionalPrice : 0,
          discountPercentage: hasPromotion 
            ? Math.round(((parseFloat(originalPrice) - promotionalPrice) / parseFloat(originalPrice)) * 100)
            : 0
        }
      });
    } catch (error) {
      console.error('Error in getPromotionalPrice controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get promotional price'
      });
    }
  }

  /**
   * Process scheduled promotions (activate/deactivate based on dates)
   * Implements Requirement 2.12
   * POST /api/v1/promotions/process-scheduled
   */
  async processScheduledPromotions(req, res) {
    try {
      const result = await promotionService.processScheduledPromotions();

      res.status(200).json({
        success: true,
        message: 'Scheduled promotions processed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in processScheduledPromotions controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process scheduled promotions'
      });
    }
  }

  /**
   * Get promotion analytics (Manager only)
   * Implements Requirement 2.18
   * GET /api/v1/promotions/:id/analytics
   */
  async getPromotionAnalytics(req, res) {
    try {
      const { id } = req.params;

      const analytics = await promotionService.getPromotionAnalytics(id);

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error in getPromotionAnalytics controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get promotion analytics'
      });
    }
  }

  /**
   * Get all promotions (Manager only)
   * GET /api/v1/promotions
   */
  async getAllPromotions(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
        product_id: req.query.product_id,
        active_only: req.query.active_only === 'true'
      };

      const result = await promotionService.getAllPromotions(page, limit, filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getAllPromotions controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get promotions'
      });
    }
  }

  /**
   * Get promotion by ID
   * GET /api/v1/promotions/:id
   */
  async getPromotionById(req, res) {
    try {
      const { id } = req.params;

      const promotion = await promotionService.getPromotionById(id);

      if (!promotion) {
        return res.status(404).json({
          success: false,
          message: 'Promotion not found'
        });
      }

      res.status(200).json({
        success: true,
        data: promotion
      });
    } catch (error) {
      console.error('Error in getPromotionById controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get promotion'
      });
    }
  }

  /**
   * Get promotions by product
   * GET /api/v1/promotions/product/:productId
   */
  async getPromotionsByProduct(req, res) {
    try {
      const { productId } = req.params;

      const promotions = await promotionService.getPromotionsByProduct(productId);

      res.status(200).json({
        success: true,
        data: promotions
      });
    } catch (error) {
      console.error('Error in getPromotionsByProduct controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get promotions by product'
      });
    }
  }

  /**
   * Get products with active promotions
   * GET /api/v1/promotions/products-with-promotions
   */
  async getProductsWithPromotions(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      const products = await promotionService.getProductsWithPromotions(limit);

      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      console.error('Error in getProductsWithPromotions controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get products with promotions'
      });
    }
  }

  /**
   * Update promotion (Manager only)
   * PUT /api/v1/promotions/:id
   */
  async updatePromotion(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const promotion = await promotionService.updatePromotion(id, updates);

      res.status(200).json({
        success: true,
        message: 'Promotion updated successfully',
        data: promotion
      });
    } catch (error) {
      console.error('Error in updatePromotion controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update promotion'
      });
    }
  }

  /**
   * Delete promotion (Manager only)
   * DELETE /api/v1/promotions/:id
   */
  async deletePromotion(req, res) {
    try {
      const { id } = req.params;

      await promotionService.deletePromotion(id);

      res.status(200).json({
        success: true,
        message: 'Promotion deleted successfully'
      });
    } catch (error) {
      console.error('Error in deletePromotion controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete promotion'
      });
    }
  }

  /**
   * Bulk create promotions (Manager only)
   * POST /api/v1/promotions/bulk
   */
  async bulkCreatePromotions(req, res) {
    try {
      const { promotions } = req.body;

      if (!Array.isArray(promotions) || promotions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Promotions array is required'
        });
      }

      // Add created_by to each promotion
      const promotionsWithCreator = promotions.map(promo => ({
        ...promo,
        created_by: req.user.id
      }));

      const createdPromotions = await promotionService.bulkCreatePromotions(promotionsWithCreator);

      res.status(201).json({
        success: true,
        message: `${createdPromotions.length} promotions created successfully`,
        data: createdPromotions
      });
    } catch (error) {
      console.error('Error in bulkCreatePromotions controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to bulk create promotions'
      });
    }
  }
}

module.exports = new PromotionController();
