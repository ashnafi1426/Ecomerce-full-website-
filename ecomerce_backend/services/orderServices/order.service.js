/**
 * ORDER SERVICE
 * 
 * Business logic layer for order operations.
 * Handles order creation, status lifecycle, and management.
 */

const supabase = require('../../config/supabase');
const cartService = require('../cartServices/cart.service');
const inventoryService = require('../inventoryServices/inventory.service');
const variantInventoryService = require('../variantServices/variantInventory.service');
const commissionService = require('../commissionServices/commission.service');
const sellerBalanceService = require('../sellerBalanceServices/sellerBalance.service');
const subOrderService = require('../subOrderServices/subOrder.service');
const discountCalculatorService = require('../discountServices/discountCalculator.service');
const couponService = require('../couponServices/coupon.service');

/**
 * Find order by ID
 * @param {String} id - Order UUID
 * @returns {Promise<Object|null>} Order object or null
 */
const findById = async (id) => {
  const { data, error } = await supabase
    .from('orders')
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
 * Find orders by user ID (AMAZON-STYLE: ONE ORDER = ONE ROW)
 * @param {String} userId - User UUID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of order objects with items from basket
 */
const findByUserId = async (userId, filters = {}) => {
  let query = supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  // Transform basket to items array for frontend compatibility
  const orders = await Promise.all((data || []).map(async (order) => {
    // Get basket items - handle both array and object formats
    let basketItems = [];
    if (Array.isArray(order.basket)) {
      basketItems = order.basket;
    } else if (order.basket && order.basket.items) {
      basketItems = order.basket.items;
    } else if (order.order_items) {
      basketItems = order.order_items;
    }
    
    // Fetch product details for each item
    const itemsWithDetails = await Promise.all(basketItems.map(async (item) => {
      const { data: product } = await supabase
        .from('products')
        .select('id, title, image_url, price')
        .eq('id', item.product_id)
        .single();
      
      return {
        ...item,
        product: product || {
          id: item.product_id,
          name: item.title,
          image: item.image_url || null,
          price: item.price
        }
      };
    }));
    
    return {
      ...order,
      items: itemsWithDetails,
      total: order.amount / 100 // Convert cents to dollars
    };
  }));
  
  return orders;
};

/**
 * Get all orders (admin only)
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of order objects
 */
const findAll = async (filters = {}) => {
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Create new order from cart
 * Implements Requirements 2.7, 2.14, 2.15
 * @param {String} userId - User UUID
 * @param {Object} orderData - Order data (paymentIntentId, shippingAddress, couponCode)
 * @returns {Promise<Object>} Created order object
 */
const createFromCart = async (userId, orderData) => {
  // Get user's cart
  const cartItems = await cartService.getCart(userId);
  
  if (cartItems.length === 0) {
    throw new Error('Cart is empty');
  }

  // Validate cart
  const validation = await cartService.validateCart(userId);
  if (!validation.valid) {
    throw new Error(`Cart validation failed: ${validation.errors.join(', ')}`);
  }

  // Calculate total amount and commission
  let subtotal = 0;
  let totalCommission = 0;
  const basket = [];
  const sellerAmounts = {}; // Track amounts per seller
  const discountItems = []; // Items for discount calculation

  for (const item of cartItems) {
    if (item.product && item.product.status === 'active') {
      // Determine price: use variant price if variant exists, otherwise product price
      let itemPrice = item.product.price;
      let variantInfo = null;
      
      // If item has variant_id, get variant details
      if (item.variant_id) {
        const { data: variant } = await supabase
          .from('product_variants')
          .select('id, variant_name, sku, price, attributes, images')
          .eq('id', item.variant_id)
          .single();
        
        if (variant) {
          itemPrice = variant.price;
          variantInfo = {
            variant_id: variant.id,
            variant_name: variant.variant_name,
            sku: variant.sku,
            attributes: variant.attributes,
            variant_images: variant.images
          };
        }
      }
      
      const itemTotal = item.quantity * itemPrice;
      subtotal += itemTotal;
      
      // Get full product details including seller_id and category_id
      const { data: productDetails } = await supabase
        .from('products')
        .select('seller_id, category_id')
        .eq('id', item.product_id)
        .single();
      
      // Build basket item with variant information
      const basketItem = {
        product_id: item.product_id,
        title: item.product.title,
        price: itemPrice,
        quantity: item.quantity,
        image_url: item.product.image_url,
        seller_id: productDetails?.seller_id || null,
        category_id: productDetails?.category_id || null
      };
      
      // Add variant information if present
      if (variantInfo) {
        basketItem.variant_id = variantInfo.variant_id;
        basketItem.variant_name = variantInfo.variant_name;
        basketItem.sku = variantInfo.sku;
        basketItem.attributes = variantInfo.attributes;
        if (variantInfo.variant_images && variantInfo.variant_images.length > 0) {
          basketItem.image_url = variantInfo.variant_images[0]; // Use first variant image
        }
      }
      
      basket.push(basketItem);
      
      // Add to discount items
      discountItems.push({
        product_id: item.product_id,
        variant_id: item.variant_id,
        category_id: productDetails?.category_id,
        price: itemPrice,
        quantity: item.quantity,
        name: item.product.title
      });
    }
  }

  // Calculate discounts (promotional + coupon)
  const discountResult = await discountCalculatorService.calculateOrderDiscounts(
    {
      items: discountItems,
      subtotal,
      couponCode: orderData.couponCode
    },
    userId
  );

  if (!discountResult.success) {
    throw new Error(discountResult.error || 'Failed to calculate discounts');
  }

  // Calculate final amount after discounts
  const totalAmount = discountResult.finalTotal;
  const promotionalDiscount = discountResult.promotionalDiscount || 0;
  const couponDiscount = discountResult.couponDiscount || 0;
  const totalDiscount = discountResult.totalDiscount || 0;

  // Update basket with promotional prices
  if (discountResult.itemsWithPromotions) {
    for (let i = 0; i < basket.length; i++) {
      const itemWithPromo = discountResult.itemsWithPromotions[i];
      if (itemWithPromo && itemWithPromo.promotionalPrice < basket[i].price) {
        basket[i].original_price = basket[i].price;
        basket[i].price = itemWithPromo.promotionalPrice;
        basket[i].promotional_discount = itemWithPromo.promotionalDiscount;
      }
    }
  }

  // Calculate commission on final amount (after discounts)
  for (const item of basket) {
    const itemTotal = item.quantity * item.price;
    
    // Calculate commission for this item
    let itemCommission = 0;
    if (item.seller_id) {
      const commissionRate = await commissionService.getApplicableRate(
        item.seller_id,
        item.category_id
      );
      
      const itemTotalCents = Math.round(itemTotal * 100);
      itemCommission = commissionService.calculateCommission(
        itemTotalCents,
        commissionRate.commission_percentage
      );
      
      totalCommission += itemCommission;
      
      // Track seller amounts for escrow
      if (!sellerAmounts[item.seller_id]) {
        sellerAmounts[item.seller_id] = {
          amount: 0,
          commission: 0
        };
      }
      sellerAmounts[item.seller_id].amount += itemTotalCents;
      sellerAmounts[item.seller_id].commission += itemCommission;
    }
  }

  // Reserve inventory for all items (handle both variants and regular products)
  for (const item of basket) {
    if (item.variant_id) {
      // Reserve variant inventory
      await variantInventoryService.reserveInventory(item.variant_id, item.quantity);
    } else {
      // Reserve regular product inventory
      await inventoryService.reserve(item.product_id, item.quantity);
    }
  }

  // Determine primary seller (for single-vendor orders)
  const sellers = Object.keys(sellerAmounts);
  const primarySellerId = sellers.length === 1 ? sellers[0] : null;

  // Create order with commission and discounts
  const orderAmountCents = Math.round(totalAmount * 100);
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      user_id: userId,
      payment_intent_id: orderData.paymentIntentId || `pi_${Date.now()}`,
      amount: orderAmountCents,
      basket: basket,
      shipping_address: orderData.shippingAddress,
      status: 'pending_payment',
      seller_id: primarySellerId,
      commission_amount: totalCommission / 100, // Store in dollars
      seller_payout_amount: (orderAmountCents - totalCommission) / 100, // Store in dollars
      coupon_id: discountResult.couponDetails?.id || null,
      coupon_code: orderData.couponCode || null,
      discount_amount: couponDiscount,
      promotional_discount: promotionalDiscount
    }])
    .select()
    .single();
  
  if (error) {
    // Release inventory if order creation fails
    for (const item of basket) {
      if (item.variant_id) {
        await variantInventoryService.releaseInventory(item.variant_id, item.quantity);
      } else {
        await inventoryService.release(item.product_id, item.quantity);
      }
    }
    throw error;
  }

  // Apply coupon if used
  if (orderData.couponCode && discountResult.couponDetails) {
    await couponService.applyCoupon(orderData.couponCode, userId, data.id);
  }

  // Update seller escrow balances
  for (const [sellerId, amounts] of Object.entries(sellerAmounts)) {
    const sellerPayout = amounts.amount - amounts.commission;
    await sellerBalanceService.addToEscrow(sellerId, sellerPayout, data.id);
    await sellerBalanceService.recordCommission(sellerId, amounts.commission);
  }

  // Create sub-orders for multi-vendor orders
  if (sellers.length > 1) {
    await subOrderService.createSubOrders(data.id, basket);
  }

  // Clear cart after successful order creation
  await cartService.clearCart(userId);
  
  // Create seller earnings records
  try {
    await createSellerEarnings(data.id, basket);
    console.log('[Order Service] Seller earnings created successfully for order:', data.id);
  } catch (earningsError) {
    console.error('[Order Service] Failed to create seller earnings:', earningsError);
    // Don't fail the order creation, but log the error
    // Admin can manually create earnings later if needed
  }
  
  // Return order with discount breakdown
  return {
    ...data,
    discount_breakdown: discountResult.breakdown
  };
};

/**
 * Create seller earnings records for an order
 * @param {String} orderId - Order UUID
 * @param {Array} orderItems - Array of order items with seller info
 * @returns {Promise<Array>} Created earnings records
 */
const createSellerEarnings = async (orderId, orderItems) => {
  try {
    console.log('[Order Service] Creating seller earnings for order:', orderId);
    
    // Group items by seller
    const sellerItems = {};
    for (const item of orderItems) {
      const sellerId = item.seller_id;
      if (!sellerId) continue; // Skip items without seller_id
      
      if (!sellerItems[sellerId]) {
        sellerItems[sellerId] = [];
      }
      sellerItems[sellerId].push(item);
    }

    // Get commission settings
    const { data: commissionSettings, error: commissionError } = await supabase
      .from('commission_settings')
      .select('*')
      .single();

    if (commissionError) {
      console.error('[Order Service] Error fetching commission settings:', commissionError);
      // Use default commission rate if settings not found
      var defaultRate = 10;
    } else {
      var defaultRate = commissionSettings.default_rate || 10;
    }

    const earningsRecords = [];

    // Create earnings record for each seller
    for (const [sellerId, items] of Object.entries(sellerItems)) {
      // Calculate gross amount (total price of all items from this seller)
      let grossAmount = 0;
      for (const item of items) {
        grossAmount += item.price * item.quantity;
      }

      // Convert to cents for database storage
      const grossAmountCents = Math.round(grossAmount * 100);

      // Calculate commission based on commission settings
      let commissionRate = defaultRate;
      
      // Check if seller has custom commission rate
      if (commissionSettings && commissionSettings.seller_rates && commissionSettings.seller_rates[sellerId]) {
        commissionRate = commissionSettings.seller_rates[sellerId];
      }

      const commissionAmountCents = Math.round(grossAmountCents * (commissionRate / 100));
      const netAmountCents = grossAmountCents - commissionAmountCents;

      // Calculate available date (7 days from now)
      const availableDate = new Date();
      availableDate.setDate(availableDate.getDate() + 7);

      // Create seller_earnings record
      const { data: earning, error: earningError } = await supabase
        .from('seller_earnings')
        .insert({
          seller_id: sellerId,
          order_id: orderId,
          gross_amount: grossAmountCents, // Amount in cents
          commission_amount: commissionAmountCents, // Amount in cents
          commission_rate: commissionRate,
          net_amount: netAmountCents, // Amount in cents
          status: 'pending', // Will become 'available' after 7 days
          available_date: availableDate.toISOString()
        })
        .select()
        .single();

      if (earningError) {
        console.error('[Order Service] Error creating seller earning:', earningError);
        throw new Error(`Failed to create seller earning for seller ${sellerId}`);
      }

      console.log('[Order Service] Created earning record:', earning.id, 'for seller:', sellerId);
      earningsRecords.push(earning);
    }

    return earningsRecords;
  } catch (error) {
    console.error('[Order Service] Error in createSellerEarnings:', error);
    throw error;
  }
};

/**
 * Create new order (legacy method)
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Created order object
 */
const create = async (orderData) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      user_id: orderData.userId,
      payment_intent_id: orderData.paymentIntentId,
      amount: orderData.amount,
      basket: orderData.basket,
      shipping_address: orderData.shippingAddress,
      status: orderData.status || 'pending_payment'
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Update order status with lifecycle validation
 * @param {String} id - Order UUID
 * @param {String} newStatus - New status
 * @param {String} adminId - Admin user ID (optional)
 * @returns {Promise<Object>} Updated order object
 */
const updateStatus = async (id, newStatus, adminId = null) => {
  // Get current order
  const order = await findById(id);
  if (!order) {
    throw new Error('Order not found');
  }

  const oldStatus = order.status;

  // Validate status transition
  const validTransitions = {
    'pending_payment': ['paid', 'cancelled'],
    'paid': ['confirmed', 'processing', 'cancelled'],
    'confirmed': ['packed', 'processing', 'shipped', 'cancelled'],
    'processing': ['packed', 'shipped', 'cancelled'],
    'packed': ['shipped', 'cancelled'],
    'shipped': ['delivered', 'cancelled'],
    'delivered': [],
    'cancelled': [],
    'refunded': []
  };

  const allowedStatuses = validTransitions[order.status] || [];
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Cannot transition from ${order.status} to ${newStatus}`);
  }

  const updateData = {
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  // Handle status-specific logic
  if (newStatus === 'paid') {
    // Fulfill inventory reservations (handle both variants and regular products)
    if (order.basket && Array.isArray(order.basket)) {
      for (const item of order.basket) {
        if (item.variant_id) {
          await variantInventoryService.fulfillInventory(item.variant_id, item.quantity);
        } else {
          await inventoryService.fulfill(item.product_id, item.quantity);
        }
      }
    }
  }

  if (newStatus === 'shipped' || newStatus === 'delivered') {
    updateData.fulfilled_at = new Date().toISOString();
    if (adminId) {
      updateData.fulfilled_by = adminId;
    }
  }

  if (newStatus === 'cancelled') {
    // Release inventory reservations if order was not yet paid (handle both variants and regular products)
    if (order.status === 'pending_payment' && order.basket && Array.isArray(order.basket)) {
      for (const item of order.basket) {
        if (item.variant_id) {
          await variantInventoryService.releaseInventory(item.variant_id, item.quantity);
        } else {
          await inventoryService.release(item.product_id, item.quantity);
        }
      }
    }
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Create notification for status change
  try {
    const orderNotificationService = require('../notificationServices/order-notification.service');
    await orderNotificationService.notifyOrderStatusChange(data, oldStatus, newStatus);
  } catch (notifError) {
    console.error('[Order Service] Failed to create notification:', notifError);
    // Don't fail the status update if notification fails
  }
  
  return data;
};

/**
 * Cancel order
 * @param {String} id - Order UUID
 * @param {String} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated order object
 */
const cancelOrder = async (id, userId) => {
  const order = await findById(id);
  
  if (!order) {
    throw new Error('Order not found');
  }

  if (order.user_id !== userId) {
    throw new Error('Unauthorized to cancel this order');
  }

  if (!['pending_payment', 'paid', 'confirmed'].includes(order.status)) {
    throw new Error(`Cannot cancel order with status: ${order.status}`);
  }

  return await updateStatus(id, 'cancelled');
};

/**
 * Generate invoice for order
 * @param {String} id - Order UUID
 * @returns {Promise<Object>} Invoice data
 */
const generateInvoice = async (id) => {
  const order = await findById(id);
  
  if (!order) {
    throw new Error('Order not found');
  }

  // Get user details
  const { data: user } = await supabase
    .from('users')
    .select('email, display_name, phone')
    .eq('id', order.user_id)
    .single();

  // Calculate totals
  let subtotal = 0;
  const items = order.basket || [];
  
  items.forEach(item => {
    subtotal += item.price * item.quantity;
  });

  const tax = subtotal * 0.1; // 10% tax
  const shipping = 10.00; // Flat shipping
  const total = subtotal + tax + shipping;

  return {
    invoice_number: `INV-${order.id.substring(0, 8).toUpperCase()}`,
    order_id: order.id,
    order_date: order.created_at,
    status: order.status,
    customer: {
      name: user?.display_name || 'N/A',
      email: user?.email || 'N/A',
      phone: user?.phone || 'N/A'
    },
    shipping_address: order.shipping_address,
    items: items.map(item => ({
      title: item.title,
      quantity: item.quantity,
      unit_price: item.price,
      total: item.price * item.quantity
    })),
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    shipping: shipping,
    total: parseFloat(total.toFixed(2)),
    payment_intent_id: order.payment_intent_id
  };
};

/**
 * Get order statistics (admin only)
 * @returns {Promise<Object>} Order statistics
 */
const getStatistics = async () => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('status, amount');
  
  if (error) throw error;
  
  const stats = {
    total_orders: orders.length,
    pending_payment: 0,
    paid: 0,
    confirmed: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    total_revenue: 0
  };

  orders.forEach(order => {
    if (order.status === 'pending_payment') stats.pending_payment++;
    else if (order.status === 'paid') stats.paid++;
    else if (order.status === 'confirmed') stats.confirmed++;
    else if (order.status === 'packed') stats.packed++;
    else if (order.status === 'shipped') stats.shipped++;
    else if (order.status === 'delivered') stats.delivered++;
    else if (order.status === 'cancelled') stats.cancelled++;
    
    if (order.status !== 'cancelled') {
      stats.total_revenue += order.amount;
    }
  });
  
  return stats;
};

/**
 * Get recent orders
 * @param {Number} limit - Number of orders to retrieve
 * @returns {Promise<Array>} Array of recent orders
 */
const getRecent = async (limit = 10) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Check if order is eligible for delivery rating
 * Implements Requirement 3.1
 * @param {String} orderId - Order UUID
 * @returns {Promise<Object>} Eligibility status
 */
const isEligibleForDeliveryRating = async (orderId) => {
  const order = await findById(orderId);
  
  if (!order) {
    return { eligible: false, reason: 'Order not found' };
  }

  if (order.status !== 'delivered') {
    return { eligible: false, reason: 'Order must be delivered to submit rating' };
  }

  // Check if within 30-day window
  const deliveredDate = new Date(order.fulfilled_at || order.updated_at);
  const now = new Date();
  const daysSinceDelivery = Math.floor((now - deliveredDate) / (1000 * 60 * 60 * 24));

  if (daysSinceDelivery > 30) {
    return { eligible: false, reason: 'Rating window has expired (30 days)' };
  }

  return { eligible: true, daysRemaining: 30 - daysSinceDelivery };
};

/**
 * Get order details with delivery rating
 * Implements Requirement 3.17
 * @param {String} orderId - Order UUID
 * @returns {Promise<Object>} Order with rating details
 */
const getOrderWithDeliveryRating = async (orderId) => {
  const order = await findById(orderId);
  
  if (!order) {
    return null;
  }

  // Get delivery rating if exists
  const { data: rating } = await supabase
    .from('delivery_ratings')
    .select('*')
    .eq('order_id', orderId)
    .single();

  return {
    ...order,
    delivery_rating: rating || null,
    can_rate_delivery: await isEligibleForDeliveryRating(orderId)
  };
};

/**
 * Check if order is eligible for replacement
 * Implements Requirement 4.1
 * @param {String} orderId - Order UUID
 * @returns {Promise<Object>} Eligibility status
 */
const isEligibleForReplacement = async (orderId) => {
  const order = await findById(orderId);
  
  if (!order) {
    return { eligible: false, reason: 'Order not found' };
  }
  
  // Check if order is delivered
  if (order.status !== 'delivered') {
    return { eligible: false, reason: 'Order must be delivered to request replacement' };
  }
  
  // Check if within 30-day window
  const deliveredDate = new Date(order.delivered_at || order.updated_at);
  const now = new Date();
  const daysSinceDelivery = Math.floor((now - deliveredDate) / (1000 * 60 * 60 * 24));
  
  if (daysSinceDelivery > 30) {
    return { eligible: false, reason: 'Replacement window (30 days) has expired' };
  }
  
  return { eligible: true, daysRemaining: 30 - daysSinceDelivery };
};

/**
 * Get order details with replacement history
 * Implements Requirement 4.15
 * @param {String} orderId - Order UUID
 * @returns {Promise<Object>} Order with replacement details
 */
const getOrderWithReplacements = async (orderId) => {
  const order = await findById(orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  // Get replacement requests for this order
  const { data: replacements } = await supabase
    .from('replacement_requests')
    .select(`
      *,
      replacement_shipments (*)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  
  return {
    ...order,
    replacements: replacements || [],
    can_request_replacement: await isEligibleForReplacement(orderId)
  };
};

/**
 * Get order refund history
 * @param {String} orderId - Order UUID
 * @returns {Promise<Array>} Array of refund records
 */
async function getOrderRefundHistory(orderId) {
  const { data, error } = await supabase
    .from('refund_details')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
}

/**
 * Get order refund summary
 * @param {String} orderId - Order UUID
 * @returns {Promise<Object>} Refund summary with totals
 */
async function getOrderRefundSummary(orderId) {
  const refunds = await getOrderRefundHistory(orderId);
  
  if (!refunds || refunds.length === 0) {
    return {
      total_refunded: 0,
      refund_count: 0,
      has_refunds: false,
      refunds: []
    };
  }
  
  // Calculate total refunded amount (only approved refunds)
  const approvedRefunds = refunds.filter(r => r.status === 'approved');
  const totalRefunded = approvedRefunds.reduce((sum, refund) => {
    return sum + parseFloat(refund.refund_amount || 0);
  }, 0);
  
  return {
    total_refunded: totalRefunded,
    refund_count: refunds.length,
    approved_count: approvedRefunds.length,
    has_refunds: true,
    refunds: refunds
  };
}

/**
 * Update order refund status
 * @param {String} orderId - Order UUID
 * @param {Number} refundAmount - Amount being refunded
 * @returns {Promise<Object>} Updated order
 */
async function updateOrderRefundStatus(orderId, refundAmount) {
  // Get current order
  const order = await findById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  
  // Get refund summary
  const refundSummary = await getOrderRefundSummary(orderId);
  const totalRefunded = refundSummary.total_refunded + refundAmount;
  
  // Determine new status
  let newStatus = order.status;
  const orderTotal = parseFloat(order.amount || 0);
  
  if (totalRefunded >= orderTotal) {
    // Full refund
    newStatus = 'refunded';
  } else if (totalRefunded > 0) {
    // Partial refund
    newStatus = 'partially_refunded';
  }
  
  // Update order status
  const { data, error } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
}

/**
 * Get order with refund details
 * @param {String} orderId - Order UUID
 * @returns {Promise<Object>} Order with refund information
 */
async function getOrderWithRefunds(orderId) {
  const order = await findById(orderId);
  if (!order) {
    return null;
  }
  
  const refundSummary = await getOrderRefundSummary(orderId);
  
  return {
    ...order,
    refund_summary: refundSummary
  };
}

/**
 * Check if order is eligible for refund
 * @param {String} orderId - Order UUID
 * @returns {Promise<Object>} Eligibility status and reason
 */
async function isEligibleForRefund(orderId) {
  const order = await findById(orderId);
  
  if (!order) {
    return {
      eligible: false,
      reason: 'Order not found'
    };
  }
  
  // Check if order is in a refundable status
  const refundableStatuses = ['delivered', 'completed', 'partially_refunded'];
  if (!refundableStatuses.includes(order.status)) {
    return {
      eligible: false,
      reason: `Order status '${order.status}' is not eligible for refund`
    };
  }
  
  // Check if already fully refunded
  if (order.status === 'refunded') {
    return {
      eligible: false,
      reason: 'Order has already been fully refunded'
    };
  }
  
  // Get refund summary to check cumulative refunds
  const refundSummary = await getOrderRefundSummary(orderId);
  const orderTotal = parseFloat(order.amount || 0);
  
  if (refundSummary.total_refunded >= orderTotal) {
    return {
      eligible: false,
      reason: 'Order has already been fully refunded'
    };
  }
  
  // Check 30-day window from delivery
  if (order.delivered_at) {
    const deliveryDate = new Date(order.delivered_at);
    const now = new Date();
    const daysSinceDelivery = (now - deliveryDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceDelivery > 30) {
      return {
        eligible: false,
        reason: 'Refund window has expired (30 days from delivery)'
      };
    }
  }
  
  return {
    eligible: true,
    remaining_refundable: orderTotal - refundSummary.total_refunded,
    order_total: orderTotal,
    total_refunded: refundSummary.total_refunded
  };
}

module.exports = {
  findById,
  findByUserId,
  findAll,
  create,
  createFromCart,
  createSellerEarnings, // NEW: Export earnings creation function
  updateStatus,
  cancelOrder,
  generateInvoice,
  getStatistics,
  getRecent,
  isEligibleForDeliveryRating,
  getOrderWithDeliveryRating,
  isEligibleForReplacement,
  getOrderWithReplacements,
  // Refund integration functions
  getOrderRefundHistory,
  getOrderRefundSummary,
  updateOrderRefundStatus,
  getOrderWithRefunds,
  isEligibleForRefund
};
