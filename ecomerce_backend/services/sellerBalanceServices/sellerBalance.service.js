/**
 * SELLER BALANCE SERVICE
 * 
 * Manages seller financial balances including available, pending, and escrow amounts.
 * Tracks commission paid and provides balance history.
 */

const supabase = require('../../config/supabase');

/**
 * Get or create seller balance
 * 
 * @param {String} sellerId - Seller UUID
 * @returns {Promise<Object>} Seller balance object
 */
const getBalance = async (sellerId) => {
  // Try to get existing balance
  let { data: balance, error } = await supabase
    .from('seller_balances')
    .select('*')
    .eq('seller_id', sellerId)
    .single();
  
  // If balance doesn't exist, create it
  if (error && error.code === 'PGRST116') {
    const { data: newBalance, error: createError } = await supabase
      .from('seller_balances')
      .insert([{
        seller_id: sellerId,
        available_balance: 0,
        pending_balance: 0,
        escrow_balance: 0,
        total_commission_paid: 0
      }])
      .select()
      .single();
    
    if (createError) throw createError;
    return newBalance;
  }
  
  if (error) throw error;
  
  return balance;
};

/**
 * Add amount to escrow balance (when order is placed)
 * 
 * @param {String} sellerId - Seller UUID
 * @param {Number} amount - Amount in cents
 * @param {String} orderId - Order UUID (for reference)
 * @returns {Promise<Object>} Updated balance
 */
const addToEscrow = async (sellerId, amount, orderId) => {
  // Get current balance
  const balance = await getBalance(sellerId);
  
  // Update escrow balance
  const { data, error } = await supabase
    .from('seller_balances')
    .update({
      escrow_balance: balance.escrow_balance + amount
    })
    .eq('seller_id', sellerId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Release amount from escrow to pending (when order is delivered)
 * 
 * @param {String} sellerId - Seller UUID
 * @param {Number} amount - Amount in cents
 * @param {String} orderId - Order UUID (for reference)
 * @returns {Promise<Object>} Updated balance
 */
const releaseFromEscrow = async (sellerId, amount, orderId) => {
  const balance = await getBalance(sellerId);
  
  if (balance.escrow_balance < amount) {
    throw new Error('Insufficient escrow balance');
  }
  
  const { data, error } = await supabase
    .from('seller_balances')
    .update({
      escrow_balance: balance.escrow_balance - amount,
      pending_balance: balance.pending_balance + amount
    })
    .eq('seller_id', sellerId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Add amount to pending balance
 * 
 * @param {String} sellerId - Seller UUID
 * @param {Number} amount - Amount in cents
 * @returns {Promise<Object>} Updated balance
 */
const addToPending = async (sellerId, amount) => {
  const balance = await getBalance(sellerId);
  
  const { data, error } = await supabase
    .from('seller_balances')
    .update({
      pending_balance: balance.pending_balance + amount
    })
    .eq('seller_id', sellerId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Move amount from pending to available (after hold period)
 * 
 * @param {String} sellerId - Seller UUID
 * @param {Number} amount - Amount in cents
 * @returns {Promise<Object>} Updated balance
 */
const movePendingToAvailable = async (sellerId, amount) => {
  const balance = await getBalance(sellerId);
  
  if (balance.pending_balance < amount) {
    throw new Error('Insufficient pending balance');
  }
  
  const { data, error } = await supabase
    .from('seller_balances')
    .update({
      pending_balance: balance.pending_balance - amount,
      available_balance: balance.available_balance + amount
    })
    .eq('seller_id', sellerId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Deduct amount from available balance (for payout)
 * 
 * @param {String} sellerId - Seller UUID
 * @param {Number} amount - Amount in cents
 * @returns {Promise<Object>} Updated balance
 */
const deductFromAvailable = async (sellerId, amount) => {
  const balance = await getBalance(sellerId);
  
  if (balance.available_balance < amount) {
    throw new Error('Insufficient available balance');
  }
  
  const { data, error } = await supabase
    .from('seller_balances')
    .update({
      available_balance: balance.available_balance - amount
    })
    .eq('seller_id', sellerId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Record commission paid
 * 
 * @param {String} sellerId - Seller UUID
 * @param {Number} amount - Commission amount in cents
 * @returns {Promise<Object>} Updated balance
 */
const recordCommission = async (sellerId, amount) => {
  const balance = await getBalance(sellerId);
  
  const { data, error } = await supabase
    .from('seller_balances')
    .update({
      total_commission_paid: balance.total_commission_paid + amount
    })
    .eq('seller_id', sellerId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Get balance history (placeholder - would query payment_transactions)
 * 
 * @param {String} sellerId - Seller UUID
 * @returns {Promise<Array>} Balance history
 */
const getBalanceHistory = async (sellerId) => {
  // This would query payment_transactions table
  // For now, return empty array
  return [];
};

/**
 * Get all seller balances (admin only)
 * 
 * @returns {Promise<Array>} Array of seller balances
 */
const getAllBalances = async () => {
  const { data, error } = await supabase
    .from('seller_balances')
    .select(`
      *,
      users:seller_id (
        id,
        display_name,
        email,
        business_name
      )
    `)
    .order('available_balance', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
};

module.exports = {
  getBalance,
  addToEscrow,
  releaseFromEscrow,
  addToPending,
  movePendingToAvailable,
  deductFromAvailable,
  recordCommission,
  getBalanceHistory,
  getAllBalances
};
