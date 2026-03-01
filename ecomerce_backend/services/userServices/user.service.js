/**
 * USER SERVICE
 * 
 * Business logic layer for user operations.
 * Database operations using Supabase.
 */

const supabase = require('../../config/supabase');

/**
 * Find user by ID
 * @param {String} id - User UUID
 * @returns {Promise<Object|null>} User object or null
 */
const findById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, password_hash, role, display_name, phone, created_at, last_login_at, status')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Find user by email
 * @param {String} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
const findByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user object
 */
const create = async ({ email, passwordHash, role = 'customer', displayName = null }) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email,
      password_hash: passwordHash,
      role,
      display_name: displayName
    }])
    .select('id, email, role, display_name, created_at, status')
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Update last login timestamp
 * @param {String} id - User UUID
 * @returns {Promise<void>}
 */
const updateLastLogin = async (id) => {
  const { error } = await supabase
    .from('users')
    .update({ 
      last_login_at: new Date().toISOString()
    })
    .eq('id', id);
  
  if (error) throw error;
};

/**
 * Update user profile
 * @param {String} id - User UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user object
 */
const update = async (id, updates) => {
  const { data, error} = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, email, role, display_name, phone, created_at, status')
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Update user status
 * @param {String} id - User UUID
 * @param {String} status - New status
 * @returns {Promise<Object>} Updated user object
 */
const updateStatus = async (id, status) => {
  return await update(id, { status });
};

/**
 * Get all users (admin only) with enhanced search and pagination
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of user objects with order stats
 */
const findAll = async (filters = {}) => {
  let query = supabase
    .from('users')
    .select('id, email, role, display_name, phone, created_at, last_login_at, status')
    .order(filters.sortBy || 'created_at', { ascending: filters.sortOrder === 'asc' });

  // Apply role filter
  if (filters.role && filters.role !== 'all') {
    query = query.eq('role', filters.role);
  }

  // Apply status filter
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  // Apply search filter
  if (filters.search) {
    query = query.or(`email.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
  }

  // Apply pagination
  if (filters.limit && filters.limit > 0) {
    const offset = filters.offset || 0;
    query = query.range(offset, offset + filters.limit - 1);
  }

  const { data: users, error } = await query;
  
  if (error) throw error;
  
  // Enhance users with order count and total spent
  if (users && users.length > 0) {
    const enhancedUsers = await Promise.all(users.map(async (user) => {
      // Get order statistics for this user
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('amount, status')
        .eq('user_id', user.id);
      
      let orderCount = 0;
      let totalSpent = 0;
      
      if (!orderError && orders) {
        orderCount = orders.length;
        // Calculate total spent (exclude cancelled orders)
        totalSpent = orders
          .filter(o => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.amount || 0), 0);
      }
      
      return {
        ...user,
        order_count: orderCount,
        total_spent: totalSpent // Amount in cents
      };
    }));
    
    return enhancedUsers;
  }
  
  return users || [];
};

/**
 * Get total count of users matching filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Number>} Total count
 */
const getTotalCount = async (filters = {}) => {
  let query = supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // Apply role filter
  if (filters.role && filters.role !== 'all') {
    query = query.eq('role', filters.role);
  }

  // Apply status filter
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  // Apply search filter
  if (filters.search) {
    query = query.or(`email.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
  }

  const { count, error } = await query;
  
  if (error) throw error;
  
  return count || 0;
};

/**
 * Bulk update users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Array>} Updated users
 */
const bulkUpdate = async (userIds, updates) => {
  const results = [];
  
  for (const userId of userIds) {
    try {
      const user = await update(userId, updates);
      results.push({ id: userId, success: true, user });
    } catch (error) {
      results.push({ id: userId, success: false, error: error.message });
    }
  }
  
  return results;
};

/**
 * Export users to CSV format
 * @param {Array} users - Array of user objects
 * @returns {Promise<String>} CSV string
 */
const exportToCSV = async (users) => {
  const headers = [
    'ID',
    'Email',
    'Display Name',
    'Role',
    'Status',
    'Phone',
    'Created At',
    'Last Login'
  ];

  const csvRows = [headers.join(',')];

  for (const user of users) {
    const row = [
      user.id,
      `"${user.email}"`,
      `"${user.display_name || ''}"`,
      user.role,
      user.status,
      `"${user.phone || ''}"`,
      user.created_at,
      user.last_login_at || ''
    ];
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
};

/**
 * Delete user (soft delete by setting status)
 * @param {String} id - User UUID
 * @returns {Promise<void>}
 */
const deleteUser = async (id) => {
  await updateStatus(id, 'deleted');
};

/**
 * Get user statistics
 * @param {String} userId - User UUID
 * @returns {Promise<Object>} User statistics
 */
const getStatistics = async (userId) => {
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('amount, status')
    .eq('user_id', userId);
  
  if (orderError) throw orderError;

  const { count: returnCount, error: returnError } = await supabase
    .from('returns')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  if (returnError) throw returnError;

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const totalSpent = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.amount, 0);

  return {
    total_orders: totalOrders,
    completed_orders: completedOrders,
    total_spent: totalSpent,
    average_order_value: totalOrders > 0 ? totalSpent / totalOrders : 0,
    total_returns: returnCount || 0
  };
};

/**
 * Search users by email or name
 * @param {String} searchTerm - Search term
 * @param {Number} limit - Limit results
 * @returns {Promise<Array>} Array of user objects
 */
const search = async (searchTerm, limit = 20) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, role, status, created_at')
    .or(`email.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
    .limit(limit);
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Create seller account
 * @param {Object} sellerData - Seller registration data
 * @returns {Promise<Object>} Created seller object
 */
const createSeller = async ({ email, passwordHash, displayName, businessName, businessInfo, phone }) => {
  const insertData = {
    email,
    password_hash: passwordHash,
    role: 'seller',
    display_name: displayName,
    business_name: businessName,
    phone,
    verification_status: 'pending', // Requires admin approval
    status: 'active'
  };

  // Handle businessInfo object - map to individual columns
  if (businessInfo) {
    if (businessInfo.description) insertData.business_description = businessInfo.description;
    if (businessInfo.email) insertData.business_email = businessInfo.email;
    if (businessInfo.phone) insertData.business_phone = businessInfo.phone;
    if (businessInfo.address) insertData.business_address = businessInfo.address;
    if (businessInfo.taxId) insertData.tax_id = businessInfo.taxId;
  }

  const { data, error } = await supabase
    .from('users')
    .insert([insertData])
    .select('id, email, role, display_name, business_name, verification_status, created_at, status')
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Create manager account (Admin only)
 * @param {Object} managerData - Manager data
 * @returns {Promise<Object>} Created manager object
 */
const createManager = async ({ email, passwordHash, displayName, phone = null }) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email,
      password_hash: passwordHash,
      role: 'manager',
      display_name: displayName,
      phone,
      status: 'active'
    }])
    .select('id, email, role, display_name, phone, created_at, status')
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Update seller verification status
 * @param {String} sellerId - Seller UUID
 * @param {String} status - Verification status ('pending', 'verified', 'rejected')
 * @returns {Promise<Object>} Updated seller object
 */
const updateSellerStatus = async (sellerId, status) => {
  const { data, error } = await supabase
    .from('users')
    .update({ verification_status: status })
    .eq('id', sellerId)
    .eq('role', 'seller')
    .select('id, email, display_name, business_name, verification_status')
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Get all sellers
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of seller objects
 */
const findAllSellers = async (filters = {}) => {
  let query = supabase
    .from('users')
    .select('id, email, display_name, business_name, business_description, business_email, business_phone, business_address, tax_id, phone, verification_status, seller_tier, created_at, status')
    .eq('role', 'seller')
    .order('created_at', { ascending: false });

  if (filters.verificationStatus && filters.verificationStatus !== 'all') {
    query = query.eq('verification_status', filters.verificationStatus);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get all managers
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of manager objects
 */
const findAllManagers = async (filters = {}) => {
  let query = supabase
    .from('users')
    .select('id, email, display_name, phone, created_at, last_login_at, status')
    .eq('role', 'manager')
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get seller by ID with full details
 * @param {String} sellerId - Seller UUID
 * @returns {Promise<Object|null>} Seller object or null
 */
const findSellerById = async (sellerId) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, business_name, business_description, business_email, business_phone, business_address, tax_id, phone, verification_status, seller_tier, average_rating, total_reviews, total_sales, total_orders, created_at, last_login_at, status')
    .eq('id', sellerId)
    .eq('role', 'seller')
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Search users for chat
 * @param {String} query - Search query
 * @param {String} role - Filter by role (optional)
 * @param {Number} limit - Result limit
 * @returns {Promise<Array>} Array of users
 */
const searchUsersForChat = async (query, role = null, limit = 20) => {
  try {
    let queryBuilder = supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        created_at,
        stores (
          id,
          store_name
        )
      `)
      .eq('status', 'active')
      .limit(limit);

    // Filter by role if specified
    if (role && role !== 'all') {
      queryBuilder = queryBuilder.eq('role', role);
    }

    // Search in multiple fields
    if (query && query.trim()) {
      queryBuilder = queryBuilder.or(`
        email.ilike.%${query}%,
        full_name.ilike.%${query}%
      `);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;

    // Format results
    return data.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      store_name: user.stores?.[0]?.store_name || null,
      is_online: false // TODO: Get from online status tracking
    }));
  } catch (error) {
    console.error('[UserService] Error searching users for chat:', error);
    throw error;
  }
};

module.exports = {
  findById,
  findByEmail,
  create,
  updateLastLogin,
  update,
  updateStatus,
  findAll,
  getTotalCount,
  bulkUpdate,
  exportToCSV,
  deleteUser,
  getStatistics,
  search,
  searchUsersForChat,
  // Phase 2: Seller & Manager functions
  createSeller,
  createManager,
  updateSellerStatus,
  findAllSellers,
  findAllManagers,
  findSellerById
};
