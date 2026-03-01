/**
 * SELLER SERVICE
 * 
 * Business logic for seller-specific operations including:
 * - Seller registration and verification
 * - Document management
 * - Performance metrics
 * - Earnings and payouts
 */

const supabase = require('../../config/supabase');

/**
 * Register as seller (upgrade customer account to seller)
 * 
 * @param {String} userId - User UUID
 * @param {Object} sellerData - Seller registration data
 * @returns {Promise<Object>} Updated user object
 */
const registerSeller = async (userId, sellerData) => {
  // Update user role to seller
  const { data, error } = await supabase
    .from('users')
    .update({
      role: 'seller',
      business_name: sellerData.businessName,
      business_address: sellerData.businessAddress,
      tax_id: sellerData.taxId,
      seller_verification_status: 'pending'
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Initialize seller performance record
  await supabase
    .from('seller_performance')
    .insert([{ seller_id: userId }])
    .select();
  
  // Initialize seller balance
  await supabase
    .from('seller_balances')
    .insert([{ seller_id: userId }])
    .select();
  
  return data;
};

/**
 * Get seller profile
 * 
 * @param {String} sellerId - Seller UUID
 * @returns {Promise<Object>} Seller profile with performance metrics
 */
const getSellerProfile = async (sellerId) => {
  const { data: seller, error } = await supabase
    .from('users')
    .select(`
      *,
      seller_performance (*),
      seller_balances (*)
    `)
    .eq('id', sellerId)
    .single();
  
  if (error) throw error;
  
  return seller;
};

/**
 * Upload seller document
 * 
 * @param {String} sellerId - Seller UUID
 * @param {Object} documentData - Document data
 * @returns {Promise<Object>} Created document record
 */
const uploadDocument = async (sellerId, documentData) => {
  const { data, error } = await supabase
    .from('seller_documents')
    .insert([{
      seller_id: sellerId,
      document_type: documentData.documentType,
      document_url: documentData.documentUrl,
      document_name: documentData.documentName,
      file_size: documentData.fileSize,
      mime_type: documentData.mimeType
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Get seller documents
 * 
 * @param {String} sellerId - Seller UUID
 * @returns {Promise<Array>} Array of documents
 */
const getDocuments = async (sellerId) => {
  const { data, error } = await supabase
    .from('seller_documents')
    .select('*')
    .eq('seller_id', sellerId)
    .order('uploaded_at', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Verify seller (manager/admin only)
 * 
 * @param {String} sellerId - Seller UUID
 * @param {String} verifiedBy - Manager/Admin UUID
 * @param {String} status - Verification status ('verified' or 'rejected')
 * @param {String} reason - Rejection reason (optional)
 * @returns {Promise<Object>} Updated user object
 */
const verifySeller = async (sellerId, verifiedBy, status, reason = null) => {
  const updateData = {
    seller_verification_status: status,
    seller_verified_at: new Date().toISOString(),
    seller_verified_by: verifiedBy
  };
  
  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', sellerId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Create notification for seller
  await supabase.rpc('create_notification', {
    p_user_id: sellerId,
    p_type: 'seller_verification',
    p_title: status === 'verified' ? 'Seller Account Verified' : 'Seller Verification Rejected',
    p_message: status === 'verified' 
      ? 'Congratulations! Your seller account has been verified. You can now start listing products.'
      : `Your seller verification was rejected. Reason: ${reason || 'Please contact support for details.'}`,
    p_priority: 'high'
  });
  
  return data;
};

/**
 * Verify seller document (manager/admin only)
 * 
 * @param {String} documentId - Document UUID
 * @param {String} verifiedBy - Manager/Admin UUID
 * @param {String} status - Document status ('verified' or 'rejected')
 * @param {String} reason - Rejection reason (optional)
 * @returns {Promise<Object>} Updated document object
 */
const verifyDocument = async (documentId, verifiedBy, status, reason = null) => {
  const updateData = {
    status,
    verified_at: new Date().toISOString(),
    verified_by: verifiedBy,
    rejection_reason: reason
  };
  
  const { data, error } = await supabase
    .from('seller_documents')
    .update(updateData)
    .eq('id', documentId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Get seller performance metrics
 * 
 * @param {String} sellerId - Seller UUID
 * @returns {Promise<Object>} Performance metrics
 */
const getPerformanceMetrics = async (sellerId) => {
  const { data, error } = await supabase
    .from('seller_performance')
    .select('*')
    .eq('seller_id', sellerId)
    .single();
  
  if (error) {
    // Create if doesn't exist
    const { data: newPerf } = await supabase
      .from('seller_performance')
      .insert([{ seller_id: sellerId }])
      .select()
      .single();
    return newPerf;
  }
  
  // Get delivery rating metrics
  const { data: deliveryMetrics } = await supabase
    .from('delivery_ratings')
    .select('overall_rating, packaging_quality_rating, delivery_speed_rating, delivery_person_rating')
    .eq('seller_id', sellerId);
  
  if (deliveryMetrics && deliveryMetrics.length > 0) {
    const avgOverall = deliveryMetrics.reduce((sum, r) => sum + r.overall_rating, 0) / deliveryMetrics.length;
    const avgPackaging = deliveryMetrics.reduce((sum, r) => sum + r.packaging_quality_rating, 0) / deliveryMetrics.length;
    const avgSpeed = deliveryMetrics.reduce((sum, r) => sum + r.delivery_speed_rating, 0) / deliveryMetrics.length;
    const avgPerson = deliveryMetrics.reduce((sum, r) => sum + (r.delivery_person_rating || 0), 0) / deliveryMetrics.length;
    
    data.delivery_rating_avg = Math.round(avgOverall * 100) / 100;
    data.packaging_quality_avg = Math.round(avgPackaging * 100) / 100;
    data.delivery_speed_avg = Math.round(avgSpeed * 100) / 100;
    data.delivery_person_avg = Math.round(avgPerson * 100) / 100;
    data.total_delivery_ratings = deliveryMetrics.length;
    
    // Check if average is below threshold (3.0)
    if (avgOverall < 3.0) {
      data.low_delivery_rating_alert = true;
    }
  }
  
  return data;
};

/**
 * Get seller earnings
 * 
 * @param {String} sellerId - Seller UUID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of earnings records
 */
const getEarnings = async (sellerId, filters = {}) => {
  let query = supabase
    .from('seller_earnings')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  
  if (filters.payoutStatus) {
    query = query.eq('payout_status', filters.payoutStatus);
  }
  
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Request payout
 * 
 * @param {String} sellerId - Seller UUID
 * @param {Object} payoutData - Payout request data
 * @returns {Promise<Object>} Created payout request
 */
const requestPayout = async (sellerId, payoutData) => {
  // Check available balance
  const { data: balance } = await supabase
    .from('seller_balances')
    .select('available_balance')
    .eq('seller_id', sellerId)
    .single();
  
  if (!balance || balance.available_balance < payoutData.amount) {
    throw new Error('Insufficient available balance');
  }
  
  // Create payout request
  const { data, error } = await supabase
    .from('payout_requests')
    .insert([{
      seller_id: sellerId,
      amount: payoutData.amount,
      payment_method: payoutData.paymentMethod,
      payment_details: payoutData.paymentDetails
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Get payout requests
 * 
 * @param {String} sellerId - Seller UUID
 * @returns {Promise<Array>} Array of payout requests
 */
const getPayoutRequests = async (sellerId) => {
  const { data, error } = await supabase
    .from('payout_requests')
    .select('*')
    .eq('seller_id', sellerId)
    .order('requested_at', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get all sellers (admin/manager only)
 * 
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of sellers
 */
const getAllSellers = async (filters = {}) => {
  let query = supabase
    .from('users')
    .select(`
      *,
      seller_performance (*),
      seller_balances (*)
    `)
    .eq('role', 'seller')
    .order('created_at', { ascending: false });
  
  if (filters.verificationStatus) {
    query = query.eq('seller_verification_status', filters.verificationStatus);
  }
  
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get seller dashboard stats
 * 
 * @param {String} sellerId - Seller UUID
 * @returns {Promise<Object>} Dashboard statistics
 */
const getDashboardStats = async (sellerId) => {
  // Get performance metrics
  const performance = await getPerformanceMetrics(sellerId);
  
  // Get balance
  const { data: balance } = await supabase
    .from('seller_balances')
    .select('*')
    .eq('seller_id', sellerId)
    .single();
  
  // Get product count (active products)
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', sellerId)
    .eq('status', 'active');
  
  // Get pending products count
  const { count: pendingProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', sellerId)
    .eq('status', 'pending');
  
  // Get pending orders count
  const { count: pendingOrders } = await supabase
    .from('sub_orders')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', sellerId)
    .in('fulfillment_status', ['pending', 'processing']);
  
  return {
    performance,
    balance: balance || { available_balance: 0, pending_balance: 0, escrow_balance: 0, total_earnings: 0 },
    productCount: productCount || 0,
    pendingProducts: pendingProducts || 0,
    pendingOrders: pendingOrders || 0
  };
};

module.exports = {
  registerSeller,
  getSellerProfile,
  uploadDocument,
  getDocuments,
  verifySeller,
  verifyDocument,
  getPerformanceMetrics,
  getEarnings,
  requestPayout,
  getPayoutRequests,
  getAllSellers,
  getDashboardStats
};
