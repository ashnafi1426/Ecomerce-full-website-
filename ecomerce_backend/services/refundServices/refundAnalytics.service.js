/**
 * REFUND ANALYTICS SERVICE
 * 
 * Handles refund analytics, alerts, and threshold monitoring
 * Implements Requirements 5.10, 5.11, 5.14, 5.18, 5.23
 */

const supabase = require('../../config/supabase');

/**
 * Calculate refund rate for a seller
 * Implements Requirement 5.11
 * @param {String} sellerId - Seller UUID
 * @param {Object} options - Date range options
 * @returns {Promise<Object>} Seller refund rate data
 */
async function getSellerRefundRate(sellerId, options = {}) {
  try {
    const { startDate, endDate } = options;
    
    // Get total orders for seller
    let orderQuery = supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('seller_id', sellerId)
      .eq('status', 'delivered');
    
    if (startDate) orderQuery = orderQuery.gte('created_at', startDate);
    if (endDate) orderQuery = orderQuery.lte('created_at', endDate);
    
    const { count: totalOrders, error: orderError } = await orderQuery;
    if (orderError) throw orderError;
    
    // Get refund requests for seller
    let refundQuery = supabase
      .from('refund_details')
      .select('id, refund_amount, order_id', { count: 'exact' })
      .eq('seller_id', sellerId);
    
    if (startDate) refundQuery = refundQuery.gte('created_at', startDate);
    if (endDate) refundQuery = refundQuery.lte('created_at', endDate);
    
    const { data: refunds, count: refundCount, error: refundError } = await refundQuery;
    if (refundError) throw refundError;
    
    // Calculate refund rate
    const refundRate = totalOrders > 0 ? (refundCount / totalOrders) * 100 : 0;
    
    // Calculate total refunded amount
    const totalRefunded = refunds.reduce((sum, r) => sum + parseFloat(r.refund_amount || 0), 0);
    
    // Check if threshold exceeded (>15%)
    const thresholdExceeded = refundRate > 15;
    
    return {
      seller_id: sellerId,
      total_orders: totalOrders,
      refund_count: refundCount,
      refund_rate: Math.round(refundRate * 100) / 100,
      total_refunded: Math.round(totalRefunded * 100) / 100,
      threshold_exceeded: thresholdExceeded,
      threshold: 15,
      alert_required: thresholdExceeded && totalOrders >= 10 // Only alert if significant sample size
    };
  } catch (error) {
    console.error('Error calculating seller refund rate:', error);
    throw error;
  }
}

/**
 * Calculate refund rate for a product
 * Implements Requirement 5.23
 * @param {String} productId - Product UUID
 * @param {Object} options - Date range options
 * @returns {Promise<Object>} Product refund rate data
 */
async function getProductRefundRate(productId, options = {}) {
  try {
    const { startDate, endDate } = options;
    
    // Get total orders containing this product
    let orderQuery = supabase
      .from('orders')
      .select('id, basket')
      .eq('status', 'delivered');
    
    if (startDate) orderQuery = orderQuery.gte('created_at', startDate);
    if (endDate) orderQuery = orderQuery.lte('created_at', endDate);
    
    const { data: orders, error: orderError } = await orderQuery;
    if (orderError) throw orderError;
    
    // Filter orders that contain this product
    const ordersWithProduct = orders.filter(order => {
      if (!order.basket || !Array.isArray(order.basket)) return false;
      return order.basket.some(item => item.product_id === productId);
    });
    
    const totalOrders = ordersWithProduct.length;
    
    // Get refund requests for orders containing this product
    const orderIds = ordersWithProduct.map(o => o.id);
    
    if (orderIds.length === 0) {
      return {
        product_id: productId,
        total_orders: 0,
        refund_count: 0,
        refund_rate: 0,
        threshold_exceeded: false,
        threshold: 20,
        should_flag: false
      };
    }
    
    const { data: refunds, error: refundError } = await supabase
      .from('refund_details')
      .select('id, refund_amount')
      .in('order_id', orderIds);
    
    if (refundError) throw refundError;
    
    const refundCount = refunds.length;
    const refundRate = totalOrders > 0 ? (refundCount / totalOrders) * 100 : 0;
    
    // Calculate total refunded amount
    const totalRefunded = refunds.reduce((sum, r) => sum + parseFloat(r.refund_amount || 0), 0);
    
    // Check if threshold exceeded (>20%)
    const thresholdExceeded = refundRate > 20;
    
    return {
      product_id: productId,
      total_orders: totalOrders,
      refund_count: refundCount,
      refund_rate: Math.round(refundRate * 100) / 100,
      total_refunded: Math.round(totalRefunded * 100) / 100,
      threshold_exceeded: thresholdExceeded,
      threshold: 20,
      should_flag: thresholdExceeded && totalOrders >= 10 // Only flag if significant sample size
    };
  } catch (error) {
    console.error('Error calculating product refund rate:', error);
    throw error;
  }
}

/**
 * Get refund reason analytics
 * Implements Requirement 5.10
 * @param {Object} filters - Seller, date range filters
 * @returns {Promise<Object>} Refund reason distribution
 */
async function getRefundReasonAnalytics(filters = {}) {
  try {
    let query = supabase
      .from('refund_details')
      .select('reason_category, refund_amount, refund_type');
    
    if (filters.sellerId) query = query.eq('seller_id', filters.sellerId);
    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);
    
    const { data: refunds, error } = await query;
    if (error) throw error;
    
    // Group by reason category
    const reasonStats = {};
    
    refunds.forEach(refund => {
      const reason = refund.reason_category;
      if (!reasonStats[reason]) {
        reasonStats[reason] = {
          count: 0,
          total_amount: 0,
          full_refunds: 0,
          partial_refunds: 0,
          goodwill_refunds: 0
        };
      }
      
      reasonStats[reason].count++;
      reasonStats[reason].total_amount += parseFloat(refund.refund_amount || 0);
      
      if (refund.refund_type === 'full') reasonStats[reason].full_refunds++;
      else if (refund.refund_type === 'partial') reasonStats[reason].partial_refunds++;
      else if (refund.refund_type === 'goodwill') reasonStats[reason].goodwill_refunds++;
    });
    
    // Calculate percentages
    const totalRefunds = refunds.length;
    Object.keys(reasonStats).forEach(reason => {
      reasonStats[reason].percentage = totalRefunds > 0 
        ? Math.round((reasonStats[reason].count / totalRefunds) * 10000) / 100 
        : 0;
      reasonStats[reason].avg_amount = reasonStats[reason].count > 0
        ? Math.round((reasonStats[reason].total_amount / reasonStats[reason].count) * 100) / 100
        : 0;
      reasonStats[reason].total_amount = Math.round(reasonStats[reason].total_amount * 100) / 100;
    });
    
    return {
      total_refunds: totalRefunds,
      reason_distribution: reasonStats,
      most_common_reason: Object.keys(reasonStats).reduce((a, b) => 
        reasonStats[a].count > reasonStats[b].count ? a : b, Object.keys(reasonStats)[0]
      )
    };
  } catch (error) {
    console.error('Error getting refund reason analytics:', error);
    throw error;
  }
}

/**
 * Check refund processing time and generate alerts
 * Implements Requirement 5.14
 * @returns {Promise<Array>} Array of refunds exceeding processing time threshold
 */
async function checkRefundProcessingTimeAlerts() {
  try {
    const { data: refunds, error } = await supabase
      .from('refund_details')
      .select('id, order_id, customer_id, seller_id, created_at, status, refund_amount')
      .in('status', ['pending', 'approved']);
    
    if (error) throw error;
    
    const now = new Date();
    const alerts = [];
    
    refunds.forEach(refund => {
      const createdDate = new Date(refund.created_at);
      const daysPending = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      
      // Alert if processing time exceeds 5 days
      if (daysPending > 5) {
        alerts.push({
          refund_id: refund.id,
          order_id: refund.order_id,
          customer_id: refund.customer_id,
          seller_id: refund.seller_id,
          status: refund.status,
          refund_amount: refund.refund_amount,
          days_pending: daysPending,
          created_at: refund.created_at,
          alert_type: 'processing_time_exceeded',
          threshold_days: 5
        });
      }
    });
    
    return alerts;
  } catch (error) {
    console.error('Error checking refund processing time alerts:', error);
    throw error;
  }
}

/**
 * Flag products with high refund rates
 * Implements Requirement 5.23
 * @param {Object} options - Date range options
 * @returns {Promise<Array>} Array of products that should be flagged
 */
async function flagHighRefundProducts(options = {}) {
  try {
    // Get all products with orders
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, basket')
      .eq('status', 'delivered');
    
    if (orderError) throw orderError;
    
    // Extract unique product IDs and count orders per product
    const productOrderCounts = {};
    orders.forEach(order => {
      if (order.basket && Array.isArray(order.basket)) {
        order.basket.forEach(item => {
          if (item.product_id) {
            if (!productOrderCounts[item.product_id]) {
              productOrderCounts[item.product_id] = {
                order_ids: new Set(),
                count: 0
              };
            }
            productOrderCounts[item.product_id].order_ids.add(order.id);
            productOrderCounts[item.product_id].count++;
          }
        });
      }
    });
    
    // Check refund rates for each product
    const flaggedProducts = [];
    
    for (const [productId, orderData] of Object.entries(productOrderCounts)) {
      // Only check products with at least 10 orders
      if (orderData.count >= 10) {
        const refundRate = await getProductRefundRate(productId, options);
        
        if (refundRate.should_flag) {
          // Get product details
          const { data: product } = await supabase
            .from('products')
            .select('id, title, seller_id')
            .eq('id', productId)
            .single();
          
          flaggedProducts.push({
            ...refundRate,
            product_title: product?.title || 'Unknown',
            seller_id: product?.seller_id,
            action_required: 'quality_review'
          });
        }
      }
    }
    
    return flaggedProducts;
  } catch (error) {
    console.error('Error flagging high refund products:', error);
    throw error;
  }
}

/**
 * Get comprehensive refund analytics dashboard
 * Implements Requirements 5.10, 5.18
 * @param {Object} filters - Date range, seller filters
 * @returns {Promise<Object>} Complete analytics dashboard data
 */
async function getRefundAnalyticsDashboard(filters = {}) {
  try {
    const [
      reasonAnalytics,
      processingTimeAlerts,
      flaggedProducts
    ] = await Promise.all([
      getRefundReasonAnalytics(filters),
      checkRefundProcessingTimeAlerts(),
      flagHighRefundProducts(filters)
    ]);
    
    // Get seller-specific data if seller filter provided
    let sellerRefundRate = null;
    if (filters.sellerId) {
      sellerRefundRate = await getSellerRefundRate(filters.sellerId, filters);
    }
    
    return {
      reason_analytics: reasonAnalytics,
      processing_time_alerts: {
        count: processingTimeAlerts.length,
        alerts: processingTimeAlerts
      },
      flagged_products: {
        count: flaggedProducts.length,
        products: flaggedProducts
      },
      seller_refund_rate: sellerRefundRate,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating refund analytics dashboard:', error);
    throw error;
  }
}

module.exports = {
  getSellerRefundRate,
  getProductRefundRate,
  getRefundReasonAnalytics,
  checkRefundProcessingTimeAlerts,
  flagHighRefundProducts,
  getRefundAnalyticsDashboard
};
