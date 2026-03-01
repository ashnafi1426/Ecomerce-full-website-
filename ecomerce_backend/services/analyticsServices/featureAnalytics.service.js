const supabase = require('../../config/supabase');

/**
 * Feature Analytics Service
 * Aggregates analytics across all critical features:
 * - Coupon analytics (usage rate, revenue impact)
 * - Delivery rating analytics (seller performance, trends)
 * - Replacement analytics (rates, common reasons)
 * - Refund analytics (rates, reasons, processing time)
 * 
 * Requirements: 2.18, 3.12, 4.18, 5.10, 5.18
 */

/**
 * Get comprehensive coupon analytics
 * Requirements: 2.18
 */
async function getCouponAnalytics(startDate, endDate) {
  try {
    // Get coupon usage statistics
    const { data: usageStats, error: usageError } = await supabase
      .from('coupon_usage')
      .select(`
        coupon_id,
        coupons (
          code,
          discount_type,
          discount_value
        )
      `)
      .gte('used_at', startDate)
      .lte('used_at', endDate);

    if (usageError) throw usageError;

    // Get order totals with coupons
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('coupon_id, amount, discount_amount')
      .not('coupon_id', 'is', null)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (orderError) throw orderError;

    // Calculate metrics
    const totalUsage = usageStats.length;
    const totalRevenue = orderData.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
    const totalDiscount = orderData.reduce((sum, order) => sum + parseFloat(order.discount_amount || 0), 0);
    
    // Group by coupon
    const couponBreakdown = {};
    usageStats.forEach(usage => {
      const couponId = usage.coupon_id;
      if (!couponBreakdown[couponId]) {
        couponBreakdown[couponId] = {
          code: usage.coupons?.code,
          discount_type: usage.coupons?.discount_type,
          discount_value: usage.coupons?.discount_value,
          usage_count: 0,
          total_discount: 0
        };
      }
      couponBreakdown[couponId].usage_count++;
    });

    orderData.forEach(order => {
      if (couponBreakdown[order.coupon_id]) {
        couponBreakdown[order.coupon_id].total_discount += parseFloat(order.discount_amount || 0);
      }
    });

    return {
      summary: {
        total_usage: totalUsage,
        total_revenue: totalRevenue,
        total_discount: totalDiscount,
        discount_percentage: totalRevenue > 0 ? (totalDiscount / totalRevenue * 100).toFixed(2) : 0,
        average_discount_per_order: totalUsage > 0 ? (totalDiscount / totalUsage).toFixed(2) : 0
      },
      coupon_breakdown: Object.values(couponBreakdown),
      date_range: { start: startDate, end: endDate }
    };
  } catch (error) {
    console.error('Error getting coupon analytics:', error);
    throw error;
  }
}

/**
 * Get comprehensive delivery rating analytics
 * Requirements: 3.12
 */
async function getDeliveryRatingAnalytics(startDate, endDate) {
  try {
    // Get all delivery ratings in date range
    const { data: ratings, error: ratingsError } = await supabase
      .from('delivery_ratings')
      .select(`
        *,
        orders (
          seller_id
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (ratingsError) throw ratingsError;

    if (!ratings || ratings.length === 0) {
      return {
        summary: {
          total_ratings: 0,
          average_overall: 0,
          average_speed: 0,
          average_packaging: 0,
          average_communication: 0,
          flagged_count: 0
        },
        seller_performance: [],
        rating_trends: [],
        date_range: { start: startDate, end: endDate }
      };
    }

    // Calculate overall metrics
    const totalRatings = ratings.length;
    const avgOverall = (ratings.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / totalRatings).toFixed(2);
    const avgSpeed = (ratings.reduce((sum, r) => sum + (r.speed_rating || 0), 0) / totalRatings).toFixed(2);
    const avgPackaging = (ratings.reduce((sum, r) => sum + (r.packaging_rating || 0), 0) / totalRatings).toFixed(2);
    const avgCommunication = (ratings.reduce((sum, r) => sum + (r.communication_rating || 0), 0) / totalRatings).toFixed(2);
    const flaggedCount = ratings.filter(r => r.flagged_for_review).length;

    // Group by seller
    const sellerStats = {};
    ratings.forEach(rating => {
      const sellerId = rating.orders?.seller_id;
      if (!sellerId) return;

      if (!sellerStats[sellerId]) {
        sellerStats[sellerId] = {
          seller_id: sellerId,
          rating_count: 0,
          total_overall: 0,
          total_speed: 0,
          total_packaging: 0,
          total_communication: 0,
          flagged_count: 0
        };
      }

      sellerStats[sellerId].rating_count++;
      sellerStats[sellerId].total_overall += rating.overall_rating || 0;
      sellerStats[sellerId].total_speed += rating.speed_rating || 0;
      sellerStats[sellerId].total_packaging += rating.packaging_rating || 0;
      sellerStats[sellerId].total_communication += rating.communication_rating || 0;
      if (rating.flagged_for_review) sellerStats[sellerId].flagged_count++;
    });

    // Calculate seller averages
    const sellerPerformance = Object.values(sellerStats).map(stats => ({
      seller_id: stats.seller_id,
      rating_count: stats.rating_count,
      average_overall: (stats.total_overall / stats.rating_count).toFixed(2),
      average_speed: (stats.total_speed / stats.rating_count).toFixed(2),
      average_packaging: (stats.total_packaging / stats.rating_count).toFixed(2),
      average_communication: (stats.total_communication / stats.rating_count).toFixed(2),
      flagged_count: stats.flagged_count
    }));

    // Calculate rating distribution trends
    const ratingDistribution = {
      '5_stars': ratings.filter(r => r.overall_rating === 5).length,
      '4_stars': ratings.filter(r => r.overall_rating === 4).length,
      '3_stars': ratings.filter(r => r.overall_rating === 3).length,
      '2_stars': ratings.filter(r => r.overall_rating === 2).length,
      '1_star': ratings.filter(r => r.overall_rating === 1).length
    };

    return {
      summary: {
        total_ratings: totalRatings,
        average_overall: parseFloat(avgOverall),
        average_speed: parseFloat(avgSpeed),
        average_packaging: parseFloat(avgPackaging),
        average_communication: parseFloat(avgCommunication),
        flagged_count: flaggedCount
      },
      seller_performance: sellerPerformance,
      rating_distribution: ratingDistribution,
      date_range: { start: startDate, end: endDate }
    };
  } catch (error) {
    console.error('Error getting delivery rating analytics:', error);
    throw error;
  }
}

/**
 * Get comprehensive replacement analytics
 * Requirements: 4.18
 */
async function getReplacementAnalytics(startDate, endDate) {
  try {
    // Get all replacement requests in date range
    const { data: replacements, error: replacementsError } = await supabase
      .from('replacement_requests')
      .select(`
        *,
        orders (
          seller_id,
          amount
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (replacementsError) throw replacementsError;

    // Get total orders in date range for rate calculation
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, seller_id')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (ordersError) throw ordersError;

    const totalOrders = orders?.length || 0;
    const totalReplacements = replacements?.length || 0;
    const replacementRate = totalOrders > 0 ? ((totalReplacements / totalOrders) * 100).toFixed(2) : 0;

    // Status breakdown
    const statusBreakdown = {
      pending: replacements?.filter(r => r.status === 'pending').length || 0,
      approved: replacements?.filter(r => r.status === 'approved').length || 0,
      rejected: replacements?.filter(r => r.status === 'rejected').length || 0,
      shipped: replacements?.filter(r => r.status === 'shipped').length || 0,
      completed: replacements?.filter(r => r.status === 'completed').length || 0
    };

    // Reason breakdown
    const reasonBreakdown = {};
    replacements?.forEach(replacement => {
      const reason = replacement.reason || 'unknown';
      reasonBreakdown[reason] = (reasonBreakdown[reason] || 0) + 1;
    });

    // Sort reasons by frequency
    const topReasons = Object.entries(reasonBreakdown)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Seller breakdown
    const sellerStats = {};
    replacements?.forEach(replacement => {
      const sellerId = replacement.orders?.seller_id;
      if (!sellerId) return;

      if (!sellerStats[sellerId]) {
        sellerStats[sellerId] = {
          seller_id: sellerId,
          replacement_count: 0,
          approved_count: 0,
          rejected_count: 0
        };
      }

      sellerStats[sellerId].replacement_count++;
      if (replacement.status === 'approved' || replacement.status === 'shipped' || replacement.status === 'completed') {
        sellerStats[sellerId].approved_count++;
      }
      if (replacement.status === 'rejected') {
        sellerStats[sellerId].rejected_count++;
      }
    });

    const sellerPerformance = Object.values(sellerStats);

    return {
      summary: {
        total_replacements: totalReplacements,
        total_orders: totalOrders,
        replacement_rate: parseFloat(replacementRate),
        approval_rate: totalReplacements > 0 
          ? ((statusBreakdown.approved + statusBreakdown.shipped + statusBreakdown.completed) / totalReplacements * 100).toFixed(2)
          : 0
      },
      status_breakdown: statusBreakdown,
      top_reasons: topReasons,
      seller_performance: sellerPerformance,
      date_range: { start: startDate, end: endDate }
    };
  } catch (error) {
    console.error('Error getting replacement analytics:', error);
    throw error;
  }
}

/**
 * Get comprehensive refund analytics
 * Requirements: 5.10, 5.18
 */
async function getRefundAnalytics(startDate, endDate) {
  try {
    // Get all refund requests in date range
    const { data: refunds, error: refundsError } = await supabase
      .from('refund_details')
      .select(`
        *,
        orders (
          seller_id,
          amount
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (refundsError) throw refundsError;

    // Get total orders in date range for rate calculation
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, seller_id, amount')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (ordersError) throw ordersError;

    const totalOrders = orders?.length || 0;
    const totalRefunds = refunds?.length || 0;
    const refundRate = totalOrders > 0 ? ((totalRefunds / totalOrders) * 100).toFixed(2) : 0;

    // Calculate total refund amounts
    const totalRefundAmount = refunds?.reduce((sum, r) => sum + parseFloat(r.refund_amount || 0), 0) || 0;
    const totalOrderAmount = orders?.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0) || 0;
    const refundAmountRate = totalOrderAmount > 0 ? ((totalRefundAmount / totalOrderAmount) * 100).toFixed(2) : 0;

    // Status breakdown
    const statusBreakdown = {
      pending: refunds?.filter(r => r.status === 'pending').length || 0,
      approved: refunds?.filter(r => r.status === 'approved').length || 0,
      processing: refunds?.filter(r => r.status === 'processing').length || 0,
      completed: refunds?.filter(r => r.status === 'completed').length || 0,
      rejected: refunds?.filter(r => r.status === 'rejected').length || 0
    };

    // Type breakdown
    const typeBreakdown = {
      full: refunds?.filter(r => r.refund_type === 'full').length || 0,
      partial: refunds?.filter(r => r.refund_type === 'partial').length || 0,
      goodwill: refunds?.filter(r => r.is_goodwill_refund).length || 0
    };

    // Reason breakdown
    const reasonBreakdown = {};
    refunds?.forEach(refund => {
      const reason = refund.reason || 'unknown';
      reasonBreakdown[reason] = (reasonBreakdown[reason] || 0) + 1;
    });

    const topReasons = Object.entries(reasonBreakdown)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Processing time analysis
    const completedRefunds = refunds?.filter(r => r.status === 'completed' && r.processed_at) || [];
    const processingTimes = completedRefunds.map(r => {
      const created = new Date(r.created_at);
      const processed = new Date(r.processed_at);
      return (processed - created) / (1000 * 60 * 60 * 24); // days
    });

    const avgProcessingTime = processingTimes.length > 0
      ? (processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length).toFixed(2)
      : 0;

    const slowRefunds = refunds?.filter(r => {
      if (r.status === 'completed' || r.status === 'rejected') return false;
      const created = new Date(r.created_at);
      const now = new Date();
      const daysPending = (now - created) / (1000 * 60 * 60 * 24);
      return daysPending > 5;
    }).length || 0;

    // Seller breakdown
    const sellerStats = {};
    refunds?.forEach(refund => {
      const sellerId = refund.orders?.seller_id;
      if (!sellerId) return;

      if (!sellerStats[sellerId]) {
        sellerStats[sellerId] = {
          seller_id: sellerId,
          refund_count: 0,
          total_refund_amount: 0,
          approved_count: 0
        };
      }

      sellerStats[sellerId].refund_count++;
      sellerStats[sellerId].total_refund_amount += parseFloat(refund.refund_amount || 0);
      if (refund.status === 'approved' || refund.status === 'processing' || refund.status === 'completed') {
        sellerStats[sellerId].approved_count++;
      }
    });

    const sellerPerformance = Object.values(sellerStats).map(stats => ({
      ...stats,
      refund_rate: totalOrders > 0 
        ? ((stats.refund_count / totalOrders) * 100).toFixed(2)
        : 0
    }));

    return {
      summary: {
        total_refunds: totalRefunds,
        total_orders: totalOrders,
        refund_rate: parseFloat(refundRate),
        total_refund_amount: totalRefundAmount,
        refund_amount_rate: parseFloat(refundAmountRate),
        average_processing_time_days: parseFloat(avgProcessingTime),
        slow_refunds_count: slowRefunds
      },
      status_breakdown: statusBreakdown,
      type_breakdown: typeBreakdown,
      top_reasons: topReasons,
      seller_performance: sellerPerformance,
      date_range: { start: startDate, end: endDate }
    };
  } catch (error) {
    console.error('Error getting refund analytics:', error);
    throw error;
  }
}

/**
 * Get comprehensive analytics dashboard for all features
 * Aggregates all feature analytics into a single dashboard view
 * Requirements: 2.18, 3.12, 4.18, 5.10, 5.18
 */
async function getComprehensiveAnalyticsDashboard(startDate, endDate) {
  try {
    const [couponAnalytics, deliveryRatingAnalytics, replacementAnalytics, refundAnalytics] = await Promise.all([
      getCouponAnalytics(startDate, endDate),
      getDeliveryRatingAnalytics(startDate, endDate),
      getReplacementAnalytics(startDate, endDate),
      getRefundAnalytics(startDate, endDate)
    ]);

    return {
      date_range: { start: startDate, end: endDate },
      coupons: couponAnalytics,
      delivery_ratings: deliveryRatingAnalytics,
      replacements: replacementAnalytics,
      refunds: refundAnalytics,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting comprehensive analytics dashboard:', error);
    throw error;
  }
}

module.exports = {
  getCouponAnalytics,
  getDeliveryRatingAnalytics,
  getReplacementAnalytics,
  getRefundAnalytics,
  getComprehensiveAnalyticsDashboard
};
