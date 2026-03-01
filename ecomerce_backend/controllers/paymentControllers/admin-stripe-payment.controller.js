const supabase = require('../../config/supabase.js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * ADMIN STRIPE PAYMENT CONTROLLER
 * ===============================
 * 
 * Handles admin-specific Stripe payment operations:
 * 1. Get all payments with filters and statistics
 * 2. Process refunds through Stripe
 * 3. Process seller payouts
 * 4. Get sellers for payout dropdown
 * 5. Payment analytics and reporting
 */

/**
 * Get All Payments with Enhanced Filtering
 * GET /api/admin/stripe/payments
 */
const getAllPayments = async (req, res) => {
  try {
    const { 
      status, 
      method, 
      seller, 
      dateRange, 
      search, 
      limit = 50, 
      offset = 0 
    } = req.query;

    console.log('🔍 Admin fetching payments with filters:', { status, method, seller, dateRange, search });

    // Build query with comprehensive payment data
    let query = supabase
      .from('orders')
      .select(`
        id,
        user_id,
        guest_email,
        payment_intent_id,
        amount,
        status,
        created_at,
        updated_at,
        basket,
        shipping_address
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`id.ilike.%${search}%,payment_intent_id.ilike.%${search}%`);
    }

    // Date range filtering
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
    }

    // Apply pagination
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    if (offset) {
      query = query.range(parseInt(offset), parseInt(offset) + (parseInt(limit) || 50) - 1);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('❌ Error fetching payments:', error);
      throw error;
    }

    // Get all unique seller IDs from orders to fetch seller names
    const allSellerIds = new Set();
    orders.forEach(order => {
      if (order.basket && Array.isArray(order.basket)) {
        order.basket.forEach(item => {
          if (item.seller_id) {
            allSellerIds.add(item.seller_id);
          }
        });
      }
    });

    // Fetch seller names if we have seller IDs
    let sellersMap = new Map();
    if (allSellerIds.size > 0) {
      try {
        const { data: sellers, error: sellersError } = await supabase
          .from('users')
          .select('id, display_name, email')
          .in('id', Array.from(allSellerIds))
          .eq('role', 'seller');

        if (!sellersError && sellers) {
          sellers.forEach(seller => {
            sellersMap.set(seller.id, seller.display_name || seller.email || `Seller ${seller.id.slice(0, 8)}`);
          });
        }
      } catch (sellersError) {
        console.warn('⚠️ Could not fetch seller names:', sellersError);
      }
    }

    // Transform orders to payment format with commission calculation
    const payments = orders.map(order => {
      const amount = order.amount || 0; // Amount in cents
      const commissionRate = 0.15; // 15% commission
      const commissionAmount = Math.round(amount * commissionRate);
      const sellerPayout = amount - commissionAmount;

      // Get customer name - we'll fetch user data separately if needed
      let customerName = 'Guest';
      if (order.guest_email) {
        customerName = `Guest (${order.guest_email})`;
      } else if (order.user_id) {
        customerName = `Customer ${order.user_id.slice(0, 8)}`;
      }

      // Get seller info from basket - improved seller extraction
      let sellerId = null;
      let sellerName = 'Multiple Sellers';
      if (order.basket && Array.isArray(order.basket) && order.basket.length > 0) {
        // Get all unique seller IDs from basket
        const sellerIds = [...new Set(order.basket.map(item => item.seller_id).filter(Boolean))];
        
        if (sellerIds.length === 1) {
          // Single seller order
          sellerId = sellerIds[0];
          sellerName = sellersMap.get(sellerId) || `Seller ${sellerId.slice(0, 8)}`;
        } else if (sellerIds.length > 1) {
          // Multi-seller order - use first seller for filtering but indicate multiple
          sellerId = sellerIds[0];
          const firstSellerName = sellersMap.get(sellerId) || `Seller ${sellerId.slice(0, 8)}`;
          sellerName = `${firstSellerName} + ${sellerIds.length - 1} more`;
        }
      }

      return {
        id: order.id,
        order_id: order.id,
        user_id: order.user_id,
        customer_name: customerName,
        amount: amount, // Keep in cents for consistency
        commission_amount: commissionAmount,
        seller_payout_amount: sellerPayout,
        payment_method: 'stripe',
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at,
        stripe_payment_intent_id: order.payment_intent_id,
        seller_id: sellerId,
        seller_name: sellerName,
        basket: order.basket,
        shipping_address: order.shipping_address
      };
    });

    // Apply seller filter on transformed data - improved filtering
    let filteredPayments = payments;
    if (seller && seller !== 'all') {
      filteredPayments = payments.filter(payment => {
        // Check if the seller ID matches directly
        if (payment.seller_id === seller) {
          return true;
        }
        
        // Also check if the seller is in the basket items (for multi-seller orders)
        if (payment.basket && Array.isArray(payment.basket)) {
          return payment.basket.some(item => item.seller_id === seller);
        }
        
        return false;
      });
    }

    // Apply search filter on transformed data
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPayments = filteredPayments.filter(payment => 
        payment.id.toLowerCase().includes(searchLower) ||
        payment.customer_name.toLowerCase().includes(searchLower) ||
        payment.stripe_payment_intent_id?.toLowerCase().includes(searchLower) ||
        payment.seller_name.toLowerCase().includes(searchLower)
      );
    }

    console.log(`✅ Found ${filteredPayments.length} payments (filtered from ${payments.length} total)`);

    res.json({
      success: true,
      count: filteredPayments.length,
      payments: filteredPayments
    });
  } catch (error) {
    console.error('❌ Error in getAllPayments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch payments',
      details: error.message 
    });
  }
};

/**
 * Get Payment Statistics
 * GET /api/admin/stripe/statistics
 */
const getPaymentStatistics = async (req, res) => {
  try {
    console.log('📊 Calculating payment statistics...');

    // Get all orders with payment data
    const { data: orders, error } = await supabase
      .from('orders')
      .select('amount, status, created_at');

    if (error) {
      console.error('❌ Error fetching orders for statistics:', error);
      throw error;
    }

    // Calculate comprehensive statistics
    const stats = {
      totalRevenue: 0,
      totalPayments: orders.length,
      successfulPayments: 0,
      pendingPayments: 0,
      refundedAmount: 0,
      commissionEarned: 0,
      successRate: 0
    };

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    orders.forEach(order => {
      const amount = order.amount || 0;
      const orderDate = new Date(order.created_at);
      
      if (['paid', 'confirmed', 'packed', 'shipped', 'delivered'].includes(order.status)) {
        stats.totalRevenue += amount;
        stats.successfulPayments++;
        stats.commissionEarned += Math.round(amount * 0.15); // 15% commission
      } else if (['pending_payment', 'processing'].includes(order.status)) {
        stats.pendingPayments++;
      } else if (order.status === 'refunded') {
        stats.refundedAmount += amount;
      }
    });

    // Calculate success rate
    stats.successRate = stats.totalPayments > 0 
      ? ((stats.successfulPayments / stats.totalPayments) * 100).toFixed(1)
      : 0;

    console.log('✅ Payment statistics calculated');

    res.json({
      success: true,
      stats: {
        // Convert from cents to dollars for display
        totalRevenue: stats.totalRevenue / 100,
        totalPayments: stats.totalPayments,
        successfulPayments: stats.successfulPayments,
        pendingPayments: stats.pendingPayments,
        refundedAmount: stats.refundedAmount / 100,
        commissionEarned: stats.commissionEarned / 100,
        successRate: parseFloat(stats.successRate)
      }
    });
  } catch (error) {
    console.error('❌ Error calculating statistics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to calculate statistics',
      details: error.message 
    });
  }
};

/**
 * Process Refund
 * POST /api/admin/stripe/refund/:paymentId
 */
const processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;
    const adminId = req.user.id;
    
    console.log('💰 Processing refund for payment:', paymentId, 'Amount:', amount, 'Reason:', reason);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ 
        success: false,
        error: 'Payment/Order not found' 
      });
    }

    if (!['paid', 'confirmed', 'packed', 'shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Can only refund paid orders' 
      });
    }

    // Calculate refund amount (in cents)
    const refundAmount = amount ? Math.round(parseFloat(amount) * 100) : order.amount;

    // Process Stripe refund if payment intent exists
    if (order.payment_intent_id) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: order.payment_intent_id,
          amount: refundAmount,
          reason: 'requested_by_customer',
          metadata: {
            admin_reason: reason || 'Admin processed refund',
            admin_id: adminId,
            order_id: order.id
          }
        });
        console.log('✅ Stripe refund processed successfully:', refund.id);
      } catch (stripeError) {
        console.error('❌ Stripe refund failed:', stripeError);
        return res.status(400).json({
          success: false,
          error: 'Failed to process refund with payment provider',
          details: stripeError.message
        });
      }
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: refundAmount === order.amount ? 'refunded' : 'partially_refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('❌ Error updating order status:', updateError);
      throw updateError;
    }

    console.log('✅ Refund processed successfully');

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        orderId: paymentId,
        amount: refundAmount / 100,
        reason: reason,
        processedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error processing refund:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process refund',
      details: error.message 
    });
  }
};

/**
 * Process Seller Payout
 * POST /api/admin/stripe/payout
 */
const processPayout = async (req, res) => {
  try {
    const { sellerId, amount, paymentId } = req.body;
    const adminId = req.user.id;

    console.log('💸 Processing payout for seller:', sellerId, 'Amount:', amount);

    if (!sellerId || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Seller ID and valid amount are required'
      });
    }

    // Get seller details
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('*')
      .eq('id', sellerId)
      .eq('role', 'seller')
      .single();

    if (sellerError || !seller) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      });
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);

    // Create payout record (using a simple table structure)
    const { data: payout, error: payoutError } = await supabase
      .from('seller_earnings')
      .insert({
        seller_id: sellerId,
        order_id: paymentId,
        gross_amount: amountInCents,
        net_amount: amountInCents,
        commission_amount: 0,
        commission_rate: 0,
        status: 'paid',
        available_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (payoutError) {
      console.error('❌ Error creating payout record:', payoutError);
      
      // Try alternative approach - update existing earnings or create simple record
      try {
        const { data: simplePayout, error: simpleError } = await supabase
          .from('orders')
          .update({
            payout_status: 'completed',
            payout_processed_at: new Date().toISOString(),
            payout_processed_by: adminId
          })
          .eq('id', paymentId)
          .select()
          .single();

        if (simpleError) throw simpleError;

        console.log('✅ Payout processed via order update');
        
        return res.json({
          success: true,
          message: 'Payout processed successfully',
          payout: {
            id: simplePayout.id,
            sellerId: sellerId,
            amount: parseFloat(amount),
            processedAt: new Date().toISOString()
          }
        });
      } catch (alternativeError) {
        console.error('❌ Alternative payout method failed:', alternativeError);
        throw payoutError; // Throw original error
      }
    }

    console.log('✅ Payout processed successfully');

    res.json({
      success: true,
      message: 'Payout processed successfully',
      payout: {
        id: payout.id,
        sellerId: sellerId,
        amount: parseFloat(amount),
        processedAt: payout.created_at
      }
    });
  } catch (error) {
    console.error('❌ Error processing payout:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process payout',
      details: error.message 
    });
  }
};

/**
 * Get Sellers for Payout Dropdown
 * GET /api/admin/stripe/sellers
 */
const getSellers = async (req, res) => {
  try {
    console.log('👥 Fetching sellers for payout dropdown...');

    const { data: sellers, error } = await supabase
      .from('users')
      .select('id, email, display_name')
      .eq('role', 'seller')
      .eq('status', 'active')
      .order('display_name');

    if (error) {
      console.error('❌ Error fetching sellers:', error);
      throw error;
    }

    // Format sellers for dropdown
    const formattedSellers = sellers.map(seller => ({
      id: seller.id,
      business_name: seller.display_name || seller.email,
      display_name: seller.display_name || seller.email,
      email: seller.email
    }));

    console.log(`✅ Found ${formattedSellers.length} active sellers`);

    res.json({
      success: true,
      count: formattedSellers.length,
      sellers: formattedSellers
    });
  } catch (error) {
    console.error('❌ Error fetching sellers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch sellers',
      details: error.message 
    });
  }
};

/**
 * Get All Seller Earnings Overview (Admin)
 * GET /api/stripe/admin/seller-earnings
 * 
 * Returns comprehensive earnings breakdown for all sellers:
 * - Pending balance (needs processing)
 * - Available balance (ready for payout)
 * - Paid balance (already paid)
 * - Count of pending earnings
 * - Oldest pending earning date
 */
const getAllSellerEarnings = async (req, res) => {
  try {
    console.log('📊 Admin fetching all seller earnings overview...');

    // Get all sellers
    const { data: sellers, error: sellersError } = await supabase
      .from('users')
      .select('id, email, display_name')
      .eq('role', 'seller')
      .eq('status', 'active')
      .order('display_name');

    if (sellersError) {
      console.error('❌ Error fetching sellers:', sellersError);
      throw sellersError;
    }

    // Get all earnings for all sellers
    const { data: allEarnings, error: earningsError } = await supabase
      .from('seller_earnings')
      .select('*')
      .order('created_at', { ascending: true });

    if (earningsError) {
      console.error('❌ Error fetching earnings:', earningsError);
      throw earningsError;
    }

    // Group earnings by seller and calculate balances
    const sellerEarningsMap = new Map();

    allEarnings.forEach(earning => {
      if (!sellerEarningsMap.has(earning.seller_id)) {
        sellerEarningsMap.set(earning.seller_id, {
          pending_balance: 0,
          available_balance: 0,
          paid_balance: 0,
          pending_count: 0,
          oldest_pending_date: null,
          pending_earnings: []
        });
      }

      const sellerData = sellerEarningsMap.get(earning.seller_id);
      const amount = earning.net_amount || 0;

      if (earning.status === 'pending') {
        sellerData.pending_balance += amount;
        sellerData.pending_count++;
        sellerData.pending_earnings.push(earning);
        
        // Track oldest pending date
        if (!sellerData.oldest_pending_date || earning.created_at < sellerData.oldest_pending_date) {
          sellerData.oldest_pending_date = earning.created_at;
        }
      } else if (earning.status === 'available') {
        sellerData.available_balance += amount;
      } else if (earning.status === 'paid') {
        sellerData.paid_balance += amount;
      }
    });

    // Build response with seller details and earnings
    const sellersWithEarnings = sellers.map(seller => {
      const earningsData = sellerEarningsMap.get(seller.id) || {
        pending_balance: 0,
        available_balance: 0,
        paid_balance: 0,
        pending_count: 0,
        oldest_pending_date: null
      };

      return {
        seller_id: seller.id,
        seller_name: seller.display_name || seller.email,
        seller_email: seller.email,
        pending_balance: earningsData.pending_balance / 100, // Convert to dollars
        available_balance: earningsData.available_balance / 100,
        paid_balance: earningsData.paid_balance / 100,
        pending_count: earningsData.pending_count,
        oldest_pending_date: earningsData.oldest_pending_date 
          ? new Date(earningsData.oldest_pending_date).toISOString().split('T')[0]
          : null
      };
    });

    // Filter to only show sellers with earnings
    const sellersWithData = sellersWithEarnings.filter(seller => 
      seller.pending_balance > 0 || 
      seller.available_balance > 0 || 
      seller.paid_balance > 0
    );

    // Calculate totals
    const totals = {
      total_pending: sellersWithData.reduce((sum, s) => sum + s.pending_balance, 0),
      total_available: sellersWithData.reduce((sum, s) => sum + s.available_balance, 0),
      total_paid: sellersWithData.reduce((sum, s) => sum + s.paid_balance, 0),
      sellers_with_pending: sellersWithData.filter(s => s.pending_count > 0).length
    };

    console.log(`✅ Found ${sellersWithData.length} sellers with earnings`);
    console.log(`   - ${totals.sellers_with_pending} sellers have pending earnings`);
    console.log(`   - Total pending: $${totals.total_pending.toFixed(2)}`);
    console.log(`   - Total available: $${totals.total_available.toFixed(2)}`);
    console.log(`   - Total paid: $${totals.total_paid.toFixed(2)}`);

    res.json({
      success: true,
      totals: totals,
      sellers: sellersWithData
    });
  } catch (error) {
    console.error('❌ Error fetching seller earnings overview:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch seller earnings',
      details: error.message 
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentStatistics,
  processRefund,
  processPayout,
  getSellers,
  getAllSellerEarnings
};