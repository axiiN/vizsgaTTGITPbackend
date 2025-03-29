// Import required modules
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables from .env file before initializing Firebase
dotenv.config();

// Initialize Firebase Admin SDK (this will also initialize the Realtime Database)
let admin, db;
try {
  const firebase = require('./config/firebase');
  admin = firebase.admin;
  db = firebase.db;
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  process.exit(1);
}

// Import database initialization
const { initializeDatabase, seedDatabase } = require('./db/initDb');

// Import routes
const habitsRoutes = require('./routes/habits');
const tasksRoutes = require('./routes/tasks');
const notesRoutes = require('./routes/notes');
const usersRoutes = require('./routes/users');

// Create Express app
const app = express();

// Define port
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(morgan('dev')); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Life Tracker API',
    status: 'Server is running',
    description: 'Track your habits and tasks to improve your daily life',
    endpoints: [
      { path: '/habits', description: 'Manage your daily and weekly habits' },
      { path: '/tasks', description: 'Manage your tasks and to-dos' },
      { path: '/notes', description: 'Manage your notes and capture your thoughts' },
      { path: '/users', description: 'User management and profile operations' }
    ]
  });
});

// Routes without /api prefix
app.use('/habits', habitsRoutes);
app.use('/tasks', tasksRoutes);
app.use('/notes', notesRoutes);
app.use('/users', usersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 404 route
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize database and start the server
async function startServer() {
  try {
    // Initialize the database structure
    await initializeDatabase();
    console.log('Database structure initialized successfully');
    
    // Only seed in development environment
    if (process.env.NODE_ENV === 'development') {
      await seedDatabase();
      console.log('Development data seeded successfully');
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`Life Tracker API is running on port ${PORT}`);
      console.log(`Server is available at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions and promise rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Start the application
startServer(); 