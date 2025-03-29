const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
let transporter;

// Initialize the email transporter
const initializeTransporter = () => {
  // Always use the actual SMTP configuration regardless of environment
  try {
    console.log('Initializing email transporter with SMTP settings');
    
    // Create configuration with appropriate settings for Gmail
    const config = {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      // Add these options to fix SSL issues
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    };
    
    console.log(`Email config - Host: ${config.host}, Port: ${config.port}, Secure: ${config.secure}`);
    
    transporter = nodemailer.createTransport(config);
    
    // Verify connection configuration
    transporter.verify(function(error, success) {
      if (error) {
        console.error('Email transporter verification failed:', error);
        
        // Fallback to development mode logging if connection fails
        if (process.env.NODE_ENV === 'development') {
          console.log('Setting up fallback development email logger');
          transporter = {
            sendMail: async (mailOptions) => {
              console.log('DEV MODE FALLBACK - Email would be sent with the following details:');
              console.log(`To: ${mailOptions.to}`);
              console.log(`Subject: ${mailOptions.subject}`);
              console.log(`Content: ${mailOptions.text}`);
              return { messageId: 'dev-mode-message-id', success: true };
            }
          };
        }
      } else {
        console.log('Email server is ready to send messages');
      }
    });
  } catch (error) {
    console.error('Error creating email transporter:', error);
    
    // Fallback to development mode logging if creation fails
    if (process.env.NODE_ENV === 'development') {
      console.log('Setting up fallback development email logger after error');
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('DEV MODE FALLBACK - Email would be sent with the following details:');
          console.log(`To: ${mailOptions.to}`);
          console.log(`Subject: ${mailOptions.subject}`);
          console.log(`Content: ${mailOptions.text}`);
          return { messageId: 'dev-mode-message-id', success: true };
        }
      };
    } else {
      throw error;
    }
  }
};

// Call initialize when the module is loaded
initializeTransporter();

/**
 * Send a welcome email to a newly registered user
 * @param {string} email - Recipient email address
 * @param {string} name - Recipient name (optional)
 * @returns {Promise<Object>} Email sending result
 */
const sendWelcomeEmail = async (email, name = '') => {
  try {
    const displayName = name || email;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Life Tracker Team" <no-reply@lifetracker.example.com>',
      to: email,
      subject: 'Welcome to Life Tracker!',
      text: `Hi ${displayName},\n\nWelcome to Life Tracker! We're excited to have you on board.\n\nWith Life Tracker, you can easily manage your habits, tasks, and notes to stay productive and organized.\n\nIf you have any questions or need assistance, please don't hesitate to reach out to our support team.\n\nBest regards,\nThe Life Tracker Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a6ee0;">Welcome to Life Tracker!</h2>
          <p>Hi ${displayName},</p>
          <p>Welcome to Life Tracker! We're excited to have you on board.</p>
          <p>With Life Tracker, you can easily manage your:</p>
          <ul>
            <li><strong>Habits</strong> - Track daily and weekly routines to build positive behaviors</li>
            <li><strong>Tasks</strong> - Keep track of your to-dos and never miss a deadline</li>
            <li><strong>Notes</strong> - Capture your thoughts and ideas in one place</li>
          </ul>
          <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
          <p>Best regards,<br>The Life Tracker Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `
    };
    
    // Log email details for debugging purposes
    if (process.env.NODE_ENV === 'development') {
      console.log('Sending email with the following details:');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail
}; 