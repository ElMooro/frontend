import axios from 'axios';

// API base URL from environment variable or default to localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Check if we should use mock data (for production without backend)
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock data for when API is not available
const mockData = {
  SP500: {
    data: Array.from({ length: 60 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (60 - i));
      return {
        date: date.toISOString().split('T')[0],
        value: 3000 + Math.random() * 2000
      };
    })
  },
  UNRATE: {
    data: Array.from({ length: 60 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (60 - i));
      return {
        date: date.toISOString().split('T')[0],
        value: 3 + Math.random() * 2
      };
    })
  },
  CPIAUCSL: {
    data: Array.from({ length: 60 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (60 - i));
      return {
        date: date.toISOString().split('T')[0],
        value: 250 + i + Math.random() * 10
      };
    })
  },
  DGS10: {
    data: Array.from({ length: 60 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (60 - i));
      return {
        date: date.toISOString().split('T')[0],
        value: 2 + Math.random() * 3
      };
    })
  },
  DGS2: {
    data: Array.from({ length: 60 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (60 - i));
      return {
        date: date.toISOString().split('T')[0],
        value: 1 + Math.random() * 2
      };
    })
  },
  FEDFUNDS: {
    data: Array.from({ length: 60 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (60 - i));
      return {
        date: date.toISOString().split('T')[0],
        value: 0.5 + Math.random() * 4
      };
    })
  },
  MORTGAGE30US: {
    data: Array.from({ length: 60 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (60 - i));
      return {
        date: date.toISOString().split('T')[0],
        value: 3 + Math.random() * 3
      };
    })
  },
  GDP: {
    data: Array.from({ length: 60 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (60 - i));
      return {
        date: date.toISOString().split('T')[0],
        value: 20000 + i * 100 + Math.random() * 500
      };
    })
  }
};

// FRED API service
const fredApi = {
  /**
   * Get series data from FRED
   * @param {string} seriesId - The FRED series ID
   * @param {Object} options - Additional options
   * @param {string} options.frequency - Data frequency (d, w, bw, m, q, sa, a)
   * @param {string} options.units - Units transformation
   * @param {string} options.startDate - Start date in YYYY-MM-DD format
   * @param {string} options.endDate - End date in YYYY-MM-DD format
   * @param {string} options.calculation - Calculation type (change, pct_change, etc.)
   * @returns {Promise<Object>} - The series data
   */
  getSeriesData: async (seriesId, options = {}) => {
    // If using mock data, return it instead of making API call
    if (USE_MOCK_DATA) {
      console.log(`Using mock data for ${seriesId}`);
      return { data: mockData[seriesId]?.data || [] };
    }
    
    try {
      const response = await apiClient.get(`/economic-data/fred/${seriesId}`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching FRED series ${seriesId}:`, error);
      // Fallback to mock data on error
      console.log(`Falling back to mock data for ${seriesId}`);
      return { data: mockData[seriesId]?.data || [] };
    }
  },

  /**
   * Search for series in FRED
   * @param {string} searchText - The search text
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} - The search results
   */
  searchSeries: async (searchText, limit = 10) => {
    try {
      // This would need a corresponding endpoint in the backend
      const response = await apiClient.get(`/economic-data/fred/search`, {
        params: { search_text: searchText, limit }
      });
      return response.data;
    } catch (error) {
      console.error(`Error searching FRED series:`, error);
      throw error;
    }
  }
};

// Treasury API service
const treasuryApi = {
  /**
   * Get debt data from Treasury
   * @param {Object} options - Options for the request
   * @param {string} options.startDate - Start date in YYYY-MM-DD format
   * @param {string} options.endDate - End date in YYYY-MM-DD format
   * @param {number} options.limit - Maximum number of results
   * @returns {Promise<Object>} - The debt data
   */
  getDebtData: async (options = {}) => {
    try {
      const response = await apiClient.get('/economic-data/treasury/debt', {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Treasury debt data:', error);
      throw error;
    }
  },

  /**
   * Get yield curve data from Treasury
   * @param {Object} options - Options for the request
   * @param {string} options.startDate - Start date in YYYY-MM-DD format
   * @param {string} options.endDate - End date in YYYY-MM-DD format
   * @param {number} options.limit - Maximum number of results
   * @returns {Promise<Object>} - The yield curve data
   */
  getYieldCurveData: async (options = {}) => {
    try {
      const response = await apiClient.get('/economic-data/treasury/yield_curve', {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Treasury yield curve data:', error);
      throw error;
    }
  },

  /**
   * Get Treasury bill rates
   * @param {Object} options - Options for the request
   * @param {string} options.startDate - Start date in YYYY-MM-DD format
   * @param {string} options.endDate - End date in YYYY-MM-DD format
   * @param {number} options.limit - Maximum number of results
   * @returns {Promise<Object>} - The Treasury bill rates
   */
  getTreasuryBillRates: async (options = {}) => {
    try {
      const response = await apiClient.get('/economic-data/treasury/treasury_bills', {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Treasury bill rates:', error);
      throw error;
    }
  }
};

// BLS API service
const blsApi = {
  /**
   * Get CPI data from BLS
   * @param {number} startYear - Start year (YYYY)
   * @param {number} endYear - End year (YYYY)
   * @returns {Promise<Object>} - The CPI data
   */
  getCPIData: async (startYear, endYear) => {
    try {
      const response = await apiClient.get('/economic-data/bls/cpi', {
        params: { startYear, endYear }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching BLS CPI data:', error);
      throw error;
    }
  },

  /**
   * Get unemployment data from BLS
   * @param {number} startYear - Start year (YYYY)
   * @param {number} endYear - End year (YYYY)
   * @returns {Promise<Object>} - The unemployment data
   */
  getUnemploymentData: async (startYear, endYear) => {
    try {
      const response = await apiClient.get('/economic-data/bls/unemployment', {
        params: { startYear, endYear }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching BLS unemployment data:', error);
      throw error;
    }
  },

  /**
   * Get employment data from BLS
   * @param {number} startYear - Start year (YYYY)
   * @param {number} endYear - End year (YYYY)
   * @returns {Promise<Object>} - The employment data
   */
  getEmploymentData: async (startYear, endYear) => {
    try {
      const response = await apiClient.get('/economic-data/bls/employment', {
        params: { startYear, endYear }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching BLS employment data:', error);
      throw error;
    }
  },

  /**
   * Get custom BLS data
   * @param {string[]} seriesIds - Array of BLS series IDs
   * @param {number} startYear - Start year (YYYY)
   * @param {number} endYear - End year (YYYY)
   * @returns {Promise<Object>} - The BLS data
   */
  getCustomData: async (seriesIds, startYear, endYear) => {
    try {
      const response = await apiClient.get('/economic-data/bls/custom', {
        params: { seriesIds: seriesIds.join(','), startYear, endYear }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching custom BLS data:', error);
      throw error;
    }
  }
};

// User data API service
const userApi = {
  /**
   * Get user's watchlist
   * @returns {Promise<Array>} - The watchlist items
   */
  getWatchlist: async () => {
    try {
      const response = await apiClient.get('/user/watchlist');
      return response.data;
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }
  },

  /**
   * Add item to watchlist
   * @param {Object} item - The item to add
   * @param {string} item.source - Data source (fred, treasury, bls)
   * @param {string} item.seriesId - Series ID
   * @param {string} item.label - Custom label
   * @returns {Promise<Object>} - The added item
   */
  addToWatchlist: async (item) => {
    try {
      const response = await apiClient.post('/user/watchlist', item);
      return response.data;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  },

  /**
   * Remove item from watchlist
   * @param {string} id - Item ID
   * @returns {Promise<Object>} - Response data
   */
  removeFromWatchlist: async (id) => {
    try {
      const response = await apiClient.delete(`/user/watchlist/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }
};

// ML API service
const mlApi = {
  /**
   * Get signal probability for a pie
   * @param {string} pieId - Pie ID
   * @returns {Promise<Object>} - The signal probability
   */
  getSignal: async (pieId) => {
    try {
      const response = await apiClient.get(`/ml/signal/${pieId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting signal:', error);
      throw error;
    }
  },

  /**
   * Train the ML model
   * @returns {Promise<Object>} - Training result
   */
  trainModel: async () => {
    try {
      const response = await apiClient.post('/ml/train');
      return response.data;
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }
};

// Export all API services
export {
  fredApi,
  treasuryApi,
  blsApi,
  userApi,
  mlApi
};

// Default export for backward compatibility
export default {
  fred: fredApi,
  treasury: treasuryApi,
  bls: blsApi,
  user: userApi,
  ml: mlApi
};
