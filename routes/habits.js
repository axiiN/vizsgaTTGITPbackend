const express = require('express');
const router = express.Router();
const habitModel = require('../models/habitModel');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// GET all habits
router.get('/', async (req, res) => {
  try {
    const userId = req.user.uid;
    const habits = await habitModel.getAllHabits(userId);
    res.json(habits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ message: 'Failed to fetch habits', error: error.message });
  }
});

// IMPORTANT: Any specialized routes need to come before the /:id route
// GET habit by ID
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.uid;
    const habit = await habitModel.getHabitById(id, userId);
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    res.json(habit);
  } catch (error) {
    console.error('Error fetching habit by ID:', error);
    res.status(500).json({ message: 'Failed to fetch habit', error: error.message });
  }
});

// POST create new habit
router.post('/', async (req, res) => {
  try {
    const { name, description, frequency } = req.body;
    const userId = req.user.uid;
    
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const newHabit = {
      name,
      description: description || '',
      frequency: frequency || 'daily'
    };
    
    // Now we get back the ID directly
    const habitId = await habitModel.createHabit(newHabit, userId);
    const insertedHabit = await habitModel.getHabitById(habitId, userId);
    
    res.status(201).json(insertedHabit);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ message: 'Failed to create habit', error: error.message });
  }
});

// PUT update habit
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.uid;
    const { name, description, frequency } = req.body;
    
    // Check if habit exists
    const habit = await habitModel.getHabitById(id, userId);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    // Update only provided fields
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (frequency !== undefined) updates.frequency = frequency;
    
    const updatedHabit = await habitModel.updateHabit(id, updates, userId);
    res.json(updatedHabit);
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({ message: 'Failed to update habit', error: error.message });
  }
});

// DELETE habit
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.uid;
    
    // Check if habit exists
    const habit = await habitModel.getHabitById(id, userId);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    await habitModel.deleteHabit(id, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ message: 'Failed to delete habit', error: error.message });
  }
});

// PATCH toggle habit completion status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.uid;
    const updatedHabit = await habitModel.toggleHabitCompletion(id, userId);
    
    if (!updatedHabit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    res.json(updatedHabit);
  } catch (error) {
    console.error('Error toggling habit completion:', error);
    res.status(500).json({ message: 'Failed to toggle habit completion', error: error.message });
  }
});

module.exports = router; 