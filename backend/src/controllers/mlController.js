const mlService = require('../services/mlService');
const logger = require('../utils/logger');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Controller for machine learning endpoints
 */
const mlController = {
  /**
   * Get signal for a pie
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getSignal(req, res) {
    try {
      const userId = req.user.id;
      const { pieId } = req.params;
      
      logger.info(`Generating signal for pie ${pieId} for user ${userId}`);
      
      // Check if pie exists and belongs to user
      const { data: pie, error: pieError } = await supabase
        .from('pies')
        .select('*')
        .eq('id', pieId)
        .eq('user_id', userId)
        .single();
      
      if (pieError) {
        return res.status(404).json({
          success: false,
          error: 'Pie not found or does not belong to user'
        });
      }
      
      // Generate signal
      const signal = await mlService.generateSignal(pieId);
      
      res.json({
        success: true,
        signal
      });
    } catch (error) {
      logger.error(`Error generating signal: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to generate signal: ${error.message}`
      });
    }
  },
  
  /**
   * Train the ML model
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async trainModel(req, res) {
    try {
      logger.info('Training ML model');
      
      // Initialize ML service if not already initialized
      if (!mlService.isInitialized) {
        await mlService.initialize();
      }
      
      // Get all pies for training
      const { data: pies, error: piesError } = await supabase
        .from('pies')
        .select('*');
      
      if (piesError) throw piesError;
      
      // Get all pie items
      const { data: pieItems, error: itemsError } = await supabase
        .from('pie_items')
        .select('*');
      
      if (itemsError) throw itemsError;
      
      // Group pie items by pie ID
      const pieItemsMap = pieItems.reduce((map, item) => {
        if (!map[item.pie_id]) {
          map[item.pie_id] = [];
        }
        map[item.pie_id].push(item);
        return map;
      }, {});
      
      // Prepare training data
      const features = [];
      const labels = [];
      
      for (const pie of pies) {
        const items = pieItemsMap[pie.id] || [];
        
        if (items.length === 0) continue;
        
        try {
          // Extract features for this pie
          const pieFeatures = await mlService._extractFeaturesFromPieItems(items);
          features.push(pieFeatures);
          
          // Set label based on pie type
          // 1 for buy signals, 0 for sell signals, 0.5 for black swan
          let label;
          switch (pie.type) {
            case 'buy':
              label = 1;
              break;
            case 'sell':
              label = 0;
              break;
            case 'black_swan':
              label = 0.5;
              break;
            default:
              label = 0.5;
          }
          
          labels.push(label);
        } catch (error) {
          logger.error(`Error extracting features for pie ${pie.id}:`, error);
          // Skip this pie if feature extraction fails
          continue;
        }
      }
      
      // Train the model
      const trainingResult = await mlService.trainModel({
        features,
        labels
      });
      
      res.json({
        success: true,
        message: 'Model trained successfully',
        trainingInfo: {
          samplesUsed: features.length,
          accuracy: trainingResult.history.acc ? 
            trainingResult.history.acc[trainingResult.history.acc.length - 1] : 
            null
        }
      });
    } catch (error) {
      logger.error(`Error training ML model: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to train ML model: ${error.message}`
      });
    }
  }
};

module.exports = mlController;