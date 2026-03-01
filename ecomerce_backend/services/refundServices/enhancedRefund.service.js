const supabase = require('../../config/supabase');
const paymentService = require('../paymentServices/payment.service');
const orderService = require('../orderServices/order.service');

/**
 * Enhanced Refund Service
 * Handles full and partial refunds with detailed tracking
 * Implements Requirements 5.1, 5.2, 5.4, 5.6, 5.9, 5.10, 5.16
 */
class EnhancedRefundService {
  /**
   * Create refund request with images
   * Implements Requirements 5.1, 5.2, 5.3, 5.4
   * @param {string} orderId - Order UUID
   * @param {string} customerId - Customer UUID
   * @param {Object} refundData - Amount, reason, images
   * @returns {Promise<Object>} Created refund request
   */
  async createRefundRequest(orderId, customerId, refundData) {
    try {
      const {
        refund_amount,
        reason_category,
        reason_description,
        images = []
      } = refundData;

      // Validate images limit (max 5)
      if (images.length > 5) {
        throw new Error('Maximum 5 images allowed per refund request');
      }

      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, sub_orders(*)')
        .eq('id', orderId)
        .single();

      if (orderError) throw new Error('Order not found');

      // Verify customer owns the order
      if (order.user_id !== customerId) {
        throw new Error('Not authorized to request refund for this order');
      }

      // Get cumulative refunds for this order
      const cumulativeRefunds = await this.getCumulativeRefunds(orderId);
      
      // Validate refund amount doesn't exceed order total
      if (cumulativeRefunds + refund_amount > order.amount) {
        throw new Error('Refund amount exceeds remaining order total');
      }

      // Determine refund type
      const refund_type = refund_amount >= order.amount ? 'full' : 'partial';

      // Get seller from first sub-order (required field)
      let sellerId = null;
      if (order.sub_orders && order.sub_orders.length > 0) {
        sellerId = order.sub_orders[0].seller_id;
      }
      
      // If no seller found, throw error as seller_id is required
      if (!sellerId) {
        throw new Error('Cannot create refund: No seller found for this order');
      }

      // Create refund request
      const { data: refund, error: refundError } = await supabase
        .from('refund_details')
        .insert([{
          order_id: orderId,
          customer_id: customerId,
          seller_id: sellerId,
          refund_type,
          refund_amount,
          original_order_amount: order.amount,
          reason_category,
          reason_description,
          status: 'pending'
        }])
        .select()
        .single();

      if (refundError) throw refundError;

      // Upload images if provided
      if (images.length > 0) {
        await this.uploadRefundImages(refund.id, images);
      }

      return refund;
    } catch (error) {
      console.error('Error creating refund request:', error);
      throw error;
    }
  }

  /**
   * Process partial refund
   * Implements Requirements 5.1, 5.2, 5.6
   * @param {string} refundId - Refund UUID
   * @param {string} managerId - Manager UUID
   * @param {number} amount - Refund amount
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>} Processed refund object
   */
  async processPartialRefund(refundId, managerId, amount, reason) {
    try {
      // Get refund details
      const { data: refund, error: refundError } = await supabase
        .from('refund_details')
        .select('*')
        .eq('id', refundId)
        .single();

      if (refundError) throw new Error('Refund request not found');

      if (refund.status !== 'pending') {
        throw new Error('Refund request has already been processed');
      }

      // Calculate commission adjustment
      const commissionAdjustment = await this.calculateCommissionAdjustment(
        refund.order_id,
        amount
      );

      // Update refund status
      const { data: updatedRefund, error: updateError } = await supabase
        .from('refund_details')
        .update({
          status: 'approved',
          reviewed_by: managerId,
          reviewed_at: new Date().toISOString(),
          commission_adjustment: commissionAdjustment.commission,
          seller_deduction: commissionAdjustment.sellerAmount,
          processed_at: new Date().toISOString()
        })
        .eq('id', refundId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating refund:', updateError);
        throw updateError;
      }

      // Process payment refund with commission data
      await this.processPaymentRefund(refund.order_id, amount, commissionAdjustment);

      // Update order status using order service (handles partial/full refund logic)
      await orderService.updateOrderRefundStatus(refund.order_id, amount);

      return updatedRefund;
    } catch (error) {
      console.error('Error processing partial refund:', error);
      throw error;
    }
  }

  /**
   * Process full refund
   * Implements Requirements 5.1, 5.2
   * @param {string} refundId - Refund UUID
   * @param {string} managerId - Manager UUID
   * @returns {Promise<Object>} Processed refund object
   */
  async processFullRefund(refundId, managerId) {
    try {
      // Get refund details
      const { data: refund, error: refundError } = await supabase
        .from('refund_details')
        .select('*')
        .eq('id', refundId)
        .single();

      if (refundError) throw new Error('Refund request not found');

      if (refund.status !== 'pending') {
        throw new Error('Refund request has already been processed');
      }

      // Calculate commission adjustment
      const commissionAdjustment = await this.calculateCommissionAdjustment(
        refund.order_id,
        refund.refund_amount
      );

      // Update refund status
      const { data: updatedRefund, error: updateError } = await supabase
        .from('refund_details')
        .update({
          status: 'approved',
          reviewed_by: managerId,
          reviewed_at: new Date().toISOString(),
          commission_adjustment: commissionAdjustment.commission,
          seller_deduction: commissionAdjustment.sellerAmount,
          processed_at: new Date().toISOString()
        })
        .eq('id', refundId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Process payment refund with commission data
      await this.processPaymentRefund(refund.order_id, refund.refund_amount, commissionAdjustment);

      // Update order status using order service (handles partial/full refund logic)
      await orderService.updateOrderRefundStatus(refund.order_id, refund.refund_amount);

      return updatedRefund;
    } catch (error) {
      console.error('Error processing full refund:', error);
      throw error;
    }
  }

  /**
   * Calculate commission adjustment for refund
   * Implements Requirement 5.6, 5.15
   * @param {string} orderId - Order UUID
   * @param {number} refundAmount - Refund amount
   * @returns {Promise<Object>} Commission adjustment details
   */
  async calculateCommissionAdjustment(orderId, refundAmount) {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('amount')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Calculate proportional commission (assuming 10% commission rate)
      const commissionRate = 0.10;
      const proportionalCommission = refundAmount * commissionRate;
      const sellerAmount = refundAmount - proportionalCommission;

      return {
        commission: Math.round(proportionalCommission * 100) / 100,
        sellerAmount: Math.round(sellerAmount * 100) / 100,
        refundAmount: Math.round(refundAmount * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating commission adjustment:', error);
      throw error;
    }
  }

  /**
   * Upload refund evidence images
   * Implements Requirement 5.4
   * @param {string} refundId - Refund UUID
   * @param {Array} images - Image URLs or files
   * @returns {Promise<Array>} Uploaded image records
   */
  async uploadRefundImages(refundId, images) {
    try {
      const imageRecords = images.map(imageUrl => ({
        refund_id: refundId,
        image_url: imageUrl,
        image_type: 'evidence',
        uploaded_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('refund_images')
        .insert(imageRecords)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading refund images:', error);
      throw error;
    }
  }

  /**
   * Get refund analytics
   * Implements Requirements 5.10, 5.18
   * @param {Object} filters - Date range, seller, reason
   * @returns {Promise<Object>} Analytics data
   */
  async getRefundAnalytics(filters = {}) {
    try {
      let query = supabase
        .from('refund_details')
        .select('*');

      // Apply filters
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.sellerId) {
        query = query.eq('seller_id', filters.sellerId);
      }
      if (filters.reason) {
        query = query.eq('reason_category', filters.reason);
      }

      const { data: refunds, error } = await query;
      if (error) throw error;

      // Calculate analytics
      const totalRefunds = refunds.length;
      const totalAmount = refunds.reduce((sum, r) => sum + parseFloat(r.refund_amount), 0);
      const avgRefundAmount = totalRefunds > 0 ? totalAmount / totalRefunds : 0;

      // Group by reason
      const reasonDistribution = {};
      refunds.forEach(refund => {
        const reason = refund.reason_category;
        reasonDistribution[reason] = (reasonDistribution[reason] || 0) + 1;
      });

      // Group by seller
      const sellerRefunds = {};
      refunds.forEach(refund => {
        if (refund.seller_id) {
          if (!sellerRefunds[refund.seller_id]) {
            sellerRefunds[refund.seller_id] = { count: 0, amount: 0 };
          }
          sellerRefunds[refund.seller_id].count++;
          sellerRefunds[refund.seller_id].amount += parseFloat(refund.refund_amount);
        }
      });

      // Calculate processing time
      const processedRefunds = refunds.filter(r => r.processed_at);
      let avgProcessingTime = 0;
      if (processedRefunds.length > 0) {
        const totalProcessingTime = processedRefunds.reduce((sum, r) => {
          const created = new Date(r.created_at);
          const processed = new Date(r.processed_at);
          return sum + (processed - created) / (1000 * 60 * 60 * 24); // days
        }, 0);
        avgProcessingTime = totalProcessingTime / processedRefunds.length;
      }

      return {
        totalRefunds,
        totalAmount: Math.round(totalAmount * 100) / 100,
        avgRefundAmount: Math.round(avgRefundAmount * 100) / 100,
        reasonDistribution,
        sellerRefunds,
        avgProcessingTimeDays: Math.round(avgProcessingTime * 10) / 10,
        refundsByType: {
          full: refunds.filter(r => r.refund_type === 'full').length,
          partial: refunds.filter(r => r.refund_type === 'partial').length,
          goodwill: refunds.filter(r => r.refund_type === 'goodwill').length
        }
      };
    } catch (error) {
      console.error('Error getting refund analytics:', error);
      throw error;
    }
  }

  /**
   * Track cumulative refunds for order
   * Implements Requirement 5.9
   * @param {string} orderId - Order UUID
   * @returns {Promise<number>} Total refunded amount
   */
  async getCumulativeRefunds(orderId) {
    try {
      const { data: refunds, error } = await supabase
        .from('refund_details')
        .select('refund_amount')
        .eq('order_id', orderId)
        .in('status', ['approved', 'processing', 'completed']);

      if (error) throw error;

      const total = refunds.reduce((sum, r) => sum + parseFloat(r.refund_amount), 0);
      return Math.round(total * 100) / 100;
    } catch (error) {
      console.error('Error getting cumulative refunds:', error);
      throw error;
    }
  }

  /**
   * Issue goodwill refund
   * Implements Requirement 5.16, 5.17
   * @param {string} orderId - Order UUID
   * @param {string} managerId - Manager UUID
   * @param {number} amount - Goodwill amount
   * @param {string} reason - Reason for goodwill
   * @returns {Promise<Object>} Goodwill refund object
   */
  async issueGoodwillRefund(orderId, managerId, amount, reason) {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, sub_orders(*)')
        .eq('id', orderId)
        .single();

      if (orderError) throw new Error('Order not found');

      // Get seller from first sub-order (required field)
      let sellerId = null;
      if (order.sub_orders && order.sub_orders.length > 0) {
        sellerId = order.sub_orders[0].seller_id;
      }
      
      // If no seller found, throw error as seller_id is required
      if (!sellerId) {
        throw new Error('Cannot issue goodwill refund: No seller found for this order');
      }

      // Create goodwill refund
      const { data: refund, error: refundError } = await supabase
        .from('refund_details')
        .insert([{
          order_id: orderId,
          customer_id: order.user_id,
          seller_id: sellerId,
          refund_type: 'goodwill',
          refund_amount: amount,
          original_order_amount: order.amount,
          reason_category: 'goodwill',
          reason_description: reason,
          status: 'approved',
          reviewed_by: managerId,
          reviewed_at: new Date().toISOString(),
          processed_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (refundError) throw refundError;

      // Process payment refund (no commission adjustment for goodwill)
      await this.processPaymentRefund(orderId, amount, {});

      return refund;
    } catch (error) {
      console.error('Error issuing goodwill refund:', error);
      throw error;
    }
  }

  /**
   * Process payment refund through payment gateway
   * @param {string} orderId - Order UUID
   * @param {number} amount - Refund amount
   * @returns {Promise<void>}
   */
  async processPaymentRefund(orderId, amount) {
    try {
      // This would integrate with actual payment gateway (Stripe, etc.)
      // For now, we'll just log it
      console.log(`Processing refund for order ${orderId}: $${amount}`);
      
      // In production, you would call:
      // await paymentService.processRefund(orderId, amount);
      
      return { success: true, amount };
    } catch (error) {
      console.error('Error processing payment refund:', error);
      throw error;
    }
  }

  /**
   * Get refund by ID
   * @param {string} refundId - Refund UUID
   * @returns {Promise<Object>} Refund details
   */
  async getRefundById(refundId) {
    try {
      const { data, error } = await supabase
        .from('refund_details')
        .select(`
          *,
          refund_images (*),
          orders (id, amount, status),
          customers:customer_id (email, display_name),
          sellers:seller_id (email, display_name),
          reviewers:reviewed_by (email, display_name)
        `)
        .eq('id', refundId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting refund by ID:', error);
      throw error;
    }
  }

  /**
   * Get all refunds with pagination
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated refunds
   */
  async getAllRefunds(filters = {}) {
    try {
      const { page = 1, limit = 20, status, customerId, sellerId } = filters;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('refund_details')
        .select(`
          *,
          orders (id, amount),
          customers:customer_id (email, display_name)
        `, { count: 'exact' });

      if (status) query = query.eq('status', status);
      if (customerId) query = query.eq('customer_id', customerId);
      if (sellerId) query = query.eq('seller_id', sellerId);

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        refunds: data || [],
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Error getting all refunds:', error);
      throw error;
    }
  }

  /**
   * Reject refund request
   * @param {string} refundId - Refund UUID
   * @param {string} managerId - Manager UUID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Updated refund
   */
  async rejectRefund(refundId, managerId, reason) {
    try {
      const { data, error } = await supabase
        .from('refund_details')
        .update({
          status: 'rejected',
          reviewed_by: managerId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', refundId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error rejecting refund:', error);
      throw error;
    }
  }
}

module.exports = new EnhancedRefundService();
