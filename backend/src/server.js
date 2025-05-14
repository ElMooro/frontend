require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createClient } = require('@supabase/supabase-js');
const apiRoutes = require('./routes/apiRoutes');
const logger = require('./utils/logger');
const mlService = require('./services/mlService');
const aiAnalysisService = require('./services/aiAnalysisService');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Initialize ML service with retry mechanism
const initializeMLService = async (retries = 3, delay = 5000) => {
  let attempt = 0;
  
  const tryInitialize = async () => {
    attempt++;
    try {
      logger.info(`Attempting to initialize ML service (attempt ${attempt}/${retries})`);
      
      // Check TensorFlow.js version
      try {
        const tf = require('@tensorflow/tfjs');
        logger.info(`TensorFlow.js version: ${tf.version.tfjs}, Backend: ${tf.getBackend() || 'not set'}`);
      } catch (tfError) {
        logger.warn(`Could not get TensorFlow.js version: ${tfError.message}`);
      }
      
      await mlService.initialize();
      logger.info('ML service initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize ML service (attempt ${attempt}/${retries}):`, error);
      
      if (attempt < retries) {
        logger.info(`Retrying ML service initialization in ${delay/1000} seconds...`);
        return new Promise(resolve => {
          setTimeout(() => resolve(tryInitialize()), delay);
        });
      } else {
        logger.warn(`ML service initialization failed after ${retries} attempts. Service will use fallback mechanisms.`);
        return false;
      }
    }
  };
  
  return tryInitialize();
};

// Initialize AI Analysis service with the same retry mechanism
const initializeAIAnalysisService = async (retries = 3, delay = 5000) => {
  let attempt = 0;
  
  const tryInitialize = async () => {
    attempt++;
    try {
      logger.info(`Attempting to initialize AI Analysis service (attempt ${attempt}/${retries})`);
      
      await aiAnalysisService.initialize();
      logger.info('AI Analysis service initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize AI Analysis service (attempt ${attempt}/${retries}):`, error);
      
      if (attempt < retries) {
        logger.info(`Retrying AI Analysis service initialization in ${delay/1000} seconds...`);
        return new Promise(resolve => {
          setTimeout(() => resolve(tryInitialize()), delay);
        });
      } else {
        logger.warn(`AI Analysis service initialization failed after ${retries} attempts. Service will use fallback mechanisms.`);
        return false;
      }
    }
  };
  
  return tryInitialize();
};

// Start ML service initialization
initializeMLService().then(success => {
  if (success) {
    logger.info('ML service is ready');
  } else {
    logger.warn('ML service initialization failed, fallback mechanisms will be used');
  }
});

// Start AI Analysis service initialization
initializeAIAnalysisService().then(success => {
  if (success) {
    logger.info('AI Analysis service is ready');
  } else {
    logger.warn('AI Analysis service initialization failed, fallback mechanisms will be used');
  }
});

// API Routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { error: err });
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
