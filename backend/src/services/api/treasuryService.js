const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';

/**
 * Service for interacting with the US Treasury API
 */
const treasuryService = {
  /**
   * Get debt data from the Treasury API
   * @param {Object} options - Options for the request
   * @param {string} options.startDate - Start date in YYYY-MM-DD format
   * @param {string} options.endDate - End date in YYYY-MM-DD format
   * @param {number} options.limit - Maximum number of results to return
   * @returns {Promise<Object>} - The debt data
   */
  async getDebtData(options = {}) {
    try {
      const response = await axios.get(`${BASE_URL}/v2/accounting/od/debt_to_penny`, {
        params: {
          filter: options.startDate ? `record_date:gte:${options.startDate}` : undefined,
          sort: '-record_date',
          'page[size]': options.limit || 100,
          format: 'json'
        }
      });
      
      return {
        type: 'debt',
        data: response.data.data.map(item => ({
          date: item.record_date,
          value: parseFloat(item.debt_held_public_amt) + parseFloat(item.intragov_hold_amt),
          debtHeldByPublic: parseFloat(item.debt_held_public_amt),
          intragovernmentalHoldings: parseFloat(item.intragov_hold_amt)
        }))
      };
    } catch (error) {
      console.error('Error fetching Treasury debt data:', error.message);
      throw new Error(`Failed to fetch Treasury debt data: ${error.message}`);
    }
  },

  /**
   * Get Treasury yield curve data
   * @param {Object} options - Options for the request
   * @param {string} options.startDate - Start date in YYYY-MM-DD format
   * @param {string} options.endDate - End date in YYYY-MM-DD format
   * @param {number} options.limit - Maximum number of results to return
   * @returns {Promise<Object>} - The yield curve data
   */
  async getYieldCurveData(options = {}) {
    try {
      const response = await axios.get(`${BASE_URL}/v1/accounting/od/yield_curve_rates`, {
        params: {
          filter: options.startDate ? `record_date:gte:${options.startDate}` : undefined,
          sort: '-record_date',
          'page[size]': options.limit || 100,
          format: 'json'
        }
      });
      
      return {
        type: 'yieldCurve',
        data: response.data.data.map(item => {
          const result = { date: item.record_date };
          
          // Add all available maturities
          if (item['1_month'] !== null) result.month1 = parseFloat(item['1_month']);
          if (item['2_month'] !== null) result.month2 = parseFloat(item['2_month']);
          if (item['3_month'] !== null) result.month3 = parseFloat(item['3_month']);
          if (item['6_month'] !== null) result.month6 = parseFloat(item['6_month']);
          if (item['1_year'] !== null) result.year1 = parseFloat(item['1_year']);
          if (item['2_year'] !== null) result.year2 = parseFloat(item['2_year']);
          if (item['3_year'] !== null) result.year3 = parseFloat(item['3_year']);
          if (item['5_year'] !== null) result.year5 = parseFloat(item['5_year']);
          if (item['7_year'] !== null) result.year7 = parseFloat(item['7_year']);
          if (item['10_year'] !== null) result.year10 = parseFloat(item['10_year']);
          if (item['20_year'] !== null) result.year20 = parseFloat(item['20_year']);
          if (item['30_year'] !== null) result.year30 = parseFloat(item['30_year']);
          
          return result;
        })
      };
    } catch (error) {
      console.error('Error fetching Treasury yield curve data:', error.message);
      throw new Error(`Failed to fetch Treasury yield curve data: ${error.message}`);
    }
  },

  /**
   * Get Treasury bill rates
   * @param {Object} options - Options for the request
   * @param {string} options.startDate - Start date in YYYY-MM-DD format
   * @param {string} options.endDate - End date in YYYY-MM-DD format
   * @param {number} options.limit - Maximum number of results to return
   * @returns {Promise<Object>} - The Treasury bill rates
   */
  async getTreasuryBillRates(options = {}) {
    try {
      const response = await axios.get(`${BASE_URL}/v1/accounting/od/avg_interest_rates`, {
        params: {
          filter: `security_type_desc:eq:Treasury Bills,${options.startDate ? `record_date:gte:${options.startDate}` : ''}`,
          sort: '-record_date',
          'page[size]': options.limit || 100,
          format: 'json'
        }
      });
      
      return {
        type: 'treasuryBills',
        data: response.data.data.map(item => ({
          date: item.record_date,
          rate: parseFloat(item.avg_interest_rate_amt),
          securityDesc: item.security_desc
        }))
      };
    } catch (error) {
      console.error('Error fetching Treasury bill rates:', error.message);
      throw new Error(`Failed to fetch Treasury bill rates: ${error.message}`);
    }
  }
};

module.exports = treasuryService;
