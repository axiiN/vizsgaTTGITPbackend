const admin = require('firebase-admin');
const { sendHabitReminderEmail, sendTaskDueReminderEmail } = require('./emailService');

// In-memory job store for development purposes
// In production, you would use a persistent store like Firebase Realtime Database
const scheduledJobs = new Map();

/**
 * Schedule a job to be executed at a specific time
 * @param {string} jobId - Unique identifier for the job
 * @param {Date} executeAt - When to execute the job
 * @param {Function} callback - Function to execute
 * @param {Object} data - Data to pass to the callback
 */
const scheduleJob = (jobId, executeAt, callback, data) => {
  const now = new Date();
  let delay = executeAt - now;
  
  // Ensure delay is positive
  if (delay < 0) {
    console.warn(`Scheduled time ${executeAt} is in the past. Using minimal delay.`);
    delay = 1000; // Set to 1 second minimum
  }
  
  // Store information about the job
  const jobInfo = {
    id: jobId,
    scheduledFor: executeAt,
    createdAt: now,
    data: data,
    timerId: null
  };
  
  // Schedule the job execution
  const timerId = setTimeout(async () => {
    try {
      // Execute the callback
      await callback(data);
      
      // Remove the job from memory after execution
      scheduledJobs.delete(jobId);
      
      // If it's a recurring job, schedule the next occurrence
      if (data.recurring) {
        scheduleNextRecurrence(data);
      }
    } catch (error) {
      console.error(`Error executing scheduled job ${jobId}:`, error);
    }
  }, delay);
  
  // Store the timer ID to allow cancellation
  jobInfo.timerId = timerId;
  scheduledJobs.set(jobId, jobInfo);
  
  console.log(`Job ${jobId} scheduled for ${executeAt}`);
  return jobId;
};

/**
 * Schedule the next recurrence of a job based on frequency
 * @param {Object} data - Job data with frequency information
 */
const scheduleNextRecurrence = (data) => {
  const { userId, habitId, frequency, email, name } = data;
  const now = new Date();
  let nextExecutionDate = new Date();
  
  // Calculate next execution date based on frequency
  switch (frequency) {
    case 'daily':
      nextExecutionDate.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      nextExecutionDate.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      nextExecutionDate.setMonth(now.getMonth() + 1);
      break;
    default:
      nextExecutionDate.setDate(now.getDate() + 1);
    }
    
    // Default to daily at 9:00 AM
    nextExecutionDate.setHours(9, 0, 0, 0); 
  
  // Create a unique ID for the reminder job
  const reminderJobId = `reminder_${habitId}_${nextExecutionDate.getTime()}`;
  
  // Schedule the next reminder
  scheduleJob(
    reminderJobId,
    nextExecutionDate,
    sendHabitReminderEmail,
    { userId, habitId, frequency, email, name, recurring: true }
  );
};

/**
 * Cancel a scheduled job
 * @param {string} jobId - ID of the job to cancel
 * @returns {boolean} - Whether the job was successfully cancelled
 */
const cancelJob = (jobId) => {
  if (!scheduledJobs.has(jobId)) {
    console.warn(`Job ${jobId} not found in scheduler.`);
    return false;
  }
  
  const job = scheduledJobs.get(jobId);
  clearTimeout(job.timerId);
  scheduledJobs.delete(jobId);
  console.log(`Job ${jobId} cancelled.`);
  return true;
};

/**
 * Cancel all jobs for a specific habit
 * @param {string} habitId - ID of the habit
 */
const cancelAllJobsForHabit = (habitId) => {
  for (const [jobId, job] of scheduledJobs.entries()) {
    if (job.data && job.data.habitId === habitId) {
      cancelJob(jobId);
    }
  }
};

/**
 * Cancel all jobs for a specific task
 * @param {string} taskId - ID of the task
 */
const cancelAllJobsForTask = (taskId) => {
  for (const [jobId, job] of scheduledJobs.entries()) {
    if (job.data && job.data.taskId === taskId) {
      cancelJob(jobId);
    }
  }
};

/**
 * Schedule reminders for a habit
 * @param {string} habitId - ID of the habit
 * @param {Object} habit - Habit data
 * @param {string} userId - User ID
 * @param {string} email - User's email
 * @param {string} name - User's name (optional)
 */
const scheduleHabitReminder = (habitId, habit, userId, email, name) => {
  // Schedule first reminder
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0); // 9:00 AM tomorrow
  
  const reminderJobId = `reminder_${habitId}_${tomorrow.getTime()}`;
  
  scheduleJob(
    reminderJobId,
    tomorrow,
    sendHabitReminderEmail,
    { userId, habitId, habit, frequency: habit.frequency, email, name, recurring: true }
  );
  
  console.log(`Scheduled recurring reminders for habit ${habitId} (${habit.name})`);
};

/**
 * Schedule a due date reminder for a task 15 minutes before it's due
 * @param {string} taskId - ID of the task
 * @param {Object} task - Task data
 * @param {string} userId - User ID
 * @param {string} email - User's email
 * @param {string} name - User's name (optional)
 */
const scheduleTaskDueReminder = (taskId, task, userId, email, name) => {
  // Only schedule if the task has a due date and isn't already completed
  if (!task.dueDate || task.completed) {
    console.log(`Task ${taskId} has no due date or is already completed. No reminder scheduled.`);
    return null;
  }
  
  // Calculate time 15 minutes before due date
  const dueDate = new Date(task.dueDate);
  const reminderTime = new Date(dueDate.getTime() - (15 * 60 * 1000)); // 15 minutes before
  
  // If the reminder time is in the past, don't schedule
  console.log(task);
  const now = new Date();
  if (reminderTime <= now) {
    console.log(`Task ${taskId} due date is less than 15 minutes away or in the past. No reminder scheduled.`);
    return null;
  }
  
  // Create a unique ID for the task reminder
  const reminderJobId = `task_due_${taskId}_${reminderTime.getTime()}`;
  
  // Schedule the reminder
  scheduleJob(
    reminderJobId,
    reminderTime,
    sendTaskDueReminderEmail,
    { userId, taskId, email, name, recurring: false }
  );
  
  console.log(`Scheduled due date reminder for task ${taskId} (${task.name}) at ${reminderTime}`);
  return reminderJobId;
};

/**
 * Initialize the scheduler by loading any saved scheduled tasks and habits
 * For a persistent solution, you would load saved tasks from the database here
 */
const initializeScheduler = async () => {
  console.log('Initializing scheduler service...');
  
  try {
    // Initialize the Firebase Admin SDK if not already initialized
    const { db } = require('../config/firebase');
    
    // 1. Initialize existing task reminders
    console.log('Loading existing tasks to schedule due date reminders...');
    const tasksSnapshot = await db.ref('tasks').once('value');
    const tasks = tasksSnapshot.val() || {};
    
    let taskCount = 0;
    let taskScheduledCount = 0;
    
    // Process each task
    for (const [taskId, task] of Object.entries(tasks)) {
      taskCount++;
      
      // Skip if task has no due date or is already completed
      if (!task.dueDate || task.completed) continue;
      
      const dueDate = new Date(task.dueDate);
      const reminderTime = new Date(dueDate.getTime() - (15 * 60 * 1000)); // 15 minutes before
      
      // Only schedule if the reminder time is in the future
      const now = new Date();
      if (reminderTime <= now) continue;
      
      try {
        // Get user email to send notification
        const userRecord = await admin.auth().getUser(task.userId);
        const userEmail = userRecord.email;
        const userName = userRecord.displayName || '';
        
        if (userEmail) {
          // Schedule the reminder
          scheduleTaskDueReminder(
            taskId, 
            { id: taskId, ...task }, 
            task.userId, 
            userEmail, 
            userName
          );
          taskScheduledCount++;
        }
      } catch (error) {
        console.error(`Error scheduling reminder for task ${taskId}:`, error);
      }
    }
    
    console.log(`Processed ${taskCount} tasks, scheduled reminders for ${taskScheduledCount} upcoming tasks.`);
    
    // 2. Initialize existing habit reminders
    console.log('Loading existing habits to schedule recurring reminders...');
    const habitsSnapshot = await db.ref('habits').once('value');
    const habits = habitsSnapshot.val() || {};
    
    let habitCount = 0;
    let habitScheduledCount = 0;
    
    // Process each habit
    for (const [habitId, habit] of Object.entries(habits)) {
      habitCount++;
      
      try {
        // Get user email to send notification
        const userRecord = await admin.auth().getUser(habit.userId);
        const userEmail = userRecord.email;
        const userName = userRecord.displayName || '';
        
        if (userEmail) {
          // Schedule the recurring habit reminder
          scheduleHabitReminder(
            habitId,
            { id: habitId, ...habit },
            habit.userId,
            userEmail,
            userName
          );
          habitScheduledCount++;
        }
      } catch (error) {
        console.error(`Error scheduling reminder for habit ${habitId}:`, error);
      }
    }
    
    console.log(`Processed ${habitCount} habits, scheduled reminders for ${habitScheduledCount} habits.`);
  } catch (error) {
    console.error('Failed to initialize scheduler service:', error);
  }
};

module.exports = {
  scheduleJob,
  cancelJob,
  scheduleHabitReminder,
  scheduleTaskDueReminder,
  cancelAllJobsForHabit,
  cancelAllJobsForTask,
  initializeScheduler
}; 