const nodemailer = require('nodemailer');

/**
 * Email Service for Order Notifications
 * Sends email notifications to customers and sellers
 */

// Create transporter with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'ashenafiashew074@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'lhln ysjx bmot ssnw'
  }
});

/**
 * Send customer order status notification email
 * @param {Object} emailData - Email data
 */
async function sendCustomerOrderStatusEmail(emailData) {
  try {
    const {
      email,
      display_name,
      title,
      message,
      action_url,
      action_text,
      metadata,
      type
    } = emailData;

    const customerName = display_name || 'Customer';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const fullActionUrl = action_url ? `${frontendUrl}${action_url}` : null;

    // Determine email styling based on status
    let headerColor = '#FF9900'; // Default orange
    let emoji = '📦';
    
    if (type === 'order_status_update') {
      const status = metadata?.new_status;
      if (status === 'confirmed') {
        headerColor = '#17a2b8'; // Info blue
        emoji = '⏳';
      } else if (status === 'shipped') {
        headerColor = '#007bff'; // Primary blue
        emoji = '🚚';
      } else if (status === 'delivered') {
        headerColor = '#28a745'; // Success green
        emoji = '✅';
      } else if (status === 'cancelled') {
        headerColor = '#dc3545'; // Danger red
        emoji = '❌';
      }
    }

    // Create email HTML
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background-color: ${headerColor};
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 20px;
    }
    .message-box {
      background-color: #f9f9f9;
      padding: 20px;
      border-left: 4px solid ${headerColor};
      margin: 20px 0;
      border-radius: 4px;
    }
    .order-details {
      background-color: #f9f9f9;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
      border: 1px solid #eee;
    }
    .order-details p {
      margin: 8px 0;
    }
    .button {
      display: inline-block;
      background-color: ${headerColor};
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
      text-align: center;
    }
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 12px;
    }
    .tracking-info {
      background-color: #e3f2fd;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .tracking-info strong {
      color: #1976d2;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>${emoji} ${title}</h1>
    </div>
    
    <div class="content">
      <p>Hello <strong>${customerName}</strong>,</p>
      
      <div class="message-box">
        <p style="margin: 0; font-size: 16px;">${message}</p>
      </div>
      
      ${metadata?.order_id ? `
      <div class="order-details">
        <h3 style="margin-top: 0;">Order Information</h3>
        <p><strong>Order ID:</strong> ${metadata.order_id}</p>
        ${metadata.product_name ? `<p><strong>Product:</strong> ${metadata.product_name}</p>` : ''}
        ${metadata.new_status ? `<p><strong>Status:</strong> ${metadata.new_status.charAt(0).toUpperCase() + metadata.new_status.slice(1)}</p>` : ''}
      </div>
      ` : ''}
      
      ${metadata?.tracking_number && metadata?.carrier ? `
      <div class="tracking-info">
        <h3 style="margin-top: 0;">📍 Tracking Information</h3>
        <p><strong>Carrier:</strong> ${metadata.carrier}</p>
        <p><strong>Tracking Number:</strong> ${metadata.tracking_number}</p>
        <p style="margin-bottom: 0;">You can track your package using the tracking number above.</p>
      </div>
      ` : ''}
      
      ${fullActionUrl && action_text ? `
      <center>
        <a href="${fullActionUrl}" class="button">
          ${action_text}
        </a>
      </center>
      ` : ''}
      
      <p style="margin-top: 30px;">Thank you for shopping with FastShop!</p>
    </div>
    
    <div class="footer">
      <p><strong>FastShop</strong> - Your Multi-Vendor Marketplace</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} FastShop. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text version
    const emailText = `
${emoji} ${title}

Hello ${customerName},

${message}

${metadata?.order_id ? `
Order Information:
- Order ID: ${metadata.order_id}
${metadata.product_name ? `- Product: ${metadata.product_name}` : ''}
${metadata.new_status ? `- Status: ${metadata.new_status.charAt(0).toUpperCase() + metadata.new_status.slice(1)}` : ''}
` : ''}

${metadata?.tracking_number && metadata?.carrier ? `
Tracking Information:
- Carrier: ${metadata.carrier}
- Tracking Number: ${metadata.tracking_number}
` : ''}

${fullActionUrl && action_text ? `${action_text}: ${fullActionUrl}` : ''}

Thank you for shopping with FastShop!

---
This is an automated notification from FastShop
Please do not reply to this email
© ${new Date().getFullYear()} FastShop. All rights reserved.
    `;

    // Send email
    const mailOptions = {
      from: `"FastShop" <${process.env.EMAIL_FROM || 'ashenafiashew074@gmail.com'}>`,
      to: email,
      subject: `${emoji} ${title}`,
      text: emailText,
      html: emailHTML
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[Email] ✅ Sent order status email to ${email} - Message ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      email: email
    };

  } catch (error) {
    console.error('[Email] ❌ Error sending customer order status email:', error);
    throw error;
  }
}

/**
 * Send new order notification email to seller
 * @param {Object} sellerInfo - Seller information
 * @param {Object} orderInfo - Order information
 */
async function sendSellerOrderNotification(sellerInfo, orderInfo) {
  try {
    const { email, display_name, business_name } = sellerInfo;
    const { sub_order_id, order_id, item_count, subtotal, items } = orderInfo;

    const sellerName = business_name || display_name || 'Seller';

    // Create email HTML
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #FF9900;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 0 0 5px 5px;
    }
    .order-details {
      background-color: white;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
      border: 1px solid #eee;
    }
    .item {
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .item:last-child {
      border-bottom: none;
    }
    .total {
      font-size: 18px;
      font-weight: bold;
      color: #FF9900;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #FF9900;
    }
    .button {
      display: inline-block;
      background-color: #FF9900;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 New Order Received!</h1>
  </div>
  
  <div class="content">
    <p>Hello <strong>${sellerName}</strong>,</p>
    
    <p>Great news! You have received a new order on FastShop.</p>
    
    <div class="order-details">
      <h3>Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Sub-Order ID:</strong> ${sub_order_id}</p>
      <p><strong>Number of Items:</strong> ${item_count}</p>
      
      <h4>Items:</h4>
      ${items.map(item => `
        <div class="item">
          <strong>${item.title || item.product_title || 'Product'}</strong><br>
          Quantity: ${item.quantity} × $${parseFloat(item.price).toFixed(2)} = $${(item.quantity * parseFloat(item.price)).toFixed(2)}
        </div>
      `).join('')}
      
      <div class="total">
        Total: $${parseFloat(subtotal).toFixed(2)}
      </div>
    </div>
    
    <p><strong>Next Steps:</strong></p>
    <ul>
      <li>Log in to your seller dashboard</li>
      <li>Review the order details</li>
      <li>Prepare the items for shipment</li>
      <li>Update the order status once shipped</li>
    </ul>
    
    <center>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/seller/orders" class="button">
        View Order in Dashboard
      </a>
    </center>
  </div>
  
  <div class="footer">
    <p>This is an automated notification from FastShop</p>
    <p>Please do not reply to this email</p>
    <p>&copy; ${new Date().getFullYear()} FastShop. All rights reserved.</p>
  </div>
</body>
</html>
    `;

    // Plain text version
    const emailText = `
Hello ${sellerName},

Great news! You have received a new order on FastShop.

Order Details:
- Order ID: ${order_id}
- Sub-Order ID: ${sub_order_id}
- Number of Items: ${item_count}

Items:
${items.map(item => `- ${item.title || item.product_title || 'Product'}: ${item.quantity} × $${parseFloat(item.price).toFixed(2)} = $${(item.quantity * parseFloat(item.price)).toFixed(2)}`).join('\n')}

Total: $${parseFloat(subtotal).toFixed(2)}

Next Steps:
1. Log in to your seller dashboard
2. Review the order details
3. Prepare the items for shipment
4. Update the order status once shipped

View your orders: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/seller/orders

---
This is an automated notification from FastShop
Please do not reply to this email
© ${new Date().getFullYear()} FastShop. All rights reserved.
    `;

    // Send email
    const mailOptions = {
      from: `"FastShop" <${process.env.EMAIL_FROM || 'ashenafiashew074@gmail.com'}>`,
      to: email,
      subject: `🎉 New Order Received - ${item_count} item(s) - $${parseFloat(subtotal).toFixed(2)}`,
      text: emailText,
      html: emailHTML
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[Email] Sent to ${email} - Message ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      email: email
    };

  } catch (error) {
    console.error('[Email] Error sending seller notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send order shipped notification to seller
 * @param {Object} sellerInfo - Seller information
 * @param {Object} shipmentInfo - Shipment information
 */
async function sendOrderShippedConfirmation(sellerInfo, shipmentInfo) {
  try {
    const { email, display_name } = sellerInfo;
    const { order_id, tracking_number, carrier } = shipmentInfo;

    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Order Shipped Successfully</h1>
  </div>
  <div class="content">
    <p>Hello ${display_name},</p>
    <p>Your order <strong>${order_id}</strong> has been marked as shipped.</p>
    <p><strong>Tracking Number:</strong> ${tracking_number}</p>
    <p><strong>Carrier:</strong> ${carrier}</p>
    <p>The customer will be notified about the shipment.</p>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: `"FastShop" <${process.env.EMAIL_FROM || 'ashenafiashew074@gmail.com'}>`,
      to: email,
      subject: `✅ Order Shipped - ${order_id}`,
      html: emailHTML
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Shipment confirmation sent to ${email}`);
    
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('[Email] Error sending shipment confirmation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test email configuration
 */
async function testEmailConfiguration() {
  try {
    await transporter.verify();
    console.log('[Email] Configuration verified successfully');
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('[Email] Configuration error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send chat message notification email
 * @param {Object} emailData - Email data
 */
async function sendChatMessageEmail(emailData) {
  try {
    const {
      email,
      display_name,
      title,
      message,
      action_url,
      action_text,
      metadata
    } = emailData;

    const recipientName = display_name || 'User';
    const senderName = metadata?.sender_name || 'Someone';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const fullActionUrl = action_url ? `${frontendUrl}${action_url}` : null;

    // Create email HTML
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #0084ff;
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 20px;
    }
    .message-box {
      background-color: #f0f2f5;
      padding: 20px;
      border-left: 4px solid #0084ff;
      margin: 20px 0;
      border-radius: 8px;
    }
    .sender-info {
      color: #0084ff;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .message-text {
      color: #1c1e21;
      font-size: 15px;
      line-height: 1.5;
    }
    .button {
      display: inline-block;
      background-color: #0084ff;
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
      text-align: center;
    }
    .button:hover {
      background-color: #0073e6;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 12px;
    }
    .chat-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="chat-icon">💬</div>
      <h1>${title}</h1>
    </div>
    
    <div class="content">
      <p>Hello <strong>${recipientName}</strong>,</p>
      
      <p>You have a new message from <strong>${senderName}</strong>:</p>
      
      <div class="message-box">
        <div class="sender-info">${senderName}</div>
        <div class="message-text">${message}</div>
      </div>
      
      ${fullActionUrl && action_text ? `
      <center>
        <a href="${fullActionUrl}" class="button">
          ${action_text}
        </a>
      </center>
      ` : ''}
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        💡 Tip: Reply directly from the FastShop platform to continue the conversation.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>FastShop</strong> - Your Multi-Vendor Marketplace</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
      <p>To manage your notification preferences, visit your account settings.</p>
      <p>&copy; ${new Date().getFullYear()} FastShop. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text version
    const emailText = `
💬 ${title}

Hello ${recipientName},

You have a new message from ${senderName}:

"${message}"

${fullActionUrl && action_text ? `${action_text}: ${fullActionUrl}` : ''}

💡 Tip: Reply directly from the FastShop platform to continue the conversation.

---
This is an automated notification from FastShop
Please do not reply to this email
To manage your notification preferences, visit your account settings
© ${new Date().getFullYear()} FastShop. All rights reserved.
    `;

    // Send email
    const mailOptions = {
      from: `"FastShop Messages" <${process.env.EMAIL_FROM || 'ashenafiashew074@gmail.com'}>`,
      to: email,
      subject: `💬 ${title} from ${senderName}`,
      text: emailText,
      html: emailHTML
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[Email] ✅ Sent chat message email to ${email} - Message ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      email: email
    };

  } catch (error) {
    console.error('[Email] ❌ Error sending chat message email:', error);
    throw error;
  }
}

module.exports = {
  sendSellerOrderNotification,
  sendOrderShippedConfirmation,
  sendCustomerOrderStatusEmail,
  sendChatMessageEmail,
  testEmailConfiguration
};
