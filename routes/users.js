const express = require('express');
const router = express.Router();
const { sendWelcomeEmail } = require('../utils/emailService');
const { authenticate } = require('../middleware/auth');

// POST send welcome email (public endpoint, no authentication required)
router.post('/welcome-email', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }
    
    // Validate email format (simple validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Send welcome email
    const result = await sendWelcomeEmail(email, name);
    
    // Return success response
    res.status(200).json({
      message: 'Welcome email sent successfully',
      success: true,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({
      message: 'Failed to send welcome email',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// GET test email sending (for debugging only)
router.get('/test-email', async (req, res) => {
  try {
    // Check if the environment is development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Test endpoint only available in development mode' });
    }
    
    // Get the recipient email from query parameter or use default
    const testEmail = req.query.email || process.env.EMAIL_USER || 'test@example.com';
    
    console.log(`Attempting to send test email to ${testEmail}...`);
    
    // Send test email
    const result = await sendWelcomeEmail(testEmail, 'Test User');
    
    // Log detailed info for debugging
    console.log('Email service config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE,
      user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + '...' : undefined,
      from: process.env.EMAIL_FROM
    });
    
    // Return success response
    res.status(200).json({
      message: 'Test email sent successfully',
      success: true,
      recipient: testEmail,
      messageId: result.messageId,
      configInfo: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE,
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + '...' : undefined
      }
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      message: 'Failed to send test email',
      error: error.message,
      stack: error.stack,
      configInfo: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE,
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + '...' : undefined
      }
    });
  }
});

// Additional user-related endpoints can be added here...
// For example:

// GET current user (requires authentication)
router.get('/me', authenticate, async (req, res) => {
  try {
    // The user information is available in req.user after authentication
    const userInfo = {
      id: req.user.uid,
      email: req.user.email,
      name: req.user.name || null,
      // Include other user properties as needed, but exclude sensitive information
    };
    
    res.json(userInfo);
  } catch (error) {
    console.error('Error fetching user information:', error);
    res.status(500).json({
      message: 'Failed to fetch user information',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

module.exports = router; 