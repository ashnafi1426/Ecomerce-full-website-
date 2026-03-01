/**
 * DELIVERY RATING SERVICE
 * 
 * Business logic layer for delivery rating operations.
 * Handles rating submission, validation, aggregation, and seller performance tracking.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.6, 3.9, 3.11
 */

const supabase = require('../../config/supabase');

/**
 * Submit delivery rating for order
 * @param {String} orderId - Order UUID
 * @param {String} customerId - Customer UUID
 * @param {Object} ratingData - Rating values and feedback
 * @returns {Promise<Object>} Created rating object
 */
async function submitDeliveryRating(orderId, customerId, ratingData) {
  // Validate required fields
  if (!ratingData.overall_rating || !ratingData.packaging_quality_rating || !ratingData.delivery_speed_rating) {
    throw new Error('Overall rating, packaging quality rating, and delivery speed rating are required');
  }
  
  // Validate rating values (1-5 stars)
  const ratings = [
    ratingData.overall_rating,
    ratingData.packaging_quality_rating,
    ratingData.delivery_speed_rating
  ];
  
  if (ratingData.delivery_person_rating) {
    ratings.push(ratingData.delivery_person_rating);
  }
  
  for (const rating of ratings) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating values must be between 1 and 5 stars');
    }
  }
  
  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, seller_id, status, created_at')
    .eq('id', orderId)
    .single();
  
  if (orderError || !order) {
    throw new Error('Order not found');
  }
  
  // Verify customer owns the order
  if (order.user_id !== customerId) {
    throw new Error('Unauthorized to rate this order');
  }
  
  // Verify order is delivered
  if (order.status !== 'delivered') {
    throw new Error('Can only rate delivered orders');
  }
  
  // Check 30-day window
  const orderDate = new Date(order.created_at);
  const now = new Date();
  const daysSinceOrder = (now - orderDate) / (1000 * 60 * 60 * 24);
  
  if (daysSinceOrder > 30) {
    throw new Error('Rating window has expired (30 days from delivery)');
  }
  
  // Check for duplicate rating
  const { data: existingRating } = await supabase
    .from('delivery_ratings')
    .select('id')
    .eq('order_id', orderId)
    .eq('customer_id', customerId)
    .single();
  
  if (existingRating) {
    throw new Error('Delivery rating already submitted for this order');
  }
  
  // Get seller_id (handle multi-vendor orders via sub_orders)
  let sellerId = order.seller_id;
  let subOrderId = null;
  
  if (!sellerId && ratingData.sub_order_id) {
    // Multi-vendor order - get seller from sub_order
    const { data: subOrder } = await supabase
      .from('sub_orders')
      .select('id, seller_id')
      .eq('id', ratingData.sub_order_id)
      .single();
    
    if (subOrder) {
      sellerId = subOrder.seller_id;
      subOrderId = subOrder.id;
    }
  }
  
  if (!sellerId) {
    throw new Error('Unable to determine seller for rating');
  }
  
  // Create rating
  const { data: rating, error: ratingError } = await supabase
    .from('delivery_ratings')
    .insert([{
      order_id: orderId,
      sub_order_id: subOrderId,
      customer_id: customerId,
      seller_id: sellerId,
      overall_rating: ratingData.overall_rating,
      packaging_quality_rating: ratingData.packaging_quality_rating,
      delivery_speed_rating: ratingData.delivery_speed_rating,
      delivery_person_rating: ratingData.delivery_person_rating || null,
      overall_feedback: ratingData.overall_feedback || null,
      packaging_feedback: ratingData.packaging_feedback || null,
      delivery_speed_feedback: ratingData.delivery_speed_feedback || null,
      delivery_person_feedback: ratingData.delivery_person_feedback || null,
      is_flagged: ratingData.overall_rating < 3 || ratingData.packaging_quality_rating < 3 || ratingData.delivery_speed_rating < 3,
      flagged_reason: (ratingData.overall_rating < 3 || ratingData.packaging_quality_rating < 3 || ratingData.delivery_speed_rating < 3) 
        ? 'Low rating (below 3 stars)' 
        : null
    }])
    .select()
    .single();
  
  if (ratingError) {
    if (ratingError.code === '23505') { // Unique constraint violation
      throw new Error('Delivery rating already exists for this order and seller');
    }
    throw ratingError;
  }
  
  return rating;
}

/**
 * Get delivery ratings for order
 * @param {String} orderId - Order UUID
 * @returns {Promise<Array>} Array of rating objects (can be multiple for multi-vendor orders)
 */
async function getOrderDeliveryRating(orderId) {
  const { data, error } = await supabase
    .from('delivery_ratings')
    .select(`
      *,
      seller:users!delivery_ratings_seller_id_fkey(id, full_name, email)
    `)
    .eq('order_id', orderId);
  
  if (error) throw error;
  
  return data || [];
}

/**
 * Calculate seller delivery performance metrics
 * @param {String} sellerId - Seller UUID
 * @returns {Promise<Object>} Performance metrics
 */
async function getSellerDeliveryMetrics(sellerId) {
  const { data: ratings, error } = await supabase
    .from('delivery_ratings')
    .select('overall_rating, packaging_quality_rating, delivery_speed_rating, delivery_person_rating')
    .eq('seller_id', sellerId);
  
  if (error) throw error;
  
  if (!ratings || ratings.length === 0) {
    return {
      seller_id: sellerId,
      total_ratings: 0,
      average_overall_rating: 0,
      average_packaging_quality: 0,
      average_delivery_speed: 0,
      average_delivery_person: 0
    };
  }
  
  // Calculate averages
  const totalRatings = ratings.length;
  const sumOverall = ratings.reduce((sum, r) => sum + r.overall_rating, 0);
  const sumPackaging = ratings.reduce((sum, r) => sum + r.packaging_quality_rating, 0);
  const sumSpeed = ratings.reduce((sum, r) => sum + r.delivery_speed_rating, 0);
  
  // Delivery person rating is optional
  const ratingsWithPerson = ratings.filter(r => r.delivery_person_rating !== null);
  const sumPerson = ratingsWithPerson.reduce((sum, r) => sum + r.delivery_person_rating, 0);
  
  return {
    seller_id: sellerId,
    total_ratings: totalRatings,
    average_overall_rating: (sumOverall / totalRatings).toFixed(2),
    average_packaging_quality: (sumPackaging / totalRatings).toFixed(2),
    average_delivery_speed: (sumSpeed / totalRatings).toFixed(2),
    average_delivery_person: ratingsWithPerson.length > 0 
      ? (sumPerson / ratingsWithPerson.length).toFixed(2) 
      : 0
  };
}

/**
 * Get delivery rating distribution for seller
 * @param {String} sellerId - Seller UUID
 * @returns {Promise<Object>} Rating distribution by stars
 */
async function getSellerRatingDistribution(sellerId) {
  const { data: ratings, error } = await supabase
    .from('delivery_ratings')
    .select('overall_rating')
    .eq('seller_id', sellerId);
  
  if (error) throw error;
  
  if (!ratings || ratings.length === 0) {
    return {
      seller_id: sellerId,
      total_ratings: 0,
      distribution: {
        5: { count: 0, percentage: 0 },
        4: { count: 0, percentage: 0 },
        3: { count: 0, percentage: 0 },
        2: { count: 0, percentage: 0 },
        1: { count: 0, percentage: 0 }
      }
    };
  }
  
  // Count ratings by star value
  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  };
  
  ratings.forEach(r => {
    distribution[r.overall_rating]++;
  });
  
  const totalRatings = ratings.length;
  
  // Calculate percentages
  const distributionWithPercentage = {};
  for (const [stars, count] of Object.entries(distribution)) {
    distributionWithPercentage[stars] = {
      count: count,
      percentage: ((count / totalRatings) * 100).toFixed(1)
    };
  }
  
  return {
    seller_id: sellerId,
    total_ratings: totalRatings,
    distribution: distributionWithPercentage
  };
}

/**
 * Flag low-rated deliveries for review
 * @param {String} ratingId - Rating UUID
 * @param {String} reason - Reason for flagging
 * @returns {Promise<void>}
 */
async function flagLowRating(ratingId, reason = 'Manual review required') {
  const { error } = await supabase
    .from('delivery_ratings')
    .update({
      is_flagged: true,
      flagged_reason: reason
    })
    .eq('id', ratingId);
  
  if (error) throw error;
}

/**
 * Get flagged ratings for manager review
 * @param {Object} filters - Filter options (sellerId, dateRange)
 * @returns {Promise<Array>} Array of flagged ratings
 */
async function getFlaggedRatings(filters = {}) {
  let query = supabase
    .from('delivery_ratings')
    .select(`
      *,
      order:orders(id, payment_intent_id),
      customer:users!delivery_ratings_customer_id_fkey(id, full_name, email),
      seller:users!delivery_ratings_seller_id_fkey(id, full_name, email)
    `)
    .eq('is_flagged', true)
    .order('created_at', { ascending: false });
  
  if (filters.sellerId) {
    query = query.eq('seller_id', filters.sellerId);
  }
  
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
}

/**
 * Get delivery rating analytics for managers
 * @param {Object} filters - Filter options (sellerId, dateRange)
 * @returns {Promise<Object>} Analytics data
 */
async function getDeliveryRatingAnalytics(filters = {}) {
  let query = supabase
    .from('delivery_ratings')
    .select('*');
  
  if (filters.sellerId) {
    query = query.eq('seller_id', filters.sellerId);
  }
  
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  
  const { data: ratings, error } = await query;
  
  if (error) throw error;
  
  if (!ratings || ratings.length === 0) {
    return {
      total_ratings: 0,
      average_overall_rating: 0,
      average_packaging_quality: 0,
      average_delivery_speed: 0,
      flagged_count: 0,
      low_rating_count: 0
    };
  }
  
  const totalRatings = ratings.length;
  const flaggedCount = ratings.filter(r => r.is_flagged).length;
  const lowRatingCount = ratings.filter(r => r.overall_rating < 3).length;
  
  const avgOverall = ratings.reduce((sum, r) => sum + r.overall_rating, 0) / totalRatings;
  const avgPackaging = ratings.reduce((sum, r) => sum + r.packaging_quality_rating, 0) / totalRatings;
  const avgSpeed = ratings.reduce((sum, r) => sum + r.delivery_speed_rating, 0) / totalRatings;
  
  return {
    total_ratings: totalRatings,
    average_overall_rating: avgOverall.toFixed(2),
    average_packaging_quality: avgPackaging.toFixed(2),
    average_delivery_speed: avgSpeed.toFixed(2),
    flagged_count: flaggedCount,
    low_rating_count: lowRatingCount,
    flagged_percentage: ((flaggedCount / totalRatings) * 100).toFixed(1),
    low_rating_percentage: ((lowRatingCount / totalRatings) * 100).toFixed(1)
  };
}

/**
 * Check if seller's average rating is below threshold
 * @param {String} sellerId - Seller UUID
 * @param {Number} threshold - Rating threshold (default 3.0)
 * @returns {Promise<Boolean>} True if below threshold
 */
async function isSellerBelowThreshold(sellerId, threshold = 3.0) {
  const metrics = await getSellerDeliveryMetrics(sellerId);
  return parseFloat(metrics.average_overall_rating) < threshold;
}

module.exports = {
  submitDeliveryRating,
  getOrderDeliveryRating,
  getSellerDeliveryMetrics,
  getSellerRatingDistribution,
  flagLowRating,
  getFlaggedRatings,
  getDeliveryRatingAnalytics,
  isSellerBelowThreshold
};