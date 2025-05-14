const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Authentication middleware functions
 */
const authMiddleware = {
  /**
   * Require authentication
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   * @returns {Promise<void>}
   */
  requireAuth: async (req, res, next) => {
    try {
      // Get JWT token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'No token provided'
        });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        logger.warn('Invalid token', { error });
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }
      
      // Add user to request object
      req.user = user;
      
      next();
    } catch (error) {
      logger.error(`Authentication error: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  },
  
  /**
   * Optional authentication - proceed even if no token is provided
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   * @returns {Promise<void>}
   */
  optionalAuth: async (req, res, next) => {
    try {
      // Get JWT token from Authorization header
      const authHeader = req.headers.authorization;
      
      // If no token, continue without authentication
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      // If token is valid, add user to request
      if (!error && user) {
        req.user = user;
      }
      
      next();
    } catch (error) {
      // Log error but continue without authentication
      logger.error(`Optional authentication error: ${error.message}`, { error });
      next();
    }
  },
  
  /**
   * Require admin role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   * @returns {void}
   */
  requireAdmin: (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    next();
  }
};

module.exports = authMiddleware;