const supabase = require('../../config/supabase.js');

/**
 * COMMISSION MANAGEMENT CONTROLLER
 * ================================
 * 
 * Handles all commission-related operations:
 * - Commission settings management
 * - Tier-based commission rates
 * - Commission analytics and reporting
 * - Seller commission tracking
 * - Admin commission configuration
 */

/**
 * Get Commission Settings
 * GET /api/admin/commission-settings
 */
const getCommissionSettings = async (req, res) => {
  try {
    console.log('[getCommissionSettings] Fetching commission settings');

    // Get current commission settings
    const { data: settings, error: settingsError } = await supabase
      .from('commission_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('[getCommissionSettings] Error fetching settings:', settingsError);
      throw settingsError;
    }

    // Default settings if none exist
    const defaultSettings = {
      default_rate: 15.00,
      category_rates: {},
      seller_tier_rates: {
        bronze: 15.00,
        silver: 12.00,
        gold: 10.00,
        platinum: 8.00
      },
      tier_thresholds: {
        bronze: { min: 0, max: 10000 },
        silver: { min: 10000, max: 50000 },
        gold: { min: 50000, max: 100000 },
        platinum: { min: 100000, max: null }
      }
    };

    const currentSettings = settings || defaultSettings;

    res.json({
      success: true,
      settings: currentSettings
    });

  } catch (error) {
    console.error('Error in getCommissionSettings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch commission settings',
      error: error.message 
    });
  }
};

/**
 * Update Commission Settings
 * PUT /api/admin/commission-settings
 */
const updateCommissionSettings = async (req, res) => {
  try {
    const { 
      default_rate, 
      category_rates, 
      seller_tier_rates, 
      tier_thresholds 
    } = req.body;

    console.log('[updateCommissionSettings] Updating settings:', req.body);

    // Validate commission rates
    if (default_rate && (default_rate < 0 || default_rate > 50)) {
      return res.status(400).json({
        success: false,
        message: 'Default commission rate must be between 0% and 50%'
      });
    }

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('commission_settings')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const settingsData = {
      default_rate: default_rate || 15.00,
      category_rates: category_rates || {},
      seller_tier_rates: seller_tier_rates || {
        bronze: 15.00,
        silver: 12.00,
        gold: 10.00,
        platinum: 8.00
      },
      tier_thresholds: tier_thresholds || {
        bronze: { min: 0, max: 10000 },
        silver: { min: 10000, max: 50000 },
        gold: { min: 50000, max: 100000 },
        platinum: { min: 100000, max: null }
      },
      updated_at: new Date().toISOString(),
      updated_by: req.user.id
    };

    let result;
    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('commission_settings')
        .update(settingsData)
        .eq('id', existingSettings.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('commission_settings')
        .insert([settingsData])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({
      success: true,
      message: 'Commission settings updated successfully',
      settings: result
    });

  } catch (error) {
    console.error('Error in updateCommissionSettings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update commission settings',
      error: error.message 
    });
  }
};

/**
 * Get Commission Analytics
 * GET /api/admin/commission-analytics
 */
const getCommissionAnalytics = async (req, res) => {
  try {
    const { period = '30days' } = req.query;
    
    console.log('[getCommissionAnalytics] Fetching analytics for period:', period);

    // Calculate date range
    let dateFilter = new Date();
    switch (period) {
      case '7days':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30days':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case '90days':
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      case '1year':
        dateFilter.setFullYear(dateFilter.getFullYear() - 1);
        break;
      default:
        dateFilter.setDate(dateFilter.getDate() - 30);
    }

    // Get commission data from seller_earnings
    const { data: earnings, error: earningsError } = await supabase
      .from('seller_earnings')
      .select(`
        *,
        users!seller_id (
          id,
          email
        )
      `)
      .gte('created_at', dateFilter.toISOString());

    if (earningsError) {
      console.error('[getCommissionAnalytics] Error fetching earnings:', earningsError);
      throw earningsError;
    }

    // Calculate analytics
    const analytics = {
      totalCommission: 0,
      totalRevenue: 0,
      totalSellerPayouts: 0,
      activeSellers: new Set(),
      averageCommissionRate: 0,
      commissionByTier: {
        bronze: { count: 0, commission: 0, revenue: 0 },
        silver: { count: 0, commission: 0, revenue: 0 },
        gold: { count: 0, commission: 0, revenue: 0 },
        platinum: { count: 0, commission: 0, revenue: 0 }
      },
      dailyCommission: {},
      topSellersByCommission: []
    };

    const sellerStats = {};

    earnings?.forEach(earning => {
      const commission = earning.commission_amount || 0;
      const sellerPayout = earning.net_amount || 0;
      const grossAmount = earning.gross_amount || 0;
      const sellerId = earning.seller_id;

      analytics.totalCommission += commission;
      analytics.totalSellerPayouts += sellerPayout;
      analytics.totalRevenue += grossAmount;
      analytics.activeSellers.add(sellerId);

      // Track seller stats
      if (!sellerStats[sellerId]) {
        sellerStats[sellerId] = {
          sellerId,
          sellerName: earning.users ? earning.users.email : 'Unknown',
          commission: 0,
          revenue: 0,
          orders: 0
        };
      }

      sellerStats[sellerId].commission += commission;
      sellerStats[sellerId].revenue += grossAmount;
      sellerStats[sellerId].orders += 1;

      // Daily commission tracking
      const date = new Date(earning.created_at).toISOString().split('T')[0];
      if (!analytics.dailyCommission[date]) {
        analytics.dailyCommission[date] = 0;
      }
      analytics.dailyCommission[date] += commission;
    });

    // Convert cents to dollars
    analytics.totalCommission = analytics.totalCommission / 100;
    analytics.totalRevenue = analytics.totalRevenue / 100;
    analytics.totalSellerPayouts = analytics.totalSellerPayouts / 100;
    analytics.activeSellers = analytics.activeSellers.size;

    // Calculate average commission rate
    if (analytics.totalRevenue > 0) {
      analytics.averageCommissionRate = (analytics.totalCommission / analytics.totalRevenue) * 100;
    }

    // Get top sellers by commission
    analytics.topSellersByCommission = Object.values(sellerStats)
      .map(seller => ({
        ...seller,
        commission: seller.commission / 100,
        revenue: seller.revenue / 100
      }))
      .sort((a, b) => b.commission - a.commission)
      .slice(0, 10);

    // Convert daily commission to dollars
    Object.keys(analytics.dailyCommission).forEach(date => {
      analytics.dailyCommission[date] = analytics.dailyCommission[date] / 100;
    });

    res.json({
      success: true,
      analytics,
      period
    });

  } catch (error) {
    console.error('Error in getCommissionAnalytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch commission analytics',
      error: error.message 
    });
  }
};

/**
 * Get Seller Commission Details
 * GET /api/seller/commission-details
 */
const getSellerCommissionDetails = async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    console.log('[getSellerCommissionDetails] Fetching details for seller:', sellerId);

    // Get seller's earnings history
    const { data: earnings, error: earningsError } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (earningsError) {
      console.error('[getSellerCommissionDetails] Error fetching earnings:', earningsError);
      throw earningsError;
    }

    // Calculate seller's monthly sales to determine tier
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEarnings = earnings?.filter(earning => 
      new Date(earning.created_at) >= thirtyDaysAgo
    ) || [];

    const monthlySales = recentEarnings.reduce((sum, earning) => 
      sum + (earning.gross_amount || 0), 0
    ) / 100; // Convert to dollars

    // Determine seller tier
    let tier = 'bronze';
    let commissionRate = 15.00;

    if (monthlySales >= 100000) {
      tier = 'platinum';
      commissionRate = 8.00;
    } else if (monthlySales >= 50000) {
      tier = 'gold';
      commissionRate = 10.00;
    } else if (monthlySales >= 10000) {
      tier = 'silver';
      commissionRate = 12.00;
    }

    // Calculate statistics
    const stats = {
      totalEarnings: 0,
      totalCommissionPaid: 0,
      totalOrders: earnings?.length || 0,
      monthlySales,
      currentTier: tier,
      currentCommissionRate: commissionRate,
      nextTierThreshold: tier === 'bronze' ? 10000 : 
                        tier === 'silver' ? 50000 : 
                        tier === 'gold' ? 100000 : null
    };

    earnings?.forEach(earning => {
      stats.totalEarnings += (earning.net_amount || 0) / 100;
      stats.totalCommissionPaid += (earning.commission_amount || 0) / 100;
    });

    // Format earnings for display
    const formattedEarnings = earnings?.map(earning => ({
      ...earning,
      net_amount: (earning.net_amount || 0) / 100,
      commission_amount: (earning.commission_amount || 0) / 100,
      gross_amount: (earning.gross_amount || 0) / 100
    })) || [];

    res.json({
      success: true,
      stats,
      earnings: formattedEarnings,
      tierInfo: {
        bronze: { threshold: '< $10,000', rate: '15%', benefits: 'Standard support' },
        silver: { threshold: '$10,000 - $50,000', rate: '12%', benefits: 'Priority support' },
        gold: { threshold: '$50,000 - $100,000', rate: '10%', benefits: 'Premium support, featured placement' },
        platinum: { threshold: '> $100,000', rate: '8%', benefits: 'VIP support, auto-approval' }
      }
    });

  } catch (error) {
    console.error('Error in getSellerCommissionDetails:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch commission details',
      error: error.message 
    });
  }
};

/**
 * Calculate Commission for Order
 * Utility function used by order processing
 */
const calculateCommission = async (sellerId, orderAmount, categoryId = null) => {
  try {
    // Get commission settings
    const { data: settings } = await supabase
      .from('commission_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    let commissionRate = 15.00; // Default rate

    if (settings) {
      // Check for category-specific rate
      if (categoryId && settings.category_rates && settings.category_rates[categoryId]) {
        commissionRate = settings.category_rates[categoryId];
      } else {
        // Calculate seller tier based on monthly sales
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentEarnings } = await supabase
          .from('seller_earnings')
          .select('gross_amount')
          .eq('seller_id', sellerId)
          .gte('created_at', thirtyDaysAgo.toISOString());

        const monthlySales = recentEarnings?.reduce((sum, earning) => 
          sum + (earning.gross_amount || 0), 0
        ) || 0;

        // Determine tier-based rate
        if (monthlySales >= 10000000) { // $100,000 in cents
          commissionRate = settings.seller_tier_rates?.platinum || 8.00;
        } else if (monthlySales >= 5000000) { // $50,000 in cents
          commissionRate = settings.seller_tier_rates?.gold || 10.00;
        } else if (monthlySales >= 1000000) { // $10,000 in cents
          commissionRate = settings.seller_tier_rates?.silver || 12.00;
        } else {
          commissionRate = settings.seller_tier_rates?.bronze || 15.00;
        }
      }
    }

    const commissionAmount = Math.round(orderAmount * (commissionRate / 100));
    const sellerPayout = orderAmount - commissionAmount;

    return {
      commissionRate,
      commissionAmount,
      sellerPayout,
      grossAmount: orderAmount
    };

  } catch (error) {
    console.error('Error calculating commission:', error);
    // Return default calculation on error
    const commissionAmount = Math.round(orderAmount * 0.15);
    return {
      commissionRate: 15.00,
      commissionAmount,
      sellerPayout: orderAmount - commissionAmount,
      grossAmount: orderAmount
    };
  }
};

module.exports = {
  getCommissionSettings,
  updateCommissionSettings,
  getCommissionAnalytics,
  getSellerCommissionDetails,
  calculateCommission
};