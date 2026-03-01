const supabase = require('../../config/supabase');
const emailService = require('../emailServices/email.service');

/**
 * Notification Service
 * Handles all notification-related business logic
 */

/**
 * Create a new notification
 * @param {Object} notificationData - Notification details
 * @returns {Promise<Object>} Created notification
 */
async function createNotification(notificationData) {
  try {
    const {
      user_id,
      type,
      title,
      message,
      priority = 'medium',
      metadata = {},
      action_url = null,
      action_text = null,
      channels = ['in_app'],
      expires_at = null
    } = notificationData;

    // Validate required fields
    if (!user_id || !type || !title || !message) {
      throw new Error('Missing required notification fields');
    }

    // Create in-app notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        message,
        priority,
        metadata,
        action_url,
        action_text,
        channels,
        expires_at
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`[Notification] ✅ Created in-app notification ${data.id} for user ${user_id}`);
    
    // Send email if email channel is enabled
    if (channels.includes('email')) {
      try {
        // Get user email
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email, display_name')
          .eq('id', user_id)
          .single();

        if (!userError && userData && userData.email) {
          // Use appropriate email template based on notification type
          if (type === 'new_message') {
            await emailService.sendChatMessageEmail({
              email: userData.email,
              display_name: userData.display_name,
              title,
              message,
              action_url,
              action_text,
              metadata
            });
          } else {
            await emailService.sendCustomerOrderStatusEmail({
              email: userData.email,
              display_name: userData.display_name,
              title,
              message,
              action_url,
              action_text,
              metadata,
              type
            });
          }
          console.log(`[Notification] ✅ Sent email notification to ${userData.email}`);
        }
      } catch (emailError) {
        console.error('[Notification] ⚠️ Failed to send email (non-critical):', emailError.message);
        // Don't throw - email failure shouldn't break notification creation
      }
    }
    
    // TODO: Trigger real-time notification via WebSocket
    // TODO: Send SMS if SMS channel is enabled

    return data;
  } catch (error) {
    console.error('[Notification Service] Error creating notification:', error);
    throw error;
  }
}

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of notifications
 */
async function getUserNotifications(userId, options = {}) {
  try {
    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      type = null,
      priority = null,
      includeArchived = false
    } = options;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    // Filter out expired notifications
    query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      notifications: data || [],
      total: count || 0,
      limit,
      offset
    };
  } catch (error) {
    console.error('[Notification Service] Error getting notifications:', error);
    throw error;
  }
}

/**
 * Get unread notification count
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread count
 */
async function getUnreadCount(userId) {
  try {
    const { data, error } = await supabase
      .rpc('get_unread_notification_count', { p_user_id: userId });

    if (error) throw error;

    return data || 0;
  } catch (error) {
    console.error('[Notification Service] Error getting unread count:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for security)
 * @returns {Promise<Object>} Updated notification
 */
async function markAsRead(notificationId, userId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('[Notification Service] Error marking as read:', error);
    throw error;
  }
}

/**
 * Mark notification as unread
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for security)
 * @returns {Promise<Object>} Updated notification
 */
async function markAsUnread(notificationId, userId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: false,
        read_at: null
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('[Notification Service] Error marking as unread:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of notifications marked as read
 */
async function markAllAsRead(userId) {
  try {
    const { data, error } = await supabase
      .rpc('mark_all_notifications_read', { p_user_id: userId });

    if (error) throw error;

    return data || 0;
  } catch (error) {
    console.error('[Notification Service] Error marking all as read:', error);
    throw error;
  }
}

/**
 * Archive notification
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for security)
 * @returns {Promise<Object>} Updated notification
 */
async function archiveNotification(notificationId, userId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('[Notification Service] Error archiving notification:', error);
    throw error;
  }
}

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for security)
 * @returns {Promise<boolean>} Success status
 */
async function deleteNotification(notificationId, userId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('[Notification Service] Error deleting notification:', error);
    throw error;
  }
}

/**
 * Get notification preferences
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User preferences
 */
async function getPreferences(userId) {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no preferences exist, create default ones
      if (error.code === 'PGRST116') {
        return await createDefaultPreferences(userId);
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[Notification Service] Error getting preferences:', error);
    throw error;
  }
}

/**
 * Update notification preferences
 * @param {string} userId - User ID
 * @param {Object} preferences - Preference updates
 * @returns {Promise<Object>} Updated preferences
 */
async function updatePreferences(userId, preferences) {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .update(preferences)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('[Notification Service] Error updating preferences:', error);
    throw error;
  }
}

/**
 * Create default preferences for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created preferences
 */
async function createDefaultPreferences(userId) {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('[Notification Service] Error creating default preferences:', error);
    throw error;
  }
}

/**
 * Delete expired notifications (cleanup job)
 * @returns {Promise<number>} Number of deleted notifications
 */
async function deleteExpiredNotifications() {
  try {
    const { data, error } = await supabase
      .rpc('delete_expired_notifications');

    if (error) throw error;

    console.log(`[Notification Service] Deleted ${data} expired notifications`);
    return data || 0;
  } catch (error) {
    console.error('[Notification Service] Error deleting expired notifications:', error);
    throw error;
  }
}

/**
 * Helper: Create order notification
 */
async function notifyOrderPlaced(orderId, userId, orderDetails) {
  return await createNotification({
    user_id: userId,
    type: 'order_placed',
    title: 'Order Placed Successfully',
    message: `Your order #${orderId.substring(0, 8)} has been placed successfully.`,
    priority: 'high',
    metadata: { order_id: orderId, ...orderDetails },
    action_url: `/orders/${orderId}`,
    action_text: 'View Order',
    channels: ['in_app', 'email']
  });
}

/**
 * Helper: Create product approval notification
 */
async function notifyProductApproved(productId, sellerId, productName) {
  return await createNotification({
    user_id: sellerId,
    type: 'product_approved',
    title: 'Product Approved',
    message: `Your product "${productName}" has been approved and is now live.`,
    priority: 'high',
    metadata: { product_id: productId },
    action_url: `/seller/products/${productId}`,
    action_text: 'View Product',
    channels: ['in_app', 'email']
  });
}

/**
 * Helper: Create low stock notification
 */
async function notifyLowStock(productId, sellerId, productName, currentStock) {
  return await createNotification({
    user_id: sellerId,
    type: 'product_low_stock',
    title: 'Low Stock Alert',
    message: `Your product "${productName}" is running low on stock (${currentStock} remaining).`,
    priority: 'medium',
    metadata: { product_id: productId, current_stock: currentStock },
    action_url: `/seller/inventory`,
    action_text: 'Manage Inventory',
    channels: ['in_app', 'email']
  });
}

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
  getPreferences,
  updatePreferences,
  createDefaultPreferences,
  deleteExpiredNotifications,
  // Helper functions
  notifyOrderPlaced,
  notifyProductApproved,
  notifyLowStock
};
