const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');
const dataSourceConfig = require('../../config/dataSourceConfig');

dotenv.config();

const FRED_API_KEY = process.env.FRED_API_KEY;
const BASE_URL = 'https://api.stlouisfed.org/fred';
const MOCK_DATA_PATH = path.resolve(__dirname, '../../data/mock/fred');

// Get service-specific configuration
const serviceConfig = dataSourceConfig.services.fred;

/**
 * Service for interacting with the Federal Reserve Economic Data (FRED) API
 */
const fredService = {
  /**
   * Get series data from FRED
   * @param {string} seriesId - The FRED series ID
   * @param {Object} options - Additional options for the request
   * @param {string} options.frequency - Data frequency (d, w, bw, m, q, sa, a)
   * @param {string} options.units - Units transformation (lin, chg, ch1, pch, pc1, pca, cch, cca)
   * @param {string} options.startDate - Start date in YYYY-MM-DD format
   * @param {string} options.endDate - End date in YYYY-MM-DD format
   * @param {boolean} options.forceMock - Force using mock data even in production
   * @param {boolean} options.forceReal - Force using real data even in development
   * @returns {Promise<Object>} - The series data
   */
  async getSeriesData(seriesId, options = {}) {
    // Determine if we should use mock data
    const useMock = options.forceMock || 
                   (serviceConfig.useMockData && !options.forceReal);
    
    // In production, never use mock data unless explicitly forced
    if (dataSourceConfig.isProduction && !options.forceMock) {
      useMock = false;
    }
    
    try {
      // Use mock data if configured to do so
      if (useMock) {
        try {
          // Try to load series-specific mock data first
          const mockFilePath = path.join(MOCK_DATA_PATH, `${seriesId.toLowerCase()}.json`);
          const mockData = await fs.readFile(mockFilePath, 'utf8');
          const parsedData = JSON.parse(mockData);
          
          console.log(`Using mock data for FRED series ${seriesId}`);
          return parsedData;
        } catch (mockError) {
          // If series-specific mock data doesn't exist, try to load generic mock data
          try {
            const genericMockPath = path.join(MOCK_DATA_PATH, 'generic.json');
            const genericMockData = await fs.readFile(genericMockPath, 'utf8');
            const parsedGenericData = JSON.parse(genericMockData);
            
            console.log(`Using generic mock data for FRED series ${seriesId}`);
            return {
              ...parsedGenericData,
              seriesId: seriesId
            };
          } catch (genericMockError) {
            // If no mock data exists and we're in development, create some
            if (process.env.NODE_ENV === 'development') {
              console.log(`No mock data found for ${seriesId}, generating random data`);
              return this._generateRandomData(seriesId, options);
            } else {
              // In production, fall back to real API
              console.log(`No mock data found for ${seriesId}, falling back to real API`);
              throw new Error('No mock data available');
            }
          }
        }
      }
      
      // Use real API data
      const response = await axios.get(`${BASE_URL}/series/observations`, {
        params: {
          series_id: seriesId,
          api_key: FRED_API_KEY,
          file_type: 'json',
          frequency: options.frequency || null,
          units: options.units || null,
          observation_start: options.startDate || null,
          observation_end: options.endDate || null,
        }
      });
      
      return {
        success: true,
        seriesId: seriesId,
        title: response.data.title || `Series ${seriesId}`,
        units: response.data.units || 'Units',
        frequency: response.data.frequency || 'Frequency',
        data: response.data.observations.map(obs => ({
          date: obs.date,
          value: parseFloat(obs.value) || null
        }))
      };
    } catch (error) {
      if (error.message === 'No mock data available') {
        // Try real API as fallback
        return this.getSeriesData(seriesId, { ...options, forceReal: true });
      }
      
      console.error(`Error fetching FRED series ${seriesId}:`, error.message);
      throw new Error(`Failed to fetch FRED series ${seriesId}: ${error.message}`);
    }
  },
  
  /**
   * Generate random data for development and testing
   * @param {string} seriesId - The series ID
   * @param {Object} options - Options for data generation
   * @returns {Object} - Generated data
   * @private
   */
  _generateRandomData(seriesId, options = {}) {
    const numPoints = 20;
    const startDate = options.startDate ? new Date(options.startDate) : new Date();
    const data = [];
    
    // Generate random time series data
    let baseValue = 100 + Math.random() * 900;
    for (let i = 0; i < numPoints; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() - i);
      
      // Add some randomness but maintain a trend
      baseValue = baseValue * (0.98 + Math.random() * 0.04);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: parseFloat(baseValue.toFixed(2))
      });
    }
    
    // Reverse to get chronological order
    data.reverse();
    
    return {
      success: true,
      seriesId: seriesId,
      title: `Mock Data for ${seriesId}`,
      units: 'Units',
      frequency: 'Monthly',
      data: data
    };
  },

  /**
   * Get series information from FRED
   * @param {string} seriesId - The FRED series ID
   * @returns {Promise<Object>} - The series information
   */
  async getSeriesInfo(seriesId) {
    try {
      const response = await axios.get(`${BASE_URL}/series`, {
        params: {
          series_id: seriesId,
          api_key: FRED_API_KEY,
          file_type: 'json'
        }
      });
      
      return response.data.seriess[0];
    } catch (error) {
      console.error(`Error fetching FRED series info for ${seriesId}:`, error.message);
      throw new Error(`Failed to fetch FRED series info for ${seriesId}: ${error.message}`);
    }
  },

  /**
   * Search for series in FRED
   * @param {string} searchText - The search text
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Array>} - The search results
   */
  async searchSeries(searchText, limit = 10) {
    try {
      const response = await axios.get(`${BASE_URL}/series/search`, {
        params: {
          search_text: searchText,
          api_key: FRED_API_KEY,
          file_type: 'json',
          limit: limit
        }
      });
      
      return response.data.seriess;
    } catch (error) {
      console.error(`Error searching FRED series for "${searchText}":`, error.message);
      throw new Error(`Failed to search FRED series for "${searchText}": ${error.message}`);
    }
  }
};

module.exports = fredService;
