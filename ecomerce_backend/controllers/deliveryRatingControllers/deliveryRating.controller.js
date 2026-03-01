/**
 * DELIVERY RATING CONTROLLER
 * 
 * HTTP request handlers for delivery rating endpoints.
 * Handles rating submission, retrieval, and analytics.
 * 
 * Requirements: 3.1, 3.6, 3.9, 3.12
 */

const deliveryRatingService = require('../../services/ratingServices/deliveryRating.service');

/**
 * Submit delivery rating for order
 * POST /api/v1/delivery-ratings
 */
const submitDeliveryRating = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { orderId, ...ratingData } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }
    
    const rating = await deliveryRatingService.submitDeliveryRating(orderId, customerId, ratingData);
    
    res.status(201).json({
      success: true,
      message: 'Delivery rating submitted successfully',
      data: rating
    });
  } catch (error) {
    console.error('Submit delivery rating error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('Unauthorized') ||
        error.message.includes('already submitted') ||
        error.message.includes('expired') ||
        error.message.includes('only rate delivered')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to submit delivery rating',
      error: error.message
    });
  }
};

/**
 * Get delivery rating for order
 * GET /api/v1/orders/:orderId/delivery-rating
 */
const getOrderDeliveryRating = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const ratings = await deliveryRatingService.getOrderDeliveryRating(orderId);
    
    res.status(200).json({
      success: true,
      data: ratings
    });
  } catch (error) {
    console.error('Get order delivery rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve delivery rating',
      error: error.message
    });
  }
};

/**
 * Get seller delivery metrics
 * GET /api/v1/sellers/:sellerId/delivery-metrics
 */
const getSellerDeliveryMetrics = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    const metrics = await deliveryRatingService.getSellerDeliveryMetrics(sellerId);
    
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get seller delivery metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve seller delivery metrics',
      error: error.message
    });
  }
};

/**
 * Get seller rating distribution
 * GET /api/v1/sellers/:sellerId/rating-distribution
 */
const getSellerRatingDistribution = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    const distribution = await deliveryRatingService.getSellerRatingDistribution(sellerId);
    
    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Get seller rating distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve rating distribution',
      error: error.message
    });
  }
};

/**
 * Get delivery rating analytics (Manager only)
 * GET /api/v1/delivery-ratings/analytics
 */
const getDeliveryRatingAnalytics = async (req, res) => {
  try {
    const filters = {
      sellerId: req.query.sellerId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const analytics = await deliveryRatingService.getDeliveryRatingAnalytics(filters);
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get delivery rating analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve delivery rating analytics',
      error: error.message
    });
  }
};

/**
 * Get flagged ratings (Manager only)
 * GET /api/v1/delivery-ratings/flagged
 */
const getFlaggedRatings = async (req, res) => {
  try {
    const filters = {
      sellerId: req.query.sellerId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const flaggedRatings = await deliveryRatingService.getFlaggedRatings(filters);
    
    res.status(200).json({
      success: true,
      data: flaggedRatings
    });
  } catch (error) {
    console.error('Get flagged ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve flagged ratings',
      error: error.message
    });
  }
};

/**
 * Flag a rating for review (Manager only)
 * PUT /api/v1/delivery-ratings/:ratingId/flag
 */
const flagRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { reason } = req.body;
    
    await deliveryRatingService.flagLowRating(ratingId, reason);
    
    res.status(200).json({
      success: true,
      message: 'Rating flagged for review'
    });
  } catch (error) {
    console.error('Flag rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to flag rating',
      error: error.message
    });
  }
};

module.exports = {
  submitDeliveryRating,
  getOrderDeliveryRating,
  getSellerDeliveryMetrics,
  getSellerRatingDistribution,
  getDeliveryRatingAnalytics,
  getFlaggedRatings,
  flagRating
};
