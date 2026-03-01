const supabase = require('../../config/supabase.js');

/**
 * PHASE 2: ENHANCED ORDER SPLITTING WITH PAYMENT SYSTEM
 * =====================================================
 * 
 * This service extends the basic order splitting to include:
 * - Commission calculations
 * - Seller earnings tracking
 * - Payment system integration
 * - Automatic payout scheduling
 */

/**
 * Get commission rate for a seller/category
 * @param {string} sellerId - Seller ID
 * @param {string} categoryId - Product category ID (optional)
 * @returns {Promise<number>} - Commission rate percentage
 */
async function getCommissionRate(sellerId, categoryId = null) {
  try {
    // Get commission settings
    const { data: settings, error } = await supabase
      .from('commission_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error || !settings) {
      console.log('[Commission] Using default rate: 15%');
      return 15.00; // Default 15%
    }

    // Check seller-specific rate first
    if (settings.seller_custom_rates && settings.seller_custom_rates[sellerId]) {
      const rate = settings.seller_custom_rates[sellerId];
      console.log(`[Commission] Using seller-specific rate for ${sellerId}: ${rate}%`);
      return rate;
    }

    // Check category-specific rate
    if (categoryId && settings.category_rates && settings.category_rates[categoryId]) {
      const rate = settings.category_rates[categoryId];
      console.log(`[Commission] Using category rate for ${categoryId}: ${rate}%`);
      return rate;
    }

    // Use default rate
    const rate = settings.default_rate || 15.00;
    console.log(`[Commission] Using default rate: ${rate}%`);
    return rate;

  } catch (error) {
    console.error('[Commission] Error fetching rate:', error);
    return 15.00; // Fallback to 15%
  }
}

/**
 * Calculate seller earnings with commission deduction
 * @param {number} grossAmount - Gross order amount in cents
 * @param {number} commissionRate - Commission rate percentage
 * @returns {Object} - Earnings breakdown
 */
function calculateSellerEarnings(grossAmount, commissionRate) {
  const commissionAmount = Math.round(grossAmount * (commissionRate / 100));
  const processingFee = Math.round(grossAmount * 0.029) + 30; // 2.9% + $0.30 (Stripe fee)
  const platformFee = 0; // Additional platform fees if any
  const netAmount = grossAmount - commissionAmount - processingFee - platformFee;

  return {
    gross_amount: grossAmount,
    commission_amount: commissionAmount,
    commission_rate: commissionRate,
    processing_fee: processingFee,
    platform_fee: platformFee,
    net_amount: Math.max(0, netAmount) // Ensure non-negative
  };
}

/**
 * Enhanced order splitting with payment system integration
 * @param {string} orderId - Parent order ID
 * @param {Array} orderItems - Array of order items with product details
 * @returns {Promise<Object>} - Result with sub-orders and earnings created
 */
async function splitOrderBySellerWithPayments(orderId, orderItems) {
  try {
    console.log(`[Enhanced Order Splitting] Starting for order: ${orderId}`);
    
    // 1. Get product details including seller_id and category
    const productIds = orderItems.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, seller_id, title, sku, price, category_id')
      .in('id', productIds);
    
    if (productsError) {
      console.error('[Enhanced Order Splitting] Error fetching products:', productsError);
      throw new Error('Failed to fetch product details');
    }
    
    // 2. Group items by seller
    const itemsBySeller = {};
    
    for (const item of orderItems) {
      const product = products.find(p => p.id === item.product_id);
      
      if (!product) {
        console.warn(`[Enhanced Order Splitting] Product not found: ${item.product_id}`);
        continue;
      }
      
      const sellerId = product.seller_id;
      
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = {
          items: [],
          category_id: product.category_id
        };
      }
      
      itemsBySeller[sellerId].items.push({
        ...item,
        seller_id: sellerId,
        product_title: product.title,
        product_sku: product.sku,
        category_id: product.category_id
      });
    }
    
    const sellerIds = Object.keys(itemsBySeller);
    console.log(`[Enhanced Order Splitting] Found ${sellerIds.length} seller(s)`);
    
    // 3. If only one seller, still create earnings record
    if (sellerIds.length === 1) {
      const sellerId = sellerIds[0];
      const sellerData = itemsBySeller[sellerId];
      
      // Calculate total for single seller
      const grossAmount = sellerData.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      
      // Get commission rate and calculate earnings
      const commissionRate = await getCommissionRate(sellerId, sellerData.category_id);
      const earnings = calculateSellerEarnings(grossAmount, commissionRate);
      
      // Create seller earnings record
      await createSellerEarningsRecord(orderId, null, sellerId, earnings);
      
      console.log('[Enhanced Order Splitting] Single seller order with earnings tracked');
      return {
        isSplit: false,
        sellerCount: 1,
        sellerId: sellerId,
        earnings: [earnings],
        message: 'Single seller order with earnings tracked'
      };
    }
    
    // 4. Create sub-orders and earnings for each seller
    const subOrders = [];
    const allEarnings = [];
    
    // Get payout settings for holding period
    const { data: payoutSettings } = await supabase
      .from('payout_settings')
      .select('holding_period_days')
      .eq('is_active', true)
      .single();
    
    const holdingDays = payoutSettings?.holding_period_days || 7;
    const availableDate = new Date();
    availableDate.setDate(availableDate.getDate() + holdingDays);
    
    for (const sellerId of sellerIds) {
      const sellerData = itemsBySeller[sellerId];
      const sellerItems = sellerData.items;
      
      // Calculate sub-order total
      const grossAmount = sellerItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      
      // Get commission rate and calculate earnings
      const commissionRate = await getCommissionRate(sellerId, sellerData.category_id);
      const earnings = calculateSellerEarnings(grossAmount, commissionRate);
      
      // Create sub-order with payment details
      const { data: subOrder, error: subOrderError } = await supabase
        .from('sub_orders')
        .insert({
          parent_order_id: orderId,
          seller_id: sellerId,
          items: sellerItems,
          subtotal: grossAmount,
          total_amount: grossAmount,
          commission_rate: earnings.commission_rate,
          commission_amount: earnings.commission_amount,
          seller_payout_amount: earnings.net_amount,
          fulfillment_status: 'pending',
          payout_status: 'pending',
          earnings_available_date: availableDate.toISOString().split('T')[0]
        })
        .select()
        .single();
      
      if (subOrderError) {
        console.error(`[Enhanced Order Splitting] Error creating sub-order for seller ${sellerId}:`, subOrderError);
        continue;
      }
      
      console.log(`[Enhanced Order Splitting] Created sub-order ${subOrder.id} for seller ${sellerId}`);
      
      // Create seller earnings record
      await createSellerEarningsRecord(orderId, subOrder.id, sellerId, earnings, availableDate);
      
      subOrders.push({
        sub_order_id: subOrder.id,
        seller_id: sellerId,
        item_count: sellerItems.length,
        gross_amount: grossAmount,
        net_amount: earnings.net_amount,
        commission_amount: earnings.commission_amount,
        commission_rate: earnings.commission_rate
      });
      
      allEarnings.push(earnings);
    }
    
    console.log(`[Enhanced Order Splitting] Successfully created ${subOrders.length} sub-orders with earnings`);
    
    return {
      isSplit: true,
      sellerCount: sellerIds.length,
      subOrders,
      earnings: allEarnings,
      totalCommission: allEarnings.reduce((sum, e) => sum + e.commission_amount, 0),
      message: `Order split into ${subOrders.length} sub-orders with payment tracking`
    };
    
  } catch (error) {
    console.error('[Enhanced Order Splitting] Error:', error);
    throw error;
  }
}

/**
 * Create seller earnings record
 * @param {string} orderId - Parent order ID
 * @param {string} subOrderId - Sub-order ID (null for single seller)
 * @param {string} sellerId - Seller ID
 * @param {Object} earnings - Earnings breakdown
 * @param {Date} availableDate - When funds become available
 */
async function createSellerEarningsRecord(orderId, subOrderId, sellerId, earnings, availableDate = null) {
  try {
    const defaultAvailableDate = availableDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const earningsData = {
      seller_id: sellerId,
      parent_order_id: orderId,
      gross_amount: earnings.gross_amount,
      commission_amount: earnings.commission_amount,
      processing_fee: earnings.processing_fee,
      platform_fee: earnings.platform_fee,
      net_amount: earnings.net_amount,
      status: 'pending',
      available_date: defaultAvailableDate.toISOString().split('T')[0]
    };
    
    // Add sub_order_id if provided
    if (subOrderId) {
      earningsData.sub_order_id = subOrderId;
    }
    
    const { data: earningsRecord, error: earningsError } = await supabase
      .from('seller_earnings')
      .insert(earningsData)
      .select()
      .single();
    
    if (earningsError) {
      console.error('[Seller Earnings] Error creating record:', earningsError);
      throw earningsError;
    }
    
    console.log(`[Seller Earnings] Created record ${earningsRecord.id} for seller ${sellerId}: $${(earnings.net_amount / 100).toFixed(2)}`);
    
    return earningsRecord;
    
  } catch (error) {
    console.error('[Seller Earnings] Error:', error);
    throw error;
  }
}

/**
 * Update seller earnings status (e.g., when order is shipped/delivered)
 * @param {string} subOrderId - Sub-order ID
 * @param {string} status - New status ('processing', 'available', 'paid')
 */
async function updateSellerEarningsStatus(subOrderId, status) {
  try {
    const { error } = await supabase
      .from('seller_earnings')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('sub_order_id', subOrderId);
    
    if (error) {
      console.error('[Seller Earnings] Error updating status:', error);
      throw error;
    }
    
    console.log(`[Seller Earnings] Updated status to ${status} for sub-order ${subOrderId}`);
    
  } catch (error) {
    console.error('[Seller Earnings] Error:', error);
    throw error;
  }
}

/**
 * Process automatic payouts for eligible sellers
 * This would typically be run as a scheduled job
 */
async function processAutomaticPayouts() {
  try {
    console.log('[Auto Payouts] Starting automatic payout processing...');
    
    // Get payout settings
    const { data: settings } = await supabase
      .from('payout_settings')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (!settings || !settings.auto_payout_enabled) {
      console.log('[Auto Payouts] Automatic payouts disabled');
      return;
    }
    
    const minAmount = settings.minimum_payout_amount || 2000; // $20
    const autoApproveThreshold = settings.auto_approve_threshold || 50000; // $500
    
    // Get sellers with available earnings above minimum
    const { data: eligibleSellers, error } = await supabase
      .from('seller_earnings')
      .select('seller_id, sum(net_amount) as total_available')
      .eq('status', 'available')
      .gte('available_date', new Date().toISOString().split('T')[0])
      .group('seller_id')
      .having('sum(net_amount)', 'gte', minAmount);
    
    if (error) {
      console.error('[Auto Payouts] Error fetching eligible sellers:', error);
      return;
    }
    
    console.log(`[Auto Payouts] Found ${eligibleSellers?.length || 0} eligible sellers`);
    
    for (const seller of eligibleSellers || []) {
      try {
        // Create automatic payout request
        const { data: payout, error: payoutError } = await supabase
          .from('payouts')
          .insert({
            seller_id: seller.seller_id,
            amount: seller.total_available,
            method: 'auto_bank_transfer',
            status: seller.total_available <= autoApproveThreshold ? 'approved' : 'pending_approval',
            requested_at: new Date().toISOString(),
            notes: 'Automatic payout'
          })
          .select()
          .single();
        
        if (payoutError) {
          console.error(`[Auto Payouts] Error creating payout for seller ${seller.seller_id}:`, payoutError);
          continue;
        }
        
        // Update earnings status
        await supabase
          .from('seller_earnings')
          .update({ 
            status: 'processing',
            payout_id: payout.id
          })
          .eq('seller_id', seller.seller_id)
          .eq('status', 'available');
        
        console.log(`[Auto Payouts] Created payout ${payout.id} for seller ${seller.seller_id}: $${(seller.total_available / 100).toFixed(2)}`);
        
      } catch (sellerError) {
        console.error(`[Auto Payouts] Error processing seller ${seller.seller_id}:`, sellerError);
      }
    }
    
    console.log('[Auto Payouts] Automatic payout processing completed');
    
  } catch (error) {
    console.error('[Auto Payouts] Error:', error);
  }
}

/**
 * Get seller earnings summary
 * @param {string} sellerId - Seller ID
 * @returns {Promise<Object>} - Earnings summary
 */
async function getSellerEarningsSummary(sellerId) {
  try {
    const { data: earnings, error } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('seller_id', sellerId);
    
    if (error) {
      console.error('[Seller Summary] Error:', error);
      throw error;
    }
    
    const summary = {
      total_earnings: 0,
      available_balance: 0,
      pending_balance: 0,
      paid_balance: 0,
      total_commission: 0,
      order_count: earnings?.length || 0
    };
    
    earnings?.forEach(earning => {
      const amount = earning.net_amount || earning.amount || 0;
      const commission = earning.commission_amount || 0;
      
      summary.total_earnings += amount;
      summary.total_commission += commission;
      
      if (earning.status === 'available') {
        summary.available_balance += amount;
      } else if (earning.status === 'pending' || earning.status === 'processing') {
        summary.pending_balance += amount;
      } else if (earning.status === 'paid') {
        summary.paid_balance += amount;
      }
    });
    
    return summary;
    
  } catch (error) {
    console.error('[Seller Summary] Error:', error);
    throw error;
  }
}

// Export the enhanced functions
module.exports = {
  splitOrderBySellerWithPayments,
  getCommissionRate,
  calculateSellerEarnings,
  createSellerEarningsRecord,
  updateSellerEarningsStatus,
  processAutomaticPayouts,
  getSellerEarningsSummary
};