const supabase = require('../../config/supabase');

/**
 * Review Controller
 * Handles product reviews and ratings
 */

// Get all reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy = 'recent' } = req.query;
    const offset = (page - 1) * limit;

    // Build query with user join
    let query = supabase
      .from('product_reviews')
      .select(`
        id,
        rating,
        title,
        review_text,
        verified_purchase,
        helpful_count,
        created_at,
        user:users!user_id(id, display_name, email)
      `)
      .eq('product_id', productId)
      .range(offset, offset + limit - 1);

    // Apply sorting
    if (sortBy === 'helpful') {
      query = query.order('helpful_count', { ascending: false }).order('created_at', { ascending: false });
    } else if (sortBy === 'rating_high') {
      query = query.order('rating', { ascending: false }).order('created_at', { ascending: false });
    } else if (sortBy === 'rating_low') {
      query = query.order('rating', { ascending: true }).order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: reviews, error, count } = await query;

    if (error) throw error;

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('product_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);

    if (countError) throw countError;

    const total = totalCount || 0;
    const totalPages = Math.ceil(total / limit);

    // Format reviews
    const formattedReviews = reviews?.map(review => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      review_text: review.review_text,
      verified_purchase: review.verified_purchase,
      helpful_count: review.helpful_count,
      created_at: review.created_at,
      user_id: review.user?.id,
      user_name: review.user?.display_name || 'Anonymous',
      user_email: review.user?.email
    })) || [];

    res.json({
      success: true,
      reviews: formattedReviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// Get review summary/statistics for a product
exports.getReviewSummary = async (req, res) => {
  try {
    const { productId } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select('average_rating, total_reviews, rating_distribution')
      .eq('id', productId)
      .single();

    if (error || !product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Calculate percentages
    const distribution = product.rating_distribution || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    const total = product.total_reviews || 0;
    
    const percentages = {};
    for (let i = 1; i <= 5; i++) {
      percentages[i] = total > 0 ? Math.round((distribution[i] / total) * 100) : 0;
    }

    res.json({
      success: true,
      summary: {
        averageRating: parseFloat(product.average_rating) || 0,
        totalReviews: total,
        distribution,
        percentages
      }
    });
  } catch (error) {
    console.error('Error fetching review summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review summary',
      error: error.message
    });
  }
};

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, reviewText } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Review title is required'
      });
    }

    if (!reviewText || reviewText.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Review text must be at least 10 characters'
      });
    }

    // Check if user has purchased this product
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, order_items!inner(product_id)')
      .eq('user_id', userId)
      .eq('order_items.product_id', productId)
      .eq('status', 'delivered');

    if (orderError) throw orderError;

    const verifiedPurchase = orders && orders.length > 0;

    // Insert review
    const { data: review, error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: productId,
        user_id: userId,
        rating: rating,
        title: title.trim(),
        review_text: reviewText.trim(),
        verified_purchase: verifiedPurchase
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this product'
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message
    });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, reviewText } = req.body;
    const userId = req.user.id;

    // Validate input
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if review belongs to user
    const { data: existingReview, error: checkError } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('id', reviewId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to update it'
      });
    }

    // Build update object
    const updates = {
      updated_at: new Date().toISOString()
    };
    if (rating) updates.rating = rating;
    if (title) updates.title = title.trim();
    if (reviewText) updates.review_text = reviewText.trim();

    // Update review
    const { data: review, error } = await supabase
      .from('product_reviews')
      .update(updates)
      .eq('id', reviewId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Check if review belongs to user
    const { data: existingReview, error: checkError } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('id', reviewId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to delete it'
      });
    }

    // Delete review
    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

// Mark review as helpful
exports.markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Check if user already voted
    const { data: existingVote, error: checkError } = await supabase
      .from('review_helpful_votes')
      .select('*')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      // Remove vote (toggle)
      const { error } = await supabase
        .from('review_helpful_votes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId);

      if (error) throw error;

      return res.json({
        success: true,
        message: 'Helpful vote removed',
        action: 'removed'
      });
    }

    // Add vote
    const { error } = await supabase
      .from('review_helpful_votes')
      .insert({
        review_id: reviewId,
        user_id: userId
      });

    if (error) throw error;

    res.json({
      success: true,
      message: 'Review marked as helpful',
      action: 'added'
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark review as helpful',
      error: error.message
    });
  }
};

// Check if user can review product
exports.canReviewProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Check if user has purchased
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, order_items!inner(product_id)')
      .eq('user_id', userId)
      .eq('order_items.product_id', productId)
      .eq('status', 'delivered');

    if (orderError) throw orderError;

    const hasPurchased = orders && orders.length > 0;

    // Check if user has already reviewed
    const { data: review, error: reviewError } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    const hasReviewed = !!review;

    res.json({
      success: true,
      canReview: !hasReviewed,
      hasPurchased,
      hasReviewed
    });
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check review eligibility',
      error: error.message
    });
  }
};
