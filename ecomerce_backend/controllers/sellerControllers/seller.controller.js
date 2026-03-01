/**
 * SELLER CONTROLLER
 * 
 * Handles HTTP requests for seller operations.
 */

const sellerService = require('../../services/sellerServices/seller.service');

/**
 * Register as seller
 */
const registerSeller = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { businessName, businessAddress, taxId } = req.body;
    
    if (!businessName || !businessAddress) {
      return res.status(400).json({
        success: false,
        message: 'Business name and address are required'
      });
    }
    
    const seller = await sellerService.registerSeller(userId, {
      businessName,
      businessAddress,
      taxId
    });
    
    res.status(200).json({
      success: true,
      message: 'Seller registration submitted. Awaiting verification.',
      seller
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller profile
 */
const getProfile = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    
    const profile = await sellerService.getSellerProfile(sellerId);
    
    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload seller document
 */
const uploadDocument = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { documentType, documentUrl, documentName, fileSize, mimeType } = req.body;
    
    if (!documentType || !documentUrl) {
      return res.status(400).json({
        success: false,
        message: 'Document type and URL are required'
      });
    }
    
    const document = await sellerService.uploadDocument(sellerId, {
      documentType,
      documentUrl,
      documentName,
      fileSize,
      mimeType
    });
    
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller documents
 */
const getDocuments = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    
    const documents = await sellerService.getDocuments(sellerId);
    
    res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller performance metrics
 */
const getPerformance = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    
    const performance = await sellerService.getPerformanceMetrics(sellerId);
    
    res.status(200).json({
      success: true,
      performance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payout requests (legacy - kept for backward compatibility)
 */
const getPayoutRequests = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    
    const payoutRequests = await sellerService.getPayoutRequests(sellerId);
    
    res.status(200).json({
      success: true,
      count: payoutRequests.length,
      payoutRequests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller dashboard stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    
    const stats = await sellerService.getDashboardStats(sellerId);
    
    // Return data directly (not wrapped in stats object)
    // API interceptor will extract response.data
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all sellers (admin/manager only)
 */
const getAllSellers = async (req, res, next) => {
  try {
    const { verificationStatus, limit } = req.query;
    
    const filters = {};
    if (verificationStatus) filters.verificationStatus = verificationStatus;
    if (limit) filters.limit = parseInt(limit);
    
    const sellers = await sellerService.getAllSellers(filters);
    
    res.status(200).json({
      success: true,
      count: sellers.length,
      sellers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller by ID (admin/manager only)
 */
const getSellerById = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    
    const seller = await sellerService.getSellerProfile(sellerId);
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    
    res.status(200).json({
      success: true,
      seller
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new seller (admin only)
 */
const createSeller = async (req, res, next) => {
  try {
    const { 
      email, 
      password, 
      displayName, 
      businessName, 
      businessDescription,
      businessEmail,
      businessPhone,
      businessAddress, 
      taxId,
      phone,
      sellerTier = 'bronze'
    } = req.body;
    
    // Validation
    if (!email || !password || !businessName || !businessAddress) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, business name, and business address are required'
      });
    }
    
    // Check if user already exists
    const supabase = require('../../config/supabase');
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create seller user
    const { data: seller, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: passwordHash,
        role: 'seller',
        display_name: displayName,
        business_name: businessName,
        business_description: businessDescription,
        business_email: businessEmail,
        business_phone: businessPhone,
        business_address: businessAddress,
        tax_id: taxId,
        phone,
        seller_tier: sellerTier,
        seller_verification_status: 'pending',
        status: 'active'
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Initialize seller performance and balance records
    await Promise.all([
      supabase.from('seller_performance').insert([{ seller_id: seller.id }]),
      supabase.from('seller_balances').insert([{ seller_id: seller.id }])
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Seller created successfully',
      seller
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update seller (admin only)
 */
const updateSeller = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updates.password_hash;
    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;
    delete updates.deleted_at;
    
    // Map frontend field names to database column names
    const fieldMapping = {
      displayName: 'display_name',
      businessName: 'business_name',
      businessDescription: 'business_description',
      businessEmail: 'business_email',
      businessPhone: 'business_phone',
      businessAddress: 'business_address',
      taxId: 'tax_id',
      sellerTier: 'seller_tier'
    };
    
    // Convert field names and filter out non-existent columns
    const dbUpdates = {};
    Object.keys(updates).forEach(key => {
      const dbColumn = fieldMapping[key] || key;
      // Only include columns that exist in the users table
      const allowedColumns = [
        'display_name', 'business_name', 'business_email', 'business_phone',
        'business_address', 'tax_id', 'phone', 'seller_tier', 'status',
        'seller_verification_status'
      ];
      
      if (allowedColumns.includes(dbColumn)) {
        dbUpdates[dbColumn] = updates[key];
      }
    });
    
    if (Object.keys(dbUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    const supabase = require('../../config/supabase');
    
    const { data: seller, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', sellerId)
      .eq('role', 'seller')
      .select()
      .single();
    
    if (error) throw error;
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Seller updated successfully',
      seller
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete seller (admin only)
 */
const deleteSeller = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    
    const supabase = require('../../config/supabase');
    
    // Check if seller exists
    const { data: seller, error: checkError } = await supabase
      .from('users')
      .select('id, email, business_name')
      .eq('id', sellerId)
      .eq('role', 'seller')
      .single();
    
    if (checkError || !seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    
    // Check if seller has active products or orders
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .eq('status', 'active');
    
    const { count: orderCount } = await supabase
      .from('sub_orders')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .in('fulfillment_status', ['pending', 'processing', 'shipped']);
    
    if (productCount > 0 || orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete seller with active products or pending orders. Please deactivate first.'
      });
    }
    
    // Since we can't change status to 'deleted' due to constraint,
    // we'll use a different approach - update the email to mark as deleted
    // This is a soft delete approach that works with the current schema
    const deletedEmail = `deleted_${Date.now()}_${seller.email}`;
    
    const { error: deleteError } = await supabase
      .from('users')
      .update({ 
        email: deletedEmail,
        // Keep status as active but mark email as deleted
        // This way we can identify deleted sellers by their email pattern
      })
      .eq('id', sellerId);
    
    if (deleteError) throw deleteError;
    
    res.status(200).json({
      success: true,
      message: 'Seller deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update seller status (admin only)
 */
const updateSellerStatus = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const { status } = req.body;
    
    // Based on database constraint testing, only 'active' is allowed for users.status
    // For other statuses, we might need to use a different approach or column
    const validStatuses = ['active'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Currently only "active" status is supported. Valid statuses: ' + validStatuses.join(', ')
      });
    }
    
    const supabase = require('../../config/supabase');
    
    const { data: seller, error } = await supabase
      .from('users')
      .update({ 
        status
      })
      .eq('id', sellerId)
      .eq('role', 'seller')
      .select()
      .single();
    
    if (error) throw error;
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Seller status updated to ${status}`,
      seller
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify seller (manager/admin only)
 */
const verifySeller = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const { status, reason } = req.body;
    const verifiedBy = req.user.id;
    
    if (!status || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (verified or rejected) is required'
      });
    }
    
    if (status === 'rejected' && !reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const seller = await sellerService.verifySeller(sellerId, verifiedBy, status, reason);
    
    res.status(200).json({
      success: true,
      message: `Seller ${status} successfully`,
      seller
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify seller document (manager/admin only)
 */
const verifyDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { status, reason } = req.body;
    const verifiedBy = req.user.id;
    
    if (!status || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (verified or rejected) is required'
      });
    }
    
    const document = await sellerService.verifyDocument(documentId, verifiedBy, status, reason);
    
    res.status(200).json({
      success: true,
      message: `Document ${status} successfully`,
      document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller payout balance
 */
const getPayoutBalance = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const supabase = require('../../config/supabase');
    
    // Get all earnings
    const { data: earnings, error } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('seller_id', sellerId);
    
    if (error) throw error;
    
    // Calculate balances
    const available = earnings
      .filter(e => e.status === 'available')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const pending = earnings
      .filter(e => e.status === 'pending' || e.status === 'processing')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const paid = earnings
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const total_earnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    
    res.json({
      success: true,
      data: {
        available,
        pending,
        paid,
        total_earnings
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller earnings history
 */
const getEarnings = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const supabase = require('../../config/supabase');
    
    const { data, error } = await supabase
      .from('seller_earnings')
      .select(`
        *,
        sub_orders (
          id,
          parent_order_id,
          items,
          subtotal
        )
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller payout history
 */
const getPayouts = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const supabase = require('../../config/supabase');
    
    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('seller_id', sellerId)
      .order('requested_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request payout
 */
const requestPayout = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { amount, method } = req.body;
    const supabase = require('../../config/supabase');
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payout amount'
      });
    }
    
    // Check available balance
    const { data: earnings } = await supabase
      .from('seller_earnings')
      .select('amount')
      .eq('seller_id', sellerId)
      .eq('status', 'available');
    
    const availableBalance = earnings.reduce((sum, e) => sum + e.amount, 0);
    
    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient available balance'
      });
    }
    
    // Get seller payment account
    const { data: seller } = await supabase
      .from('users')
      .select('stripe_account_id, paypal_email')
      .eq('id', sellerId)
      .single();
    
    if (!seller.stripe_account_id && !seller.paypal_email) {
      return res.status(400).json({
        success: false,
        message: 'Please set up your payment account first'
      });
    }
    
    // Create payout request
    const { data: payout, error } = await supabase
      .from('payouts')
      .insert([{
        seller_id: sellerId,
        amount: amount,
        method: method || 'stripe_connect',
        status: 'pending_approval',
        requested_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Update earnings status
    await supabase
      .from('seller_earnings')
      .update({ 
        status: 'processing',
        payout_id: payout.id
      })
      .eq('seller_id', sellerId)
      .eq('status', 'available')
      .lte('amount', amount);
    
    res.json({
      success: true,
      message: 'Payout requested successfully',
      data: payout
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment account info
 */
const getPaymentAccount = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const supabase = require('../../config/supabase');
    
    const { data: seller, error } = await supabase
      .from('users')
      .select('stripe_account_id, paypal_email')
      .eq('id', sellerId)
      .single();
    
    if (error) throw error;
    
    const hasStripe = !!seller.stripe_account_id;
    const hasPayPal = !!seller.paypal_email;
    
    res.json({
      success: true,
      data: {
        method: hasStripe ? 'stripe_connect' : hasPayPal ? 'paypal' : null,
        verified: hasStripe || hasPayPal,
        stripe_connected: hasStripe,
        paypal_connected: hasPayPal
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerSeller,
  getProfile,
  uploadDocument,
  getDocuments,
  getDashboardStats,
  getPayoutBalance,
  getEarnings,
  getPayouts,
  requestPayout,
  getPaymentAccount,
  getPayoutRequests,
  getPerformance,
  getAllSellers,
  getSellerById,
  createSeller,
  updateSeller,
  deleteSeller,
  updateSellerStatus,
  verifySeller,
  verifyDocument
};
