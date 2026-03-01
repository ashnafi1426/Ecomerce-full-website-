const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/notificationControllers/notification.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

/**
 * Notification Routes
 * All routes require authentication
 */

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications with filters
 * @access  Private
 * @query   limit, offset, unreadOnly, type, priority, includeArchived
 */
router.get('/', authenticate, notificationController.getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get notification preferences
 * @access  Private
 */
router.get('/preferences', authenticate, notificationController.getPreferences);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update notification preferences
 * @access  Private
 */
router.put('/preferences', authenticate, notificationController.updatePreferences);

/**
 * @route   POST /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post('/mark-all-read', authenticate, notificationController.markAllAsRead);

/**
 * @route   POST /api/notifications/test
 * @desc    Create test notification (development only)
 * @access  Private
 */
router.post('/test', authenticate, notificationController.createTestNotification);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/:id/read', authenticate, notificationController.markAsRead);

/**
 * @route   PATCH /api/notifications/:id/unread
 * @desc    Mark notification as unread
 * @access  Private
 */
router.patch('/:id/unread', authenticate, notificationController.markAsUnread);

/**
 * @route   PATCH /api/notifications/:id/archive
 * @desc    Archive notification
 * @access  Private
 */
router.patch('/:id/archive', authenticate, notificationController.archiveNotification);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', authenticate, notificationController.deleteNotification);

module.exports = router;
