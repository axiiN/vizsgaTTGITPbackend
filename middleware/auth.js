const { admin } = require('../config/firebase');

/**
 * Middleware to verify Firebase authentication token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check if authorization header exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Unauthorized: No token provided' 
      });
    }
    
    // Extract token from header
    const token = authHeader.split('Bearer ')[1];
    
    // For development/testing mode: skip authentication if token is 'development-token'
    if (process.env.NODE_ENV === 'development' && token === 'development-token') {
      req.user = { uid: 'test-user-id', email: 'test@example.com' };
      return next();
    }
    
    try {
      // Verify token with Firebase
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Add user information to the request
      req.user = decodedToken;
      
      // Proceed to the route handler
      next();
    } catch (error) {
      // Token verification failed
      console.error('Token verification failed:', error);
      return res.status(403).json({ 
        message: 'Forbidden: Invalid token',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  } catch (error) {
    // Unexpected error
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      message: 'Internal server error during authentication',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

module.exports = { authenticate }; 