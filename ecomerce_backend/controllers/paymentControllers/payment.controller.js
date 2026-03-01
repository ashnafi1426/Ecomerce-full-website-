import { stripe, stripeConfig } from '../../config/stripe.js';
import supabase from '../../config/supabase.js';
import { splitOrderBySeller, notifySellers } from '../../services/orderServices/order-splitting-with-email.service.js';
import notificationService from '../../services/notificationServices/notification.service.js';

/**
 * FASTSHOP PAYMENT CONTROLLER - COMPLETE IMPLEMENTATION
 * ====================================================
 * 
 * Handles the complete payment flow:
 * 1. Payment Intent Creation (with backend price validation)
 * 2. Order Creation after payment success
 * 3. Multi-vendor order splitting
 * 4. Commission calculation and seller earnings
 * 5. Admin payment management
 * 6. Refund processing
 */

/**
 * Create Payment Intent
 * POST /api/payments/create-intent
 * 
 * Security: Recalculates all prices on backend
 * Never trusts frontend pricing
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user?.id; // Can be null for guest checkout
    const { cartItems, shippingAddress, billingAddress } = req.body;

    // Enhanced validation for cart items
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Validate each cart item has required fields
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      
      if (!item.id) {
        return res.status(400).json({ 
          error: 'Invalid cart item',
          message: `Cart item at index ${i} is missing product ID` 
        });
      }
      
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ 
          error: 'Invalid cart item',
          message: `Cart item at index ${i} has invalid quantity` 
        });
      }
      
      // Validate UUID format for product ID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(item.id)) {
        return res.status(400).json({ 
          error: 'Invalid cart item',
          message: `Cart item at index ${i} has invalid product ID format` 
        });
      }
    }

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.email || !shippingAddress.address) {
      return res.status(400).json({ 
        error: 'Invalid shipping address',
        message: 'Shipping address must include fullName, email, and address' 
      });
    }

    // 1. Fetch actual product prices from database (NEVER trust frontend)
    const productIds = cartItems.map(item => item.id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price, title, status, approval_status')
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // 2. Validate all products exist and are available
    for (const cartItem of cartItems) {
      const product = products.find(p => p.id === cartItem.id);
      
      if (!product) {
        return res.status(400).json({ 
          error: `Product not found`,
          message: `Product with ID ${cartItem.id} does not exist`
        });
      }
      
      if (product.status !== 'active') {
        return res.status(400).json({ 
          error: `Product unavailable`,
          message: `Product "${product.title}" is not available (status: ${product.status})`
        });
      }
      
      if (product.approval_status !== 'approved') {
        return res.status(400).json({ 
          error: `Product not approved`,
          message: `Product "${product.title}" is not approved for sale`
        });
      }
    }

    // 3. Calculate total from database prices
    let subtotal = 0;
    const orderItems = [];

    for (const cartItem of cartItems) {
      const product = products.find(p => p.id === cartItem.id);
      const itemTotal = parseFloat(product.price) * cartItem.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: product.id,
        quantity: cartItem.quantity,
        price: parseFloat(product.price),
        title: product.title
      });
    }

    // 4. Calculate tax and shipping (customize based on your logic)
    const taxRate = 0.08; // 8% tax
    const tax = subtotal * taxRate;
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    const total = subtotal + tax + shipping;

    // 5. Convert to cents for Stripe
    const amountInCents = Math.round(total * 100);

    // 6. Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: stripeConfig.currency,
      payment_method_types: stripeConfig.paymentMethodTypes,
      metadata: {
        user_id: userId || 'guest',
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        shipping: shipping.toFixed(2),
        total: total.toFixed(2),
        items_count: cartItems.length,
        order_items: JSON.stringify(orderItems),
        shipping_address: JSON.stringify(shippingAddress),
        billing_address: JSON.stringify(billingAddress),
        guest_email: shippingAddress?.email || billingAddress?.email || ''
      }
    });

    // 7. Store payment record (status: pending)
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: amountInCents,
        currency: stripeConfig.currency,
        status: 'pending',
        metadata: {
          subtotal,
          tax,
          shipping,
          total,
          items: orderItems
        }
      });

    if (paymentError) {
      console.error('Error storing payment:', paymentError);
      // Don't fail the request, payment intent is already created
    }

    // 8. Return client secret to frontend
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
      breakdown: {
        subtotal,
        tax,
        shipping,
        total
      }
    });

  } catch (error) {
    console.error('Create Payment Intent Error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      message: error.message 
    });
  }
};

/**
 * Get Payment Status
 * GET /api/payments/:paymentIntentId
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Also fetch from Stripe for real-time status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      payment,
      stripeStatus: paymentIntent.status,
      order_id: payment.order_id
    });

  } catch (error) {
    console.error('Get Payment Status Error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
};

/**
 * Cancel Payment
 * POST /api/payments/:paymentIntentId/cancel
 */
export const cancelPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const userId = req.user?.id;

    // Verify payment belongs to user
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (fetchError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Cancel on Stripe
    const canceledIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    // Update database
    const { error: updateError } = await supabase
      .from('payments')
      .update({ 
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
    }

    res.json({
      message: 'Payment canceled successfully',
      status: canceledIntent.status
    });

  } catch (error) {
    console.error('Cancel Payment Error:', error);
    res.status(500).json({ error: 'Failed to cancel payment' });
  }
};

/**
 * Create Order After Payment Success (No Webhooks)
 * POST /api/payments/create-order
 * 
 * This endpoint is called by frontend after successful payment
 * It verifies the payment with Stripe before creating the order
 */
export const createOrderAfterPayment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID is required' });
    }

    // 1. Verify payment exists in our database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // 2. Check if order already exists for this payment
    if (payment.order_id) {
      return res.status(400).json({ 
        error: 'Order already created for this payment',
        order_id: payment.order_id
      });
    }

    // 3. Verify payment status with Stripe (CRITICAL - Never trust frontend)
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Payment not successful',
        status: paymentIntent.status
      });
    }

    // 4. Extract order data from payment metadata
    const orderItems = JSON.parse(paymentIntent.metadata.order_items);
    const shippingAddress = JSON.parse(paymentIntent.metadata.shipping_address);
    const billingAddress = JSON.parse(paymentIntent.metadata.billing_address);

    // 5. Determine if this is a guest or registered user order
    const isGuest = !userId;
    
    // Try to get email from multiple sources
    let guestEmail = null;
    if (isGuest) {
      // Priority: billing address email > shipping address email > metadata guest_email
      guestEmail = billingAddress?.email || shippingAddress?.email || paymentIntent.metadata.guest_email;
      
      if (!guestEmail) {
        return res.status(400).json({ 
          error: 'Email is required for guest orders' 
        });
      }
    }
    
    const guestPhone = isGuest ? shippingAddress?.phone : null;

    // Generate tracking token for guest orders
    const trackingToken = isGuest ? `TRACK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null;

    // 6. Create order (using actual orders table structure)
    // IMPORTANT: Must satisfy check_user_or_guest constraint
    // Either user_id OR guest_email must be set (not both, not neither)
    const orderData = {
      payment_intent_id: paymentIntentId,
      amount: paymentIntent.amount, // Amount in cents
      basket: orderItems, // Store items array directly in basket JSONB
      shipping_address: shippingAddress,
      status: 'paid', // Payment already succeeded, so status is 'paid'
      order_items: orderItems // Also store in order_items JSONB
    };

    // Add user_id for registered users OR guest_email for guests
    if (isGuest) {
      orderData.guest_email = guestEmail;
      orderData.guest_phone = guestPhone;
      orderData.order_tracking_token = trackingToken;
    } else {
      orderData.user_id = userId;
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return res.status(500).json({ 
        error: 'Failed to create order',
        message: orderError.message,
        details: orderError
      });
    }

    const orderId = order.id;

    // 7. Create order items and handle inventory
    for (const item of orderItems) {
      // Create order item with subtotal
      const itemSubtotal = item.price * item.quantity;
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          subtotal: itemSubtotal
        });

      if (itemError) {
        console.error('Error creating order item:', itemError);
      }

      // Check if there's an active reservation for this product
      const { data: reservation } = await supabase
        .from('inventory_reservations')
        .select('id')
        .eq('product_id', item.product_id)
        .eq('status', 'active')
        .or(`user_id.eq.${userId},session_id.eq.${paymentIntent.metadata.session_id || 'none'}`)
        .single();

      if (reservation) {
        // Convert reservation to order (deducts from inventory)
        const { error: conversionError } = await supabase.rpc('convert_reservation_to_order', {
          p_reservation_id: reservation.id,
          p_order_id: orderId
        });

        if (conversionError) {
          console.error('Error converting reservation:', conversionError);
          // Fallback to direct inventory deduction
          await supabase.rpc('decrement_inventory', {
            p_product_id: item.product_id,
            p_quantity: item.quantity
          });
        }
      } else {
        // No reservation found, directly deduct inventory
        const { error: inventoryError } = await supabase.rpc('decrement_inventory', {
          p_product_id: item.product_id,
          p_quantity: item.quantity
        });

        if (inventoryError) {
          console.error('Error updating inventory:', inventoryError);
          // Continue anyway - inventory can be manually adjusted
        }
      }
    }

    // 7. Update payment record with order_id
    const { error: updateError } = await supabase
      .from('payments')
      .update({ 
        order_id: orderId,
        status: 'succeeded',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    if (updateError) {
      console.error('Error updating payment:', updateError);
    }

    // 7.5. Create notification for customer about order placement
    try {
      // Only create notification for registered users (not guests)
      if (userId) {
        await notificationService.createNotification({
          user_id: userId,
          type: 'order_placed',
          title: 'Order Placed Successfully',
          message: `Your order #${orderId.substring(0, 8)} has been placed successfully`,
          priority: 'high',
          metadata: { 
            order_id: orderId,
            amount: paymentIntent.amount / 100,
            items_count: orderItems.length
          },
          action_url: `/orders/${orderId}`,
          action_text: 'View Order',
          channels: ['in_app', 'email']
        });
        console.log(`[Payment] Customer notification created for order ${orderId}`);
      } else {
        console.log(`[Payment] Skipping notification for guest order ${orderId}`);
      }
    } catch (notifError) {
      console.error('[Payment] Error creating customer notification:', notifError);
      // Don't fail order creation if notification fails
    }

    // 8. PHASE 3: Split order by seller if multi-vendor
    try {
      console.log(`[Payment] Checking if order ${orderId} needs splitting...`);
      const splitResult = await splitOrderBySeller(orderId, orderItems);
      
      if (splitResult.isSplit) {
        console.log(`[Payment] Order split into ${splitResult.subOrders.length} sub-orders for ${splitResult.sellerCount} sellers`);
        
        // Notify sellers about their new orders (in-app + email)
        await notifySellers(splitResult.subOrders, orderId);
        console.log(`[Payment] Sellers notified successfully (in-app + email)`);
      } else {
        console.log(`[Payment] Single seller order, no splitting needed`);
      }
    } catch (splitError) {
      console.error('[Payment] Order splitting error:', splitError);
      // Don't fail the order creation - splitting can be done manually if needed
      // Order is already created successfully at this point
    }

    res.json({
      success: true,
      order_id: orderId,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Create Order After Payment Error:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      message: error.message 
    });
  }
};

/**
 * ADMIN: Get all payments
 * GET /api/admin/payments
 */
export const getAllPayments = async (req, res) => {
  try {
    const { status, userId, limit, offset } = req.query;

    console.log('[getAllPayments] Query params:', { status, userId, limit, offset });

    let query = supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      console.log('[getAllPayments] Applying status filter:', status);
      query = query.eq('status', status);
    } else {
      console.log('[getAllPayments] NOT applying status filter (status is:', status, ')');
    }

    if (userId) {
      console.log('[getAllPayments] Applying userId filter:', userId);
      query = query.eq('user_id', userId);
    }

    // Apply pagination
    if (limit) {
      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset) || 0;
      console.log('[getAllPayments] Applying pagination:', { limitNum, offsetNum });
      query = query.range(offsetNum, offsetNum + limitNum - 1);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('[getAllPayments] Supabase error:', error);
      throw error;
    }

    console.log('[getAllPayments] Query result:', { count: payments?.length || 0 });

    res.json({
      success: true,
      count: payments?.length || 0,
      payments: payments || []
    });
  } catch (error) {
    console.error('Error in getAllPayments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payments',
      message: error.message 
    });
  }
};

/**
 * ADMIN: Get payment statistics
 * GET /api/admin/payments/statistics
 */
export const getPaymentStatistics = async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('status, amount');
    
    if (error) throw error;
    
    const stats = {
      total_payments: payments?.length || 0,
      successful: 0,
      pending: 0,
      failed: 0,
      refunded: 0,
      total_amount: 0,
      successful_amount: 0
    };

    payments?.forEach(payment => {
      if (payment.status === 'succeeded') {
        stats.successful++;
        stats.successful_amount += payment.amount;
      } else if (payment.status === 'pending') {
        stats.pending++;
      } else if (payment.status === 'failed') {
        stats.failed++;
      } else if (payment.status === 'refunded') {
        stats.refunded++;
      }
      
      stats.total_amount += payment.amount;
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Error in getPaymentStatistics:', error);
    res.status(500).json({ 
      error: 'Failed to get payment statistics',
      message: error.message 
    });
  }
};

/**
 * ADMIN: Process refund
 * POST /api/admin/payments/:id/refund
 */
export const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    // Get payment record
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'succeeded') {
      return res.status(400).json({ error: 'Can only refund successful payments' });
    }

    // Determine refund amount (full or partial)
    const refundAmount = amount || payment.amount;
    
    // Validate refund amount
    if (refundAmount > payment.amount) {
      return res.status(400).json({ error: 'Refund amount cannot exceed payment amount' });
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      amount: refundAmount,
      reason: reason || 'requested_by_customer'
    });

    // Determine if this is a partial refund
    const isPartial = refundAmount < payment.amount;

    // Update payment status
    if (isPartial) {
      await supabase
        .from('payments')
        .update({ 
          refunded_amount: refundAmount,
          last_refund_at: new Date().toISOString()
        })
        .eq('id', id);
    } else {
      await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', id);
    }

    // Update order status if order exists
    if (payment.order_id) {
      const orderStatus = isPartial ? 'partially_refunded' : 'refunded';
      await supabase
        .from('orders')
        .update({ status: orderStatus })
        .eq('id', payment.order_id);
    }

    res.json({
      success: true,
      message: isPartial ? 'Partial refund processed successfully' : 'Full refund processed successfully',
      refund,
      isPartial,
      refundAmount
    });
  } catch (error) {
    console.error('Error in processRefund:', error);
    res.status(500).json({ 
      error: 'Failed to process refund',
      message: error.message 
    });
  }
};
