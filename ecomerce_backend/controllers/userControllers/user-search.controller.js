/**
 * USER SEARCH CONTROLLER
 * 
 * Controller for user search functionality (chat)
 */

const userService = require('../../services/userServices/user.service');

/**
 * Search users for chat
 * GET /api/users/search
 */
const searchUsersForChat = async (req, res) => {
  try {
    const { q, role, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const users = await userService.searchUsersForChat(q, role, parseInt(limit));

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('[UserSearchController] Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error.message
    });
  }
};

module.exports = {
  searchUsersForChat
};
