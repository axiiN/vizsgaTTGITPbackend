const { db } = require('../config/firebase');

const REF_PATH = 'habits';

/**
 * Get all habits from the database for a specific user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of habits
 */
async function getAllHabits(userId) {
  try {
    const snapshot = await db.ref(REF_PATH).orderByChild('userId').equalTo(userId).once('value');
    const habits = snapshot.val() || {};
    
    // Convert from Firebase object format to array format
    return Object.entries(habits).map(([id, habit]) => ({
      id,
      ...habit
    }));
  } catch (error) {
    console.error('Error getting all habits:', error);
    throw error;
  }
}

/**
 * Get a specific habit by ID for a specific user
 * @param {string} id - The habit ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The habit object or null if not found
 */
async function getHabitById(id, userId) {
  try {
    const snapshot = await db.ref(`${REF_PATH}/${id}`).once('value');
    const habit = snapshot.val();
    
    if (!habit || habit.userId !== userId) {
      return null;
    }
    
    return {
      id,
      ...habit
    };
  } catch (error) {
    console.error('Error getting habit by ID:', error);
    throw error;
  }
}

/**
 * Create a new habit for a specific user
 * @param {Object} habit - The habit data
 * @param {string} userId - The user ID
 * @returns {Promise<string>} ID of the new habit
 */
async function createHabit(habit, userId) {
  try {
    const habitWithUser = {
      ...habit,
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Generate a new key for the habit
    const newHabitRef = db.ref(REF_PATH).push();
    await newHabitRef.set(habitWithUser);
    
    return newHabitRef.key;
  } catch (error) {
    console.error('Error creating habit:', error);
    throw error;
  }
}

/**
 * Update a habit for a specific user
 * @param {string} id - The habit ID
 * @param {Object} updates - The updated habit data
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The updated habit or null if not found
 */
async function updateHabit(id, updates, userId) {
  try {
    // Check if habit exists and belongs to the user
    const habitSnapshot = await db.ref(`${REF_PATH}/${id}`).once('value');
    const habit = habitSnapshot.val();
    
    if (!habit || habit.userId !== userId) {
      return null;
    }
    
    const updatedHabit = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await db.ref(`${REF_PATH}/${id}`).update(updatedHabit);
    
    return getHabitById(id, userId);
  } catch (error) {
    console.error('Error updating habit:', error);
    throw error;
  }
}

/**
 * Delete a habit for a specific user
 * @param {string} id - The habit ID
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteHabit(id, userId) {
  try {
    // Check if habit exists and belongs to the user
    const habitSnapshot = await db.ref(`${REF_PATH}/${id}`).once('value');
    const habit = habitSnapshot.val();
    
    if (!habit || habit.userId !== userId) {
      return false;
    }
    
    await db.ref(`${REF_PATH}/${id}`).remove();
    return true;
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
}

/**
 * Toggle the completion status of a habit for a specific user
 * @param {string} id - The habit ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The updated habit or null if not found
 */
async function toggleHabitCompletion(id, userId) {
  try {
    const habit = await getHabitById(id, userId);
    if (!habit) {
      return null;
    }
    
    const updatedHabit = await updateHabit(id, {
      completed: !habit.completed
    }, userId);
    
    return updatedHabit;
  } catch (error) {
    console.error('Error toggling habit completion:', error);
    throw error;
  }
}

module.exports = {
  getAllHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitCompletion
}; 