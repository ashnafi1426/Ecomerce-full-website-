/**
 * SUPPORT ROUTES
 * 
 * Routes for customer support and contact forms.
 */

const express = require('express');
const router = express.Router();
const { optionalAuthenticate } = require('../../middlewares/auth.middleware');
const supabase = require('../../config/supabase');

// Submit contact form
router.post('/contact', optionalAuthenticate, async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    const userId = req.user?.id || null;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Insert support ticket
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        name,
        email,
        subject,
        message,
        status: 'open',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // TODO: Send email notification to support team
    
    res.status(201).json({
      success: true,
      message: 'Your message has been sent. We\'ll get back to you soon!',
      ticket_id: ticket.id
    });
  } catch (error) {
    next(error);
  }
});

// Get FAQs
router.get('/faqs', async (req, res, next) => {
  try {
    const { data: faqs, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('is_published', true)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      count: faqs?.length || 0,
      faqs: faqs || []
    });
  } catch (error) {
    // If FAQs table doesn't exist, return empty array
    res.status(200).json({
      success: true,
      count: 0,
      faqs: []
    });
  }
});

module.exports = router;
