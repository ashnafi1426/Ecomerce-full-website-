/**
 * SELLER ROUTES
 * 
 * Routes for seller-specific operations.
 */

const express = require('express');
const router = express.Router();
const sellerController = require('../../controllers/sellerControllers/seller.controller');
const sellerOrderController = require('../../controllers/sellerControllers/seller-order.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireSeller, requireAnyRole } = require('../../middlewares/role.middleware');

// ===== PUBLIC ROUTES =====

// Public: Browse all sellers (no authentication required)
router.get('/api/sellers/browse', async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    const { limit = 50, search } = req.query;
    
    let query = supabase
      .from('users')
      .select('id, display_name, email, business_name, created_at')
      .eq('role', 'seller')
      .eq('status', 'active');
    
    // Add search if provided
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,business_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    query = query.order('created_at', { ascending: false }).limit(parseInt(limit));
    
    const { data: sellers, error } = await query;
    
    if (error) throw error;
    
    // Get product counts for each seller
    const sellersWithStats = await Promise.all(
      (sellers || []).map(async (seller) => {
        const { data: products } = await supabase
          .from('products')
          .select('id', { count: 'exact' })
          .eq('seller_id', seller.id)
          .eq('approval_status', 'approved');
        
        return {
          ...seller,
          store_name: seller.business_name || seller.display_name,
          total_products: products?.length || 0
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: sellersWithStats.length,
      data: sellersWithStats
    });
  } catch (error) {
    next(error);
  }
});

// ===== AUTHENTICATED ROUTES =====

// Seller registration (authenticated users can upgrade to seller)
router.post('/api/seller/register', authenticate, sellerController.registerSeller);

// Seller profile and dashboard (seller only)
router.get('/api/seller/profile', authenticate, requireSeller, sellerController.getProfile);
router.get('/api/seller/dashboard', authenticate, requireSeller, sellerController.getDashboardStats);
router.get('/api/seller/dashboard/stats', authenticate, requireSeller, sellerController.getDashboardStats);

// Seller payment routes - REMOVED: Now handled by seller-payment.routes.js
// router.get('/api/seller/payouts/balance', authenticate, requireSeller, sellerController.getPayoutBalance);
// router.get('/api/seller/earnings', authenticate, requireSeller, sellerController.getEarnings);
// router.get('/api/seller/payouts', authenticate, requireSeller, sellerController.getPayouts);
// router.post('/api/seller/payouts/request', authenticate, requireSeller, sellerController.requestPayout);
// router.get('/api/seller/payment-account', authenticate, requireSeller, sellerController.getPaymentAccount);

// Seller products (seller only) - Get seller's products
router.get('/api/seller/products', authenticate, requireSeller, async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { limit, sort, status } = req.query;
    const supabase = require('../../config/supabase');
    
    let query = supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    // Handle sorting
    if (sort) {
      const isDescending = sort.startsWith('-');
      const field = isDescending ? sort.substring(1) : sort;
      query = query.order(field === 'createdAt' ? 'created_at' : field, { ascending: !isDescending });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const { data: products, error } = await query;
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      count: products?.length || 0,
      products: products || []
    });
  } catch (error) {
    next(error);
  }
});

// Seller sub-orders (seller only) - Get orders for seller's products
router.get('/api/seller/sub-orders', authenticate, requireSeller, async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { limit, sort, fulfillment_status } = req.query;
    const supabase = require('../../config/supabase');
    
    let query = supabase
      .from('sub_orders')
      .select(`
        *,
        orders!inner (
          id,
          created_at,
          shipping_address,
          status
        )
      `)
      .eq('seller_id', sellerId);
    
    if (fulfillment_status) {
      query = query.eq('fulfillment_status', fulfillment_status);
    }
    
    // Handle sorting
    if (sort) {
      const isDescending = sort.startsWith('-');
      const field = isDescending ? sort.substring(1) : sort;
      query = query.order(field === 'createdAt' ? 'created_at' : field, { ascending: !isDescending });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const { data: subOrders, error } = await query;
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      count: subOrders?.length || 0,
      orders: subOrders || []
    });
  } catch (error) {
    next(error);
  }
});

// ===== SELLER ORDER MANAGEMENT ROUTES (Phase 1) =====
// Get all orders for seller
router.get('/api/seller/orders', authenticate, requireSeller, sellerOrderController.getOrders);

// Get single order details
router.get('/api/seller/orders/:id', authenticate, requireSeller, sellerOrderController.getOrderById);

// Update order status
router.put('/api/seller/orders/:id/status', authenticate, requireSeller, sellerOrderController.updateOrderStatus);

// Add shipping information
router.put('/api/seller/orders/:id/shipping', authenticate, requireSeller, sellerOrderController.addShippingInfo);

// Seller documents (seller only)
router.post('/api/seller/documents', authenticate, requireSeller, sellerController.uploadDocument);
router.get('/api/seller/documents', authenticate, requireSeller, sellerController.getDocuments);

// Seller performance (seller only)
router.get('/api/seller/performance', authenticate, requireSeller, sellerController.getPerformance);

// Seller earnings and payouts - REMOVED: Now handled by seller-payment.routes.js
// router.get('/api/seller/earnings', authenticate, requireSeller, sellerController.getEarnings);
// router.post('/api/seller/payout', authenticate, requireSeller, sellerController.requestPayout);
// router.get('/api/seller/payouts', authenticate, requireSeller, sellerController.getPayoutRequests);

// Seller inventory (seller only) - Get inventory for seller's products
router.get('/api/seller/inventory', authenticate, requireSeller, async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const supabase = require('../../config/supabase');
    
    // Get seller's products with inventory data
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        sku,
        price,
        status,
        image_url,
        created_at,
        inventory (
          quantity,
          reserved_quantity,
          low_stock_threshold,
          updated_at
        )
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Calculate available quantity for each product
    const productsWithAvailability = (products || []).map(product => ({
      ...product,
      inventory: product.inventory ? {
        ...product.inventory,
        available_quantity: (product.inventory.quantity || 0) - (product.inventory.reserved_quantity || 0)
      } : {
        quantity: 0,
        reserved_quantity: 0,
        available_quantity: 0,
        low_stock_threshold: 10
      }
    }));
    
    res.status(200).json({
      success: true,
      count: productsWithAvailability.length,
      products: productsWithAvailability
    });
  } catch (error) {
    next(error);
  }
});

// Seller returns (seller only) - Get returns for seller's products
router.get('/api/seller/returns', authenticate, requireSeller, async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const supabase = require('../../config/supabase');
    
    // Get returns for seller - returns table has seller_id column
    const { data: returns, error } = await supabase
      .from('returns')
      .select(`
        *,
        orders (id, created_at, amount, status),
        users (display_name, email)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      count: returns?.length || 0,
      returns: returns || []
    });
  } catch (error) {
    next(error);
  }
});

// Seller reviews (seller only) - Get reviews for seller's products
router.get('/api/seller/reviews', authenticate, requireSeller, async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const supabase = require('../../config/supabase');
    
    // Get reviews for seller's products - fix ambiguous relationship
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        products!inner (seller_id, title, image_url),
        users!reviews_user_id_fkey (display_name, email)
      `)
      .eq('products.seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      count: reviews?.length || 0,
      reviews: reviews || []
    });
  } catch (error) {
    next(error);
  }
});

// Seller disputes (seller only) - Get disputes involving seller
router.get('/api/seller/disputes', authenticate, requireSeller, async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const supabase = require('../../config/supabase');
    
    // Get disputes where seller is involved
    const { data: disputes, error } = await supabase
      .from('disputes')
      .select(`
        *,
        orders (id, created_at, amount, status),
        users!disputes_customer_id_fkey (display_name, email)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      count: disputes?.length || 0,
      disputes: disputes || []
    });
  } catch (error) {
    next(error);
  }
});

// Seller commissions (seller only) - Get commission records
router.get('/api/seller/commissions', authenticate, requireSeller, async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const supabase = require('../../config/supabase');
    
    // Get commission records from seller_earnings
    const { data: commissions, error } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      count: commissions?.length || 0,
      commissions: commissions || []
    });
  } catch (error) {
    next(error);
  }
});

// Seller settings (seller only) - Get/Update seller settings
router.get('/api/seller/settings', authenticate, requireSeller, async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const supabase = require('../../config/supabase');
    
    // Get seller settings from user profile - only select existing columns
    const { data: settings, error } = await supabase
      .from('users')
      .select('business_name, business_address, tax_id, email, display_name, phone')
      .eq('id', sellerId)
      .single();
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      settings: settings || {}
    });
  } catch (error) {
    next(error);
  }
});

router.put('/api/seller/settings', authenticate, requireSeller, async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const supabase = require('../../config/supabase');
    const { business_name, business_address, tax_id, display_name, phone } = req.body;
    
    // Update seller settings - only update existing columns
    const { data: settings, error } = await supabase
      .from('users')
      .update({
        business_name,
        business_address,
        tax_id,
        display_name,
        phone
      })
      .eq('id', sellerId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    next(error);
  }
});

// Seller messages (seller only) - Get messages (placeholder for future implementation)
router.get('/api/seller/messages', authenticate, requireSeller, async (req, res, next) => {
  try {
    // TODO: Implement proper messaging system
    // For now, return empty array to prevent 404 errors
    res.status(200).json({
      success: true,
      count: 0,
      messages: [],
      note: 'Messaging system not yet implemented'
    });
  } catch (error) {
    next(error);
  }
});

// Seller invoices (seller only) - Get invoices (placeholder for future implementation)
router.get('/api/seller/invoices', authenticate, requireSeller, async (req, res, next) => {
  try {
    // TODO: Implement proper invoice system
    // For now, return empty array to prevent 404 errors
    res.status(200).json({
      success: true,
      count: 0,
      invoices: [],
      note: 'Invoice system not yet implemented'
    });
  } catch (error) {
    next(error);
  }
});

// Seller analytics endpoints (placeholders)
router.get('/api/seller/analytics', authenticate, requireSeller, async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const supabase = require('../../config/supabase');
    
    // Get basic analytics
    const { data: orders, error: ordersError } = await supabase
      .from('sub_orders')
      .select('total_amount, created_at')
      .eq('seller_id', sellerId);
    
    if (ordersError) throw ordersError;
    
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const totalOrders = orders?.length || 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        period: req.query.period || 'all-time'
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/api/seller/analytics/revenue', authenticate, requireSeller, async (req, res, next) => {
  try {
    // TODO: Implement revenue analytics
    res.status(200).json({
      success: true,
      data: {
        totalRevenue: 0,
        period: req.query.period || 'last-3-months'
      },
      note: 'Analytics not yet implemented'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/api/seller/analytics/sales', authenticate, requireSeller, async (req, res, next) => {
  try {
    // TODO: Implement sales analytics
    res.status(200).json({
      success: true,
      data: {
        totalSales: 0,
        period: req.query.period || 'last-3-months'
      },
      note: 'Analytics not yet implemented'
    });
  } catch (error) {
    next(error);
  }
});

// Seller payout balance endpoint - REMOVED: Now handled by seller-payment.routes.js
// router.get('/api/seller/payouts/balance', authenticate, requireSeller, async (req, res, next) => {
// });

// Admin/Manager routes for seller management
router.get('/api/sellers', authenticate, requireAnyRole(['admin', 'manager']), sellerController.getAllSellers);
router.get('/api/sellers/:sellerId', authenticate, requireAnyRole(['admin', 'manager']), sellerController.getSellerById);
router.post('/api/sellers', authenticate, requireAnyRole(['admin']), sellerController.createSeller);
router.put('/api/sellers/:sellerId', authenticate, requireAnyRole(['admin']), sellerController.updateSeller);
router.delete('/api/sellers/:sellerId', authenticate, requireAnyRole(['admin']), sellerController.deleteSeller);
router.put('/api/sellers/:sellerId/status', authenticate, requireAnyRole(['admin']), sellerController.updateSellerStatus);
router.post('/api/sellers/:sellerId/verify', authenticate, requireAnyRole(['admin', 'manager']), sellerController.verifySeller);
router.post('/api/sellers/documents/:documentId/verify', authenticate, requireAnyRole(['admin', 'manager']), sellerController.verifyDocument);

module.exports = router;
