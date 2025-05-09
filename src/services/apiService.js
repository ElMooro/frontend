import axios from 'axios';

// Create axios instance for consistent configuration
const api = axios.create({
  baseURL: '/',  // This will use the current domain as base URL
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// API Services for Economic Data
const apiService = {
  // FRED API (Federal Reserve Economic Data)
  fred: {
    // Get economic series data
    getSeries: async (seriesId) => {
      try {
        const response = await api.get(`/fred/series/observations?series_id=${seriesId}&file_type=json`);
        return response.data;
      } catch (error) {
        console.error('Error fetching FRED data:', error);
        throw error;
      }
    },
    // Get GDP data
    getGDP: async () => {
      try {
        const response = await api.get('/fred/series/observations?series_id=GDP&file_type=json');
        return response.data;
      } catch (error) {
        console.error('Error fetching GDP data:', error);
        throw error;
      }
    }
  },

  // BEA API (Bureau of Economic Analysis)
  bea: {
    // Get economic data
    getData: async (datasetName, method, params) => {
      try {
        const queryParams = new URLSearchParams({
          datasetname: datasetName,
          method: method,
          ...params
        }).toString();
        
        const response = await api.get(`/bea?${queryParams}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching BEA data:', error);
        throw error;
      }
    }
  },

  // Census API
  census: {
    // Get population data
    getPopulation: async (year, state) => {
      try {
        const response = await api.get(`/census/${year}/pep/population?for=state:${state}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching Census data:', error);
        throw error;
      }
    }
  },

  // BLS API (Bureau of Labor Statistics)
  bls: {
    // Get unemployment data
    getUnemployment: async (seriesId, startYear, endYear) => {
      try {
        const requestData = {
          seriesid: [seriesId],
          startyear: startYear,
          endyear: endYear
        };
        
        const response = await api.post('/bls/timeseries/data/', requestData);
        return response.data;
      } catch (error) {
        console.error('Error fetching BLS data:', error);
        throw error;
      }
    }
  },

  // ECB API (European Central Bank)
  ecb: {
    // Get exchange rates
    getExchangeRates: async () => {
      try {
        const response = await api.get('/ecb/data/EXR/D.USD.EUR.SP00.A');
        return response.data;
      } catch (error) {
        console.error('Error fetching ECB data:', error);
        throw error;
      }
    }
  },

  // NY Fed API
  nyFed: {
    // Get SOFR rates
    getSOFR: async () => {
      try {
        const response = await api.get('/nyfed/rates/sofr');
        return response.data;
      } catch (error) {
        console.error('Error fetching NY Fed data:', error);
        throw error;
      }
    }
  },

  // Treasury API
  treasury: {
    // Get treasury rates
    getTreasuryRates: async () => {
      try {
        const response = await api.get('/treasury/securities/auctioned');
        return response.data;
      } catch (error) {
        console.error('Error fetching Treasury data:', error);
        throw error;
      }
    }
  }
};

export default apiService;
