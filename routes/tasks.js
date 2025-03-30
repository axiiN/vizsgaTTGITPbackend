const express = require('express');
const router = express.Router();
const taskModel = require('../models/taskModel');
const { authenticate } = require('../middleware/auth');
const { scheduleTaskDueReminder, cancelAllJobsForTask } = require('../utils/scheduleService');
const admin = require('firebase-admin');

// Apply authentication middleware to all routes
router.use(authenticate);

// GET all tasks
router.get('/', async (req, res) => {
  try {
    const userId = req.user.uid;
    const tasks = await taskModel.getAllTasks(userId);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
});

// IMPORTANT: These specific routes need to come before the /:id route to avoid being treated as IDs
// GET tasks by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.user.uid;
    const tasks = await taskModel.getTasksByCategory(category, userId);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks by category:', error);
    res.status(500).json({ message: 'Failed to fetch tasks by category', error: error.message });
  }
});

// GET tasks by priority
router.get('/priority/:priority', async (req, res) => {
  try {
    const { priority } = req.params;
    const userId = req.user.uid;
    const tasks = await taskModel.getTasksByPriority(priority, userId);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks by priority:', error);
    res.status(500).json({ message: 'Failed to fetch tasks by priority', error: error.message });
  }
});

// GET task by ID - This route must come after the more specific routes above
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.uid;
    const task = await taskModel.getTaskById(id, userId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task by ID:', error);
    res.status(500).json({ message: 'Failed to fetch task', error: error.message });
  }
});

// POST create new task
router.post('/', async (req, res) => {
  try {
    const { name, category, dueDate, priority } = req.body;
    const userId = req.user.uid;
    
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const newTask = {
      name,
      category: category || '',
      dueDate: dueDate || null,
      priority: priority || 'medium',
      completed: false
    };
    
    const taskId = await taskModel.createTask(newTask, userId);
    const insertedTask = await taskModel.getTaskById(taskId, userId);
    
    // Schedule due date reminder if task has a due date
    if (insertedTask.dueDate) {
      try {
        const userRecord = await admin.auth().getUser(userId);
        const userEmail = userRecord.email;
        const userName = userRecord.displayName || '';
        
        if (userEmail) {
          scheduleTaskDueReminder(taskId, insertedTask, userId, userEmail, userName);
        }
      } catch (reminderError) {
        console.error('Error scheduling task due reminder:', reminderError);
        // Continue with response even if reminder scheduling fails
      }
    }
    
    res.status(201).json(insertedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
});

// PUT update task
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.uid;
    const { name, category, dueDate, priority, completed } = req.body;
    
    // Check if task exists
    const task = await taskModel.getTaskById(id, userId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // If due date or completion status is being updated, cancel any existing reminders
    if (dueDate !== undefined || completed !== undefined) {
      cancelAllJobsForTask(id);
    }
    
    // Update only provided fields
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (priority !== undefined) updates.priority = priority;
    if (completed !== undefined) updates.completed = completed;
    
    const updatedTask = await taskModel.updateTask(id, updates, userId);
    
    // Reschedule due date reminder if task was updated with a new due date and isn't completed
    if ((dueDate !== undefined || completed !== undefined) && updatedTask.dueDate && !updatedTask.completed) {
      try {
        const userRecord = await admin.auth().getUser(userId);
        const userEmail = userRecord.email;
        const userName = userRecord.displayName || '';
        
        if (userEmail) {
          scheduleTaskDueReminder(id, updatedTask, userId, userEmail, userName);
        }
      } catch (reminderError) {
        console.error('Error rescheduling task due reminder:', reminderError);
        // Continue with response even if reminder scheduling fails
      }
    }
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.uid;
    
    // Check if task exists
    const task = await taskModel.getTaskById(id, userId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Cancel any scheduled reminders for this task
    cancelAllJobsForTask(id);
    
    await taskModel.deleteTask(id, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
});

// PATCH toggle task completion status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.uid;
    const updatedTask = await taskModel.toggleTaskCompletion(id, userId);
    
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // If task is now completed, cancel any due reminders
    // If it's uncompleted and has a future due date, reschedule the reminder
    if (updatedTask.completed) {
      cancelAllJobsForTask(id);
    } else if (updatedTask.dueDate) {
      const dueDate = new Date(updatedTask.dueDate);
      const now = new Date();
      // Only reschedule if due date is in the future
      if (dueDate > now) {
        try {
          const userRecord = await admin.auth().getUser(userId);
          const userEmail = userRecord.email;
          const userName = userRecord.displayName || '';
          
          if (userEmail) {
            // Cancel any existing reminders first
            cancelAllJobsForTask(id);
            // Then schedule new reminder
            scheduleTaskDueReminder(id, updatedTask, userId, userEmail, userName);
          }
        } catch (reminderError) {
          console.error('Error rescheduling task due reminder after toggle:', reminderError);
          // Continue with response even if reminder scheduling fails
        }
      }
    }
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Error toggling task completion:', error);
    res.status(500).json({ message: 'Failed to toggle task completion', error: error.message });
  }
});

module.exports = router; 