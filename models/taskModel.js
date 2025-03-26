const { db } = require('../config/firebase');

const REF_PATH = 'tasks';

/**
 * Get all tasks from the database for a specific user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of tasks
 */
async function getAllTasks(userId) {
  try {
    const snapshot = await db.ref(REF_PATH).orderByChild('userId').equalTo(userId).once('value');
    const tasks = snapshot.val() || {};
    
    // Convert from Firebase object format to array format
    const taskArray = Object.entries(tasks).map(([id, task]) => ({
      id,
      ...task
    }));
    
    // Sort by dueDate
    return taskArray.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } catch (error) {
    console.error('Error getting all tasks:', error);
    throw error;
  }
}

/**
 * Get a specific task by ID for a specific user
 * @param {string} id - The task ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The task object or null if not found
 */
async function getTaskById(id, userId) {
  try {
    const snapshot = await db.ref(`${REF_PATH}/${id}`).once('value');
    const task = snapshot.val();
    
    if (!task || task.userId !== userId) {
      return null;
    }
    
    return {
      id,
      ...task
    };
  } catch (error) {
    console.error('Error getting task by ID:', error);
    throw error;
  }
}

/**
 * Create a new task for a specific user
 * @param {Object} task - The task data
 * @param {string} userId - The user ID
 * @returns {Promise<string>} ID of the new task
 */
async function createTask(task, userId) {
  try {
    const taskWithUser = {
      ...task,
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Generate a new key for the task
    const newTaskRef = db.ref(REF_PATH).push();
    await newTaskRef.set(taskWithUser);
    
    return newTaskRef.key;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

/**
 * Update a task for a specific user
 * @param {string} id - The task ID
 * @param {Object} updates - The updated task data
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The updated task or null if not found
 */
async function updateTask(id, updates, userId) {
  try {
    // Check if task exists and belongs to the user
    const taskSnapshot = await db.ref(`${REF_PATH}/${id}`).once('value');
    const task = taskSnapshot.val();
    
    if (!task || task.userId !== userId) {
      return null;
    }
    
    const updatedTask = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await db.ref(`${REF_PATH}/${id}`).update(updatedTask);
    
    return getTaskById(id, userId);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

/**
 * Delete a task for a specific user
 * @param {string} id - The task ID
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteTask(id, userId) {
  try {
    // Check if task exists and belongs to the user
    const taskSnapshot = await db.ref(`${REF_PATH}/${id}`).once('value');
    const task = taskSnapshot.val();
    
    if (!task || task.userId !== userId) {
      return false;
    }
    
    await db.ref(`${REF_PATH}/${id}`).remove();
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

/**
 * Toggle the completion status of a task for a specific user
 * @param {string} id - The task ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The updated task or null if not found
 */
async function toggleTaskCompletion(id, userId) {
  try {
    const task = await getTaskById(id, userId);
    if (!task) {
      return null;
    }
    
    const updatedTask = await updateTask(id, {
      completed: !task.completed
    }, userId);
    
    return updatedTask;
  } catch (error) {
    console.error('Error toggling task completion:', error);
    throw error;
  }
}

/**
 * Get tasks by category for a specific user
 * @param {string} category - The category
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of tasks
 */
async function getTasksByCategory(category, userId) {
  try {
    const allTasks = await getAllTasks(userId);
    return allTasks.filter(task => task.category === category);
  } catch (error) {
    console.error('Error getting tasks by category:', error);
    throw error;
  }
}

/**
 * Get tasks by priority for a specific user
 * @param {string} priority - The priority
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of tasks
 */
async function getTasksByPriority(priority, userId) {
  try {
    const allTasks = await getAllTasks(userId);
    return allTasks.filter(task => task.priority === priority);
  } catch (error) {
    console.error('Error getting tasks by priority:', error);
    throw error;
  }
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  getTasksByCategory,
  getTasksByPriority
}; 