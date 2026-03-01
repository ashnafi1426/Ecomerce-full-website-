/**
 * SELLER ORDER SERVICE
 * 
 * Business logic for seller order management and fulfillment
 */

const supabase = require('../../config/supabase');
const notificationService = require('../notificationServices/notification.service');

/**
 * Get all orders for a seller
 * @param {string} sellerId - Seller ID
 * @param {Object} filters - Filter options (status, limit, offset)
 * @returns {Promise<Array>} - Array of sub-orders
 */
async function getSellerOrders(sellerId, filters = {}) {
  try {
    const { fulfillment_status, limit = 50, offset = 0 } = filters;
    
    let query = supabase
      .from('sub_orders')
      .select(`
        *,
        orders!sub_orders_parent_order_id_fkey (
          id,
          created_at,
          shipping_address,
          status,
          user_id,
          users!orders_user_id_fkey (
            display_name,
            email,
            phone
          )
        )
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (fulfillment_status) {
      query = query.eq('fulfillment_status', fulfillment_status);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    if (offset) {
      query = query.range(offset, offset + limit - 1);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[Seller Order Service] Error fetching orders:', error);
      throw error;
    }
    
    return data || [];
    
  } catch (error) {
    console.error('[Seller Order Service] Error:', error);
    throw error;
  }
}

/**
 * Get single order details for seller
 * @param {string} sellerId - Seller ID
 * @param {string} subOrderId - Sub-order ID
 * @returns {Promise<Object>} - Order details
 */
async function getOrderDetails(sellerId, subOrderId) {
  try {
    const { data, error } = await supabase
      .from('sub_orders')
      .select(`
        *,
        orders!sub_orders_parent_order_id_fkey (
          id,
          created_at,
          shipping_address,
          status,
          user_id,
          users!orders_user_id_fkey (
            display_name,
            email,
            phone
          )
        )
      `)
      .eq('id', subOrderId)
      .eq('seller_id', sellerId)
      .single();
    
    if (error) {
      console.error('[Seller Order Service] Error fetching order details:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Order not found or access denied');
    }
    
    return data;
    
  } catch (error) {
    console.error('[Seller Order Service] Error:', error);
    throw error;
  }
}

/**
 * Update order fulfillment status
 * @param {string} sellerId - Seller ID
 * @param {string} subOrderId - Sub-order ID
 * @param {string} newStatus - New fulfillment status
 * @returns {Promise<Object>} - Updated order
 */
async function updateOrderStatus(sellerId, subOrderId, newStatus) {
  try {
    // Validate status - only these values are allowed by database constraint
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Get current order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('sub_orders')
      .select('fulfillment_status, parent_order_id')
      .eq('id', subOrderId)
      .eq('seller_id', sellerId)
      .single();
    
    if (fetchError || !currentOrder) {
      throw new Error('Order not found or access denied');
    }
    
    // Validate status transition
    const currentStatus = currentOrder.fulfillment_status;
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
    
    // Update status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('sub_orders')
      .update({
        fulfillment_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', subOrderId)
      .eq('seller_id', sellerId)
      .select()
      .single();
    
    if (updateError) {
      console.error('[Seller Order Service] Error updating status:', updateError);
      throw updateError;
    }
    
    console.log(`[Seller Order Service] Updated order ${subOrderId} to ${newStatus}`);
    
    // Send notification to customer
    await notifyCustomerOfStatusChange(subOrderId, newStatus);
    
    // Update parent order status if needed
    await updateParentOrderStatus(currentOrder.parent_order_id);
    
    return updatedOrder;
    
  } catch (error) {
    console.error('[Seller Order Service] Error updating status:', error);
    throw error;
  }
}

/**
 * Add shipping information to order
 * @param {string} sellerId - Seller ID
 * @param {string} subOrderId - Sub-order ID
 * @param {Object} shippingInfo - Shipping details
 * @returns {Promise<Object>} - Updated order
 */
async function addShippingInfo(sellerId, subOrderId, shippingInfo) {
  try {
    const { tracking_number, carrier, estimated_delivery } = shippingInfo;
    
    if (!tracking_number || !carrier) {
      throw new Error('Tracking number and carrier are required');
    }
    
    // Update order with shipping info and set status to shipped
    const updateData = {
      fulfillment_status: 'shipped',
      tracking_number,
      carrier,
      shipped_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: updatedOrder, error } = await supabase
      .from('sub_orders')
      .update(updateData)
      .eq('id', subOrderId)
      .eq('seller_id', sellerId)
      .select(`
        *,
        orders!sub_orders_parent_order_id_fkey (
          id,
          user_id,
          users!orders_user_id_fkey (
            id,
            display_name,
            email
          )
        )
      `)
      .single();
    
    if (error) {
      console.error('[Seller Order Service] Error adding shipping info:', error);
      throw error;
    }
    
    if (!updatedOrder) {
      throw new Error('Order not found or access denied');
    }
    
    console.log(`[Seller Order Service] Added shipping info to order ${subOrderId}`);
    
    // Notification is sent by notifyCustomerOfStatusChange when status changes to 'shipped'
    
    // Update parent order status
    await updateParentOrderStatus(updatedOrder.orders.id);
    
    return updatedOrder;
    
  } catch (error) {
    console.error('[Seller Order Service] Error adding shipping info:', error);
    throw error;
  }
}

/**
 * Validate status transition
 * @param {string} currentStatus - Current status
 * @param {string} newStatus - New status
 * @returns {boolean} - Is valid transition
 */
function isValidStatusTransition(currentStatus, newStatus) {
  // Don't allow transitioning to the same status
  if (currentStatus === newStatus) {
    return false;
  }
  
  // Valid transitions based on database constraint: pending, confirmed, shipped, delivered, cancelled
  const transitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['shipped', 'cancelled'],
    'shipped': ['delivered'], // Can only mark as delivered once shipped
    'delivered': [], // Final state
    'cancelled': [] // Final state
  };
  
  return transitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Notify customer of status change
 * @param {string} subOrderId - Sub-order ID
 * @param {string} newStatus - New status
 */
async function notifyCustomerOfStatusChange(subOrderId, newStatus) {
  try {
    // Get order and customer info
    const { data: order, error } = await supabase
      .from('sub_orders')
      .select(`
        id,
        parent_order_id,
        product_name,
        tracking_number,
        carrier,
        orders!sub_orders_parent_order_id_fkey (
          user_id,
          users!orders_user_id_fkey (
            display_name,
            email
          )
        )
      `)
      .eq('id', subOrderId)
      .single();
    
    if (error || !order) {
      console.error('[Seller Order Service] Error fetching order for notification:', error);
      return;
    }
    
    // Define notification content based on status
    const notificationConfig = {
      'confirmed': {
        title: 'Order Being Prepared',
        message: 'Your order is being prepared',
        priority: 'medium',
        channels: ['in_app', 'email'],
        action_text: 'View Order',
        action_url: `/orders/${order.parent_order_id}`
      },
      'shipped': {
        title: 'Order Shipped!',
        message: order.tracking_number && order.carrier
          ? `Your order has been shipped via ${order.carrier}. Tracking: ${order.tracking_number}`
          : 'Your order has been shipped',
        priority: 'high',
        channels: ['in_app', 'email', 'sms'],
        action_text: 'Track Package',
        action_url: `/orders/${order.parent_order_id}`
      },
      'delivered': {
        title: 'Order Delivered',
        message: 'Your order has been delivered',
        priority: 'high',
        channels: ['in_app', 'email'],
        action_text: 'View Order',
        action_url: `/orders/${order.parent_order_id}`
      },
      'cancelled': {
        title: 'Order Cancelled',
        message: 'Your order has been cancelled',
        priority: 'medium',
        channels: ['in_app', 'email'],
        action_text: 'View Order',
        action_url: `/orders/${order.parent_order_id}`
      }
    };
    
    const config = notificationConfig[newStatus];
    
    if (!config) {
      console.log(`[Seller Order Service] No notification config for status: ${newStatus}`);
      return;
    }
    
    // Create notification
    await notificationService.createNotification({
      user_id: order.orders.user_id,
      type: 'order_status_update',
      title: config.title,
      message: config.message,
      priority: config.priority,
      metadata: {
        order_id: order.parent_order_id,
        sub_order_id: subOrderId,
        new_status: newStatus,
        product_name: order.product_name,
        tracking_number: order.tracking_number,
        carrier: order.carrier
      },
      action_url: config.action_url,
      action_text: config.action_text,
      channels: config.channels
    });
    
    console.log(`[Seller Order Service] ✅ Notified customer of status change to ${newStatus}`);
    console.log(`   Customer: ${order.orders.users.email}`);
    console.log(`   Title: ${config.title}`);
    console.log(`   Channels: ${config.channels.join(', ')}`);
    
  } catch (error) {
    console.error('[Seller Order Service] Error notifying customer:', error);
    // Don't throw - notifications are not critical
  }
}

/**
 * Update parent order status based on sub-orders
 * @param {string} parentOrderId - Parent order ID
 */
async function updateParentOrderStatus(parentOrderId) {
  try {
    // Get all sub-orders for this parent order
    const { data: subOrders, error } = await supabase
      .from('sub_orders')
      .select('fulfillment_status')
      .eq('parent_order_id', parentOrderId);
    
    if (error || !subOrders || subOrders.length === 0) {
      return;
    }
    
    // Determine parent order status
    const allDelivered = subOrders.every(so => so.fulfillment_status === 'delivered');
    const allShipped = subOrders.every(so => 
      so.fulfillment_status === 'shipped' || so.fulfillment_status === 'delivered'
    );
    const someShipped = subOrders.some(so => so.fulfillment_status === 'shipped');
    const allCancelled = subOrders.every(so => so.fulfillment_status === 'cancelled');
    
    let newStatus = null;
    
    if (allDelivered) {
      newStatus = 'delivered';
    } else if (allCancelled) {
      newStatus = 'cancelled';
    } else if (allShipped) {
      newStatus = 'shipped';
    } else if (someShipped) {
      newStatus = 'partially_shipped';
    }
    
    if (newStatus) {
      await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', parentOrderId);
      
      console.log(`[Seller Order Service] Updated parent order ${parentOrderId} to ${newStatus}`);
    }
    
  } catch (error) {
    console.error('[Seller Order Service] Error updating parent order status:', error);
  }
}

module.exports = {
  getSellerOrders,
  getOrderDetails,
  updateOrderStatus,
  addShippingInfo
};
