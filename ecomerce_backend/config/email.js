/**
 * EMAIL CONFIGURATION
 * 
 * Nodemailer setup for sending transactional emails.
 * Supports Gmail, SendGrid, or any SMTP provider.
 */

const nodemailer = require('nodemailer');
const { envConfig } = require('./env.config');

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 */
const initializeTransporter = () => {
  if (transporter) {
    return transporter;
  }

  // Check if email is configured
  if (!envConfig.email.host || !envConfig.email.user || !envConfig.email.password) {
    console.warn('⚠️  Email not configured. Email notifications will be disabled.');
    return null;
  }

  try {
    transporter = nodemailer.createTransporter({
      host: envConfig.email.host,
      port: envConfig.email.port,
      secure: envConfig.email.port === 465, // true for 465, false for other ports
      auth: {
        user: envConfig.email.user,
        pass: envConfig.email.password
      }
    });

    console.log('✅ Email transporter initialized');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to initialize email transporter:', error.message);
    return null;
  }
};

/**
 * Send email
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Send result
 */
const sendEmail = async (options) => {
  const emailTransporter = initializeTransporter();

  if (!emailTransporter) {
    console.warn('⚠️  Email not sent (transporter not configured)');
    return { success: false, message: 'Email not configured' };
  }

  try {
    const mailOptions = {
      from: envConfig.email.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify email configuration
 */
const verifyEmailConfig = async () => {
  const emailTransporter = initializeTransporter();

  if (!emailTransporter) {
    return false;
  }

  try {
    await emailTransporter.verify();
    console.log('✅ Email configuration verified');
    return true;
  } catch (error) {
    console.error('❌ Email configuration invalid:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  verifyEmailConfig,
  initializeTransporter
};
