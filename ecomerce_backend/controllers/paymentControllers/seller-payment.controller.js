const supabase = require('../../config/supabase.js');

/**
 * PHASE 2: SELLER PAYMENT SYSTEM CONTROLLERS
 * ==========================================
 * 
 * These controllers handle the multi-vendor payment system:
 * - Seller earnings tracking
 * - Payout requests and processing
 * - Commission calculations
 * - Payment account management
 */

/**
 * Get Seller Earnings Dashboard
 * GET /api/seller/earnings
 */
const getSellerEarnings = async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    console.log('[getSellerEarnings] Fetching earnings for seller:', sellerId);

    // Get all earnings for this seller
    const { data: earnings, error: earningsError } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (earningsError) {
      console.error('[getSellerEarnings] Error fetching earnings:', earningsError);
      throw earningsError;
    }

    // Calculate totals
    const stats = {
      total_earnings: 0,
      available_balance: 0,
      pending_balance: 0,
      paid_balance: 0,
      total_orders: earnings?.length || 0,
      commission_paid: 0
    };

    earnings?.forEach(earning => {
      const amount = earning.net_amount || 0;
      const commission = earning.commission_amount || 0;
      
      stats.total_earnings += amount;
      stats.commission_paid += commission;
      
      if (earning.status === 'available') {
        stats.available_balance += amount;
      } else if (earning.status === 'pending' || earning.status === 'processing') {
        stats.pending_balance += amount;
      } else if (earning.status === 'paid') {
        stats.paid_balance += amount;
      }
    });

    // Get recent payouts
    const { data: payouts, error: payoutsError } = await supabase
      .from('payouts')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (payoutsError) {
      console.error('[getSellerEarnings] Error fetching payouts:', payoutsError);
    }

    res.json({
      success: true,
      stats: {
        ...stats,
        // Convert from cents to dollars for display
        total_earnings: stats.total_earnings / 100,
        available_balance: stats.available_balance / 100,
        pending_balance: stats.pending_balance / 100,
        paid_balance: stats.paid_balance / 100,
        commission_paid: stats.commission_paid / 100
      },
      earnings: earnings?.map(earning => ({
        ...earning,
        net_amount: (earning.net_amount || 0) / 100,
        commission_amount: (earning.commission_amount || 0) / 100,
        gross_amount: (earning.gross_amount || 0) / 100
      })) || [],
      payouts: payouts?.map(payout => ({
        ...payout,
        amount: (payout.amount || 0) / 100,
        net_amount: (payout.net_amount || 0) / 100
      })) || []
    });

  } catch (error) {
    console.error('Error in getSellerEarnings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch seller earnings',
      message: error.message 
    });
  }
};

/**
 * Request Payout
 * POST /api/seller/payouts/request
 */
const requestPayout = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { amount, method, account_details } = req.body;

    console.log('[requestPayout] Payout request:', { sellerId, amount, method });

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payout amount' });
    }

    if (!method || !['bank_transfer', 'paypal', 'stripe_connect'].includes(method)) {
      return res.status(400).json({ error: 'Invalid payout method' });
    }

    // Convert amount to cents
    const amountInCents = Math.round(amount * 100);

    // Check available balance
    const { data: earnings, error: earningsError } = await supabase
      .from('seller_earnings')
      .select('net_amount')
      .eq('seller_id', sellerId)
      .eq('status', 'available');

    if (earningsError) {
      console.error('[requestPayout] Error fetching available earnings:', earningsError);
      throw earningsError;
    }

    const availableBalance = earnings?.reduce((sum, earning) => {
      return sum + (earning.net_amount || 0);
    }, 0) || 0;

    if (amountInCents > availableBalance) {
      return res.status(400).json({ 
        error: 'Insufficient available balance',
        available: availableBalance / 100,
        requested: amount
      });
    }

    // Get payout settings for validation
    const { data: payoutSettings } = await supabase
      .from('payout_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    const minPayout = payoutSettings?.minimum_payout_amount || 2000; // $20 default
    const maxPayout = payoutSettings?.maximum_payout_amount || 10000000; // $100k default

    if (amountInCents < minPayout) {
      return res.status(400).json({ 
        error: 'Amount below minimum payout threshold',
        minimum: minPayout / 100
      });
    }

    if (amountInCents > maxPayout) {
      return res.status(400).json({ 
        error: 'Amount exceeds maximum payout limit',
        maximum: maxPayout / 100
      });
    }

    // Create payout request
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert({
        seller_id: sellerId,
        amount: amountInCents,
        method: method,
        status: 'pending_approval',
        account_details: account_details || {},
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (payoutError) {
      console.error('[requestPayout] Error creating payout:', payoutError);
      throw payoutError;
    }

    // Update earnings status to 'processing' for the requested amount
    let remainingAmount = amountInCents;
    const earningsToUpdate = [];

    for (const earning of earnings) {
      if (remainingAmount <= 0) break;
      
      const earningAmount = earning.net_amount || 0;
      if (earningAmount <= remainingAmount) {
        earningsToUpdate.push(earning.id);
        remainingAmount -= earningAmount;
      }
    }

    // Update earnings status
    if (earningsToUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from('seller_earnings')
        .update({ 
          status: 'processing',
          payout_id: payout.id
        })
        .in('id', earningsToUpdate);

      if (updateError) {
        console.error('[requestPayout] Error updating earnings:', updateError);
      }
    }

    res.json({
      success: true,
      message: 'Payout request submitted successfully',
      payout: {
        ...payout,
        amount: payout.amount / 100
      }
    });

  } catch (error) {
    console.error('Error in requestPayout:', error);
    res.status(500).json({ 
      error: 'Failed to request payout',
      message: error.message 
    });
  }
};

/**
 * Get Seller Payouts
 * GET /api/seller/payouts
 */
const getSellerPayouts = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('payouts')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: payouts, error } = await query;

    if (error) {
      console.error('[getSellerPayouts] Error:', error);
      throw error;
    }

    res.json({
      success: true,
      payouts: payouts?.map(payout => ({
        ...payout,
        amount: (payout.amount || 0) / 100,
        net_amount: (payout.net_amount || 0) / 100,
        processing_fee: (payout.processing_fee || 0) / 100
      })) || []
    });

  } catch (error) {
    console.error('Error in getSellerPayouts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payouts',
      message: error.message 
    });
  }
};

/**
 * ADMIN: Get All Payouts
 * GET /api/admin/payouts
 */
const getAllPayouts = async (req, res) => {
  try {
    const { status, seller_id, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('payouts')
      .select(`
        *,
        users!inner(email, id)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (seller_id) {
      query = query.eq('seller_id', seller_id);
    }

    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: payouts, error } = await query;

    if (error) {
      console.error('[getAllPayouts] Error:', error);
      throw error;
    }

    res.json({
      success: true,
      payouts: payouts?.map(payout => ({
        ...payout,
        amount: (payout.amount || 0) / 100,
        net_amount: (payout.net_amount || 0) / 100,
        processing_fee: (payout.processing_fee || 0) / 100,
        seller_email: payout.users?.email
      })) || []
    });

  } catch (error) {
    console.error('Error in getAllPayouts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payouts',
      message: error.message 
    });
  }
};

/**
 * ADMIN: Approve Payout
 * POST /api/admin/payouts/:id/approve
 */
const approvePayout = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    console.log('[approvePayout] Approving payout:', id, 'by admin:', adminId);

    // Get payout details
    const { data: payout, error: fetchError } = await supabase
      .from('payouts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    if (payout.status !== 'pending_approval') {
      return res.status(400).json({ 
        error: 'Payout is not pending approval',
        current_status: payout.status
      });
    }

    // Update payout status
    const { error: updateError } = await supabase
      .from('payouts')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: adminId
      })
      .eq('id', id);

    if (updateError) {
      console.error('[approvePayout] Error updating payout:', updateError);
      throw updateError;
    }

    // In a real implementation, you would:
    // 1. Process the actual money transfer (Stripe Connect, bank transfer, etc.)
    // 2. Update status to 'processing' then 'completed'
    // 3. Handle any transfer failures

    res.json({
      success: true,
      message: 'Payout approved successfully',
      payout_id: id
    });

  } catch (error) {
    console.error('Error in approvePayout:', error);
    res.status(500).json({ 
      error: 'Failed to approve payout',
      message: error.message 
    });
  }
};

/**
 * ADMIN: Reject Payout
 * POST /api/admin/payouts/:id/reject
 */
const rejectPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    console.log('[rejectPayout] Rejecting payout:', id, 'by admin:', adminId);

    // Get payout details
    const { data: payout, error: fetchError } = await supabase
      .from('payouts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    if (payout.status !== 'pending_approval') {
      return res.status(400).json({ 
        error: 'Payout is not pending approval',
        current_status: payout.status
      });
    }

    // Update payout status
    const { error: updateError } = await supabase
      .from('payouts')
      .update({
        status: 'rejected',
        failure_reason: reason || 'Rejected by admin',
        approved_by: adminId,
        approved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('[rejectPayout] Error updating payout:', updateError);
      throw updateError;
    }

    // Release earnings back to 'available' status
    const { error: earningsError } = await supabase
      .from('seller_earnings')
      .update({
        status: 'available',
        payout_id: null
      })
      .eq('payout_id', id);

    if (earningsError) {
      console.error('[rejectPayout] Error releasing earnings:', earningsError);
    }

    res.json({
      success: true,
      message: 'Payout rejected successfully',
      payout_id: id,
      reason: reason
    });

  } catch (error) {
    console.error('Error in rejectPayout:', error);
    res.status(500).json({ 
      error: 'Failed to reject payout',
      message: error.message 
    });
  }
};

/**
 * Get Commission Settings
 * GET /api/admin/commission-settings
 */
const getCommissionSettings = async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('commission_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('[getCommissionSettings] Error:', error);
      throw error;
    }

    // Return default settings if none found
    const defaultSettings = {
      default_rate: 15.00,
      category_rates: {},
      seller_custom_rates: {},
      transaction_fee: 30,
      listing_fee: 0,
      subscription_fee: 0
    };

    res.json({
      success: true,
      settings: settings || defaultSettings
    });

  } catch (error) {
    console.error('Error in getCommissionSettings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch commission settings',
      message: error.message 
    });
  }
};

/**
 * Update Commission Settings
 * PUT /api/admin/commission-settings
 */
const updateCommissionSettings = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { 
      default_rate, 
      category_rates, 
      seller_custom_rates, 
      transaction_fee, 
      listing_fee, 
      subscription_fee 
    } = req.body;

    console.log('[updateCommissionSettings] Updating by admin:', adminId);

    // Validate rates
    if (default_rate && (default_rate < 0 || default_rate > 100)) {
      return res.status(400).json({ error: 'Default rate must be between 0 and 100' });
    }

    const updateData = {
      updated_at: new Date().toISOString(),
      updated_by: adminId
    };

    if (default_rate !== undefined) updateData.default_rate = default_rate;
    if (category_rates !== undefined) updateData.category_rates = category_rates;
    if (seller_custom_rates !== undefined) updateData.seller_custom_rates = seller_custom_rates;
    if (transaction_fee !== undefined) updateData.transaction_fee = transaction_fee;
    if (listing_fee !== undefined) updateData.listing_fee = listing_fee;
    if (subscription_fee !== undefined) updateData.subscription_fee = subscription_fee;

    // Try to update existing settings
    const { data: updated, error: updateError } = await supabase
      .from('commission_settings')
      .update(updateData)
      .eq('is_active', true)
      .select()
      .single();

    if (updateError && updateError.code === 'PGRST116') {
      // No existing settings, create new
      const { data: created, error: createError } = await supabase
        .from('commission_settings')
        .insert({
          ...updateData,
          is_active: true,
          effective_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (createError) {
        console.error('[updateCommissionSettings] Error creating:', createError);
        throw createError;
      }

      return res.json({
        success: true,
        message: 'Commission settings created successfully',
        settings: created
      });
    }

    if (updateError) {
      console.error('[updateCommissionSettings] Error updating:', updateError);
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Commission settings updated successfully',
      settings: updated
    });

  } catch (error) {
    console.error('Error in updateCommissionSettings:', error);
    res.status(500).json({ 
      error: 'Failed to update commission settings',
      message: error.message 
    });
  }
};

/**
 * Get Payout Settings
 * GET /api/admin/payout-settings
 */
const getPayoutSettings = async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('payout_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[getPayoutSettings] Error:', error);
      throw error;
    }

    // Return default settings if none found
    const defaultSettings = {
      holding_period_days: 7,
      minimum_payout_amount: 2000, // $20
      maximum_payout_amount: 10000000, // $100k
      auto_payout_enabled: false,
      require_manual_approval: true,
      auto_approve_threshold: 50000 // $500
    };

    res.json({
      success: true,
      settings: settings || defaultSettings
    });

  } catch (error) {
    console.error('Error in getPayoutSettings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payout settings',
      message: error.message 
    });
  }
};

/**
 * Update Payout Settings
 * PUT /api/admin/payout-settings
 */
const updatePayoutSettings = async (req, res) => {
  try {
    const adminId = req.user.id;
    const settings = req.body;

    console.log('[updatePayoutSettings] Updating by admin:', adminId);

    const updateData = {
      ...settings,
      updated_at: new Date().toISOString(),
      updated_by: adminId
    };

    // Try to update existing settings
    const { data: updated, error: updateError } = await supabase
      .from('payout_settings')
      .update(updateData)
      .eq('is_active', true)
      .select()
      .single();

    if (updateError && updateError.code === 'PGRST116') {
      // No existing settings, create new
      const { data: created, error: createError } = await supabase
        .from('payout_settings')
        .insert({
          ...updateData,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('[updatePayoutSettings] Error creating:', createError);
        throw createError;
      }

      return res.json({
        success: true,
        message: 'Payout settings created successfully',
        settings: created
      });
    }

    if (updateError) {
      console.error('[updatePayoutSettings] Error updating:', updateError);
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Payout settings updated successfully',
      settings: updated
    });

  } catch (error) {
    console.error('Error in updatePayoutSettings:', error);
    res.status(500).json({ 
      error: 'Failed to update payout settings',
      message: error.message 
    });
  }
};

module.exports = {
  getSellerEarnings,
  requestPayout,
  getSellerPayouts,
  getAllPayouts,
  approvePayout,
  rejectPayout,
  getCommissionSettings,
  updateCommissionSettings,
  getPayoutSettings,
  updatePayoutSettings
};