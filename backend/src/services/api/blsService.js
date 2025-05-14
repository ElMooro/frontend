const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BLS_API_KEY = process.env.BLS_API_KEY;
const BASE_URL = 'https://api.bls.gov/publicAPI/v2';

/**
 * Service for interacting with the Bureau of Labor Statistics (BLS) API
 */
const blsService = {
  /**
   * Get data from the BLS API
   * @param {string[]} seriesIds - Array of BLS series IDs
   * @param {number} startYear - Start year (YYYY)
   * @param {number} endYear - End year (YYYY)
   * @returns {Promise<Object>} - The BLS data
   */
  async getData(seriesIds, startYear, endYear) {
    try {
      // BLS API has a limit of 50 series per request
      const MAX_SERIES_PER_REQUEST = 50;
      let allResults = {};
      
      // Split series IDs into chunks of MAX_SERIES_PER_REQUEST
      for (let i = 0; i < seriesIds.length; i += MAX_SERIES_PER_REQUEST) {
        const seriesChunk = seriesIds.slice(i, i + MAX_SERIES_PER_REQUEST);
        
        const response = await axios.post(
          `${BASE_URL}/timeseries/data/`, 
          {
            seriesid: seriesChunk,
            startyear: startYear.toString(),
            endyear: endYear.toString(),
            registrationkey: BLS_API_KEY
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Check for API errors
        if (response.data.status !== 'REQUEST_SUCCEEDED') {
          throw new Error(`BLS API error: ${response.data.message}`);
        }
        
        // Process and merge results
        response.data.Results.series.forEach(series => {
          allResults[series.seriesID] = {
            id: series.seriesID,
            data: series.data.map(item => ({
              year: parseInt(item.year),
              period: item.period,
              periodName: item.periodName,
              value: parseFloat(item.value) || null,
              // Convert BLS period format (M01, M02, etc.) to date format
              date: this._convertBLSPeriodToDate(item.year, item.period)
            }))
          };
        });
      }
      
      return allResults;
    } catch (error) {
      console.error('Error fetching BLS data:', error.message);
      throw new Error(`Failed to fetch BLS data: ${error.message}`);
    }
  },
  
  /**
   * Get CPI (Consumer Price Index) data
   * @param {number} startYear - Start year (YYYY)
   * @param {number} endYear - End year (YYYY)
   * @returns {Promise<Object>} - The CPI data
   */
  async getCPIData(startYear, endYear) {
    // CPI for All Urban Consumers (CPI-U)
    const seriesIds = ['CUUR0000SA0']; // All items
    return this.getData(seriesIds, startYear, endYear);
  },
  
  /**
   * Get unemployment rate data
   * @param {number} startYear - Start year (YYYY)
   * @param {number} endYear - End year (YYYY)
   * @returns {Promise<Object>} - The unemployment rate data
   */
  async getUnemploymentData(startYear, endYear) {
    // Unemployment Rate
    const seriesIds = ['LNS14000000']; // Unemployment Rate - 16 years and over
    return this.getData(seriesIds, startYear, endYear);
  },
  
  /**
   * Get employment data
   * @param {number} startYear - Start year (YYYY)
   * @param {number} endYear - End year (YYYY)
   * @returns {Promise<Object>} - The employment data
   */
  async getEmploymentData(startYear, endYear) {
    // Employment data
    const seriesIds = ['CES0000000001']; // All Employees, Total Nonfarm
    return this.getData(seriesIds, startYear, endYear);
  },
  
  /**
   * Convert BLS period format to date
   * @param {string} year - Year (YYYY)
   * @param {string} period - Period in BLS format (M01, M02, etc. or Q01, Q02, etc.)
   * @returns {string} - Date in YYYY-MM-DD format
   * @private
   */
  _convertBLSPeriodToDate(year, period) {
    // Handle monthly data (M01, M02, etc.)
    if (period.startsWith('M')) {
      const month = parseInt(period.substring(1));
      // Return the first day of the month
      return `${year}-${month.toString().padStart(2, '0')}-01`;
    }
    
    // Handle quarterly data (Q01, Q02, etc.)
    if (period.startsWith('Q')) {
      const quarter = parseInt(period.substring(1));
      // Convert quarter to month (Q1->01, Q2->04, Q3->07, Q4->10)
      const month = (quarter - 1) * 3 + 1;
      return `${year}-${month.toString().padStart(2, '0')}-01`;
    }
    
    // Handle annual data (A01)
    if (period.startsWith('A')) {
      return `${year}-01-01`;
    }
    
    // Default case
    return `${year}-01-01`;
  }
};

module.exports = blsService;
