const couponService = require('../../services/couponServices/coupon.service');

/**
 * Coupon Controller
 * Handles HTTP requests for coupon management
 * Implements Requirements 2.1, 2.7, 2.17, 2.18
 */
class CouponController {
  /**
   * Create a new coupon (Manager only)
   * Implements Requirement 2.1
   * POST /api/v1/coupons
   */
  async createCoupon(req, res) {
    try {
      const couponData = {
        ...req.body,
        created_by: req.user.id
      };

      const coupon = await couponService.createCoupon(couponData);

      res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        data: coupon
      });
    } catch (error) {
      console.error('Error in createCoupon controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create coupon'
      });
    }
  }

  /**
   * Validate a coupon code
   * Implements Requirement 2.7
   * POST /api/v1/coupons/validate
   */
  async validateCoupon(req, res) {
    try {
      const { code, cartTotal, cartItems } = req.body;
      const customerId = req.user.id;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code is required'
        });
      }

      if (!cartTotal || cartTotal <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid cart total is required'
        });
      }

      const validation = await couponService.validateCoupon(code, customerId, {
        cartTotal,
        cartItems: cartItems || []
      });

      res.status(200).json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('Error in validateCoupon controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to validate coupon'
      });
    }
  }

  /**
   * Apply a coupon to an order
   * Implements Requirement 2.7
   * POST /api/v1/coupons/apply
   */
  async applyCoupon(req, res) {
    try {
      const { code, orderId } = req.body;
      const customerId = req.user.id;

      if (!code || !orderId) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code and order ID are required'
        });
      }

      const appliedCoupon = await couponService.applyCoupon(code, customerId, orderId);

      res.status(200).json({
        success: true,
        message: 'Coupon applied successfully',
        data: appliedCoupon
      });
    } catch (error) {
      console.error('Error in applyCoupon controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to apply coupon'
      });
    }
  }

  /**
   * Get coupon analytics (Manager only)
   * Implements Requirement 2.18
   * GET /api/v1/coupons/:id/analytics
   */
  async getCouponAnalytics(req, res) {
    try {
      const { id } = req.params;

      const analytics = await couponService.getCouponUsage(id);

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error in getCouponAnalytics controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get coupon analytics'
      });
    }
  }

  /**
   * Get overall coupon analytics (Manager only)
   * Implements Requirement 2.18
   * GET /api/v1/coupons/analytics
   */
  async getOverallCouponAnalytics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const analytics = await couponService.getCouponAnalytics(filters);

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error in getOverallCouponAnalytics controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get coupon analytics'
      });
    }
  }

  /**
   * Deactivate a coupon (Manager only)
   * Implements Requirement 2.17
   * PUT /api/v1/coupons/:id/deactivate
   */
  async deactivateCoupon(req, res) {
    try {
      const { id } = req.params;

      const coupon = await couponService.deactivateCoupon(id);

      res.status(200).json({
        success: true,
        message: 'Coupon deactivated successfully',
        data: coupon
      });
    } catch (error) {
      console.error('Error in deactivateCoupon controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to deactivate coupon'
      });
    }
  }

  /**
   * Get all coupons (Manager only)
   * GET /api/v1/coupons
   */
  async getAllCoupons(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await couponService.getAllCoupons(page, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getAllCoupons controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get coupons'
      });
    }
  }

  /**
   * Get active coupons
   * GET /api/v1/coupons/active
   */
  async getActiveCoupons(req, res) {
    try {
      const coupons = await couponService.getActiveCoupons();

      res.status(200).json({
        success: true,
        data: coupons
      });
    } catch (error) {
      console.error('Error in getActiveCoupons controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get active coupons'
      });
    }
  }

  /**
   * Get available coupons for current user
   * GET /api/v1/coupons/available
   */
  async getUserAvailableCoupons(req, res) {
    try {
      const customerId = req.user.id;

      const coupons = await couponService.getUserAvailableCoupons(customerId);

      res.status(200).json({
        success: true,
        data: coupons
      });
    } catch (error) {
      console.error('Error in getUserAvailableCoupons controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get available coupons'
      });
    }
  }

  /**
   * Get coupon by ID
   * GET /api/v1/coupons/:id
   */
  async getCouponById(req, res) {
    try {
      const { id } = req.params;

      const coupon = await couponService.getCouponById(id);

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      res.status(200).json({
        success: true,
        data: coupon
      });
    } catch (error) {
      console.error('Error in getCouponById controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get coupon'
      });
    }
  }

  /**
   * Get coupon by code
   * GET /api/v1/coupons/code/:code
   */
  async getCouponByCode(req, res) {
    try {
      const { code } = req.params;

      const coupon = await couponService.getCouponByCode(code);

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      res.status(200).json({
        success: true,
        data: coupon
      });
    } catch (error) {
      console.error('Error in getCouponByCode controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get coupon'
      });
    }
  }

  /**
   * Update coupon (Manager only)
   * PUT /api/v1/coupons/:id
   */
  async updateCoupon(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const coupon = await couponService.updateCoupon(id, updates);

      res.status(200).json({
        success: true,
        message: 'Coupon updated successfully',
        data: coupon
      });
    } catch (error) {
      console.error('Error in updateCoupon controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update coupon'
      });
    }
  }

  /**
   * Delete coupon (Manager only)
   * DELETE /api/v1/coupons/:id
   */
  async deleteCoupon(req, res) {
    try {
      const { id } = req.params;

      await couponService.deleteCoupon(id);

      res.status(200).json({
        success: true,
        message: 'Coupon deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteCoupon controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete coupon'
      });
    }
  }
}

module.exports = new CouponController();
