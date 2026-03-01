const supabase = require('../../config/supabase');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class GuestService {
  // ==========================================
  // GUEST CART MANAGEMENT
  // ==========================================

  async createGuestCart(sessionId, expiresAt) {
    const { data, error } = await supabase
      .from('guest_carts')
      .insert({
        session_id: sessionId,
        cart_data: [],
        expires_at: expiresAt
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create guest cart: ${error.message}`);
    return data;
  }

  async getGuestCart(sessionId) {
    const { data, error } = await supabase
      .from('guest_carts')
      .select('*')
      .eq('session_id', sessionId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get guest cart: ${error.message}`);
    }

    return data;
  }

  async addToGuestCart(sessionId, productId, quantity) {
    // Get current cart
    const cart = await this.getGuestCart(sessionId);
    
    if (!cart) {
      throw new Error('Cart not found or expired');
    }

    // Parse cart data
    let cartData = cart.cart_data || [];
    
    // Check if product already in cart
    const existingItemIndex = cartData.findIndex(item => item.product_id === productId);
    
    if (existingItemIndex >= 0) {
      // Update quantity
      cartData[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cartData.push({
        product_id: productId,
        quantity: quantity,
        added_at: new Date().toISOString()
      });
    }

    // Update cart
    const { data, error } = await supabase
      .from('guest_carts')
      .update({
        cart_data: cartData,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update cart: ${error.message}`);
    return data;
  }

  async updateGuestCartItem(sessionId, productId, quantity) {
    const cart = await this.getGuestCart(sessionId);
    
    if (!cart) {
      throw new Error('Cart not found or expired');
    }

    let cartData = cart.cart_data || [];
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cartData = cartData.filter(item => item.product_id !== productId);
    } else {
      // Update quantity
      const itemIndex = cartData.findIndex(item => item.product_id === productId);
      if (itemIndex >= 0) {
        cartData[itemIndex].quantity = quantity;
      }
    }

    const { data, error } = await supabase
      .from('guest_carts')
      .update({
        cart_data: cartData,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update cart: ${error.message}`);
    return data;
  }

  async removeFromGuestCart(sessionId, productId) {
    const cart = await this.getGuestCart(sessionId);
    
    if (!cart) {
      throw new Error('Cart not found or expired');
    }

    let cartData = cart.cart_data || [];
    cartData = cartData.filter(item => item.product_id !== productId);

    const { data, error } = await supabase
      .from('guest_carts')
      .update({
        cart_data: cartData,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw new Error(`Failed to remove item: ${error.message}`);
    return data;
  }

  async clearGuestCart(sessionId) {
    const { data, error } = await supabase
      .from('guest_carts')
      .update({
        cart_data: [],
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw new Error(`Failed to clear cart: ${error.message}`);
    return data;
  }

  // ==========================================
  // GUEST USER MANAGEMENT
  // ==========================================

  async findUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data;
  }

  async createGuestUser(email, fullName, phone) {
    // Check if guest user already exists
    const existingUser = await this.findUserByEmail(email);
    
    if (existingUser) {
      if (existingUser.user_type === 'registered') {
        throw new Error('Email already registered. Please login.');
      }
      // Update existing guest user
      const { data, error } = await supabase
        .from('users')
        .update({
          display_name: fullName,
          phone: phone,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select()
        .single();

      if (error) throw new Error(`Failed to update guest user: ${error.message}`);
      return data;
    }

    // Create new guest user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: email,
        display_name: fullName,
        phone: phone,
        user_type: 'guest',
        role: 'customer',
        email_verified: false,
        guest_session_id: uuidv4()
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create guest user: ${error.message}`);
    return data;
  }

  // ==========================================
  // GUEST ADDRESS MANAGEMENT
  // ==========================================

  async saveGuestAddress(addressData) {
    const { data, error } = await supabase
      .from('guest_addresses')
      .insert({
        guest_email: addressData.guestEmail,
        full_name: addressData.fullName,
        phone: addressData.phone,
        address_line1: addressData.addressLine1,
        address_line2: addressData.addressLine2,
        city: addressData.city,
        state: addressData.state,
        postal_code: addressData.postalCode,
        country: addressData.country || 'US',
        is_default: true
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to save address: ${error.message}`);
    return data;
  }

  async getGuestAddresses(guestEmail) {
    const { data, error } = await supabase
      .from('guest_addresses')
      .select('*')
      .eq('guest_email', guestEmail)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get addresses: ${error.message}`);
    return data;
  }

  // ==========================================
  // GUEST ORDER MANAGEMENT
  // ==========================================

  async placeGuestOrder(orderData) {
    const {
      sessionId,
      guestEmail,
      guestPhone,
      shippingAddress,
      paymentMethod,
      items,
      trackingToken
    } = orderData;

    // Calculate total
    let subtotal = 0;
    for (const item of items) {
      // Get product price
      const { data: product } = await supabase
        .from('products')
        .select('price')
        .eq('id', item.product_id)
        .single();
      
      if (product) {
        subtotal += product.price * item.quantity;
      }
    }

    const shippingCost = 10.00; // Fixed shipping for now
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shippingCost + tax;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        guest_email: guestEmail,
        guest_phone: guestPhone,
        status: 'pending',
        total_amount: total,
        shipping_address: JSON.stringify(shippingAddress),
        payment_method: paymentMethod,
        order_tracking_token: trackingToken,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);

    // Create order items
    for (const item of items) {
      await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        });
    }

    // Clear guest cart
    if (sessionId) {
      await this.clearGuestCart(sessionId);
    }

    return order;
  }

  async getOrderByToken(token) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            id,
            title,
            image_url,
            price
          )
        )
      `)
      .eq('order_tracking_token', token)
      .single();

    if (error) throw new Error(`Failed to get order: ${error.message}`);
    return data;
  }

  async getOrderByEmailAndId(email, orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            id,
            title,
            image_url,
            price
          )
        )
      `)
      .eq('guest_email', email)
      .eq('id', orderId)
      .single();

    if (error) throw new Error(`Failed to get order: ${error.message}`);
    return data;
  }

  // ==========================================
  // GUEST TO REGISTERED CONVERSION
  // ==========================================

  async convertGuestToRegistered(email, password, fullName) {
    // Find guest user
    const guestUser = await this.findUserByEmail(email);
    
    if (!guestUser) {
      throw new Error('Guest user not found');
    }

    if (guestUser.user_type === 'registered') {
      throw new Error('User is already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user to registered
    const { data, error } = await supabase
      .from('users')
      .update({
        user_type: 'registered',
        password_hash: hashedPassword,
        display_name: fullName,
        email_verified: true,
        converted_from_guest: true,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (error) throw new Error(`Failed to convert user: ${error.message}`);

    // Update all guest orders to link to user
    await supabase
      .from('orders')
      .update({ user_id: data.id })
      .eq('guest_email', email);

    return data;
  }

  // ==========================================
  // EMAIL NOTIFICATIONS (Placeholder)
  // ==========================================

  async sendOrderConfirmation(guestEmail, order, trackingToken) {
    // TODO: Implement email service integration
    console.log(`📧 Sending order confirmation to ${guestEmail}`);
    console.log(`Order ID: ${order.id}`);
    console.log(`Tracking URL: ${process.env.FRONTEND_URL}/track-order?token=${trackingToken}`);
    
    // In production, integrate with SendGrid, AWS SES, or similar
    return true;
  }

  async sendTrackingLink(guestEmail, orderId, trackingToken) {
    console.log(`📧 Sending tracking link to ${guestEmail}`);
    console.log(`Tracking URL: ${process.env.FRONTEND_URL}/track-order?token=${trackingToken}`);
    return true;
  }

  // ==========================================
  // CLEANUP UTILITIES
  // ==========================================

  async cleanupExpiredCarts() {
    const { data, error } = await supabase
      .from('guest_carts')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) throw new Error(`Failed to cleanup carts: ${error.message}`);
    return data;
  }
}

module.exports = new GuestService();
