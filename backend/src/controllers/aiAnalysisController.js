const aiAnalysisService = require('../services/aiAnalysisService');
const logger = require('../utils/logger');
const { createClient } = require('@supabase/supabase-js');
const apiServices = require('../services/api');
const moment = require('moment');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Controller for AI analysis endpoints
 */
const aiAnalysisController = {
  /**
   * Analyze market data and provide comprehensive predictions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async analyzeMarket(req, res) {
    try {
      const userId = req.user?.id;
      const { symbol, timeframe = 'daily', dataPoints = 60 } = req.query;
      
      logger.info(`Analyzing market data for ${symbol} (${timeframe}) for user ${userId || 'anonymous'}`);
      
      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Symbol parameter is required'
        });
      }
      
      // Initialize AI service if not already initialized
      if (!aiAnalysisService.isInitialized) {
        await aiAnalysisService.initialize();
      }
      
      // Ensure we have enough data points for AI analysis (minimum 60)
      const minDataPoints = Math.max(60, dataPoints);
      
      // Fetch market data
      const marketData = await this._fetchMarketData(symbol, timeframe, minDataPoints);
      
      // Calculate additional metrics
      const enhancedMarketData = {
        ...marketData,
        ohlcv: this._enhanceMarketData(marketData.ohlcv)
      };
      
      // Fetch macro data
      const macroData = await this._fetchMacroData(minDataPoints);
      
      // Perform analysis
      const analysis = await aiAnalysisService.analyzeMarket({
        marketData: enhancedMarketData.ohlcv,
        priceData: enhancedMarketData.ohlcv,
        macroData: macroData
      });
      
      // Save analysis to user history if authenticated
      if (userId) {
        try {
          await supabase
            .from('analysis_history')
            .insert({
              user_id: userId,
              symbol,
              timeframe,
              analysis_result: analysis,
              created_at: new Date().toISOString()
            });
        } catch (saveError) {
          logger.error(`Error saving analysis to history: ${saveError.message}`);
          // Continue even if saving fails
        }
      }
      
      res.json({
        success: true,
        symbol,
        timeframe,
        analysis
      });
    } catch (error) {
      logger.error(`Error analyzing market: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to analyze market: ${error.message}`
      });
    }
  },
  
  /**
   * Get trend prediction for a symbol
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getTrendPrediction(req, res) {
    try {
      const { symbol, timeframe = 'daily' } = req.query;
      
      logger.info(`Getting trend prediction for ${symbol} (${timeframe})`);
      
      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Symbol parameter is required'
        });
      }
      
      // Initialize AI service if not already initialized
      if (!aiAnalysisService.isInitialized) {
        await aiAnalysisService.initialize();
      }
      
      // Fetch market data
      const marketData = await this._fetchMarketData(symbol, timeframe, 30);
      
      // Predict trend
      const prediction = await aiAnalysisService.predictTrend(marketData.ohlcv);
      
      res.json({
        success: true,
        symbol,
        timeframe,
        prediction
      });
    } catch (error) {
      logger.error(`Error predicting trend: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to predict trend: ${error.message}`
      });
    }
  },
  
  /**
   * Detect potential market tops and bottoms
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async detectTurningPoints(req, res) {
    try {
      const { symbol, timeframe = 'daily' } = req.query;
      
      logger.info(`Detecting turning points for ${symbol} (${timeframe})`);
      
      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Symbol parameter is required'
        });
      }
      
      // Initialize AI service if not already initialized
      if (!aiAnalysisService.isInitialized) {
        await aiAnalysisService.initialize();
      }
      
      // Fetch market data
      const marketData = await this._fetchMarketData(symbol, timeframe, 30);
      
      // Detect turning points
      const turningPoints = await aiAnalysisService.detectTurningPoints(marketData.ohlcv);
      
      res.json({
        success: true,
        symbol,
        timeframe,
        turningPoints
      });
    } catch (error) {
      logger.error(`Error detecting turning points: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to detect turning points: ${error.message}`
      });
    }
  },
  
  /**
   * Predict liquidity regime
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async predictLiquidityRegime(req, res) {
    try {
      logger.info('Predicting liquidity regime');
      
      // Initialize AI service if not already initialized
      if (!aiAnalysisService.isInitialized) {
        await aiAnalysisService.initialize();
      }
      
      // Fetch macro data
      const macroData = await this._fetchMacroData(60);
      
      // Predict liquidity regime
      const prediction = await aiAnalysisService.predictLiquidityRegime(macroData);
      
      res.json({
        success: true,
        prediction
      });
    } catch (error) {
      logger.error(`Error predicting liquidity regime: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to predict liquidity regime: ${error.message}`
      });
    }
  },
  
  /**
   * Train AI models with historical data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async trainModels(req, res) {
    try {
      logger.info('Training AI models');
      
      // Initialize AI service if not already initialized
      if (!aiAnalysisService.isInitialized) {
        await aiAnalysisService.initialize();
      }
      
      // Fetch training data
      const trainingData = await this._fetchTrainingData();
      
      // Train models
      const results = await aiAnalysisService.trainModels(trainingData);
      
      res.json({
        success: true,
        message: 'AI models trained successfully',
        results
      });
    } catch (error) {
      logger.error(`Error training AI models: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to train AI models: ${error.message}`
      });
    }
  },
  
  /**
   * Fetch market data for a symbol
   * @param {string} symbol - Market symbol
   * @param {string} timeframe - Data timeframe
   * @param {number} dataPoints - Number of data points to fetch
   * @returns {Promise<Object>} - Market data
   * @private
   */
  async _fetchMarketData(symbol, timeframe, dataPoints) {
    try {
      // Calculate start date based on timeframe and data points
      const endDate = new Date();
      let startDate;
      
      switch (timeframe) {
        case 'hourly':
          startDate = new Date(endDate);
          startDate.setHours(endDate.getHours() - dataPoints);
          break;
        case 'weekly':
          startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - dataPoints * 7);
          break;
        case 'monthly':
          startDate = new Date(endDate);
          startDate.setMonth(endDate.getMonth() - dataPoints);
          break;
        case 'daily':
        default:
          startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - dataPoints);
      }
      
      // Format dates
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Try to fetch from market data API
      let marketData;
      
      try {
        // This is a placeholder - replace with actual API call to your market data provider
        // For example, you might use Alpha Vantage, Yahoo Finance, etc.
        if (apiServices.marketDataService) {
          marketData = await apiServices.marketDataService.getOHLCV(symbol, {
            startDate: startDateStr,
            endDate: endDateStr,
            timeframe
          });
        } else {
          // Fallback to mock data if no service is available
          marketData = this._generateMockMarketData(symbol, timeframe, dataPoints);
        }
      } catch (apiError) {
        logger.error(`Error fetching market data from API: ${apiError.message}`);
        // Fallback to mock data
        marketData = this._generateMockMarketData(symbol, timeframe, dataPoints);
      }
      
      return marketData;
    } catch (error) {
      logger.error(`Error fetching market data: ${error.message}`);
      throw new Error(`Failed to fetch market data: ${error.message}`);
    }
  },
  
  /**
   * Fetch macro economic data
   * @param {number} dataPoints - Number of data points to fetch
   * @returns {Promise<Array>} - Macro data
   * @private
   */
  async _fetchMacroData(dataPoints) {
    try {
      // Ensure we have at least 60 data points for AI analysis
      const minDataPoints = Math.max(60, dataPoints);
      
      // Calculate start date
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - minDataPoints);
      
      // Format dates
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Fetch data from various sources
      let macroData = [];
      
      try {
        // Fetch Fed Funds Rate from FRED
        const fedFundsData = await apiServices.fredService.getSeriesData('FEDFUNDS', {
          startDate: startDateStr,
          endDate: endDateStr
        });
        
        // Fetch 10Y Treasury Yield from FRED
        const treasury10YData = await apiServices.fredService.getSeriesData('DGS10', {
          startDate: startDateStr,
          endDate: endDateStr
        });
        
        // Fetch 2Y Treasury Yield from FRED
        const treasury2YData = await apiServices.fredService.getSeriesData('DGS2', {
          startDate: startDateStr,
          endDate: endDateStr
        });
        
        // Combine data
        const dates = new Set();
        
        // Add all dates from all datasets
        fedFundsData.data.forEach(item => dates.add(item.date));
        treasury10YData.data.forEach(item => dates.add(item.date));
        treasury2YData.data.forEach(item => dates.add(item.date));
        
        // Sort dates
        const sortedDates = Array.from(dates).sort();
        
        // Create combined dataset
        macroData = sortedDates.map(date => {
          const fedFunds = fedFundsData.data.find(item => item.date === date);
          const treasury10Y = treasury10YData.data.find(item => item.date === date);
          const treasury2Y = treasury2YData.data.find(item => item.date === date);
          
          return {
            date,
            fedFundsRate: fedFunds ? fedFunds.value : null,
            treasuryYield10Y: treasury10Y ? treasury10Y.value : null,
            treasuryYield2Y: treasury2Y ? treasury2Y.value : null,
            // Other fields would be populated from additional API calls
            vix: Math.random() * 30, // Mock data
            dollarIndex: 90 + Math.random() * 20, // Mock data
            creditSpread: 1 + Math.random() * 5, // Mock data
            excessReserves: 1000 + Math.random() * 500, // Mock data
            m2Money: 20000 + Math.random() * 1000, // Mock data
            fedBalance: 8000 + Math.random() * 500, // Mock data
            repoRate: 0.5 + Math.random() * 2 // Mock data
          };
        });
      } catch (apiError) {
        logger.error(`Error fetching macro data from APIs: ${apiError.message}`);
        // Fallback to mock data
        macroData = this._generateMockMacroData(dataPoints);
      }
      
      return macroData;
    } catch (error) {
      logger.error(`Error fetching macro data: ${error.message}`);
      throw new Error(`Failed to fetch macro data: ${error.message}`);
    }
  },
  
  /**
   * Fetch training data for AI models
   * @returns {Promise<Object>} - Training data for all models
   * @private
   */
  async _fetchTrainingData() {
    try {
      // This would typically involve fetching historical data for multiple symbols
      // and preparing it for training each model type
      
      // For this implementation, we'll use a simplified approach with mock data
      
      // LSTM training data (for trend prediction)
      const lstmFeatures = [];
      const lstmLabels = [];
      
      // Generate training data for 10 different symbols
      for (let i = 0; i < 10; i++) {
        const symbol = `SYMBOL${i}`;
        const marketData = await this._fetchMarketData(symbol, 'daily', 60);
        
        // Process each 30-day window
        for (let j = 0; j < marketData.ohlcv.length - 30; j++) {
          const window = marketData.ohlcv.slice(j, j + 30);
          const nextDay = marketData.ohlcv[j + 30];
          
          // Skip if we don't have a next day
          if (!nextDay) continue;
          
          // Process window for LSTM input
          const processedWindow = window.map(day => {
            const prevClose = day.prevClose || day.open;
            
            return [
              day.open / prevClose - 1,
              day.high / prevClose - 1,
              day.low / prevClose - 1,
              day.close / prevClose - 1,
              Math.log(day.volume || 1)
            ];
          });
          
          // Determine label based on next day's movement
          const pctChange = (nextDay.close - window[window.length - 1].close) / window[window.length - 1].close;
          
          let label;
          if (pctChange > 0.01) {
            label = [1, 0, 0]; // Up
          } else if (pctChange < -0.01) {
            label = [0, 1, 0]; // Down
          } else {
            label = [0, 0, 1]; // Stable
          }
          
          lstmFeatures.push(processedWindow);
          lstmLabels.push(label);
        }
      }
      
      // Autoencoder training data (for anomaly detection)
      const autoencoderFeatures = [];
      
      // Use the same market data but focus on price patterns
      for (let i = 0; i < 10; i++) {
        const symbol = `SYMBOL${i}`;
        const marketData = await this._fetchMarketData(symbol, 'daily', 60);
        
        // Process each 30-day window of closing prices
        for (let j = 0; j < marketData.ohlcv.length - 30; j++) {
          const window = marketData.ohlcv.slice(j, j + 30);
          
          // Extract closing prices
          const closingPrices = window.map(day => day.close);
          
          // Normalize to [0, 1]
          const minPrice = Math.min(...closingPrices);
          const maxPrice = Math.max(...closingPrices);
          const range = maxPrice - minPrice;
          
          if (range === 0) continue;
          
          const normalizedPrices = closingPrices.map(price => (price - minPrice) / range);
          
          autoencoderFeatures.push(normalizedPrices);
        }
      }
      
      // Transformer training data (for liquidity regime prediction)
      const transformerFeatures = [];
      const transformerLabels = [];
      
      // Fetch macro data for training
      const macroData = await this._fetchMacroData(120);
      
      // Process each 60-day window
      for (let i = 0; i < macroData.length - 60; i++) {
        const window = macroData.slice(i, i + 60);
        
        // Process window for transformer input
        const processedWindow = window.map(day => {
          return [
            day.fedFundsRate || 0,
            day.treasuryYield10Y || 0,
            day.treasuryYield2Y || 0,
            day.vix || 0,
            day.dollarIndex || 0,
            day.creditSpread || 0,
            day.excessReserves || 0,
            day.m2Money || 0,
            day.fedBalance || 0,
            day.repoRate || 0
          ];
        });
        
        // Determine label based on Fed Funds Rate trend
        const startRate = window[0].fedFundsRate || 0;
        const endRate = window[window.length - 1].fedFundsRate || 0;
        
        let label;
        if (endRate > startRate) {
          label = [1, 0]; // Tightening
        } else {
          label = [0, 1]; // Easing
        }
        
        transformerFeatures.push(processedWindow);
        transformerLabels.push(label);
      }
      
      return {
        lstm: {
          features: lstmFeatures,
          labels: lstmLabels
        },
        autoencoder: {
          features: autoencoderFeatures
        },
        transformer: {
          features: transformerFeatures,
          labels: transformerLabels
        }
      };
    } catch (error) {
      logger.error(`Error fetching training data: ${error.message}`);
      throw new Error(`Failed to fetch training data: ${error.message}`);
    }
  },
  
  /**
   * Generate mock market data for testing
   * @param {string} symbol - Market symbol
   * @param {string} timeframe - Data timeframe
   * @param {number} dataPoints - Number of data points to generate
   * @returns {Object} - Mock market data
   * @private
   */
  _generateMockMarketData(symbol, timeframe, dataPoints) {
    const ohlcv = [];
    let basePrice = 100 + Math.random() * 900; // Random starting price between 100 and 1000
    let baseVolume = 1000000 + Math.random() * 9000000; // Random base volume
    
    const endDate = new Date();
    let currentDate = new Date(endDate);
    
    // Adjust date based on timeframe
    switch (timeframe) {
      case 'hourly':
        currentDate.setHours(endDate.getHours() - dataPoints);
        break;
      case 'weekly':
        currentDate.setDate(endDate.getDate() - dataPoints * 7);
        break;
      case 'monthly':
        currentDate.setMonth(endDate.getMonth() - dataPoints);
        break;
      case 'daily':
      default:
        currentDate.setDate(endDate.getDate() - dataPoints);
    }
    
    // Generate data points
    for (let i = 0; i < dataPoints; i++) {
      // Random price movement
      const priceChange = (Math.random() - 0.5) * 0.02 * basePrice; // +/- 2%
      const open = basePrice;
      const close = basePrice + priceChange;
      const high = Math.max(open, close) + Math.random() * Math.abs(priceChange);
      const low = Math.min(open, close) - Math.random() * Math.abs(priceChange);
      
      // Random volume
      const volume = baseVolume * (0.8 + Math.random() * 0.4); // +/- 20%
      
      // Format date
      let date;
      switch (timeframe) {
        case 'hourly':
          currentDate.setHours(currentDate.getHours() + 1);
          date = currentDate.toISOString();
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          date = currentDate.toISOString().split('T')[0];
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          date = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'daily':
        default:
          currentDate.setDate(currentDate.getDate() + 1);
          date = currentDate.toISOString().split('T')[0];
      }
      
      // Add data point
      ohlcv.push({
        date,
        open,
        high,
        low,
        close,
        volume,
        prevClose: i > 0 ? ohlcv[i - 1].close : open
      });
      
      // Update base price for next iteration
      basePrice = close;
    }
    
    return {
      symbol,
      timeframe,
      ohlcv
    };
  },
  
  /**
   * Enhance market data with additional metrics
   * @param {Array} ohlcvData - OHLCV data
   * @returns {Array} - Enhanced data with delta, percent change, and trendline slope
   * @private
   */
  _enhanceMarketData(ohlcvData) {
    if (!ohlcvData || !Array.isArray(ohlcvData) || ohlcvData.length === 0) {
      return ohlcvData;
    }
    
    try {
      // Add delta and percent change
      let enhancedData = [...ohlcvData];
      
      // First point has no previous value
      enhancedData[0].delta = 0;
      enhancedData[0].percentChange = 0;
      
      // Calculate for remaining points
      for (let i = 1; i < enhancedData.length; i++) {
        const currentClose = enhancedData[i].close;
        const previousClose = enhancedData[i-1].close;
        
        enhancedData[i].delta = currentClose - previousClose;
        enhancedData[i].percentChange = previousClose !== 0 ? 
          (enhancedData[i].delta / previousClose) * 100 : 0;
      }
      
      // Calculate 7-day rolling trendline slope
      const windowSize = 7;
      
      for (let i = 0; i < enhancedData.length; i++) {
        if (i >= windowSize - 1) {
          // Get window of data for regression
          const window = enhancedData.slice(i - windowSize + 1, i + 1);
          
          // Calculate trendline slope using linear regression
          const values = window.map(d => d.close);
          const slope = this._calculateLinearRegressionSlope(values);
          
          enhancedData[i].trendlineSlope = parseFloat(slope.toFixed(4));
        } else {
          enhancedData[i].trendlineSlope = 0;
        }
      }
      
      return enhancedData;
    } catch (error) {
      logger.error('Error enhancing market data:', error);
      return ohlcvData;
    }
  },
  
  /**
   * Calculate linear regression slope
   * @param {Array} values - Array of values
   * @returns {number} - Slope of the trend line
   * @private
   */
  _calculateLinearRegressionSlope(values) {
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
    
    return numerator / denominator;
  },
  
  _generateMockMacroData(dataPoints) {
    const macroData = [];
    
    // Ensure we have at least 60 data points for AI analysis
    const minDataPoints = Math.max(60, dataPoints);
    
    // Base values
    let fedFundsRate = 0.25 + Math.random() * 0.5;
    let treasuryYield10Y = 1.5 + Math.random() * 1.0;
    let treasuryYield2Y = 0.5 + Math.random() * 0.5;
    let vix = 15 + Math.random() * 10;
    let dollarIndex = 90 + Math.random() * 10;
    let creditSpread = 1 + Math.random() * 2;
    let excessReserves = 1000 + Math.random() * 500;
    let m2Money = 20000 + Math.random() * 1000;
    let fedBalance = 8000 + Math.random() * 500;
    let repoRate = 0.1 + Math.random() * 0.2;
    
    const endDate = new Date();
    let currentDate = new Date(endDate);
    currentDate.setDate(endDate.getDate() - minDataPoints);
    
    // Generate data points
    for (let i = 0; i < minDataPoints; i++) {
      // Random changes
      fedFundsRate += (Math.random() - 0.5) * 0.05;
      treasuryYield10Y += (Math.random() - 0.5) * 0.1;
      treasuryYield2Y += (Math.random() - 0.5) * 0.05;
      vix += (Math.random() - 0.5) * 2;
      dollarIndex += (Math.random() - 0.5) * 0.5;
      creditSpread += (Math.random() - 0.5) * 0.1;
      excessReserves += (Math.random() - 0.5) * 50;
      m2Money += (Math.random() - 0.5) * 100;
      fedBalance += (Math.random() - 0.5) * 50;
      repoRate += (Math.random() - 0.5) * 0.02;
      
      // Ensure values stay in reasonable ranges
      fedFundsRate = Math.max(0, Math.min(5, fedFundsRate));
      treasuryYield10Y = Math.max(0.5, Math.min(5, treasuryYield10Y));
      treasuryYield2Y = Math.max(0.1, Math.min(4, treasuryYield2Y));
      vix = Math.max(10, Math.min(40, vix));
      dollarIndex = Math.max(80, Math.min(110, dollarIndex));
      creditSpread = Math.max(0.5, Math.min(5, creditSpread));
      excessReserves = Math.max(500, Math.min(2000, excessReserves));
      m2Money = Math.max(19000, Math.min(22000, m2Money));
      fedBalance = Math.max(7000, Math.min(9000, fedBalance));
      repoRate = Math.max(0.05, Math.min(1, repoRate));
      
      // Format date
      currentDate.setDate(currentDate.getDate() + 1);
      const date = currentDate.toISOString().split('T')[0];
      
      // Add data point
      macroData.push({
        date,
        fedFundsRate,
        treasuryYield10Y,
        treasuryYield2Y,
        vix,
        dollarIndex,
        creditSpread,
        excessReserves,
        m2Money,
        fedBalance,
        repoRate
      });
    }
    
    return macroData;
  },
  
  /**
   * Get historical trading signals and their accuracy
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getHistoricalSignals(req, res) {
    try {
      const userId = req.user?.id;
      const { symbol = 'SPY', limit = 20 } = req.query;
      
      logger.info(`Fetching historical signals for ${symbol} for user ${userId || 'anonymous'}`);
      
      // Query the database for historical signals
      const { data: signals, error } = await supabase
        .from('trading_signals')
        .select('*')
        .eq('symbol', symbol)
        .order('date', { ascending: false })
        .limit(parseInt(limit));
      
      if (error) {
        logger.error(`Error fetching historical signals: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch historical signals'
        });
      }
      
      // Format the signals for the frontend
      const formattedSignals = signals.map(signal => ({
        date: signal.date,
        signal: signal.signal_type.toLowerCase(), // Ensure lowercase for consistency
        actualReturn: parseFloat(signal.actual_return)
      }));
      
      // Calculate accuracy statistics
      const stats = this._calculateAccuracyStats(formattedSignals);
      
      return res.json({
        success: true,
        signals: formattedSignals,
        stats
      });
    } catch (error) {
      logger.error(`Error fetching historical signals: ${error.message}`, { stack: error.stack });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch historical signals'
      });
    }
  },
  
  /**
   * Calculate accuracy statistics from historical signals
   * @param {Array} signals - Array of historical signals
   * @returns {Object} - Accuracy statistics
   * @private
   */
  _calculateAccuracyStats(signals) {
    const stats = {
      buy: { correct: 0, total: 0, accuracy: 0 },
      sell: { correct: 0, total: 0, accuracy: 0 },
      neutral: { correct: 0, total: 0, accuracy: 0 },
      overall: { correct: 0, total: 0, accuracy: 0 },
    };
    
    signals.forEach(signal => {
      // Skip if signal type is not recognized
      if (!['buy', 'sell', 'neutral'].includes(signal.signal)) {
        return;
      }
      
      // Count total signals by type
      stats[signal.signal].total += 1;
      stats.overall.total += 1;
      
      // Count correct signals (buy with positive return, sell with negative return, neutral with small return)
      if (
        (signal.signal === 'buy' && signal.actualReturn > 0) ||
        (signal.signal === 'sell' && signal.actualReturn < 0) ||
        (signal.signal === 'neutral' && Math.abs(signal.actualReturn) < 2)
      ) {
        stats[signal.signal].correct += 1;
        stats.overall.correct += 1;
      }
    });
    
    // Calculate accuracy percentages
    stats.buy.accuracy = stats.buy.total > 0 ? (stats.buy.correct / stats.buy.total) * 100 : 0;
    stats.sell.accuracy = stats.sell.total > 0 ? (stats.sell.correct / stats.sell.total) * 100 : 0;
    stats.neutral.accuracy = stats.neutral.total > 0 ? (stats.neutral.correct / stats.neutral.total) * 100 : 0;
    stats.overall.accuracy = stats.overall.total > 0 ? (stats.overall.correct / stats.overall.total) * 100 : 0;
    
    return stats;
  }
};

module.exports = aiAnalysisController;