const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
const BASE_URL = 'https://api.census.gov/data';

/**
 * Service for interacting with the US Census Bureau API
 */
const censusService = {
  /**
   * Get population data from the Census API
   * @param {Object} options - Options for the request
   * @param {string} options.year - Year for the data (e.g., "2020")
   * @param {string} options.dataset - Census dataset (e.g., "pep/population", "acs/acs1")
   * @param {string} options.variables - Variables to retrieve (comma-separated)
   * @param {string} options.geoLevel - Geographic level (e.g., "us", "state", "county")
   * @param {string} options.geoIds - Geographic IDs to filter by (comma-separated)
   * @returns {Promise<Object>} - The population data
   */
  async getPopulationData(options = {}) {
    try {
      // Set default parameters
      const year = options.year || new Date().getFullYear() - 1; // Default to previous year
      const dataset = options.dataset || 'pep/population';
      const variables = options.variables || 'POP,NAME';
      const geoLevel = options.geoLevel || 'us';
      const geoIds = options.geoIds || '*';
      
      // Construct the URL
      const url = `${BASE_URL}/${year}/${dataset}?get=${variables}&for=${geoLevel}:${geoIds}&key=${CENSUS_API_KEY}`;
      
      const response = await axios.get(url);
      
      // Process the data
      const headers = response.data[0];
      const rows = response.data.slice(1);
      
      // Transform the data into a more usable format
      const transformedData = rows.map(row => {
        const item = {};
        headers.forEach((header, index) => {
          // Try to convert numeric values
          const value = row[index];
          item[header] = isNaN(value) ? value : parseFloat(value);
        });
        return item;
      });
      
      return {
        type: 'population',
        data: transformedData
      };
    } catch (error) {
      console.error('Error fetching Census population data:', error.message);
      throw new Error(`Failed to fetch Census population data: ${error.message}`);
    }
  },

  /**
   * Get economic indicators from the Census API
   * @param {Object} options - Options for the request
   * @param {string} options.year - Year for the data (e.g., "2020")
   * @param {string} options.dataset - Census dataset (e.g., "ecnbasic", "cbp")
   * @param {string} options.variables - Variables to retrieve (comma-separated)
   * @param {string} options.geoLevel - Geographic level (e.g., "us", "state", "county")
   * @param {string} options.geoIds - Geographic IDs to filter by (comma-separated)
   * @returns {Promise<Object>} - The economic indicator data
   */
  async getEconomicIndicators(options = {}) {
    try {
      // Set default parameters
      const year = options.year || new Date().getFullYear() - 2; // Default to 2 years ago (census data lag)
      const dataset = options.dataset || 'cbp'; // County Business Patterns
      const variables = options.variables || 'ESTAB,PAYANN,EMPL,NAME';
      const geoLevel = options.geoLevel || 'us';
      const geoIds = options.geoIds || '*';
      
      // Construct the URL
      const url = `${BASE_URL}/${year}/${dataset}?get=${variables}&for=${geoLevel}:${geoIds}&key=${CENSUS_API_KEY}`;
      
      const response = await axios.get(url);
      
      // Process the data
      const headers = response.data[0];
      const rows = response.data.slice(1);
      
      // Transform the data into a more usable format
      const transformedData = rows.map(row => {
        const item = {};
        headers.forEach((header, index) => {
          // Try to convert numeric values
          const value = row[index];
          item[header] = isNaN(value) ? value : parseFloat(value);
        });
        return item;
      });
      
      return {
        type: 'economicIndicators',
        data: transformedData
      };
    } catch (error) {
      console.error('Error fetching Census economic indicators:', error.message);
      throw new Error(`Failed to fetch Census economic indicators: ${error.message}`);
    }
  },

  /**
   * Get housing data from the Census API
   * @param {Object} options - Options for the request
   * @param {string} options.year - Year for the data (e.g., "2020")
   * @param {string} options.dataset - Census dataset (e.g., "acs/acs1", "acs/acs5")
   * @param {string} options.variables - Variables to retrieve (comma-separated)
   * @param {string} options.geoLevel - Geographic level (e.g., "us", "state", "county")
   * @param {string} options.geoIds - Geographic IDs to filter by (comma-separated)
   * @returns {Promise<Object>} - The housing data
   */
  async getHousingData(options = {}) {
    try {
      // Set default parameters
      const year = options.year || new Date().getFullYear() - 1; // Default to previous year
      const dataset = options.dataset || 'acs/acs1';
      // Common housing variables: 
      // B25077_001E (Median home value)
      // B25064_001E (Median gross rent)
      // B25002_001E (Total housing units)
      // B25002_002E (Occupied housing units)
      // B25002_003E (Vacant housing units)
      const variables = options.variables || 'B25077_001E,B25064_001E,B25002_001E,B25002_002E,B25002_003E,NAME';
      const geoLevel = options.geoLevel || 'us';
      const geoIds = options.geoIds || '*';
      
      // Construct the URL
      const url = `${BASE_URL}/${year}/${dataset}?get=${variables}&for=${geoLevel}:${geoIds}&key=${CENSUS_API_KEY}`;
      
      const response = await axios.get(url);
      
      // Process the data
      const headers = response.data[0];
      const rows = response.data.slice(1);
      
      // Transform the data into a more usable format with readable names
      const transformedData = rows.map(row => {
        const item = {
          name: row[headers.indexOf('NAME')],
          date: `${year}-01-01` // Use January 1st of the year as the date
        };
        
        // Map census variable codes to readable names
        headers.forEach((header, index) => {
          if (header === 'B25077_001E') {
            item.medianHomeValue = parseFloat(row[index]);
          } else if (header === 'B25064_001E') {
            item.medianRent = parseFloat(row[index]);
          } else if (header === 'B25002_001E') {
            item.totalHousingUnits = parseFloat(row[index]);
          } else if (header === 'B25002_002E') {
            item.occupiedHousingUnits = parseFloat(row[index]);
          } else if (header === 'B25002_003E') {
            item.vacantHousingUnits = parseFloat(row[index]);
          } else if (header.includes('state') || header.includes('county') || header.includes('tract')) {
            item[header] = row[index];
          }
        });
        
        // Calculate vacancy rate
        if (item.totalHousingUnits && item.vacantHousingUnits) {
          item.vacancyRate = (item.vacantHousingUnits / item.totalHousingUnits) * 100;
        }
        
        return item;
      });
      
      return {
        type: 'housing',
        data: transformedData
      };
    } catch (error) {
      console.error('Error fetching Census housing data:', error.message);
      throw new Error(`Failed to fetch Census housing data: ${error.message}`);
    }
  },

  /**
   * Get income data from the Census API
   * @param {Object} options - Options for the request
   * @param {string} options.year - Year for the data (e.g., "2020")
   * @param {string} options.dataset - Census dataset (e.g., "acs/acs1", "acs/acs5")
   * @param {string} options.geoLevel - Geographic level (e.g., "us", "state", "county")
   * @param {string} options.geoIds - Geographic IDs to filter by (comma-separated)
   * @returns {Promise<Object>} - The income data
   */
  async getIncomeData(options = {}) {
    try {
      // Set default parameters
      const year = options.year || new Date().getFullYear() - 1; // Default to previous year
      const dataset = options.dataset || 'acs/acs1';
      // Common income variables:
      // B19013_001E (Median household income)
      // B19301_001E (Per capita income)
      // B19083_001E (Gini Index of Income Inequality)
      const variables = 'B19013_001E,B19301_001E,B19083_001E,NAME';
      const geoLevel = options.geoLevel || 'us';
      const geoIds = options.geoIds || '*';
      
      // Construct the URL
      const url = `${BASE_URL}/${year}/${dataset}?get=${variables}&for=${geoLevel}:${geoIds}&key=${CENSUS_API_KEY}`;
      
      const response = await axios.get(url);
      
      // Process the data
      const headers = response.data[0];
      const rows = response.data.slice(1);
      
      // Transform the data into a more usable format with readable names
      const transformedData = rows.map(row => {
        const item = {
          name: row[headers.indexOf('NAME')],
          date: `${year}-01-01` // Use January 1st of the year as the date
        };
        
        // Map census variable codes to readable names
        headers.forEach((header, index) => {
          if (header === 'B19013_001E') {
            item.medianHouseholdIncome = parseFloat(row[index]);
          } else if (header === 'B19301_001E') {
            item.perCapitaIncome = parseFloat(row[index]);
          } else if (header === 'B19083_001E') {
            item.giniIndex = parseFloat(row[index]);
          } else if (header.includes('state') || header.includes('county') || header.includes('tract')) {
            item[header] = row[index];
          }
        });
        
        return item;
      });
      
      return {
        type: 'income',
        data: transformedData
      };
    } catch (error) {
      console.error('Error fetching Census income data:', error.message);
      throw new Error(`Failed to fetch Census income data: ${error.message}`);
    }
  }
};

module.exports = censusService;