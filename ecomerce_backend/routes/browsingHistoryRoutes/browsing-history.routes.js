/**
 * BROWSING HISTORY ROUTES
 * 
 * Routes for tracking and retrieving user browsing history.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const supabase = require('../../config/supabase');

// Get user's browsing history
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;
    
    const { data: history, error } = await supabase
      .from('browsing_history')
      .select(`
        *,
        product:products (
          id,
          title,
          price,
          image_url,
          rating,
          status
        )
      `)
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) throw error;
    
    // Filter out products that are no longer available
    const filteredHistory = (history || []).filter(item => 
      item.product && item.product.status === 'approved'
    );
    
    res.status(200).json({
      success: true,
      count: filteredHistory.length,
      history: filteredHistory
    });
  } catch (error) {
    next(error);
  }
});

// Add product to browsing history
router.post('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;
    
    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Check if already in history
    const { data: existing } = await supabase
      .from('browsing_history')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', product_id)
      .single();
    
    if (existing) {
      // Update viewed_at timestamp
      const { error: updateError } = await supabase
        .from('browsing_history')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', existing.id);
      
      if (updateError) throw updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('browsing_history')
        .insert({
          user_id: userId,
          product_id,
          viewed_at: new Date().toISOString()
        });
      
      if (insertError) throw insertError;
    }
    
    res.status(200).json({
      success: true,
      message: 'Browsing history updated'
    });
  } catch (error) {
    next(error);
  }
});

// Clear browsing history
router.delete('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const { error } = await supabase
      .from('browsing_history')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      message: 'Browsing history cleared'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
