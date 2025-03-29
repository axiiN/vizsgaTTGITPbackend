const { db } = require('../config/firebase');

const REF_PATH = 'notes';

/**
 * Get all notes from the database for a specific user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of notes
 */
async function getAllNotes(userId) {
  try {
    const snapshot = await db.ref(REF_PATH).orderByChild('userId').equalTo(userId).once('value');
    const notes = snapshot.val() || {};
    
    // Convert from Firebase object format to array format
    return Object.entries(notes).map(([id, note]) => ({
      id,
      ...note
    }));
  } catch (error) {
    console.error('Error getting all notes:', error);
    throw error;
  }
}

/**
 * Get a specific note by ID for a specific user
 * @param {string} id - The note ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The note object or null if not found
 */
async function getNoteById(id, userId) {
  try {
    const snapshot = await db.ref(`${REF_PATH}/${id}`).once('value');
    const note = snapshot.val();
    
    if (!note || note.userId !== userId) {
      return null;
    }
    
    return {
      id,
      ...note
    };
  } catch (error) {
    console.error('Error getting note by ID:', error);
    throw error;
  }
}

/**
 * Create a new note for a specific user
 * @param {Object} note - The note data
 * @param {string} userId - The user ID
 * @returns {Promise<string>} ID of the new note
 */
async function createNote(note, userId) {
  try {
    const noteWithUser = {
      ...note,
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Generate a new key for the note
    const newNoteRef = db.ref(REF_PATH).push();
    await newNoteRef.set(noteWithUser);
    
    return newNoteRef.key;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
}

/**
 * Update a note for a specific user
 * @param {string} id - The note ID
 * @param {Object} updates - The updated note data
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The updated note or null if not found
 */
async function updateNote(id, updates, userId) {
  try {
    // Check if note exists and belongs to the user
    const noteSnapshot = await db.ref(`${REF_PATH}/${id}`).once('value');
    const note = noteSnapshot.val();
    
    if (!note || note.userId !== userId) {
      return null;
    }
    
    const updatedNote = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await db.ref(`${REF_PATH}/${id}`).update(updatedNote);
    
    return getNoteById(id, userId);
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}

/**
 * Delete a note for a specific user
 * @param {string} id - The note ID
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteNote(id, userId) {
  try {
    // Check if note exists and belongs to the user
    const noteSnapshot = await db.ref(`${REF_PATH}/${id}`).once('value');
    const note = noteSnapshot.val();
    
    if (!note || note.userId !== userId) {
      return false;
    }
    
    await db.ref(`${REF_PATH}/${id}`).remove();
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}

/**
 * Toggle the favorite status of a note for a specific user
 * @param {string} id - The note ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The updated note or null if not found
 */
async function toggleNoteFavorite(id, userId) {
  try {
    const note = await getNoteById(id, userId);
    if (!note) {
      return null;
    }
    
    const updatedNote = await updateNote(id, {
      isFavorite: !note.isFavorite
    }, userId);
    
    return updatedNote;
  } catch (error) {
    console.error('Error toggling note favorite status:', error);
    throw error;
  }
}

/**
 * Get favorite notes for a specific user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of favorite notes
 */
async function getFavoriteNotes(userId) {
  try {
    const allNotes = await getAllNotes(userId);
    return allNotes.filter(note => note.isFavorite === true);
  } catch (error) {
    console.error('Error getting favorite notes:', error);
    throw error;
  }
}

module.exports = {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  toggleNoteFavorite,
  getFavoriteNotes
}; 