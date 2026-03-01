import { stripe } from '../../config/stripe.js';
import pool from '../../config/database.js';

/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 * 
 * CRITICAL: This is where orders are actually created
 * Never create orders before webhook confirmation
 */
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check for duplicate webhook (idempotency)
    const duplicateCheck = await client.query(
      'SELECT id FROM webhook_events WHERE stripe_event_id = $1',
      [event.id]
    );

    if (duplicateCheck.rows.length > 0) {
      console.log(`Duplicate webhook event ${event.id}, skipping`);
      await client.query('COMMIT');
      return res.json({ received: true, duplicate: true });
    }

    // Log webhook event
    await client.query(
      `INSERT INTO webhook_events (stripe_event_id, event_type, payload, processed)
       VALUES ($1, $2, $3, $4)`,
      [event.id, event.type, JSON.stringify(event), false]
    );

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(client, event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(client, event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(client, event.data.object);
        break;

      case 'charge.refunded':
        await handleRefund(client, event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark webhook as processed
    await client.query(
      'UPDATE webhook_events SET processed = true WHERE stripe_event_id = $1',
      [event.id]
    );

    await client.query('COMMIT');
    res.json({ received: true });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  } finally {
    client.release();
  }
};

/**
 * Handle successful payment
 * Creates order, deducts inventory, sends notifications
 */
async function handlePaymentSuccess(client, paymentIntent) {
  console.log(`Processing successful payment: ${paymentIntent.id}`);

  const { id: paymentIntentId, amount, metadata } = paymentIntent;

  // 1. Update payment record
  await client.query(
    `UPDATE payments 
     SET status = 'succeeded', updated_at = NOW()
     WHERE stripe_payment_intent_id = $1`,
    [paymentIntentId]
  );

  // 2. Parse metadata
  const orderItems = JSON.parse(metadata.order_items || '[]');
  const shippingAddress = JSON.parse(metadata.shipping_address || '{}');
  const userId = metadata.user_id === 'guest' ? null : metadata.user_id;

  // 3. Create order
  const orderResult = await client.query(
    `INSERT INTO orders (
      user_id, total_amount, status, payment_intent_id, payment_status,
      shipping_address, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING id`,
    [
      userId,
      amount / 100, // Convert cents to dollars
      'confirmed',
      paymentIntentId,
      'paid',
      JSON.stringify(shippingAddress)
    ]
  );

  const orderId = orderResult.rows[0].id;

  // 4. Create order items
  for (const item of orderItems) {
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price)
       VALUES ($1, $2, $3, $4)`,
      [orderId, item.product_id, item.quantity, item.price]
    );

    // 5. Deduct inventory
    await client.query(
      `UPDATE products 
       SET stock_quantity = stock_quantity - $1
       WHERE id = $2 AND stock_quantity >= $1`,
      [item.quantity, item.product_id]
    );
  }

  // 6. Link payment to order
  await client.query(
    'UPDATE payments SET order_id = $1 WHERE stripe_payment_intent_id = $2',
    [orderId, paymentIntentId]
  );

  // 7. Clear user's cart (if logged in)
  if (userId) {
    await client.query(
      `UPDATE carts SET status = 'converted' 
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
  }

  console.log(`Order ${orderId} created successfully for payment ${paymentIntentId}`);

  // TODO: Send confirmation email
  // TODO: Send notification to seller
  // TODO: Create shipping label

  return orderId;
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(client, paymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);

  await client.query(
    `UPDATE payments 
     SET status = 'failed', 
         error_message = $1,
         updated_at = NOW()
     WHERE stripe_payment_intent_id = $2`,
    [paymentIntent.last_payment_error?.message || 'Payment failed', paymentIntent.id]
  );

  // TODO: Send failure notification to user
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(client, paymentIntent) {
  console.log(`Payment canceled: ${paymentIntent.id}`);

  await client.query(
    `UPDATE payments 
     SET status = 'canceled', updated_at = NOW()
     WHERE stripe_payment_intent_id = $1`,
    [paymentIntent.id]
  );
}

/**
 * Handle refund
 */
async function handleRefund(client, charge) {
  console.log(`Refund processed: ${charge.id}`);

  const paymentIntentId = charge.payment_intent;

  // Get payment and order
  const paymentResult = await client.query(
    'SELECT id, order_id FROM payments WHERE stripe_payment_intent_id = $1',
    [paymentIntentId]
  );

  if (paymentResult.rows.length === 0) {
    console.error(`Payment not found for refund: ${paymentIntentId}`);
    return;
  }

  const payment = paymentResult.rows[0];

  // Create refund record
  await client.query(
    `INSERT INTO refunds (
      payment_id, order_id, stripe_refund_id, amount, status
    ) VALUES ($1, $2, $3, $4, $5)`,
    [
      payment.id,
      payment.order_id,
      charge.refunds.data[0]?.id || 'unknown',
      charge.amount_refunded,
      'succeeded'
    ]
  );

  // Update order status
  if (payment.order_id) {
    await client.query(
      `UPDATE orders 
       SET status = 'refunded', payment_status = 'refunded'
       WHERE id = $1`,
      [payment.order_id]
    );
  }

  // TODO: Restore inventory
  // TODO: Send refund confirmation email
}

export default handleStripeWebhook;
