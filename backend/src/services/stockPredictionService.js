// Try to use tfjs-node (which includes C++ bindings for better performance)
// Fall back to regular tfjs with CPU backend if tfjs-node fails
let tf;
try {
  tf = require('@tensorflow/tfjs-node');
  console.log('Using TensorFlow.js Node.js bindings for better performance');
} catch (error) {
  console.warn('Failed to load TensorFlow.js Node.js bindings, falling back to CPU backend:', error.message);
  tf = require('@tensorflow/tfjs');
  // Load the CPU backend for TensorFlow.js
  require('@tensorflow/tfjs-backend-cpu');
}
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Service for stock market prediction using LSTM neural networks
 */
const stockPredictionService = {
  model: null,
  isInitialized: false,
  scaler: null,
  
  /**
   * Initialize the stock prediction service
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
      logger.info(`Using TensorFlow.js version ${tfVersion} with ${backend} backend`);
      
      // Create a new LSTM model
      this._createLSTMModel();
      
      this.isInitialized = true;
      logger.info('Stock prediction service initialized successfully');
    } catch (error) {
      logger.error('Error initializing stock prediction service:', error);
      this.initializationFailed = true;
      this.initializationError = error.message;
    }
  },
  
  /**
   * Create a new LSTM model for stock prediction
   * @private
   */
  _createLSTMModel() {
    try {
      logger.info('Creating new LSTM model for stock prediction');
      
      // Define model parameters
      const sequenceLength = 60; // 60 days of historical data
      const numFeatures = 5;     // Open, High, Low, Close, Volume
      
      // Create a sequential model
      this.model = tf.sequential();
      
      // Add LSTM layers with proper input shape
      this.model.add(tf.layers.lstm({
        units: 50,
        returnSequences: true,
        inputShape: [sequenceLength, numFeatures],
        recurrentInitializer: 'glorotNormal'
      }));
      
      this.model.add(tf.layers.dropout({ rate: 0.2 }));
      
      this.model.add(tf.layers.lstm({
        units: 50,
        returnSequences: false,
        recurrentInitializer: 'glorotNormal'
      }));
      
      this.model.add(tf.layers.dropout({ rate: 0.2 }));
      
      this.model.add(tf.layers.dense({
        units: 25,
        activation: 'relu'
      }));
      
      this.model.add(tf.layers.dense({
        units: 1,
        activation: 'linear' // Linear activation for regression
      }));
      
      // Compile the model
      this.model.compile({
        optimizer: tf.train.adam({ learningRate: 0.001 }),
        loss: 'meanSquaredError',
        metrics: ['mse']
      });
      
      // Log model summary
      this.model.summary();
      
      logger.info('Created new LSTM model successfully');
      return true;
    } catch (error) {
      logger.error('Error creating LSTM model:', error);
      return false;
    }
  },
  
  /**
   * Fetch historical stock data from Alpha Vantage API
   * @param {string} symbol - Stock symbol (e.g., 'AAPL')
   * @param {string} apiKey - Alpha Vantage API key
   * @returns {Promise<Array>} - Historical stock data
   */
  async fetchStockData(symbol, apiKey) {
    try {
      logger.info(`Fetching historical data for ${symbol}`);
      
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${apiKey}`;
      const response = await axios.get(url);
      
      if (response.data['Error Message']) {
        throw new Error(`Alpha Vantage API error: ${response.data['Error Message']}`);
      }
      
      const timeSeriesData = response.data['Time Series (Daily)'];
      
      if (!timeSeriesData) {
        throw new Error('No time series data returned from Alpha Vantage API');
      }
      
      // Convert the data to an array of objects
      const stockData = Object.entries(timeSeriesData).map(([date, values]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseFloat(values['5. volume'])
      }));
      
      // Sort by date (oldest first)
      stockData.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      logger.info(`Fetched ${stockData.length} days of historical data for ${symbol}`);
      return stockData;
    } catch (error) {
      logger.error(`Error fetching stock data for ${symbol}:`, error);
      throw new Error(`Failed to fetch stock data: ${error.message}`);
    }
  },
  
  /**
   * Preprocess stock data for LSTM model
   * @param {Array} stockData - Historical stock data
   * @param {number} sequenceLength - Length of input sequences
   * @returns {Object} - Preprocessed data
   */
  preprocessData(stockData, sequenceLength = 60) {
    try {
      logger.info(`Preprocessing stock data with sequence length ${sequenceLength}`);
      
      // Extract features and target
      const features = stockData.map(d => [
        d.open,
        d.high,
        d.low,
        d.close,
        d.volume
      ]);
      
      // Store min and max values for each feature for later denormalization
      this.scaler = {
        min: [
          Math.min(...features.map(f => f[0])),
          Math.min(...features.map(f => f[1])),
          Math.min(...features.map(f => f[2])),
          Math.min(...features.map(f => f[3])),
          Math.min(...features.map(f => f[4]))
        ],
        max: [
          Math.max(...features.map(f => f[0])),
          Math.max(...features.map(f => f[1])),
          Math.max(...features.map(f => f[2])),
          Math.max(...features.map(f => f[3])),
          Math.max(...features.map(f => f[4]))
        ]
      };
      
      // Normalize features to [0, 1]
      const normalizedFeatures = features.map(feature => 
        feature.map((value, i) => 
          (value - this.scaler.min[i]) / (this.scaler.max[i] - this.scaler.min[i])
        )
      );
      
      // Create sequences for LSTM
      const sequences = [];
      const targets = [];
      
      for (let i = 0; i < normalizedFeatures.length - sequenceLength; i++) {
        // Input sequence
        const seq = normalizedFeatures.slice(i, i + sequenceLength);
        sequences.push(seq);
        
        // Target is the next day's closing price
        targets.push(normalizedFeatures[i + sequenceLength][3]); // Index 3 is close price
      }
      
      // Convert to tensors
      const inputTensor = tf.tensor3d(sequences);
      const targetTensor = tf.tensor2d(targets, [targets.length, 1]);
      
      // Split into training and validation sets (80% training, 20% validation)
      const splitIdx = Math.floor(sequences.length * 0.8);
      
      const trainX = inputTensor.slice([0, 0, 0], [splitIdx, -1, -1]);
      const trainY = targetTensor.slice([0, 0], [splitIdx, -1]);
      
      const valX = inputTensor.slice([splitIdx, 0, 0], [-1, -1, -1]);
      const valY = targetTensor.slice([splitIdx, 0], [-1, -1]);
      
      logger.info(`Created ${sequences.length} sequences, ${splitIdx} for training and ${sequences.length - splitIdx} for validation`);
      
      return {
        trainX,
        trainY,
        valX,
        valY,
        originalData: stockData,
        sequenceLength
      };
    } catch (error) {
      logger.error('Error preprocessing stock data:', error);
      throw new Error(`Failed to preprocess data: ${error.message}`);
    }
  },
  
  /**
   * Train the LSTM model
   * @param {Object} data - Preprocessed data
   * @param {number} epochs - Number of training epochs
   * @param {number} batchSize - Batch size for training
   * @returns {Promise<Object>} - Training history
   */
  async trainModel(data, epochs = 50, batchSize = 32) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      logger.info(`Training LSTM model with ${epochs} epochs and batch size ${batchSize}`);
      
      const { trainX, trainY, valX, valY } = data;
      
      // Train the model
      const history = await this.model.fit(trainX, trainY, {
        epochs,
        batchSize,
        validationData: [valX, valY],
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            logger.info(`Epoch ${epoch + 1}/${epochs}: loss = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}`);
          }
        }
      });
      
      // Save model as JSON
      const modelJSON = this.model.toJSON();
      
      // Clean up tensors
      trainX.dispose();
      trainY.dispose();
      valX.dispose();
      valY.dispose();
      
      logger.info('Model training completed successfully');
      
      return {
        success: true,
        history: history.history,
        modelJSON
      };
    } catch (error) {
      logger.error('Error training LSTM model:', error);
      throw new Error(`Failed to train model: ${error.message}`);
    }
  },
  
  /**
   * Make predictions for future stock prices
   * @param {Array} stockData - Historical stock data
   * @param {number} daysToPredict - Number of days to predict into the future
   * @returns {Promise<Array>} - Predicted stock prices
   */
  async predict(stockData, daysToPredict = 7) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      logger.info(`Predicting stock prices for next ${daysToPredict} days`);
      
      const sequenceLength = 60;
      
      // Preprocess the last 'sequenceLength' days of data
      const recentData = stockData.slice(-sequenceLength);
      
      // Extract features
      const features = recentData.map(d => [
        d.open,
        d.high,
        d.low,
        d.close,
        d.volume
      ]);
      
      // Normalize features
      const normalizedFeatures = features.map(feature => 
        feature.map((value, i) => 
          (value - this.scaler.min[i]) / (this.scaler.max[i] - this.scaler.min[i])
        )
      );
      
      // Make predictions for the specified number of days
      const predictions = [];
      let currentSequence = [...normalizedFeatures];
      
      for (let i = 0; i < daysToPredict; i++) {
        // Prepare input tensor
        const inputTensor = tf.tensor3d([currentSequence.slice(-sequenceLength)]);
        
        // Make prediction
        const predictionTensor = this.model.predict(inputTensor);
        const predictedValue = predictionTensor.dataSync()[0];
        
        // Denormalize the predicted closing price
        const denormalizedClose = predictedValue * (this.scaler.max[3] - this.scaler.min[3]) + this.scaler.min[3];
        
        // Create a date for the prediction (next day after the last date)
        const lastDate = i === 0 
          ? new Date(stockData[stockData.length - 1].date) 
          : new Date(predictions[i - 1].date);
        
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 1);
        
        // Skip weekends
        if (nextDate.getDay() === 0) nextDate.setDate(nextDate.getDate() + 1); // Skip Sunday
        if (nextDate.getDay() === 6) nextDate.setDate(nextDate.getDate() + 2); // Skip Saturday
        
        // Add prediction to results
        predictions.push({
          date: nextDate.toISOString().split('T')[0],
          predictedClose: denormalizedClose
        });
        
        // Update the sequence with the new prediction
        // We'll use the predicted close for all OHLC values and an average volume
        const avgVolume = normalizedFeatures.reduce((sum, f) => sum + f[4], 0) / normalizedFeatures.length;
        currentSequence.push([predictedValue, predictedValue, predictedValue, predictedValue, avgVolume]);
        
        // Clean up tensors
        inputTensor.dispose();
        predictionTensor.dispose();
      }
      
      logger.info(`Generated ${predictions.length} predictions`);
      return predictions;
    } catch (error) {
      logger.error('Error making predictions:', error);
      throw new Error(`Failed to make predictions: ${error.message}`);
    }
  },
  
  /**
   * Evaluate model performance on test data
   * @param {Object} data - Preprocessed data
   * @returns {Promise<Object>} - Evaluation metrics
   */
  async evaluateModel(data) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const { valX, valY } = data;
      
      // Evaluate the model
      const evaluation = await this.model.evaluate(valX, valY);
      
      // Get the MSE value
      const mse = evaluation[0].dataSync()[0];
      
      // Calculate RMSE
      const rmse = Math.sqrt(mse);
      
      // Make predictions on validation data
      const predictions = this.model.predict(valX);
      
      // Convert to arrays
      const predictedValues = predictions.dataSync();
      const actualValues = valY.dataSync();
      
      // Denormalize values
      const denormalizedPredictions = Array.from(predictedValues).map(val => 
        val * (this.scaler.max[3] - this.scaler.min[3]) + this.scaler.min[3]
      );
      
      const denormalizedActuals = Array.from(actualValues).map(val => 
        val * (this.scaler.max[3] - this.scaler.min[3]) + this.scaler.min[3]
      );
      
      // Calculate Mean Absolute Percentage Error (MAPE)
      let sumPercentageError = 0;
      for (let i = 0; i < denormalizedActuals.length; i++) {
        const actual = denormalizedActuals[i];
        const predicted = denormalizedPredictions[i];
        const percentageError = Math.abs((actual - predicted) / actual);
        sumPercentageError += percentageError;
      }
      const mape = (sumPercentageError / denormalizedActuals.length) * 100;
      
      // Clean up tensors
      predictions.dispose();
      
      logger.info(`Model evaluation: MSE=${mse.toFixed(4)}, RMSE=${rmse.toFixed(4)}, MAPE=${mape.toFixed(2)}%`);
      
      return {
        mse,
        rmse,
        mape
      };
    } catch (error) {
      logger.error('Error evaluating model:', error);
      throw new Error(`Failed to evaluate model: ${error.message}`);
    }
  }
};

module.exports = stockPredictionService;