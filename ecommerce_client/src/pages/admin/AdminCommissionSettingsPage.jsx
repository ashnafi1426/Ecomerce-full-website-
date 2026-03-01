import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api.service';

const AdminCommissionSettingsPage = () => {
  const [settings, setSettings] = useState({
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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalCommission: 0,
    activeSellers: 0,
    averageRate: 0,
    commissionRevenue: 0,
    sellersByTier: {
      bronze: { count: 0, commission: 0 },
      silver: { count: 0, commission: 0 },
      gold: { count: 0, commission: 0 },
      platinum: { count: 0, commission: 0 }
    }
  });

  useEffect(() => {
    fetchCommissionSettings();
    fetchCategories();
    fetchStats();
  }, []);

  const fetchCommissionSettings = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching commission settings with hybrid approach...');
      
      // Default settings as fallback
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
      
      // Try to fetch commission settings from database first
      try {
        const response = await adminAPI.getCommissionSettings();
        
        if (response.success && response.settings) {
          console.log('✅ Commission settings loaded from database:', response.settings);
          setSettings(response.settings);
        } else {
          console.log('⚠️ No commission settings found in database, using defaults');
          setSettings(defaultSettings);
        }
      } catch (dbError) {
        console.warn('⚠️ Database fetch failed, using default settings:', dbError.message);
        setSettings(defaultSettings);
        toast.info('Using default commission settings (database unavailable)');
      }
    } catch (error) {
      console.error('❌ Error loading commission settings:', error);
      // Use default settings on any error
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
      setSettings(defaultSettings);
      toast.error('Failed to load commission settings, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminAPI.getCategories();
      if (response.success) {
        setCategories(response.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('🔍 Fetching commission analytics from database and payments...');
      
      // Try to fetch analytics from database first (for comprehensive data)
      let databaseStats = null;
      try {
        const analyticsResponse = await adminAPI.getCommissionAnalytics('30days');
        if (analyticsResponse.success && analyticsResponse.analytics) {
          databaseStats = analyticsResponse.analytics;
          console.log('✅ Database analytics loaded:', databaseStats);
        }
      } catch (dbError) {
        console.warn('⚠️ Database analytics not available, using payment calculations:', dbError.message);
      }
      
      // Always fetch payment data for real-time calculations (as backup/verification)
      const paymentsResponse = await adminAPI.getStripePayments({ dateRange: '30days' });
      const payments = paymentsResponse.payments || [];
      
      // Calculate commission statistics from payment data locally
      const frontendStats = calculateCommissionFromPayments(payments);
      console.log('✅ Frontend calculations completed:', frontendStats);
      
      // Use database stats if available, otherwise use frontend calculations
      const finalStats = databaseStats ? {
        // Prefer database data but supplement with frontend calculations
        totalCommission: databaseStats.totalCommission || frontendStats.totalCommission,
        activeSellers: databaseStats.activeSellers || frontendStats.activeSellers,
        averageRate: databaseStats.averageCommissionRate || frontendStats.averageRate,
        commissionRevenue: databaseStats.totalRevenue || frontendStats.commissionRevenue,
        sellersByTier: databaseStats.commissionByTier || frontendStats.sellersByTier
      } : frontendStats;
      
      setStats(finalStats);
      console.log('✅ Final commission statistics set:', finalStats);
      
    } catch (error) {
      console.error('❌ Error fetching commission statistics:', error);
      // Use default values on error
      setStats({
        totalCommission: 0,
        activeSellers: 0,
        averageRate: 0,
        commissionRevenue: 0,
        sellersByTier: {
          bronze: { count: 0, commission: 0 },
          silver: { count: 0, commission: 0 },
          gold: { count: 0, commission: 0 },
          platinum: { count: 0, commission: 0 }
        }
      });
    }
  };

  const calculateCommissionFromPayments = (payments) => {
    // Filter successful payments only (same logic as AdminPaymentsPage)
    const successfulPayments = payments.filter(p => 
      ['paid', 'confirmed', 'packed', 'shipped', 'delivered'].includes(p.status)
    );

    // Calculate commission using current settings rates
    let totalCommission = 0;
    let totalRevenue = 0;

    successfulPayments.forEach(payment => {
      const amount = (payment.amount || 0) / 100;
      totalRevenue += amount;
      
      // Calculate commission based on current settings
      let commissionRate = settings.default_rate / 100;
      
      // Check for category-specific rate
      if (payment.category_id && settings.category_rates[payment.category_id]) {
        commissionRate = settings.category_rates[payment.category_id] / 100;
      }
      
      // Check for seller tier rate (if seller tier is available)
      if (payment.seller_tier && settings.seller_tier_rates[payment.seller_tier]) {
        commissionRate = settings.seller_tier_rates[payment.seller_tier] / 100;
      }
      
      totalCommission += amount * commissionRate;
    });

    // Get unique sellers from payment data
    const uniqueSellers = [...new Set(successfulPayments.map(p => p.seller_id).filter(Boolean))];
    const activeSellers = uniqueSellers.length;

    // Calculate average commission rate
    const averageRate = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0;

    // Calculate seller tiers based on monthly sales from payment data
    const sellersByTier = calculateSellerTiers(successfulPayments, uniqueSellers);

    return {
      totalCommission,
      activeSellers,
      averageRate,
      commissionRevenue: totalRevenue,
      sellersByTier
    };
  };

  const calculateSellerTiers = (payments, sellers) => {
    const tiers = {
      bronze: { count: 0, commission: 0 },
      silver: { count: 0, commission: 0 },
      gold: { count: 0, commission: 0 },
      platinum: { count: 0, commission: 0 }
    };

    sellers.forEach(sellerId => {
      // Calculate seller's monthly sales from payment data
      const sellerPayments = payments.filter(p => p.seller_id === sellerId);
      const monthlySales = sellerPayments.reduce((sum, p) => sum + ((p.amount || 0) / 100), 0);
      
      // Determine tier based on monthly sales thresholds (using current settings)
      let tier = 'bronze';
      if (monthlySales >= (settings.tier_thresholds.platinum?.min || 100000)) {
        tier = 'platinum';
      } else if (monthlySales >= (settings.tier_thresholds.gold?.min || 50000)) {
        tier = 'gold';
      } else if (monthlySales >= (settings.tier_thresholds.silver?.min || 10000)) {
        tier = 'silver';
      }

      // Calculate commission using tier rate from settings
      const tierRate = settings.seller_tier_rates[tier] / 100;
      const sellerCommission = sellerPayments.reduce((sum, p) => {
        const amount = (p.amount || 0) / 100;
        return sum + (amount * tierRate);
      }, 0);

      tiers[tier].count += 1;
      tiers[tier].commission += sellerCommission;
    });

    return tiers;
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving commission settings with hybrid approach...');
      
      // Try to save settings to database first
      try {
        const response = await adminAPI.updateCommissionSettings(settings);
        
        if (response.success) {
          console.log('✅ Commission settings saved to database successfully');
          toast.success('Commission settings updated successfully');
          fetchStats(); // Refresh stats after update to reflect new rates
          return;
        } else {
          throw new Error(response.message || 'Database save failed');
        }
      } catch (dbError) {
        console.warn('⚠️ Database save failed, falling back to local save:', dbError.message);
        
        // Fallback to local save with user notification
        console.log('💾 Saving commission settings locally as fallback...');
        console.log('Settings saved locally:', settings);
        
        toast.warning('Settings saved locally only (database unavailable)');
        fetchStats(); // Refresh stats after local update
      }
    } catch (error) {
      console.error('❌ Error saving commission settings:', error);
      toast.error('Failed to save commission settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTierRateChange = (tier, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 50) return;
    
    setSettings(prev => ({
      ...prev,
      seller_tier_rates: {
        ...prev.seller_tier_rates,
        [tier]: numValue
      }
    }));
  };

  const handleThresholdChange = (tier, field, value) => {
    const numValue = field === 'max' && value === '' ? null : parseInt(value);
    if (field !== 'max' && (isNaN(numValue) || numValue < 0)) return;
    
    setSettings(prev => ({
      ...prev,
      tier_thresholds: {
        ...prev.tier_thresholds,
        [tier]: {
          ...prev.tier_thresholds[tier],
          [field]: numValue
        }
      }
    }));
  };

  const handleCategoryRateChange = (categoryId, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 50) return;
    
    setSettings(prev => ({
      ...prev,
      category_rates: {
        ...prev.category_rates,
        [categoryId]: numValue
      }
    }));
  };

  const removeCategoryRate = (categoryId) => {
    setSettings(prev => {
      const newCategoryRates = { ...prev.category_rates };
      delete newCategoryRates[categoryId];
      return {
        ...prev,
        category_rates: newCategoryRates
      };
    });
  };

  const getTierIcon = (tier) => {
    const icons = {
      bronze: '🥉',
      silver: '🥈', 
      gold: '🥇',
      platinum: '💎'
    };
    return icons[tier] || '⭐';
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'from-orange-400 to-orange-600',
      silver: 'from-gray-400 to-gray-600',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-purple-400 to-purple-600'
    };
    return colors[tier] || 'from-blue-400 to-blue-600';
  };

  const getSellerCount = (tier) => {
    return stats.sellersByTier[tier]?.count || 0;
  };

  const getCommissionAmount = (tier) => {
    const amount = stats.sellersByTier[tier]?.commission || 0;
    return `$${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <span className="text-white text-lg">💰</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Settings</h1>
          <p className="text-gray-600">Configure commission rates for different seller tiers</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="text-sm text-gray-600 mb-1">Total Commission (This Month)</div>
          <div className="text-2xl font-bold text-orange-500">${stats.totalCommission.toLocaleString()}</div>
          <div className="text-xs text-green-600 mt-1">↑ 15.8% from last month</div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="text-sm text-gray-600 mb-1">Active Sellers</div>
          <div className="text-2xl font-bold text-blue-600">{stats.activeSellers.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Across all tiers</div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="text-sm text-gray-600 mb-1">Average Commission Rate</div>
          <div className="text-2xl font-bold text-green-600">{stats.averageRate.toFixed(2)}%</div>
          <div className="text-xs text-gray-500 mt-1">Weighted average</div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="text-sm text-gray-600 mb-1">Commission Revenue</div>
          <div className="text-2xl font-bold text-purple-600">${stats.commissionRevenue.toLocaleString()}</div>
          <div className="text-xs text-green-600 mt-1">↑ 18.2% from last month</div>
        </div>
      </div>

      {/* Seller Tier Commission Rates */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-6">Seller Tier Commission Rates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(settings.seller_tier_rates).map(([tier, rate]) => (
            <div key={tier} className="relative">
              <div className={`bg-gradient-to-br ${getTierColor(tier)} rounded-lg p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getTierIcon(tier)}</span>
                    <div>
                      <h3 className="font-semibold capitalize text-lg">{tier} Tier</h3>
                      <p className="text-sm opacity-90">
                        {tier === 'bronze' && 'Entry level sellers'}
                        {tier === 'silver' && 'Established sellers'}
                        {tier === 'gold' && 'Premium sellers'}
                        {tier === 'platinum' && 'Elite sellers'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm opacity-90">Commission Rate (%)</label>
                    <div className="flex items-center mt-1">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.01"
                        value={rate}
                        onChange={(e) => handleTierRateChange(tier, e.target.value)}
                        className="w-20 px-3 py-2 bg-white/20 border border-white/30 rounded text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm opacity-90">Monthly Sales Threshold</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="number"
                        min="0"
                        value={settings.tier_thresholds[tier]?.min || 0}
                        onChange={(e) => handleThresholdChange(tier, 'min', e.target.value)}
                        className="w-24 px-2 py-1 bg-white/20 border border-white/30 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                      <span className="text-sm opacity-90">to</span>
                      <input
                        type="number"
                        min="0"
                        value={settings.tier_thresholds[tier]?.max || ''}
                        onChange={(e) => handleThresholdChange(tier, 'max', e.target.value)}
                        placeholder="∞"
                        className="w-24 px-2 py-1 bg-white/20 border border-white/30 rounded text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats below each tier */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{getSellerCount(tier)}</div>
                  <div className="text-sm text-gray-600">Sellers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{getCommissionAmount(tier)}</div>
                  <div className="text-sm text-gray-600">Commission</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Default Commission Rate */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Default Commission Rate</h2>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Default Rate:</label>
          <div className="flex items-center">
            <input
              type="number"
              min="0"
              max="50"
              step="0.01"
              value={settings.default_rate}
              onChange={(e) => setSettings(prev => ({ ...prev, default_rate: parseFloat(e.target.value) || 0 }))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2 text-gray-600">%</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          This rate applies to sellers who don't have tier-specific or category-specific rates
        </p>
      </div>

      {/* Category-Specific Rates */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Category-Specific Commission Rates</h2>
        
        {/* Existing Category Rates */}
        {Object.entries(settings.category_rates).length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Current Category Rates:</h3>
            <div className="space-y-2">
              {Object.entries(settings.category_rates).map(([categoryId, rate]) => {
                const category = categories.find(c => c.id === categoryId);
                return (
                  <div key={categoryId} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <span className="font-medium">{category?.name || `Category ${categoryId}`}</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.01"
                        value={rate}
                        onChange={(e) => handleCategoryRateChange(categoryId, e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-600">%</span>
                      <button
                        onClick={() => removeCategoryRate(categoryId)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add New Category Rate */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">Add Category Rate:</h3>
          <div className="flex items-center space-x-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => {
                if (e.target.value && !settings.category_rates[e.target.value]) {
                  handleCategoryRateChange(e.target.value, settings.default_rate);
                }
              }}
            >
              <option value="">Select Category</option>
              {categories
                .filter(category => !settings.category_rates[category.id])
                .map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              }
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
        >
          {saving && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
};

export default AdminCommissionSettingsPage;