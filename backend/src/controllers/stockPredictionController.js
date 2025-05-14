const stockPredictionService = require('../services/stockPredictionService');
const logger = require('../utils/logger');

/**
 * Controller for stock market prediction endpoints
 */
const stockPredictionController = {
  /**
   * Train the stock prediction model
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async trainModel(req, res) {
    try {
      const { symbol, apiKey, epochs, batchSize } = req.body;
      
      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Stock symbol is required'
        });
      }
      
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'Alpha Vantage API key is required'
        });
      }
      
      logger.info(`Training stock prediction model for ${symbol}`);
      
      // Initialize service if not already initialized
      if (!stockPredictionService.isInitialized) {
        await stockPredictionService.initialize();
      }
      
      // Fetch historical stock data
      const stockData = await stockPredictionService.fetchStockData(symbol, apiKey);
      
      // Preprocess data
      const preprocessedData = stockPredictionService.preprocessData(stockData);
      
      // Train the model
      const trainingResult = await stockPredictionService.trainModel(
        preprocessedData,
        epochs || 50,
        batchSize || 32
      );
      
      // Evaluate the model
      const evaluationResult = await stockPredictionService.evaluateModel(preprocessedData);
      
      res.json({
        success: true,
        message: `Model trained successfully for ${symbol}`,
        trainingInfo: {
          symbol,
          dataPoints: stockData.length,
          epochs: epochs || 50,
          batchSize: batchSize || 32,
          loss: trainingResult.history.loss[trainingResult.history.loss.length - 1],
          valLoss: trainingResult.history.val_loss[trainingResult.history.val_loss.length - 1]
        },
        evaluation: evaluationResult
      });
    } catch (error) {
      logger.error(`Error training stock prediction model: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to train stock prediction model: ${error.message}`
      });
    }
  },
  
  /**
   * Make stock price predictions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async predictStockPrices(req, res) {
    try {
      const { symbol, apiKey, days } = req.body;
      
      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Stock symbol is required'
        });
      }
      
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'Alpha Vantage API key is required'
        });
      }
      
      const daysToPredict = days || 7;
      
      logger.info(`Predicting stock prices for ${symbol} for next ${daysToPredict} days`);
      
      // Initialize service if not already initialized
      if (!stockPredictionService.isInitialized) {
        await stockPredictionService.initialize();
      }
      
      // Fetch historical stock data
      const stockData = await stockPredictionService.fetchStockData(symbol, apiKey);
      
      // If the model hasn't been trained yet, train it first
      if (!stockPredictionService.model) {
        logger.info(`Model not trained yet, training model for ${symbol} first`);
        
        // Preprocess data
        const preprocessedData = stockPredictionService.preprocessData(stockData);
        
        // Train the model
        await stockPredictionService.trainModel(preprocessedData);
      }
      
      // Make predictions
      const predictions = await stockPredictionService.predict(stockData, daysToPredict);
      
      // Get the last known price for reference
      const lastKnownPrice = stockData[stockData.length - 1].close;
      const lastKnownDate = stockData[stockData.length - 1].date;
      
      res.json({
        success: true,
        symbol,
        lastKnownPrice,
        lastKnownDate,
        predictions,
        predictionDate: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Error predicting stock prices: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to predict stock prices: ${error.message}`
      });
    }
  }
};

module.exports = stockPredictionController;