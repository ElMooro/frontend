// Try to use tfjs-node (which includes C++ bindings for better performance)
// Fall back to regular tfjs with CPU backend if tfjs-node fails
let tf;
try {
  // First try to load the CPU backend to ensure it's available as fallback
  require('@tensorflow/tfjs-backend-cpu');
  
  // Then try to load tfjs-node
  try {
    tf = require('@tensorflow/tfjs-node');
    console.log('Using TensorFlow.js Node.js bindings for better performance');
  } catch (error) {
    console.warn('Failed to load TensorFlow.js Node.js bindings, falling back to CPU backend:', error.message);
    tf = require('@tensorflow/tfjs');
    tf.setBackend('cpu');
    console.log('Using TensorFlow.js with CPU backend');
  }
} catch (error) {
  console.error('Failed to load TensorFlow.js:', error.message);
  // Last resort fallback
  tf = require('@tensorflow/tfjs');
  console.log('Using TensorFlow.js without specific backend');
}
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const apiServices = require('./api');

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Service for machine learning operations
 */
const mlService = {
  model: null,
  isInitialized: false,
  
  /**
   * Initialize the ML service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Verify TensorFlow.js is properly loaded
      if (!tf) {
        throw new Error('TensorFlow.js failed to load');
      }
      
      // Check TensorFlow.js version and backend
      const tfVersion = tf.version.tfjs;
      const backend = tf.getBackend() || 'cpu';
      console.log(`Using TensorFlow.js version ${tfVersion} with ${backend} backend`);
      
      // Check if we have a saved model
      try {
        const { data: savedModel, error } = await supabase
          .storage
          .from('ml-models')
          .download('latest-model/model.json');
        
        if (savedModel && !error) {
          try {
            // Parse the saved model JSON
            const modelJSON = JSON.parse(await savedModel.text());
            
            // Validate model structure before loading
            if (!modelJSON.modelTopology) {
              throw new Error('Invalid model JSON: missing modelTopology');
            }
            
            // Load the saved model
            this.model = await tf.loadLayersModel(
              tf.io.fromMemory(modelJSON)
            );
            
            // Verify the model loaded correctly
            if (!this.model || typeof this.model.predict !== 'function') {
              throw new Error('Model loaded but appears to be invalid');
            }
            
            console.log('Loaded saved model from Supabase storage');
          } catch (loadError) {
            console.error('Error loading saved model:', loadError);
            // Fall back to creating a new model
            this._createNewModel();
          }
        } else {
          console.log('No saved model found, creating new model');
          this._createNewModel();
        }
      } catch (storageError) {
        console.error('Error accessing model storage:', storageError);
        // Fall back to creating a new model
        this._createNewModel();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing ML service:', error);
      // Set a flag to indicate initialization failed but don't throw
      // This allows the service to still function with fallback predictions
      this.initializationFailed = true;
      this.initializationError = error.message;
    }
  },
  
  /**
   * Create a new TensorFlow model
   * @param {number} inputFeatures - Number of input features (default: 10)
   * @private
   */
  _createNewModel(inputFeatures = 10) {
    try {
      console.log(`Creating new model with ${inputFeatures} input features`);
      
      // Create a new model
      this.model = tf.sequential();
      
      // Add layers to the model with proper input validation
      this.model.add(tf.layers.dense({
        units: 64,
        activation: 'relu',
        inputShape: [inputFeatures],
        kernelInitializer: 'heNormal',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }) // Add L2 regularization to prevent overfitting
      }));
      
      this.model.add(tf.layers.batchNormalization());
      this.model.add(tf.layers.dropout({ rate: 0.3 }));
      
      this.model.add(tf.layers.dense({
        units: 32,
        activation: 'relu',
        kernelInitializer: 'heNormal',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
      }));
      
      this.model.add(tf.layers.batchNormalization());
      this.model.add(tf.layers.dropout({ rate: 0.2 }));
      
      this.model.add(tf.layers.dense({
        units: 16,
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }));
      
      this.model.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid', // Output between 0 and 1 for signal probability
        kernelInitializer: 'glorotNormal'
      }));
      
      // Compile the model with better optimizer settings
      this.model.compile({
        optimizer: tf.train.adam({
          learningRate: 0.001,
          beta1: 0.9,
          beta2: 0.999,
          epsilon: 1e-7
        }),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'] // Removed unsupported metrics
      });
      
      // Log model summary
      this.model.summary();
      
      console.log('Created new ML model successfully');
      return true;
    } catch (error) {
      console.error('Error creating new model:', error);
      return false;
    }
  },
  
  /**
   * Train the model with historical data
   * @param {Object} trainingData - Training data
   * @param {number[][]} trainingData.features - Features for training
   * @param {number[]} trainingData.labels - Labels for training
   * @returns {Promise<Object>} - Training history
   */
  async trainModel(trainingData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const { features, labels } = trainingData;
      
      // Convert to tensors
      const xs = tf.tensor2d(features);
      const ys = tf.tensor1d(labels);
      
      // Train the model
      const history = await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch}: loss = ${logs.loss}, accuracy = ${logs.acc}`);
          }
        }
      });
      
      // Save the trained model to Supabase storage
      try {
        // Get model JSON
        const modelJSON = this.model.toJSON();
        
        // Save to Supabase storage
        const { error } = await supabase
          .storage
          .from('ml-models')
          .upload('latest-model/model.json', JSON.stringify(modelJSON), {
            contentType: 'application/json',
            upsert: true
          });
        
        if (error) {
          console.error('Error saving model to Supabase:', error);
        } else {
          console.log('Model saved to Supabase storage');
        }
        
        const modelArtifacts = { modelArtifactsInfo: { dateSaved: new Date() } };
        
        // Clean up tensors
        xs.dispose();
        ys.dispose();
        
        return {
          success: true,
          history: history.history,
          modelInfo: modelArtifacts
        };
      } catch (saveError) {
        console.error('Error saving model:', saveError);
        
        // Clean up tensors
        xs.dispose();
        ys.dispose();
        
        return {
          success: true,
          history: history.history,
          modelInfo: { error: saveError.message }
        };
      }
    } catch (error) {
      console.error('Error training ML model:', error);
      throw new Error(`Failed to train ML model: ${error.message}`);
    }
  },
  
  /**
   * Generate a signal for a pie
   * @param {string} pieId - The ID of the pie
   * @returns {Promise<Object>} - The signal probability
   */
  async generateSignal(pieId) {
    try {
      // Try to initialize if not already initialized
      if (!this.isInitialized) {
        try {
          await this.initialize();
        } catch (initError) {
          console.warn(`ML service initialization failed during signal generation: ${initError.message}`);
          // Continue with fallback mechanisms
        }
      }
      
      // Get pie data from Supabase
      const { data: pie, error: pieError } = await supabase
        .from('pies')
        .select('*')
        .eq('id', pieId)
        .single();
      
      if (pieError || !pie) {
        throw new Error(`Pie with ID ${pieId} not found`);
      }
      
      // Get pie items
      const { data: pieItems, error: itemsError } = await supabase
        .from('pie_items')
        .select('*')
        .eq('pie_id', pieId);
      
      if (itemsError) {
        throw new Error(`Error fetching pie items: ${itemsError.message}`);
      }
      
      if (pieItems.length === 0) {
        throw new Error(`Pie ${pieId} has no items`);
      }
      
      // Fetch data for each pie item
      const features = await this._extractFeaturesFromPieItems(pieItems);
      
      let signalProbability;
      let predictionMethod = 'ml_model';
      
      // Check if we can use the ML model
      if (this.model && typeof this.model.predict === 'function' && !this.initializationFailed) {
        try {
          // Make prediction using TensorFlow
          const tensorFeatures = tf.tensor2d([features]);
          const prediction = this.model.predict(tensorFeatures);
          signalProbability = prediction.dataSync()[0];
          
          // Clean up tensor
          prediction.dispose();
          tensorFeatures.dispose();
        } catch (predictionError) {
          console.error(`ML prediction failed for pie ${pieId}:`, predictionError);
          // Fall back to heuristic prediction
          signalProbability = this._generateHeuristicPrediction(features, pie, pieItems);
          predictionMethod = 'heuristic_fallback';
        }
      } else {
        console.warn(`Using heuristic prediction for pie ${pieId} because ML model is not available`);
        // Use heuristic prediction if model is not available
        signalProbability = this._generateHeuristicPrediction(features, pie, pieItems);
        predictionMethod = 'heuristic_only';
      }
      
      // Ensure probability is within valid range
      signalProbability = Math.max(0, Math.min(1, signalProbability));
      
      return {
        pieId,
        pieType: pie.type,
        signalProbability,
        signalStrength: this._calculateSignalStrength(signalProbability),
        predictionMethod,
        features: features.map(f => parseFloat(f.toFixed(4))), // Include normalized features for debugging
        timestamp: new Date().toISOString(),
        modelStatus: this.initializationFailed ? 'failed' : (this.isInitialized ? 'initialized' : 'not_initialized')
      };
    } catch (error) {
      console.error(`Error generating signal for pie ${pieId}:`, error);
      
      // Return a fallback response instead of throwing
      return {
        pieId,
        pieType: 'unknown',
        signalProbability: 0.5, // Neutral signal
        signalStrength: 'moderate',
        predictionMethod: 'error_fallback',
        error: error.message,
        timestamp: new Date().toISOString(),
        modelStatus: this.initializationFailed ? 'failed' : (this.isInitialized ? 'initialized' : 'not_initialized')
      };
    }
  },
  
  /**
   * Generate a prediction using heuristics when ML model is unavailable
   * @param {Array} features - Extracted features
   * @param {Object} pie - Pie data
   * @param {Array} pieItems - Pie items
   * @returns {number} - Signal probability
   * @private
   */
  _generateHeuristicPrediction(features, pie, pieItems) {
    try {
      // Simple heuristic based on the features
      // This is a fallback when the ML model is not available
      
      // Calculate average of non-zero features
      const nonZeroFeatures = features.filter(f => f !== 0);
      const avgFeature = nonZeroFeatures.length > 0 
        ? nonZeroFeatures.reduce((sum, val) => sum + val, 0) / nonZeroFeatures.length
        : 0.5;
      
      // Count positive trends (feature index 3, 7, etc. are trend features)
      const trendFeatures = [features[3], features[7]].filter(f => f !== undefined);
      const positiveTrends = trendFeatures.filter(f => f > 0).length;
      const negativeTrends = trendFeatures.filter(f => f < 0).length;
      
      // Base signal on trend direction
      let baseSignal = 0.5; // Neutral by default
      
      if (positiveTrends > negativeTrends) {
        // More positive trends suggest buy
        baseSignal = 0.7;
      } else if (negativeTrends > positiveTrends) {
        // More negative trends suggest sell
        baseSignal = 0.3;
      }
      
      // Adjust based on pie type (if available)
      if (pie && pie.type) {
        switch (pie.type) {
          case 'buy':
            // Bias slightly toward buy for buy pies
            baseSignal = baseSignal * 0.8 + 0.2;
            break;
          case 'sell':
            // Bias slightly toward sell for sell pies
            baseSignal = baseSignal * 0.8;
            break;
          case 'black_swan':
            // Black swan pies are more volatile
            baseSignal = Math.abs(baseSignal - 0.5) > 0.2 ? baseSignal : 0.5;
            break;
        }
      }
      
      // Ensure the result is between 0 and 1
      return Math.max(0, Math.min(1, baseSignal));
    } catch (error) {
      console.error('Error in heuristic prediction:', error);
      return 0.5; // Return neutral on error
    }
  },
  
  /**
   * Extract features from pie items
   * @param {Array} pieItems - The pie items
   * @returns {Promise<number[]>} - The extracted features
   * @private
   */
  async _extractFeaturesFromPieItems(pieItems) {
    try {
      const features = [];
      const featureStats = {
        count: 0,
        min: {},
        max: {},
        sum: {},
        mean: {},
        stdDev: {}
      };
      
      // Process each pie item to extract features
      for (const item of pieItems) {
        let data;
        
        try {
          // Fetch data based on the source with better error handling
          switch (item.source) {
            case 'fred':
              const fredData = await apiServices.fredService.getSeriesData(item.series_id, {
                // Get last 60 days of data for better statistical significance
                startDate: this._getDateXDaysAgo(60)
              });
              data = fredData.data;
              break;
              
            case 'treasury':
              const treasuryData = await apiServices.treasuryService.getYieldCurveData({
                // Get last 60 days of data
                startDate: this._getDateXDaysAgo(60)
              });
              data = treasuryData.data;
              break;
              
            case 'bls':
              const currentYear = new Date().getFullYear();
              const blsData = await apiServices.blsService.getData(
                [item.series_id],
                currentYear - 2, // Get 2 years of data for better trend analysis
                currentYear
              );
              data = blsData[item.series_id]?.data || [];
              break;
              
            case 'bea':
              try {
                if (apiServices.beaService) {
                  const beaData = await apiServices.beaService.getGDPData({
                    frequency: 'Q',
                    firstYear: new Date().getFullYear() - 2,
                    lastYear: new Date().getFullYear()
                  });
                  data = beaData.data || [];
                } else {
                  console.warn('BEA service not available');
                  data = [];
                }
              } catch (beaError) {
                console.error('Error fetching BEA data:', beaError.message);
                // Use fallback data
                data = [];
              }
              break;
              
            case 'census':
              if (apiServices.censusService) {
                const censusData = await apiServices.censusService.getEconomicIndicators({
                  year: new Date().getFullYear() - 1
                });
                data = censusData.data;
              } else {
                console.warn('Census service not available');
                data = [];
              }
              break;
              
            default:
              console.warn(`Unknown data source: ${item.source}`);
              data = [];
          }
        } catch (fetchError) {
          console.error(`Error fetching data for ${item.source} ${item.series_id}:`, fetchError);
          data = []; // Use empty array on error
        }
        
        // Extract features from the data with improved calculations
        const itemFeatures = this._calculateFeatures(data, item);
        
        // Track statistics for normalization
        itemFeatures.forEach((value, index) => {
          const featureName = `feature_${index}`;
          
          if (featureStats.count === 0) {
            featureStats.min[featureName] = value;
            featureStats.max[featureName] = value;
            featureStats.sum[featureName] = value;
          } else {
            featureStats.min[featureName] = Math.min(featureStats.min[featureName], value);
            featureStats.max[featureName] = Math.max(featureStats.max[featureName], value);
            featureStats.sum[featureName] = (featureStats.sum[featureName] || 0) + value;
          }
        });
        
        featureStats.count++;
        features.push(...itemFeatures);
      }
      
      // Calculate means
      if (featureStats.count > 0) {
        Object.keys(featureStats.sum).forEach(feature => {
          featureStats.mean[feature] = featureStats.sum[feature] / featureStats.count;
        });
      }
      
      // Normalize features using min-max scaling
      const normalizedFeatures = [];
      for (let i = 0; i < features.length; i++) {
        const featureName = `feature_${i % 4}`; // 4 features per item
        const value = features[i];
        
        // Apply min-max normalization if we have valid min/max
        if (featureStats.min[featureName] !== undefined && 
            featureStats.max[featureName] !== undefined && 
            featureStats.min[featureName] !== featureStats.max[featureName]) {
          const normalizedValue = (value - featureStats.min[featureName]) / 
                                 (featureStats.max[featureName] - featureStats.min[featureName]);
          normalizedFeatures.push(normalizedValue);
        } else {
          // If min equals max or undefined, use the original value
          normalizedFeatures.push(value);
        }
      }
      
      // Ensure we have exactly 10 features
      // If we have fewer than 10, pad with zeros
      while (normalizedFeatures.length < 10) {
        normalizedFeatures.push(0);
      }
      
      // If we have more than 10, take the first 10
      return normalizedFeatures.slice(0, 10);
    } catch (error) {
      console.error('Error extracting features from pie items:', error);
      // Return default features instead of throwing
      return Array(10).fill(0.5); // Neutral prediction
    }
  },
  
  /**
   * Calculate features from data
   * @param {Array} data - The data to calculate features from
   * @param {Object} item - The pie item
   * @returns {Array} - The calculated features
   * @private
   */
  _calculateFeatures(data, item) {
    const features = [];
    
    // Handle empty or invalid data
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [0, 0, 0, 0]; // Return zeros for all features
    }
    
    // Extract values, handling different data structures
    let values;
    if (data[0].value !== undefined) {
      values = data.map(d => d.value).filter(v => v !== null && !isNaN(v));
    } else if (data[0].date && Object.keys(data[0]).length > 1) {
      // For complex objects, use the first numeric property that's not a date
      const numericKey = Object.keys(data[0]).find(key => 
        key !== 'date' && typeof data[0][key] === 'number'
      );
      values = numericKey ? data.map(d => d[numericKey]).filter(v => v !== null && !isNaN(v)) : [];
    } else {
      values = [];
    }
    
    // If we still have no valid values, return zeros
    if (values.length === 0) {
      return [0, 0, 0, 0];
    }
    
    // Sort values by date if possible (newest first)
    values.reverse();
    
    // 1. Last value (most recent)
    features.push(values[0]);
    
    // 2. Mean
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    features.push(mean);
    
    // 3. Standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    features.push(stdDev);
    
    // 4. Change rate or trend
    if (values.length > 1) {
      // For longer series, calculate a more robust trend using linear regression
      if (values.length >= 5) {
        const trend = this._calculateTrend(values);
        features.push(trend);
      } else {
        // Simple percent change for shorter series
        const changeRate = (values[0] - values[values.length - 1]) / Math.abs(values[values.length - 1] || 1);
        // Cap extreme values
        const cappedChangeRate = Math.max(Math.min(changeRate, 5), -5);
        features.push(cappedChangeRate);
      }
    } else {
      features.push(0);
    }
    
    return features;
  },
  
  /**
   * Calculate trend using simple linear regression
   * @param {Array} values - Array of values
   * @returns {number} - Slope of the trend line
   * @private
   */
  _calculateTrend(values) {
    const n = values.length;
    
    // Create x values (0, 1, 2, ...)
    const x = Array.from({ length: n }, (_, i) => i);
    
    // Calculate means
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = values.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate slope
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (values[i] - meanY);
      denominator += Math.pow(x[i] - meanX, 2);
    }
    
    // Avoid division by zero
    if (denominator === 0) return 0;
    
    const slope = numerator / denominator;
    
    // Normalize slope by the mean value to get a relative trend
    const normalizedSlope = slope / (Math.abs(meanY) || 1);
    
    // Cap extreme values
    return Math.max(Math.min(normalizedSlope, 5), -5);
  },
  
  /**
   * Calculate signal strength based on probability
   * @param {number} probability - The signal probability
   * @returns {string} - The signal strength
   * @private
   */
  _calculateSignalStrength(probability) {
    if (probability >= 0.8) return 'very_strong';
    if (probability >= 0.6) return 'strong';
    if (probability >= 0.4) return 'moderate';
    if (probability >= 0.2) return 'weak';
    return 'very_weak';
  },
  
  /**
   * Get date X days ago in YYYY-MM-DD format
   * @param {number} days - Number of days ago
   * @returns {string} - Date in YYYY-MM-DD format
   * @private
   */
  _getDateXDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
};

module.exports = mlService;
