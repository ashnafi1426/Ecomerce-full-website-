/**
 * DEAL ROUTES
 * 
 * Routes for promotional deals and special offers.
 */

const express = require('express');
const router = express.Router();
const supabase = require('../../config/supabase');

// Get all deals
router.get('/', async (req, res, next) => {
  try {
    const { filter = 'all' } = req.query;
    
    console.log('[Deals] Fetching deals with filter:', filter);
    
    // Get all approved products with stock and original_price
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('approval_status', 'approved')
      .gt('stock', 0)
      .not('original_price', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('[Deals] Database error:', error);
      throw error;
    }
    
    console.log('[Deals] Found products:', products?.length || 0);
    
    // Filter products that have discounts (price < original_price)
    let deals = (products || []).filter(product => {
      try {
        const hasDiscount = product.original_price && 
                          product.price && 
                          parseFloat(product.price) < parseFloat(product.original_price);
        return hasDiscount;
      } catch (err) {
        console.error('[Deals] Error filtering product:', product.id, err);
        return false;
      }
    });
    
    console.log('[Deals] Deals after discount filter:', deals.length);
    
    // Apply time-based filters
    const now = new Date();
    
    if (filter === 'today') {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      deals = deals.filter(product => {
        if (!product.deal_start_time || !product.deal_end_time) return true;
        try {
          const startTime = new Date(product.deal_start_time);
          const endTime = new Date(product.deal_end_time);
          return startTime <= now && endTime >= now && endTime <= endOfDay;
        } catch (err) {
          return true;
        }
      });
    } else if (filter === 'week') {
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      deals = deals.filter(product => {
        if (!product.deal_start_time || !product.deal_end_time) return true;
        try {
          const startTime = new Date(product.deal_start_time);
          const endTime = new Date(product.deal_end_time);
          return startTime <= now && endTime <= endOfWeek;
        } catch (err) {
          return true;
        }
      });
    } else if (filter === 'month') {
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      deals = deals.filter(product => {
        if (!product.deal_start_time || !product.deal_end_time) return true;
        try {
          const startTime = new Date(product.deal_start_time);
          const endTime = new Date(product.deal_end_time);
          return startTime <= now && endTime <= endOfMonth;
        } catch (err) {
          return true;
        }
      });
    }
    
    // Limit to 50 deals
    deals = deals.slice(0, 50);
    
    console.log('[Deals] Final deals count:', deals.length);
    
    res.status(200).json({
      success: true,
      count: deals.length,
      deals: deals
    });
  } catch (error) {
    console.error('[Deals] Error in deals route:', error);
    // Return empty deals instead of error to prevent frontend crash
    res.status(200).json({
      success: true,
      count: 0,
      deals: [],
      message: 'No deals available at the moment'
    });
  }
});

module.exports = router;
