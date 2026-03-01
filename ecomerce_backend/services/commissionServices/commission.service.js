/**
 * COMMISSION SERVICE
 * 
 * Handles commission rate configuration and calculations for the multi-vendor platform.
 * Commission rates can be set globally, per category, or per seller.
 */

const supabase = require('../../config/supabase');

/**
 * Get applicable commission rate for a seller and category
 * Priority: Seller-specific > Category-specific > Global
 * 
 * @param {String} sellerId - Seller UUID (optional)
 * @param {String} categoryId - Category UUID (optional)
 * @returns {Promise<Object>} Commission rate object
 */
const getApplicableRate = async (sellerId = null, categoryId = null) => {
  // Try seller-specific rate first
  if (sellerId) {
    const { data: sellerRate } = await supabase
      .from('commission_rates')
      .select('*')
      .eq('rate_type', 'seller')
      .eq('seller_id', sellerId)
      .eq('is_active', true)
      .single();
    
    if (sellerRate) return sellerRate;
  }

  // Try category-specific rate
  if (categoryId) {
    const { data: categoryRate } = await supabase
      .from('commission_rates')
      .select('*')
      .eq('rate_type', 'category')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .single();
    
    if (categoryRate) return categoryRate;
  }

  // Fall back to global rate
  const { data: globalRate, error } = await supabase
    .from('commission_rates')
    .select('*')
    .eq('rate_type', 'global')
    .eq('is_active', true)
    .single();
  
  if (error) {
    // If no global rate exists, return default 10%
    return {
      id: 'default',
      rate_type: 'global',
      commission_percentage: 10.00,
      is_active: true
    };
  }
  
  return globalRate;
};

/**
 * Calculate commission amount
 * 
 * @param {Number} amount - Order amount in cents
 * @param {Number} rate - Commission percentage (e.g., 10.5 for 10.5%)
 * @returns {Number} Commission amount in cents
 */
const calculateCommission = (amount, rate) => {
  return Math.round((amount * rate) / 100);
};

/**
 * Calculate seller payout (amount minus commission)
 * 
 * @param {Number} amount - Order amount in cents
 * @param {Number} commission - Commission amount in cents
 * @returns {Number} Seller payout amount in cents
 */
const calculateSellerPayout = (amount, commission) => {
  return amount - commission;
};

/**
 * Get all commission rates (admin only)
 * 
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of commission rate objects
 */
const getAllRates = async (filters = {}) => {
  let query = supabase
    .from('commission_rates')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.rateType) {
    query = query.eq('rate_type', filters.rateType);
  }

  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get commission rate by ID
 * 
 * @param {String} id - Commission rate UUID
 * @returns {Promise<Object|null>} Commission rate object or null
 */
const findById = async (id) => {
  const { data, error } = await supabase
    .from('commission_rates')
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
 * Create new commission rate (admin only)
 * 
 * @param {Object} rateData - Commission rate data
 * @returns {Promise<Object>} Created commission rate object
 */
const createRate = async (rateData) => {
  const insertData = {
    rate_type: rateData.rateType,
    commission_percentage: rateData.commissionPercentage,
    seller_id: rateData.sellerId || null,
    category_id: rateData.categoryId || null,
    is_active: rateData.isActive !== undefined ? rateData.isActive : true
  };

  // Validate rate type
  if (!['global', 'category', 'seller'].includes(insertData.rate_type)) {
    throw new Error('Invalid rate type. Must be: global, category, or seller');
  }

  // Validate percentage
  if (insertData.commission_percentage < 0 || insertData.commission_percentage > 100) {
    throw new Error('Commission percentage must be between 0 and 100');
  }

  // Validate required fields based on rate type
  if (insertData.rate_type === 'seller' && !insertData.seller_id) {
    throw new Error('Seller ID is required for seller-specific rates');
  }

  if (insertData.rate_type === 'category' && !insertData.category_id) {
    throw new Error('Category ID is required for category-specific rates');
  }

  const { data, error } = await supabase
    .from('commission_rates')
    .insert([insertData])
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Update commission rate (admin only)
 * 
 * @param {String} id - Commission rate UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated commission rate object
 */
const updateRate = async (id, updates) => {
  const updateData = {};

  if (updates.commissionPercentage !== undefined) {
    if (updates.commissionPercentage < 0 || updates.commissionPercentage > 100) {
      throw new Error('Commission percentage must be between 0 and 100');
    }
    updateData.commission_percentage = updates.commissionPercentage;
  }

  if (updates.isActive !== undefined) {
    updateData.is_active = updates.isActive;
  }

  const { data, error } = await supabase
    .from('commission_rates')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Delete commission rate (admin only)
 * 
 * @param {String} id - Commission rate UUID
 * @returns {Promise<Boolean>} Success status
 */
const deleteRate = async (id) => {
  const { error } = await supabase
    .from('commission_rates')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  
  return true;
};

module.exports = {
  getApplicableRate,
  calculateCommission,
  calculateSellerPayout,
  getAllRates,
  findById,
  createRate,
  updateRate,
  deleteRate
};
