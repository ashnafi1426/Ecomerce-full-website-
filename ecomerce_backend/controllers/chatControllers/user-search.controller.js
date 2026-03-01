/**
 * USER SEARCH CONTROLLER
 * 
 * Allows users to search for other users to start chat conversations
 */

const supabase = require('../../config/supabase');

/**
 * Search users for chat
 * Managers can search: Customers, Sellers, Admins
 * Admins can search: Customers, Sellers, Managers
 * Sellers can search: Customers, Admins, Managers
 * Customers can search: Sellers, Admins, Managers
 */
exports.searchUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    const { search = '', role = '', limit = 20 } = req.query;

    console.log('[User Search] User:', currentUserId, 'Role:', currentUserRole, 'Search:', search, 'Filter Role:', role);

    // Define which roles can be searched by each role
    const searchableRoles = {
      admin: ['customer', 'seller', 'manager'],
      manager: ['customer', 'seller', 'admin'],
      seller: ['customer', 'admin', 'manager'],
      customer: ['seller', 'admin', 'manager']
    };

    const allowedRoles = searchableRoles[currentUserRole] || [];

    // Build query
    let query = supabase
      .from('users')
      .select('id, email, role, display_name, status, created_at')
      .neq('id', currentUserId)
      .eq('status', 'active');

    // Filter by allowed roles
    if (allowedRoles.length > 0) {
      query = query.in('role', allowedRoles);
    }

    // Filter by specific role if provided
    if (role && allowedRoles.includes(role.toLowerCase())) {
      query = query.eq('role', role.toLowerCase());
    }

    // Search by name or email
    if (search) {
      const searchLower = search.toLowerCase();
      query = query.or(`display_name.ilike.%${searchLower}%,email.ilike.%${searchLower}%`);
    }

    // Order and limit
    query = query.order('display_name', { ascending: true }).limit(parseInt(limit));

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Format users
    const users = (data || []).map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name || user.email.split('@')[0],
      profileImage: null,
      status: user.status,
      createdAt: user.created_at
    }));

    res.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('[User Search] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error.message
    });
  }
};

/**
 * Get all available users for chat (grouped by role)
 */
exports.getAvailableUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    console.log('[Available Users] User:', currentUserId, 'Role:', currentUserRole);

    // Define which roles can be searched by each role
    const searchableRoles = {
      admin: ['customer', 'seller', 'manager'],
      manager: ['customer', 'seller', 'admin'],
      seller: ['customer', 'admin', 'manager'],
      customer: ['seller', 'admin', 'manager']
    };

    const allowedRoles = searchableRoles[currentUserRole] || [];

    if (allowedRoles.length === 0) {
      return res.json({
        success: true,
        data: {
          customers: [],
          sellers: [],
          admins: [],
          managers: []
        }
      });
    }

    // Fetch users by role
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, display_name, status, created_at')
      .neq('id', currentUserId)
      .eq('status', 'active')
      .in('role', allowedRoles)
      .order('role', { ascending: true })
      .order('display_name', { ascending: true })
      .limit(100);

    if (error) {
      throw error;
    }

    // Group users by role
    const groupedUsers = {
      customers: [],
      sellers: [],
      admins: [],
      managers: []
    };

    (data || []).forEach(user => {
      const formattedUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name || user.email.split('@')[0],
        profileImage: null,
        status: user.status,
        createdAt: user.created_at
      };

      switch (user.role) {
        case 'customer':
          groupedUsers.customers.push(formattedUser);
          break;
        case 'seller':
          groupedUsers.sellers.push(formattedUser);
          break;
        case 'admin':
          groupedUsers.admins.push(formattedUser);
          break;
        case 'manager':
          groupedUsers.managers.push(formattedUser);
          break;
      }
    });

    res.json({
      success: true,
      data: groupedUsers,
      totalCount: (data || []).length
    });

  } catch (error) {
    console.error('[Available Users] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available users',
      error: error.message
    });
  }
};
