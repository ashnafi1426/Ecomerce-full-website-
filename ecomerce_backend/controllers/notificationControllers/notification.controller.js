const notificationService = require('../../services/notificationServices/notification.service');

/**
 * Notification Controller
 * Handles HTTP requests for notification operations
 */




/**
 * Get user notifications
 * GET /api/notifications
 * 
 * ENHANCED with better error handling and logging
 */
async function getNotifications(req, res) {
  try {
    console.log('[Notification Controller] Fetching notifications for user:', req.user?.id);
    
    // Validate user authentication
    if (!req.user || !req.user.id) {
      console.error('[Notification Controller] ❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      type,
      priority,
      includeArchived = false
    } = req.query;

    console.log('[Notification Controller] Query params:', {
      limit,
      offset,
      unreadOnly,
      type,
      priority,
      includeArchived
    });

    const result = await notificationService.getUserNotifications(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true',
      type,
      priority,
      includeArchived: includeArchived === 'true'
    });

    console.log('[Notification Controller] ✅ Fetched', result?.notifications?.length || 0, 'notifications');

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Notification Controller] ❌ Error getting notifications:', error);
    console.error('[Notification Controller] Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('[Notification Controller] Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
}

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
async function markAsRead(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await notificationService.markAsRead(id, userId);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('[Notification Controller] Error marking as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
}

/**
 * Mark notification as unread
 * PATCH /api/notifications/:id/unread
 */
async function markAsUnread(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await notificationService.markAsUnread(id, userId);

    res.status(200).json({
      success: true,
      message: 'Notification marked as unread',
      data: notification
    });
  } catch (error) {
    console.error('[Notification Controller] Error marking as unread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as unread',
      error: error.message
    });
  }
}

/**
 * Mark all notifications as read
 * POST /api/notifications/mark-all-read
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;
    const count = await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: `${count} notifications marked as read`,
      data: { count }
    });
  } catch (error) {
    console.error('[Notification Controller] Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
}

/**
 * Archive notification
 * PATCH /api/notifications/:id/archive
 */
async function archiveNotification(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await notificationService.archiveNotification(id, userId);

    res.status(200).json({
      success: true,
      message: 'Notification archived',
      data: notification
    });
  } catch (error) {
    console.error('[Notification Controller] Error archiving notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive notification',
      error: error.message
    });
  }
}

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
async function deleteNotification(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await notificationService.deleteNotification(id, userId);

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('[Notification Controller] Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
}

/**
 * Get notification preferences
 * GET /api/notifications/preferences
 */
async function getPreferences(req, res) {
  try {
    const userId = req.user.id;
    const preferences = await notificationService.getPreferences(userId);

    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('[Notification Controller] Error getting preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      error: error.message
    });
  }
}

/**
 * Update notification preferences
 * PUT /api/notifications/preferences
 */
async function updatePreferences(req, res) {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    const updated = await notificationService.updatePreferences(userId, preferences);

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated',
      data: updated
    });
  } catch (error) {
    console.error('[Notification Controller] Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message
    });
  }
}

/**
 * Create test notification (for development/testing)
 * POST /api/notifications/test
 */
async function createTestNotification(req, res) {
  try {
    const userId = req.user.id;
    
    const notification = await notificationService.createNotification({
      user_id: userId,
      type: 'system_announcement',
      title: 'Test Notification',
      message: 'This is a test notification from the system.',
      priority: 'medium',
      metadata: { test: true },
      action_url: '/dashboard',
      action_text: 'Go to Dashboard',
      channels: ['in_app']
    });

    res.status(201).json({
      success: true,
      message: 'Test notification created',
      data: notification
    });
  } catch (error) {
    console.error('[Notification Controller] Error creating test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test notification',
      error: error.message
    });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
  getPreferences,
  updatePreferences,
  createTestNotification
};
