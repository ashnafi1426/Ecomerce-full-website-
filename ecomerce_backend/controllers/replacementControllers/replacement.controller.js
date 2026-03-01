const replacementService = require('../../services/replacementServices/replacement.service');

/**
 * Replacement Controller
 * Handles HTTP requests for replacement process
 * Implements Requirements 4.1, 4.6, 4.7, 4.8, 4.18
 */
class ReplacementController {
  /**
   * Create replacement request
   * POST /api/v1/replacements
   * @access Customer
   */
  async createReplacementRequest(req, res) {
    try {
      const customerId = req.user.id;
      const {
        order_id,
        product_id,
        variant_id,
        quantity,
        reason_category,
        reason_description,
        images
      } = req.body;

      // Validate required fields
      if (!order_id || !product_id || !reason_category || !reason_description) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: order_id, product_id, reason_category, reason_description'
        });
      }

      const requestData = {
        order_id,
        product_id,
        variant_id,
        quantity: quantity || 1,
        reason_category,
        reason_description,
        images: images || []
      };

      const replacement = await replacementService.createReplacementRequest(
        order_id,
        customerId,
        requestData
      );

      res.status(201).json({
        success: true,
        message: 'Replacement request created successfully',
        data: replacement
      });
    } catch (error) {
      console.error('Error in createReplacementRequest controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create replacement request'
      });
    }
  }

  /**
   * Get replacement request by ID
   * GET /api/v1/replacements/:id
   * @access Customer/Seller/Manager
   */
  async getReplacementRequest(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const replacement = await replacementService.getReplacementRequest(id);

      if (!replacement) {
        return res.status(404).json({
          success: false,
          message: 'Replacement request not found'
        });
      }

      // Authorization check
      if (userRole === 'customer' && replacement.customer_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this replacement request'
        });
      }

      if (userRole === 'seller' && replacement.seller_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this replacement request'
        });
      }

      res.status(200).json({
        success: true,
        data: replacement
      });
    } catch (error) {
      console.error('Error in getReplacementRequest controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get replacement request'
      });
    }
  }

  /**
   * Get all replacement requests for user
   * GET /api/v1/replacements
   * @access Customer/Seller/Manager
   */
  async getReplacementRequests(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { status, page = 1, limit = 20 } = req.query;

      const filters = { status, page: parseInt(page), limit: parseInt(limit) };

      let replacements;
      if (userRole === 'customer') {
        replacements = await replacementService.getCustomerReplacements(userId, filters);
      } else if (userRole === 'seller') {
        replacements = await replacementService.getSellerReplacements(userId, filters);
      } else {
        replacements = await replacementService.getAllReplacements(filters);
      }

      res.status(200).json({
        success: true,
        data: replacements
      });
    } catch (error) {
      console.error('Error in getReplacementRequests controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get replacement requests'
      });
    }
  }

  /**
   * Approve replacement request
   * PUT /api/v1/replacements/:id/approve
   * @access Manager
   */
  async approveReplacement(req, res) {
    try {
      const { id } = req.params;
      const managerId = req.user.id;

      const replacement = await replacementService.approveReplacement(id, managerId);

      res.status(200).json({
        success: true,
        message: 'Replacement request approved successfully',
        data: replacement
      });
    } catch (error) {
      console.error('Error in approveReplacement controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to approve replacement request'
      });
    }
  }

  /**
   * Reject replacement request
   * PUT /api/v1/replacements/:id/reject
   * @access Manager
   */
  async rejectReplacement(req, res) {
    try {
      const { id } = req.params;
      const managerId = req.user.id;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      const replacement = await replacementService.rejectReplacement(id, managerId, reason);

      res.status(200).json({
        success: true,
        message: 'Replacement request rejected',
        data: replacement
      });
    } catch (error) {
      console.error('Error in rejectReplacement controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reject replacement request'
      });
    }
  }

  /**
   * Update replacement shipment
   * PUT /api/v1/replacements/:id/shipment
   * @access Seller
   */
  async updateReplacementShipment(req, res) {
    try {
      const { id } = req.params;
      const {
        tracking_number,
        carrier,
        shipped_at,
        estimated_delivery,
        notes
      } = req.body;

      const shipmentData = {
        tracking_number,
        carrier,
        shipped_at,
        estimated_delivery,
        notes
      };

      const shipment = await replacementService.updateReplacementShipment(id, shipmentData);

      res.status(200).json({
        success: true,
        message: 'Replacement shipment updated successfully',
        data: shipment
      });
    } catch (error) {
      console.error('Error in updateReplacementShipment controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update replacement shipment'
      });
    }
  }

  /**
   * Get replacement analytics
   * GET /api/v1/replacements/analytics
   * @access Manager
   */
  async getReplacementAnalytics(req, res) {
    try {
      const { startDate, endDate, sellerId, status } = req.query;

      const filters = {
        startDate,
        endDate,
        sellerId,
        status
      };

      const analytics = await replacementService.getReplacementAnalytics(filters);

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error in getReplacementAnalytics controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get replacement analytics'
      });
    }
  }

  /**
   * Update return tracking
   * PUT /api/v1/replacements/:id/return-tracking
   * @access Customer
   */
  async updateReturnTracking(req, res) {
    try {
      const { id } = req.params;
      const customerId = req.user.id;
      const { return_tracking_number } = req.body;

      if (!return_tracking_number) {
        return res.status(400).json({
          success: false,
          message: 'Return tracking number is required'
        });
      }

      const replacement = await replacementService.updateReturnTracking(
        id,
        customerId,
        return_tracking_number
      );

      res.status(200).json({
        success: true,
        message: 'Return tracking updated successfully',
        data: replacement
      });
    } catch (error) {
      console.error('Error in updateReturnTracking controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update return tracking'
      });
    }
  }

  /**
   * Confirm return received
   * PUT /api/v1/replacements/:id/confirm-return
   * @access Seller
   */
  async confirmReturnReceived(req, res) {
    try {
      const { id } = req.params;
      const sellerId = req.user.id;

      const replacement = await replacementService.confirmReturnReceived(id, sellerId);

      res.status(200).json({
        success: true,
        message: 'Return receipt confirmed',
        data: replacement
      });
    } catch (error) {
      console.error('Error in confirmReturnReceived controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to confirm return receipt'
      });
    }
  }
}

module.exports = new ReplacementController();
