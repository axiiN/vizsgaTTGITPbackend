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

/**
 * Send a recurring reminder email for a habit
 * @param {Object} data - Contains habit, user email, and name information
 * @returns {Promise<Object>} Email sending result
 */
const sendHabitReminderEmail = async (data) => {
  try {
    const { habitId, email, name = '' } = data;
    
    // Get the latest habit information from the database
    // We need to import the model here to avoid circular dependencies
    const habitModel = require('../models/habitModel');
    const habit = await habitModel.getHabitById(habitId, data.userId);
    
    // If the habit no longer exists, don't send a reminder
    if (!habit) {
      console.log(`Habit ${habitId} no longer exists. Skipping reminder.`);
      return { success: false, reason: 'habit_not_found' };
    }
    
    const displayName = name || email;
    const habitName = habit.name;
    const frequency = habit.frequency || 'daily';
    const streak = habit.streak || 0;
    const category = habit.category || 'General';
    
    // Format the frequency for display
    const frequencyText = frequency.charAt(0).toUpperCase() + frequency.slice(1);
    
    // Get streakText based on the current streak
    let streakText = '';
    if (streak === 0) {
      streakText = 'Start your streak today!';
    } else if (streak === 1) {
      streakText = 'You have a streak of 1 day! Keep it going!';
    } else {
      streakText = `You have a streak of ${streak} days! Keep up the good work!`;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Life Tracker Team" <no-reply@lifetracker.example.com>',
      to: email,
      subject: `Reminder: ${habitName}`,
      text: `Hi ${displayName},\n\nThis is a reminder for your ${frequency} habit: "${habitName}" (${category}).\n\n${streakText}\n\nKeeping up with your habits consistently is the key to building lasting behavior changes.\n\nBest regards,\nThe Life Tracker Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a6ee0;">Habit Reminder</h2>
          <p>Hi ${displayName},</p>
          <p>This is a reminder for your <strong>${frequencyText}</strong> habit:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">${habitName}</h3>
            <p><strong>Category:</strong> ${category}</p>
            <p style="margin-bottom: 10px;">${habit.description || ''}</p>
            <p style="margin-top: 15px; color: #4a6ee0; font-weight: bold;">
              ${streakText}
            </p>
          </div>
          <p>Keeping up with your habits consistently is the key to building lasting behavior changes.</p>
          <p>Best regards,<br>The Life Tracker Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `
    };
    
    // Log email details for debugging purposes
    if (process.env.NODE_ENV === 'development') {
      console.log('Sending habit reminder email with the following details:');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Habit reminder email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending habit reminder email:', error);
    throw error;
  }
};

/**
 * Send a task due reminder email 15 minutes before the task is due
 * @param {Object} data - Contains task, user email, and name information
 * @returns {Promise<Object>} Email sending result
 */
const sendTaskDueReminderEmail = async (data) => {
  try {
    const { taskId, email, name = '' } = data;
    
    // Get the latest task information from the database
    // We need to import the model here to avoid circular dependencies
    const taskModel = require('../models/taskModel');
    const task = await taskModel.getTaskById(taskId, data.userId);
    
    // If the task no longer exists or is already completed, don't send a reminder
    if (!task || task.completed) {
      console.log(`Task ${taskId} no longer exists or is completed. Skipping reminder.`);
      return { success: false, reason: task ? 'task_completed' : 'task_not_found' };
    }
    
    const displayName = name || email;
    const taskName = task.name;
    const dueDate = new Date(task.dueDate);
    const formattedDueDate = dueDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
    
    // Get priority color
    let priorityColor = '#4a6ee0'; // Default blue
    if (task.priority === 'high') {
      priorityColor = '#e74c3c'; // Red for high priority
    } else if (task.priority === 'medium') {
      priorityColor = '#f39c12'; // Orange for medium priority
    } else if (task.priority === 'low') {
      priorityColor = '#2ecc71'; // Green for low priority
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Life Tracker Team" <no-reply@lifetracker.example.com>',
      to: email,
      subject: `Due Soon: ${taskName}`,
      text: `Hi ${displayName},\n\nYour task "${taskName}" is due in 15 minutes (${formattedDueDate}).\n\nThis is a friendly reminder to complete this task on time.\n\nBest regards,\nThe Life Tracker Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a6ee0;">Task Due Soon</h2>
          <p>Hi ${displayName},</p>
          <p>Your task is due in <strong>15 minutes</strong>:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: ${priorityColor};">${taskName}</h3>
            <p><strong>Due:</strong> ${formattedDueDate}</p>
            <p><strong>Priority:</strong> <span style="color: ${priorityColor};">${task.priority || 'normal'}</span></p>
            <p><strong>Category:</strong> ${task.category || 'Uncategorized'}</p>
          </div>
          <p>This is a friendly reminder to complete this task on time.</p>
          <p>Best regards,<br>The Life Tracker Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `
    };
    
    // Log email details for debugging purposes
    if (process.env.NODE_ENV === 'development') {
      console.log('Sending task due reminder email with the following details:');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Task due reminder email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending task due reminder email:', error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendHabitReminderEmail,
  sendTaskDueReminderEmail
}; 