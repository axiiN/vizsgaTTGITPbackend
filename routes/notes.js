const express = require('express');
const router = express.Router();
const noteModel = require('../models/noteModel');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// GET all notes
router.get('/', async (req, res) => {
  try {
    const userId = req.user.uid;
    const notes = await noteModel.getAllNotes(userId);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Failed to fetch notes', error: error.message });
  }
});

// GET favorite notes
router.get('/favorites', async (req, res) => {
  try {
    const userId = req.user.uid;
    const notes = await noteModel.getFavoriteNotes(userId);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching favorite notes:', error);
    res.status(500).json({ message: 'Failed to fetch favorite notes', error: error.message });
  }
});

// GET note by ID
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.uid;
    const note = await noteModel.getNoteById(id, userId);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    res.json(note);
  } catch (error) {
    console.error('Error fetching note by ID:', error);
    res.status(500).json({ message: 'Failed to fetch note', error: error.message });
  }
});

// POST create new note
router.post('/', async (req, res) => {
  try {
    const { title, content, isFavorite } = req.body;
    const userId = req.user.uid;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const newNote = {
      title,
      content: content || '',
      isFavorite: isFavorite || false
    };
    
    const noteId = await noteModel.createNote(newNote, userId);
    const insertedNote = await noteModel.getNoteById(noteId, userId);
    
    res.status(201).json(insertedNote);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ message: 'Failed to create note', error: error.message });
  }
});

// PUT update note
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.uid;
    const { title, content, isFavorite } = req.body;
    
    // Check if note exists
    const note = await noteModel.getNoteById(id, userId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Update only provided fields
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (isFavorite !== undefined) updates.isFavorite = isFavorite;
    
    const updatedNote = await noteModel.updateNote(id, updates, userId);
    res.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Failed to update note', error: error.message });
  }
});

// DELETE note
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.uid;
    
    // Check if note exists
    const note = await noteModel.getNoteById(id, userId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    await noteModel.deleteNote(id, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Failed to delete note', error: error.message });
  }
});

// PATCH toggle note favorite status
router.patch('/:id/toggle-favorite', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.uid;
    const updatedNote = await noteModel.toggleNoteFavorite(id, userId);
    
    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    res.json(updatedNote);
  } catch (error) {
    console.error('Error toggling note favorite status:', error);
    res.status(500).json({ message: 'Failed to toggle note favorite status', error: error.message });
  }
});

module.exports = router; 