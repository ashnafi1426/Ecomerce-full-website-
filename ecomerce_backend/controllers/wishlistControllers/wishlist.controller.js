const { supabase } = require('../../config/supabase');

const wishlistController = {
  // Get user's wishlist
  getWishlist: async (req, res) => {
    try {
      console.log('🔍 Getting wishlist for user:', req.user.id);
      
      const { data: wishlistItems, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          product_id,
          created_at,
          products (
            id,
            name,
            price,
            image,
            rating,
            reviews_count,
            status,
            stock_quantity
          )
        `)
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching wishlist:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch wishlist',
          error: error.message
        });
      }

      console.log('✅ Wishlist fetched successfully:', wishlistItems?.length || 0, 'items');
      
      res.json({
        success: true,
        wishlist: wishlistItems || [],
        count: wishlistItems?.length || 0
      });
    } catch (error) {
      console.error('❌ Error in getWishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Add product to wishlist
  addToWishlist: async (req, res) => {
    try {
      const { productId } = req.body;
      const userId = req.user.id;

      console.log('🔍 Adding to wishlist:', { userId, productId });

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
      }

      // Check if product exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, status')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        console.error('❌ Product not found:', productError);
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      if (product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Product is not available'
        });
      }

      // Add to wishlist (will ignore if already exists due to unique constraint)
      const { data: wishlistItem, error } = await supabase
        .from('wishlist')
        .insert({
          user_id: userId,
          product_id: productId
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return res.status(409).json({
            success: false,
            message: 'Product is already in your wishlist'
          });
        }
        console.error('❌ Error adding to wishlist:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to add to wishlist',
          error: error.message
        });
      }

      console.log('✅ Added to wishlist successfully:', wishlistItem);
      
      res.status(201).json({
        success: true,
        message: 'Product added to wishlist',
        wishlistItem
      });
    } catch (error) {
      console.error('❌ Error in addToWishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Remove product from wishlist
  removeFromWishlist: async (req, res) => {
    try {
      const { productId } = req.params;
      const userId = req.user.id;

      console.log('🔍 Removing from wishlist:', { userId, productId });

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
      }

      const { data: deletedItem, error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error removing from wishlist:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to remove from wishlist',
          error: error.message
        });
      }

      if (!deletedItem) {
        return res.status(404).json({
          success: false,
          message: 'Product not found in wishlist'
        });
      }

      console.log('✅ Removed from wishlist successfully:', deletedItem);
      
      res.json({
        success: true,
        message: 'Product removed from wishlist'
      });
    } catch (error) {
      console.error('❌ Error in removeFromWishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Clear entire wishlist
  clearWishlist: async (req, res) => {
    try {
      const userId = req.user.id;

      console.log('🔍 Clearing wishlist for user:', userId);

      const { data: deletedItems, error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('❌ Error clearing wishlist:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to clear wishlist',
          error: error.message
        });
      }

      console.log('✅ Wishlist cleared successfully:', deletedItems?.length || 0, 'items removed');
      
      res.json({
        success: true,
        message: 'Wishlist cleared successfully',
        removedCount: deletedItems?.length || 0
      });
    } catch (error) {
      console.error('❌ Error in clearWishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Check if product is in wishlist
  checkWishlistStatus: async (req, res) => {
    try {
      const { productId } = req.params;
      const userId = req.user.id;

      console.log('🔍 Checking wishlist status:', { userId, productId });

      const { data: wishlistItem, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error checking wishlist status:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to check wishlist status',
          error: error.message
        });
      }

      const isInWishlist = !!wishlistItem;
      
      console.log('✅ Wishlist status checked:', isInWishlist);
      
      res.json({
        success: true,
        isInWishlist
      });
    } catch (error) {
      console.error('❌ Error in checkWishlistStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get wishlist count
  getWishlistCount: async (req, res) => {
    try {
      const userId = req.user.id;

      console.log('🔍 Getting wishlist count for user:', userId);

      const { count, error } = await supabase
        .from('wishlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error getting wishlist count:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to get wishlist count',
          error: error.message
        });
      }

      console.log('✅ Wishlist count retrieved:', count);
      
      res.json({
        success: true,
        count: count || 0
      });
    } catch (error) {
      console.error('❌ Error in getWishlistCount:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

module.exports = wishlistController;