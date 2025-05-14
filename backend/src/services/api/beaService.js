const axios = require('axios');
const dotenv = require('dotenv');
const logger = require('../../utils/logger');

dotenv.config();

const BEA_API_KEY = process.env.BEA_API_KEY;
const BASE_URL = 'https://apps.bea.gov/api/data';

// Check if BEA API key is configured
if (!BEA_API_KEY) {
  logger.warn('BEA API key is not configured. BEA data will not be available.');
}

/**
 * Service for interacting with the Bureau of Economic Analysis (BEA) API
 */
const beaService = {
  /**
   * Get GDP data from the BEA API
   * @param {Object} options - Options for the request
   * @param {string} options.frequency - Data frequency (A: Annual, Q: Quarterly, M: Monthly)
   * @param {number} options.year - Year for annual data
   * @param {number} options.quarter - Quarter for quarterly data (1-4)
   * @param {number} options.firstYear - First year for range of years
   * @param {number} options.lastYear - Last year for range of years
   * @returns {Promise<Object>} - The GDP data
   */
  async getGDPData(options = {}) {
    try {
      // Set default parameters
      const params = {
        UserID: BEA_API_KEY,
        method: 'GetData',
        datasetname: 'NIPA',
        TableName: 'T10101',  // GDP and related data
        Frequency: options.frequency || 'Q',  // Default to quarterly
        Year: options.year || 'X',  // 'X' means all years
        Quarter: options.quarter || 'X',  // 'X' means all quarters
        FirstYear: options.firstYear || null,
        LastYear: options.lastYear || null,
        ResultFormat: 'JSON'
      };

      // Remove null parameters
      Object.keys(params).forEach(key => {
        if (params[key] === null) {
          delete params[key];
        }
      });

      const response = await axios.get(BASE_URL, { params });
      
      // Check for API errors
      if (response.data.BEAAPI.Results && response.data.BEAAPI.Results.Error) {
        throw new Error(`BEA API error: ${response.data.BEAAPI.Results.Error.APIErrorDescription}`);
      }

      // Process the data
      const data = response.data.BEAAPI.Results.Data;
      
      // Transform the data into a more usable format
      const transformedData = this._transformGDPData(data);
      
      return {
        type: 'gdp',
        data: transformedData
      };
    } catch (error) {
      console.error('Error fetching BEA GDP data:', error.message);
      throw new Error(`Failed to fetch BEA GDP data: ${error.message}`);
    }
  },

  /**
   * Get Personal Income data from the BEA API
   * @param {Object} options - Options for the request
   * @param {string} options.frequency - Data frequency (A: Annual, Q: Quarterly, M: Monthly)
   * @param {number} options.year - Year for annual data
   * @param {number} options.quarter - Quarter for quarterly data (1-4)
   * @param {number} options.firstYear - First year for range of years
   * @param {number} options.lastYear - Last year for range of years
   * @returns {Promise<Object>} - The Personal Income data
   */
  async getPersonalIncomeData(options = {}) {
    try {
      // Set default parameters
      const params = {
        UserID: BEA_API_KEY,
        method: 'GetData',
        datasetname: 'NIPA',
        TableName: 'T20100',  // Personal Income and Its Disposition
        Frequency: options.frequency || 'Q',  // Default to quarterly
        Year: options.year || 'X',  // 'X' means all years
        Quarter: options.quarter || 'X',  // 'X' means all quarters
        FirstYear: options.firstYear || null,
        LastYear: options.lastYear || null,
        ResultFormat: 'JSON'
      };

      // Remove null parameters
      Object.keys(params).forEach(key => {
        if (params[key] === null) {
          delete params[key];
        }
      });

      const response = await axios.get(BASE_URL, { params });
      
      // Check for API errors
      if (response.data.BEAAPI.Results && response.data.BEAAPI.Results.Error) {
        throw new Error(`BEA API error: ${response.data.BEAAPI.Results.Error.APIErrorDescription}`);
      }

      // Process the data
      const data = response.data.BEAAPI.Results.Data;
      
      // Transform the data into a more usable format
      const transformedData = this._transformPersonalIncomeData(data);
      
      return {
        type: 'personalIncome',
        data: transformedData
      };
    } catch (error) {
      console.error('Error fetching BEA Personal Income data:', error.message);
      throw new Error(`Failed to fetch BEA Personal Income data: ${error.message}`);
    }
  },

  /**
   * Get International Trade data from the BEA API
   * @param {Object} options - Options for the request
   * @param {string} options.frequency - Data frequency (A: Annual, Q: Quarterly, M: Monthly)
   * @param {string} options.direction - Trade direction (exports, imports, or both)
   * @param {number} options.year - Year for annual data
   * @param {number} options.firstYear - First year for range of years
   * @param {number} options.lastYear - Last year for range of years
   * @returns {Promise<Object>} - The International Trade data
   */
  async getInternationalTradeData(options = {}) {
    try {
      // Set default parameters
      const params = {
        UserID: BEA_API_KEY,
        method: 'GetData',
        datasetname: 'ITA',  // International Transactions Accounts
        TableName: options.direction === 'exports' ? 'T10' : 
                   options.direction === 'imports' ? 'T11' : 'T1',
        Frequency: options.frequency || 'A',  // Default to annual
        Year: options.year || 'X',  // 'X' means all years
        FirstYear: options.firstYear || null,
        LastYear: options.lastYear || null,
        ResultFormat: 'JSON'
      };

      // Remove null parameters
      Object.keys(params).forEach(key => {
        if (params[key] === null) {
          delete params[key];
        }
      });

      const response = await axios.get(BASE_URL, { params });
      
      // Check for API errors
      if (response.data.BEAAPI.Results && response.data.BEAAPI.Results.Error) {
        throw new Error(`BEA API error: ${response.data.BEAAPI.Results.Error.APIErrorDescription}`);
      }

      // Process the data
      const data = response.data.BEAAPI.Results.Data;
      
      // Transform the data into a more usable format
      const transformedData = this._transformTradeData(data);
      
      return {
        type: 'internationalTrade',
        direction: options.direction || 'both',
        data: transformedData
      };
    } catch (error) {
      console.error('Error fetching BEA International Trade data:', error.message);
      throw new Error(`Failed to fetch BEA International Trade data: ${error.message}`);
    }
  },

  /**
   * Transform GDP data into a more usable format
   * @param {Array} data - Raw data from the BEA API
   * @returns {Array} - Transformed data
   * @private
   */
  _transformGDPData(data) {
    // Group data by time period
    const groupedData = {};
    
    data.forEach(item => {
      const period = this._createDateFromBEAPeriod(item.TimePeriod);
      
      if (!groupedData[period]) {
        groupedData[period] = {
          date: period,
          gdp: null,
          realGdp: null,
          gdpGrowth: null,
          realGdpGrowth: null
        };
      }
      
      // Map line numbers to our data structure
      // Line 1 is GDP
      if (item.LineNumber === '1' && item.SeriesCode === 'A') {
        groupedData[period].gdp = parseFloat(item.DataValue);
      }
      // Line 1 is Real GDP
      else if (item.LineNumber === '1' && item.SeriesCode === 'Q') {
        groupedData[period].realGdp = parseFloat(item.DataValue);
      }
      // Line 1 is GDP % change
      else if (item.LineNumber === '1' && item.SeriesCode === 'A%') {
        groupedData[period].gdpGrowth = parseFloat(item.DataValue);
      }
      // Line 1 is Real GDP % change
      else if (item.LineNumber === '1' && item.SeriesCode === 'Q%') {
        groupedData[period].realGdpGrowth = parseFloat(item.DataValue);
      }
    });
    
    // Convert the grouped data object to an array and sort by date
    return Object.values(groupedData).sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  /**
   * Transform Personal Income data into a more usable format
   * @param {Array} data - Raw data from the BEA API
   * @returns {Array} - Transformed data
   * @private
   */
  _transformPersonalIncomeData(data) {
    // Group data by time period
    const groupedData = {};
    
    data.forEach(item => {
      const period = this._createDateFromBEAPeriod(item.TimePeriod);
      
      if (!groupedData[period]) {
        groupedData[period] = {
          date: period,
          personalIncome: null,
          disposablePersonalIncome: null,
          personalSaving: null,
          personalSavingRate: null
        };
      }
      
      // Map line numbers to our data structure
      // Line 1 is Personal Income
      if (item.LineNumber === '1') {
        groupedData[period].personalIncome = parseFloat(item.DataValue);
      }
      // Line 2 is Disposable Personal Income
      else if (item.LineNumber === '10') {
        groupedData[period].disposablePersonalIncome = parseFloat(item.DataValue);
      }
      // Line 13 is Personal Saving
      else if (item.LineNumber === '13') {
        groupedData[period].personalSaving = parseFloat(item.DataValue);
      }
      // Line 14 is Personal Saving Rate
      else if (item.LineNumber === '14') {
        groupedData[period].personalSavingRate = parseFloat(item.DataValue);
      }
    });
    
    // Convert the grouped data object to an array and sort by date
    return Object.values(groupedData).sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  /**
   * Transform International Trade data into a more usable format
   * @param {Array} data - Raw data from the BEA API
   * @returns {Array} - Transformed data
   * @private
   */
  _transformTradeData(data) {
    // Group data by time period
    const groupedData = {};
    
    data.forEach(item => {
      const period = this._createDateFromBEAPeriod(item.TimePeriod);
      
      if (!groupedData[period]) {
        groupedData[period] = {
          date: period,
          exports: null,
          imports: null,
          balance: null
        };
      }
      
      // Map indicators to our data structure based on the table and line descriptions
      if (item.Indicator && item.Indicator.includes('Exports')) {
        groupedData[period].exports = parseFloat(item.DataValue);
      }
      else if (item.Indicator && item.Indicator.includes('Imports')) {
        groupedData[period].imports = parseFloat(item.DataValue);
      }
      else if (item.Indicator && item.Indicator.includes('Balance')) {
        groupedData[period].balance = parseFloat(item.DataValue);
      }
    });
    
    // Convert the grouped data object to an array and sort by date
    return Object.values(groupedData).sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  /**
   * Create a date string from a BEA time period
   * @param {string} period - BEA time period (e.g., "2023Q1", "2023")
   * @returns {string} - Date in YYYY-MM-DD format
   * @private
   */
  _createDateFromBEAPeriod(period) {
    // Handle quarterly data (e.g., "2023Q1")
    if (period.includes('Q')) {
      const year = period.substring(0, 4);
      const quarter = period.substring(5, 6);
      // Convert quarter to month (Q1->01, Q2->04, Q3->07, Q4->10)
      const month = (parseInt(quarter) - 1) * 3 + 1;
      return `${year}-${month.toString().padStart(2, '0')}-01`;
    }
    
    // Handle annual data (e.g., "2023")
    if (period.length === 4) {
      return `${period}-01-01`;
    }
    
    // Handle monthly data (e.g., "2023M01")
    if (period.includes('M')) {
      const year = period.substring(0, 4);
      const month = period.substring(5, 7);
      return `${year}-${month}-01`;
    }
    
    // Default case
    return period;
  }
};

module.exports = beaService;