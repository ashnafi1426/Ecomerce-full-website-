/**
 * REVIEW SERVICE
 * 
 * Business logic layer for product reviews and ratings.
 * Handles review creation, moderation, and rating calculations.
 */

const supabase = require('../../config/supabase');
const orderService = require('../orderServices/order.service');

/**
 * REQUIREMENT 1: Create review for purchased product
 * @param {String} userId - User UUID
 * @param {Object} reviewData - Review data (productId, rating, title, comment)
 * @returns {Promise<Object>} Created review object
 */
const createReview = async (userId, reviewData) => {
  const { productId, rating, title, comment } = reviewData;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // REQUIREMENT 2: Check if user already reviewed this product
  const existingReview = await findByUserAndProduct(userId, productId);
  if (existingReview) {
    throw new Error('You have already reviewed this product');
  }

  // Verify user purchased this product
  const hasPurchased = await verifyPurchase(userId, productId);

  const { data, error } = await supabase
    .from('reviews')
    .insert([{
      user_id: userId,
      product_id: productId,
      rating: parseInt(rating),
      title: title || null,
      comment: comment || null,
      status: 'pending', // Requires admin approval
      verified_purchase: hasPurchased
    }])
    .select()
    .single();
  
  if (error) throw error;

  // REQUIREMENT 3: Recalculate product average rating
  await updateProductRating(productId);
  
  return data;
};

/**
 * REQUIREMENT 2: Find review by user and product (one review per user per product)
 * @param {String} userId - User UUID
 * @param {String} productId - Product UUID
 * @returns {Promise<Object|null>} Review object or null
 */
const findByUserAndProduct = async (userId, productId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Verify if user purchased the product
 * @param {String} userId - User UUID
 * @param {String} productId - Product UUID
 * @returns {Promise<Boolean>} True if purchased
 */
const verifyPurchase = async (userId, productId) => {
  try {
    // Get user's orders
    const orders = await orderService.findByUserId(userId);
    
    // Check if any order contains this product
    for (const order of orders) {
      if (order.basket && Array.isArray(order.basket)) {
        const hasProduct = order.basket.some(item => item.product_id === productId);
        if (hasProduct && ['paid', 'confirmed', 'packed', 'shipped', 'delivered'].includes(order.status)) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying purchase:', error);
    return false;
  }
};

/**
 * Update review
 * @param {String} reviewId - Review UUID
 * @param {String} userId - User UUID (for authorization)
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated review object
 */
const updateReview = async (reviewId, userId, updateData) => {
  // Get existing review
  const review = await findById(reviewId);
  
  if (!review) {
    throw new Error('Review not found');
  }

  if (review.user_id !== userId) {
    throw new Error('Unauthorized to update this review');
  }

  const { rating, title, comment } = updateData;

  const updates = {
    updated_at: new Date().toISOString()
  };

  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    updates.rating = parseInt(rating);
  }

  if (title !== undefined) updates.title = title;
  if (comment !== undefined) updates.comment = comment;

  // Reset to pending if content changed
  if (rating !== undefined || title !== undefined || comment !== undefined) {
    updates.status = 'pending';
  }

  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', reviewId)
    .select()
    .single();
  
  if (error) throw error;

  // Recalculate product rating if rating changed
  if (rating !== undefined) {
    await updateProductRating(review.product_id);
  }
  
  return data;
};

/**
 * Delete review
 * @param {String} reviewId - Review UUID
 * @param {String} userId - User UUID (for authorization)
 * @returns {Promise<Object>} Deleted review object
 */
const deleteReview = async (reviewId, userId) => {
  const review = await findById(reviewId);
  
  if (!review) {
    throw new Error('Review not found');
  }

  if (review.user_id !== userId) {
    throw new Error('Unauthorized to delete this review');
  }

  const { data, error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .select()
    .single();
  
  if (error) throw error;

  // Recalculate product rating
  await updateProductRating(review.product_id);
  
  return data;
};

/**
 * Find review by ID
 * @param {String} id - Review UUID
 * @returns {Promise<Object|null>} Review object or null
 */
const findById = async (id) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Get reviews for a product
 * @param {String} productId - Product UUID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of review objects
 */
const getProductReviews = async (productId, filters = {}) => {
  let query = supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('status', 'approved') // Only show approved reviews
    .order('created_at', { ascending: false });

  if (filters.rating) {
    query = query.eq('rating', parseInt(filters.rating));
  }

  if (filters.verifiedOnly) {
    query = query.eq('verified_purchase', true);
  }

  if (filters.limit) {
    query = query.limit(parseInt(filters.limit));
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get user's reviews
 * @param {String} userId - User UUID
 * @returns {Promise<Array>} Array of review objects
 */
const getUserReviews = async (userId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * REQUIREMENT 3: Calculate and update product average rating
 * @param {String} productId - Product UUID
 * @returns {Promise<Object>} Rating statistics
 */
const updateProductRating = async (productId) => {
  // Get all approved reviews for this product
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('status', 'approved');
  
  if (error) throw error;

  if (!reviews || reviews.length === 0) {
    // No reviews, set rating to null
    await supabase
      .from('products')
      .update({ 
        rating: null,
        review_count: 0
      })
      .eq('id', productId);
    
    return { averageRating: null, totalReviews: 0 };
  }

  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  // Update product with new rating
  await supabase
    .from('products')
    .update({ 
      rating: parseFloat(averageRating.toFixed(2)),
      review_count: reviews.length
    })
    .eq('id', productId);

  return {
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalReviews: reviews.length
  };
};

/**
 * Get product rating statistics
 * @param {String} productId - Product UUID
 * @returns {Promise<Object>} Rating statistics
 */
const getProductRatingStats = async (productId) => {
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('status', 'approved');
  
  if (error) throw error;

  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  // Calculate average
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  // Calculate distribution
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(review => {
    distribution[review.rating]++;
  });

  return {
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalReviews: reviews.length,
    ratingDistribution: distribution
  };
};

/**
 * REQUIREMENT 4: Admin moderation - Get pending reviews
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of pending reviews
 */
const getPendingReviews = async (filters = {}) => {
  let query = supabase
    .from('reviews')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (filters.limit) {
    query = query.limit(parseInt(filters.limit));
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * REQUIREMENT 4: Admin moderation - Approve review
 * @param {String} reviewId - Review UUID
 * @param {String} adminId - Admin user ID
 * @returns {Promise<Object>} Updated review object
 */
const approveReview = async (reviewId, adminId) => {
  const review = await findById(reviewId);
  
  if (!review) {
    throw new Error('Review not found');
  }

  const { data, error } = await supabase
    .from('reviews')
    .update({
      status: 'approved',
      moderated_by: adminId,
      moderated_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .select()
    .single();
  
  if (error) throw error;

  // Recalculate product rating
  await updateProductRating(review.product_id);
  
  return data;
};

/**
 * REQUIREMENT 4: Admin moderation - Reject review
 * @param {String} reviewId - Review UUID
 * @param {String} adminId - Admin user ID
 * @returns {Promise<Object>} Updated review object
 */
const rejectReview = async (reviewId, adminId) => {
  const review = await findById(reviewId);
  
  if (!review) {
    throw new Error('Review not found');
  }

  const { data, error } = await supabase
    .from('reviews')
    .update({
      status: 'rejected',
      moderated_by: adminId,
      moderated_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .select()
    .single();
  
  if (error) throw error;

  // Recalculate product rating (rejected reviews don't count)
  await updateProductRating(review.product_id);
  
  return data;
};

/**
 * Get all reviews (admin only)
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of review objects
 */
const getAllReviews = async (filters = {}) => {
  let query = supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.productId) {
    query = query.eq('product_id', filters.productId);
  }

  if (filters.limit) {
    query = query.limit(parseInt(filters.limit));
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get review statistics (admin only)
 * @returns {Promise<Object>} Review statistics
 */
const getReviewStatistics = async () => {
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('status, rating');
  
  if (error) throw error;
  
  const stats = {
    total_reviews: reviews.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    average_rating: 0
  };

  let totalRating = 0;
  let approvedCount = 0;

  reviews.forEach(review => {
    if (review.status === 'pending') stats.pending++;
    else if (review.status === 'approved') {
      stats.approved++;
      totalRating += review.rating;
      approvedCount++;
    }
    else if (review.status === 'rejected') stats.rejected++;
  });

  if (approvedCount > 0) {
    stats.average_rating = parseFloat((totalRating / approvedCount).toFixed(2));
  }
  
  return stats;
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  findById,
  findByUserAndProduct,
  getProductReviews,
  getUserReviews,
  updateProductRating,
  getProductRatingStats,
  getPendingReviews,
  approveReview,
  rejectReview,
  getAllReviews,
  getReviewStatistics
};
