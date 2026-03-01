/**
 * RECOMMENDATION ROUTES
 * 
 * Routes for personalized product recommendations.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const supabase = require('../../config/supabase');

// Get personalized recommendations for authenticated user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user's order history to find categories they've purchased from
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .limit(10);
    
    if (ordersError) throw ordersError;
    
    let categoryIds = [];
    
    if (orders && orders.length > 0) {
      // Get order items to find product categories
      const orderIds = orders.map(o => o.id);
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id')
        .in('order_id', orderIds);
      
      if (orderItems && orderItems.length > 0) {
        const productIds = orderItems.map(item => item.product_id);
        const { data: products } = await supabase
          .from('products')
          .select('category_id')
          .in('id', productIds);
        
        if (products) {
          categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))];
        }
      }
    }
    
    // Build recommendation query
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'approved')
      .gt('stock', 0);
    
    // If we have category preferences, prioritize those
    if (categoryIds.length > 0) {
      query = query.in('category_id', categoryIds);
    }
    
    // Get top-rated products
    query = query
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);
    
    const { data: recommendations, error } = await query;
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      count: recommendations?.length || 0,
      recommendations: recommendations || []
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
