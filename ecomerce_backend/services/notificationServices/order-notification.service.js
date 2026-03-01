/**
 * ORDER NOTIFICATION SERVICE
 * 
 * Handles creating notifications when order status changes
 */

const notificationService = require('./notification.service');

/**
 * Create notification for order status change
 * @param {Object} order - Order object
 * @param {String} oldStatus - Previous status
 * @param {String} newStatus - New status
 */
async function notifyOrderStatusChange(order, oldStatus, newStatus) {
  try {
    console.log(`[Order Notification] Creating notification for order ${order.id}: ${oldStatus} → ${newStatus}`);
    
    // Map status to notification type and content
    const notificationConfig = {
      'paid': {
        type: 'payment_received',
        title: 'Payment Confirmed',
        message: 'Your payment has been confirmed. Your order is being processed.',
        priority: 'high',
        channels: ['in_app', 'email']
      },
      'processing': {
        type: 'order_confirmed',
        title: 'Order Being Processed',
        message: 'Your order is being processed and will be shipped soon.',
        priority: 'medium',
        channels: ['in_app', 'email']
      },
      'confirmed': {
        type: 'order_confirmed',
        title: 'Order Confirmed',
        message: 'Your order has been confirmed and is being prepared for shipment.',
        priority: 'medium',
        channels: ['in_app', 'email']
      },
      'shipped': {
        type: 'order_shipped',
        title: 'Order Shipped!',
        message: 'Your order has been shipped and is on its way to you.',
        priority: 'high',
        channels: ['in_app', 'email', 'sms']
      },
      'delivered': {
        type: 'order_delivered',
        title: 'Order Delivered',
        message: 'Your order has been delivered. Thank you for shopping with us!',
        priority: 'high',
        channels: ['in_app', 'email']
      },
      'cancelled': {
        type: 'order_cancelled',
        title: 'Order Cancelled',
        message: 'Your order has been cancelled.',
        priority: 'medium',
        channels: ['in_app', 'email']
      }
    };
    
    const config = notificationConfig[newStatus];
    
    if (!config) {
      console.log(`[Order Notification] No notification config for status: ${newStatus}`);
      return null;
    }
    
    // Create notification
    const notification = await notificationService.createNotification({
      user_id: order.user_id,
      type: config.type, // Use proper enum value
      title: config.title,
      message: config.message,
      priority: config.priority,
      metadata: {
        order_id: order.id,
        orderId: order.id, // Both formats for compatibility
        old_status: oldStatus,
        new_status: newStatus,
        order_amount: order.amount
      },
      action_url: `/orders/${order.id}`, // Fixed: Use correct frontend route (CustomerLayout is at root)
      action_text: 'View Order',
      channels: config.channels
    });
    
    console.log(`[Order Notification] ✅ Created notification for ${newStatus} status`);
    console.log(`   User: ${order.user_id}`);
    console.log(`   Title: ${config.title}`);
    console.log(`   Type: ${config.type}`);
    console.log(`   Channels: ${config.channels.join(', ')}`);
    
    return notification;
    
  } catch (error) {
    console.error('[Order Notification] Error creating notification:', error);
    // Don't throw - notifications are not critical
    return null;
  }
}

module.exports = {
  notifyOrderStatusChange
};
