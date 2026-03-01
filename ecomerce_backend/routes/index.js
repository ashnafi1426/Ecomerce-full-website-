/**
 * Central router that imports and combines all route modules.
 * This follows the organized folder structure pattern.
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Safe route loading function
function safeRequire(routePath, routeName) {
  try {
    const fullPath = path.join(__dirname, routePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  Route file not found: ${routePath} (${routeName})`);
      return null;
    }
    
    const routeModule = require(routePath);
    
    // Validate that it's a proper router/middleware
    if (!routeModule || (typeof routeModule !== 'function' && typeof routeModule !== 'object')) {
      console.warn(`⚠️  Invalid route module: ${routePath} (${routeName}) - not a function or object`);
      return null;
    }
    
    console.log(`✅ Loaded route: ${routeName}`);
    return routeModule;
  } catch (error) {
    console.warn(`⚠️  Failed to load route: ${routePath} (${routeName}) - ${error.message}`);
    return null;
  }
}

// Import routes from organized folders with safe loading
const authRouter = safeRequire('./authRoutes/auth.routes.js', 'Auth Routes');
const userRouter = safeRequire('./userRoutes/user.routes.js', 'User Routes');
const productRouter = safeRequire('./productRoutes/product.routes.js', 'Product Routes');
const orderRouter = safeRequire('./orderRoutes/order.routes.js', 'Order Routes');
const adminRouter = safeRequire('./adminRoutes/admin.routes.js', 'Admin Routes');
const categoryRouter = safeRequire('./categoryRoutes/category.routes.js', 'Category Routes');
const returnRouter = safeRequire('./returnRoutes/return.routes.js', 'Return Routes');
const addressRouter = safeRequire('./addressRoutes/address.routes.js', 'Address Routes');
const auditLogRouter = safeRequire('./auditLogRoutes/auditLog.routes.js', 'Audit Log Routes');
const cartRouter = safeRequire('./cartRoutes/cart.routes.js', 'Cart Routes');
const paymentRouter = safeRequire('./paymentRoutes/payment.routes.js', 'Payment Routes');
const reviewRouter = safeRequire('./reviewRoutes/review.routes.js', 'Review Routes');
const analyticsRouter = safeRequire('./analyticsRoutes/analytics.routes.js', 'Analytics Routes');
const commissionRouter = safeRequire('./commissionRoutes/commission.routes.js', 'Commission Routes');
const sellerBalanceRouter = safeRequire('./sellerBalanceRoutes/sellerBalance.routes.js', 'Seller Balance Routes');
const subOrderRouter = safeRequire('./subOrderRoutes/subOrder.routes.js', 'Sub Order Routes');

// Phase 5: Multi-vendor feature routes
const sellerRouter = safeRequire('./sellerRoutes/seller.routes.js', 'Seller Routes');
const managerRouter = safeRequire('./managerRoutes/manager.routes.js', 'Manager Routes');
const notificationRouter = safeRequire('./notificationRoutes/notification.routes.js', 'Notification Routes');
const disputeRouter = safeRequire('./disputeRoutes/dispute.routes.js', 'Dispute Routes');

// Phase 6: Product Variants System
const variantRouter = safeRequire('./variantRoutes/variant.routes.js', 'Variant Routes');

// Discount and Promotion System
const couponRouter = safeRequire('./couponRoutes/coupon.routes.js', 'Coupon Routes');
const promotionRouter = safeRequire('./promotionRoutes/promotion.routes.js', 'Promotion Routes');

// Delivery Rating System
const deliveryRatingRouter = safeRequire('./deliveryRatingRoutes/deliveryRating.routes.js', 'Delivery Rating Routes');

// Replacement Process System
const replacementRouter = safeRequire('./replacementRoutes/replacement.routes.js', 'Replacement Routes');

// Enhanced Refund Process System
const refundRouter = safeRequire('./refundRoutes/enhancedRefund.routes.js', 'Enhanced Refund Routes');

// Guest Checkout System (Amazon-style)
const guestRouter = safeRequire('./guestRoutes/guest.routes.js', 'Guest Routes');

// Enhanced Inventory Management System (Amazon-style)
const inventoryEnhancedRouter = safeRequire('./inventoryRoutes/inventory.routes.js', 'Inventory Routes');

// Amazon-style Product Approval Workflow
const approvalRouter = safeRequire('./approvalRoutes/approval.routes.js', 'Approval Routes');

// Phase 2: Seller Payment System
const sellerPaymentRouter = safeRequire('./paymentRoutes/seller-payment.routes.js', 'Seller Payment Routes');

// Stripe Payment System
const stripePaymentRouter = safeRequire('./paymentRoutes/stripe-payment.routes.js', 'Stripe Payment Routes');

// Wishlist System
const wishlistRouter = safeRequire('./wishlistRoutes/wishlist.routes.js', 'Wishlist Routes');

// Live Chat System
const chatRouter = safeRequire('./chatRoutes/chat.routes.js', 'Chat Routes');

// Deals System
const dealRouter = safeRequire('./dealRoutes/deal.routes.js', 'Deal Routes');

// Recommendations System
const recommendationRouter = safeRequire('./recommendationRoutes/recommendation.routes.js', 'Recommendation Routes');

// Browsing History System
const browsingHistoryRouter = safeRequire('./browsingHistoryRoutes/browsing-history.routes.js', 'Browsing History Routes');

// Support System
const supportRouter = safeRequire('./supportRoutes/support.routes.js', 'Support Routes');

// Safe route mounting function
function safeMount(router, path, routeModule, routeName) {
  if (routeModule) {
    try {
      router.use(path, routeModule);
      console.log(`✅ Mounted route: ${routeName} at ${path || '/'}`);
    } catch (error) {
      console.warn(`⚠️  Failed to mount route: ${routeName} at ${path || '/'} - ${error.message}`);
    }
  } else {
    console.log(`⏭️  Skipped route: ${routeName} (not available)`);
  }
}

// Add routes to the main router with safe mounting
safeMount(router, '/api/auth', authRouter, 'Auth Routes');
safeMount(router, '', userRouter, 'User Routes');
safeMount(router, '/api', productRouter, 'Product Routes');
safeMount(router, '', orderRouter, 'Order Routes');
safeMount(router, '/api/admin', adminRouter, 'Admin Routes');
safeMount(router, '/api/categories', categoryRouter, 'Category Routes');
safeMount(router, '', returnRouter, 'Return Routes');
safeMount(router, '', addressRouter, 'Address Routes');
safeMount(router, '', auditLogRouter, 'Audit Log Routes');
safeMount(router, '/api/cart', cartRouter, 'Cart Routes');
safeMount(router, '/api/payments', paymentRouter, 'Payment Routes');
safeMount(router, '/api/reviews', reviewRouter, 'Review Routes');
safeMount(router, '', analyticsRouter, 'Analytics Routes');
safeMount(router, '/api', commissionRouter, 'Commission Routes');
safeMount(router, '', sellerBalanceRouter, 'Seller Balance Routes');
safeMount(router, '', subOrderRouter, 'Sub Order Routes');

// Phase 5: Multi-vendor feature routes
safeMount(router, '', sellerRouter, 'Seller Routes');
safeMount(router, '', managerRouter, 'Manager Routes');
safeMount(router, '/api/notifications', notificationRouter, 'Notification Routes');
safeMount(router, '', disputeRouter, 'Dispute Routes');

// Phase 6: Product Variants System
safeMount(router, '/api/variants', variantRouter, 'Variant Routes');

// Discount and Promotion System
safeMount(router, '/api/coupons', couponRouter, 'Coupon Routes');
safeMount(router, '/api/promotions', promotionRouter, 'Promotion Routes');

// Delivery Rating System
safeMount(router, '/api/delivery-ratings', deliveryRatingRouter, 'Delivery Rating Routes');

// Replacement Process System
safeMount(router, '/api/replacements', replacementRouter, 'Replacement Routes');

// Enhanced Refund Process System
safeMount(router, '/api/refunds', refundRouter, 'Enhanced Refund Routes');

// Guest Checkout System (Amazon-style)
safeMount(router, '/api/guest', guestRouter, 'Guest Routes');

// Enhanced Inventory Management System (Amazon-style)
safeMount(router, '/api/inventory', inventoryEnhancedRouter, 'Inventory Routes');

// Amazon-style Product Approval Workflow
safeMount(router, '/api/approvals', approvalRouter, 'Approval Routes');

// Phase 2: Seller Payment System
safeMount(router, '/api/seller', sellerPaymentRouter, 'Seller Payment Routes');

// Stripe Payment System
safeMount(router, '/api/stripe', stripePaymentRouter, 'Stripe Payment Routes');

// Wishlist System
safeMount(router, '/api/wishlist', wishlistRouter, 'Wishlist Routes');

// Live Chat System
safeMount(router, '/api/chat', chatRouter, 'Chat Routes');

// Deals System
safeMount(router, '/api/deals', dealRouter, 'Deal Routes');

// Recommendations System
safeMount(router, '/api/recommendations', recommendationRouter, 'Recommendation Routes');

// Browsing History System
safeMount(router, '/api/browsing-history', browsingHistoryRouter, 'Browsing History Routes');

// Support System
safeMount(router, '/api/support', supportRouter, 'Support Routes');

// Export the router
module.exports = router;
