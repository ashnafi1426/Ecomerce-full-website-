const supabase = require('../../config/supabase.js');

/**
 * Phase 3: Multi-Vendor Order Splitting Service
 * 
 * Automatically splits orders by seller after payment succeeds
 * Creates sub-orders and notifies sellers
 */

/**
 * Split order by seller and create sub-orders
 * @param {string} orderId - Parent order ID
 * @param {Array} orderItems - Array of order items with product details
 * @returns {Promise<Object>} - Result with sub-orders created
 */
async function splitOrderBySeller(orderId, orderItems) {
  try {
    console.log(`[Order Splitting] Starting for order: ${orderId}`);
    
    // 1. Get product details including seller_id
    const productIds = orderItems.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, seller_id, title, sku, price')
      .in('id', productIds);
    
    if (productsError) {
      console.error('[Order Splitting] Error fetching products:', productsError);
      throw new Error('Failed to fetch product details');
    }
    
    // 2. Group items by seller
    const itemsBySeller = {};
    
    for (const item of orderItems) {
      const product = products.find(p => p.id === item.product_id);
      
      if (!product) {
        console.warn(`[Order Splitting] Product not found: ${item.product_id}`);
        continue;
      }
      
      const sellerId = product.seller_id;
      
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = [];
      }
      
      itemsBySeller[sellerId].push({
        ...item,
        seller_id: sellerId,
        product_title: product.title,
        product_sku: product.sku
      });
    }
    
    const sellerIds = Object.keys(itemsBySeller);
    console.log(`[Order Splitting] Found ${sellerIds.length} seller(s)`);
    
    // 3. If only one seller, no need to split
    if (sellerIds.length === 1) {
      console.log('[Order Splitting] Single seller order, no splitting needed');
      return {
        isSplit: false,
        sellerCount: 1,
        sellerId: sellerIds[0],
        message: 'Single seller order'
      };
    }
    
    // 4. Create sub-orders for each seller
    const subOrders = [];
    
    for (const sellerId of sellerIds) {
      const sellerItems = itemsBySeller[sellerId];
      
      // Calculate sub-order total
      const subOrderTotal = sellerItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      
      // Create sub-order
      const { data: subOrder, error: subOrderError } = await supabase
        .from('sub_orders')
        .insert({
          parent_order_id: orderId,
          seller_id: sellerId,
          subtotal: subOrderTotal,
          total_amount: subOrderTotal, // Required field
          fulfillment_status: 'pending',
          payout_status: 'pending',
          items: sellerItems // Store items in JSONB
        })
        .select()
        .single();
      
      if (subOrderError) {
        console.error(`[Order Splitting] Error creating sub-order for seller ${sellerId}:`, subOrderError);
        continue;
      }
      
      console.log(`[Order Splitting] Created sub-order ${subOrder.id} for seller ${sellerId}`);
      
      // Try to update order_items with sub_order_id (optional - column may not exist)
      try {
        for (const item of sellerItems) {
          await supabase
            .from('order_items')
            .update({ sub_order_id: subOrder.id })
            .eq('order_id', orderId)
            .eq('product_id', item.product_id);
        }
      } catch (updateError) {
        // Column doesn't exist - that's okay, items are stored in sub_order.items JSONB
        console.log(`[Order Splitting] Note: sub_order_id column not available in order_items`);
      }
      
      subOrders.push({
        sub_order_id: subOrder.id,
        seller_id: sellerId,
        item_count: sellerItems.length,
        subtotal: subOrderTotal
      });
    }
    
    console.log(`[Order Splitting] Successfully created ${subOrders.length} sub-orders`);
    
    return {
      isSplit: true,
      sellerCount: sellerIds.length,
      subOrders,
      message: `Order split into ${subOrders.length} sub-orders`
    };
    
  } catch (error) {
    console.error('[Order Splitting] Error:', error);
    throw error;
  }
}

/**
 * Notify sellers about new orders
 * @param {Array} subOrders - Array of sub-orders
 * @param {string} orderId - Parent order ID
 */
async function notifySellers(subOrders, orderId) {
  try {
    console.log(`[Seller Notification] Notifying ${subOrders.length} seller(s)`);
    
    for (const subOrder of subOrders) {
      // Create notification for seller
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: subOrder.seller_id,
          type: 'new_order',
          title: 'New Order Received',
          message: `You have a new order with ${subOrder.item_count} item(s). Total: $${subOrder.subtotal.toFixed(2)}`,
          metadata: {
            order_id: orderId,
            sub_order_id: subOrder.sub_order_id,
            item_count: subOrder.item_count,
            subtotal: subOrder.subtotal
          },
          priority: 'high'
        });
      
      if (notificationError) {
        console.error(`[Seller Notification] Error creating notification:`, notificationError);
      } else {
        console.log(`[Seller Notification] Notified seller ${subOrder.seller_id}`);
      }
    }
    
    console.log('[Seller Notification] All sellers notified');
    
  } catch (error) {
    console.error('[Seller Notification] Error:', error);
    // Don't throw - notifications are not critical
  }
}

/**
 * Get sub-orders for a parent order
 * @param {string} orderId - Parent order ID
 * @returns {Promise<Array>} - Array of sub-orders
 */
async function getSubOrders(orderId) {
  try {
    const { data, error } = await supabase
      .from('sub_orders')
      .select('*')
      .eq('parent_order_id', orderId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('[Get Sub-Orders] Error:', error);
      throw error;
    }
    
    return data || [];
    
  } catch (error) {
    console.error('[Get Sub-Orders] Error:', error);
    throw error;
  }
}

/**
 * Update sub-order fulfillment status
 * @param {string} subOrderId - Sub-order ID
 * @param {string} status - New status
 * @param {Object} trackingInfo - Tracking information (optional)
 */
async function updateSubOrderStatus(subOrderId, status, trackingInfo = null) {
  try {
    const updateData = {
      fulfillment_status: status,
      updated_at: new Date().toISOString()
    };
    
    if (trackingInfo) {
      updateData.tracking_number = trackingInfo.tracking_number;
      updateData.carrier = trackingInfo.carrier;
      updateData.shipped_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('sub_orders')
      .update(updateData)
      .eq('id', subOrderId)
      .select()
      .single();
    
    if (error) {
      console.error('[Update Sub-Order] Error:', error);
      throw error;
    }
    
    console.log(`[Update Sub-Order] Updated ${subOrderId} to ${status}`);
    
    // Check if all sub-orders are fulfilled
    const { data: subOrder } = await supabase
      .from('sub_orders')
      .select('parent_order_id')
      .eq('id', subOrderId)
      .single();
    
    if (subOrder) {
      await checkAndUpdateParentOrderStatus(subOrder.parent_order_id);
    }
    
    return data;
    
  } catch (error) {
    console.error('[Update Sub-Order] Error:', error);
    throw error;
  }
}

/**
 * Check if all sub-orders are fulfilled and update parent order
 * @param {string} orderId - Parent order ID
 */
async function checkAndUpdateParentOrderStatus(orderId) {
  try {
    // Get all sub-orders for this order
    const { data: subOrders, error } = await supabase
      .from('sub_orders')
      .select('fulfillment_status')
      .eq('parent_order_id', orderId);
    
    if (error || !subOrders || subOrders.length === 0) {
      return;
    }
    
    // Check if all are delivered
    const allDelivered = subOrders.every(so => so.fulfillment_status === 'delivered');
    const allShipped = subOrders.every(so => 
      so.fulfillment_status === 'shipped' || so.fulfillment_status === 'delivered'
    );
    
    let newStatus = null;
    
    if (allDelivered) {
      newStatus = 'delivered';
    } else if (allShipped) {
      newStatus = 'shipped';
    } else if (subOrders.some(so => so.fulfillment_status === 'shipped')) {
      newStatus = 'partially_shipped';
    }
    
    if (newStatus) {
      await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      console.log(`[Parent Order] Updated ${orderId} to ${newStatus}`);
    }
    
  } catch (error) {
    console.error('[Check Parent Order] Error:', error);
  }
}

module.exports = {
  splitOrderBySeller,
  notifySellers,
  getSubOrders,
  updateSubOrderStatus,
  checkAndUpdateParentOrderStatus
};
