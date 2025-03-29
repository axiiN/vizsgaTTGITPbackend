const { db } = require('../config/firebase');

// Function to initialize the database structure
async function initializeDatabase() {
  try {
    console.log('Initializing Firebase Realtime Database...');
    
    // Check if the database structure already exists
    const snapshot = await db.ref('/').once('value');
    const data = snapshot.val();
    
    // If the database is empty, set up the initial structure
    if (!data) {
      console.log('Setting up initial database structure...');
      await db.ref('/').set({
        habits: {},
        tasks: {},
        notes: {}
      });
      console.log('Initial database structure created successfully');
    } else {
      console.log('Database structure already exists');
    }
    
    console.log('Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error; // Rethrow for the caller to handle
  }
}

// Function to seed initial data (for development purposes)
async function seedDatabase() {
  try {
    console.log('Seeding database with initial data...');
    
    // Sample habits data
    const habits = {
      'habit1': {
        name: 'Morning Meditation',
        description: '10 minutes of mindfulness',
        frequency: 'daily',
        completed: false,
        userId: 'test-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      'habit2': {
        name: 'Drink Water',
        description: '8 glasses of water',
        frequency: 'daily',
        completed: false,
        userId: 'test-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      'habit3': {
        name: 'Exercise',
        description: '30 minutes of physical activity',
        frequency: 'weekly',
        completed: false,
        userId: 'test-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    
    // Sample tasks data
    const tasks = {
      'task1': {
        name: 'Complete project proposal',
        category: 'Work',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        priority: 'high',
        completed: false,
        userId: 'test-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      'task2': {
        name: 'Buy groceries',
        category: 'Personal',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        priority: 'medium',
        completed: false,
        userId: 'test-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      'task3': {
        name: 'Schedule dentist appointment',
        category: 'Health',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        priority: 'low',
        completed: false,
        userId: 'test-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    
    // Sample notes data
    const notes = {
      'note1': {
        title: 'Project Ideas',
        content: 'List of ideas for the next quarter:\n- Mobile app redesign\n- API performance optimization\n- New dashboard features',
        isFavorite: true,
        userId: 'test-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      'note2': {
        title: 'Meeting Notes',
        content: 'Topics discussed:\n1. Timeline for the new release\n2. Budget allocation\n3. Resource planning',
        isFavorite: false,
        userId: 'test-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      'note3': {
        title: 'Book Recommendations',
        content: 'Books to read:\n- Atomic Habits by James Clear\n- Deep Work by Cal Newport\n- The Psychology of Money by Morgan Housel',
        isFavorite: true,
        userId: 'test-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    
    // Check if data already exists
    const habitsSnapshot = await db.ref('/habits').once('value');
    const tasksSnapshot = await db.ref('/tasks').once('value');
    const notesSnapshot = await db.ref('/notes').once('value');
    
    if (!habitsSnapshot.val()) {
      await db.ref('/habits').set(habits);
      console.log('Habits seed data inserted successfully');
    } else {
      console.log('Habits data already exists, skipping seed');
    }
    
    if (!tasksSnapshot.val()) {
      await db.ref('/tasks').set(tasks);
      console.log('Tasks seed data inserted successfully');
    } else {
      console.log('Tasks data already exists, skipping seed');
    }
    
    if (!notesSnapshot.val()) {
      await db.ref('/notes').set(notes);
      console.log('Notes seed data inserted successfully');
    } else {
      console.log('Notes data already exists, skipping seed');
    }
    
    console.log('Database seeding completed successfully');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error; // Rethrow for the caller to handle
  }
}

// Run the initialization if this file is executed directly
if (require.main === module) {
  const runAll = async () => {
    try {
      await initializeDatabase();
      
      // Only seed in development environment
      if (process.env.NODE_ENV === 'development') {
        await seedDatabase();
      }
      
      console.log('Database setup complete');
      process.exit(0);
    } catch (error) {
      console.error('Database setup failed:', error);
      process.exit(1);
    }
  };
  
  runAll();
}

module.exports = {
  initializeDatabase,
  seedDatabase
}; 