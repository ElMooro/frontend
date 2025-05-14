/**
 * Configuration for data sources
 * Controls whether to use real API data or mock data based on environment
 */

const dotenv = require('dotenv');
dotenv.config();

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';
const FALLBACK_TO_MOCK = process.env.FALLBACK_TO_MOCK === 'true';

// Configuration object
const dataSourceConfig = {
  // Global setting - can be overridden by individual services
  useMockData: NODE_ENV === 'development' && USE_MOCK_DATA,
  
  // Fallback setting - whether to use mock data as fallback when API calls fail
  fallbackToMock: FALLBACK_TO_MOCK || NODE_ENV === 'development',
  
  // Service-specific settings
  services: {
    fred: {
      useMockData: NODE_ENV === 'development' && USE_MOCK_DATA,
      mockDataPath: '../data/mock/fred',
      apiKey: process.env.FRED_API_KEY,
      fallbackToMock: FALLBACK_TO_MOCK || NODE_ENV === 'development'
    },
    treasury: {
      useMockData: NODE_ENV === 'development' && USE_MOCK_DATA,
      mockDataPath: '../data/mock/treasury',
      fallbackToMock: FALLBACK_TO_MOCK || NODE_ENV === 'development'
    },
    bls: {
      useMockData: NODE_ENV === 'development' && USE_MOCK_DATA,
      mockDataPath: '../data/mock/bls',
      apiKey: process.env.BLS_API_KEY,
      fallbackToMock: FALLBACK_TO_MOCK || NODE_ENV === 'development'
    },
    bea: {
      useMockData: NODE_ENV === 'development' && USE_MOCK_DATA,
      mockDataPath: '../data/mock/bea',
      apiKey: process.env.BEA_API_KEY,
      fallbackToMock: FALLBACK_TO_MOCK || NODE_ENV === 'development'
    },
    census: {
      useMockData: NODE_ENV === 'development' && USE_MOCK_DATA,
      mockDataPath: '../data/mock/census',
      apiKey: process.env.CENSUS_API_KEY,
      fallbackToMock: FALLBACK_TO_MOCK || NODE_ENV === 'development'
    }
  },
  
  // Environment flags
  isProduction: NODE_ENV === 'production',
  isDevelopment: NODE_ENV === 'development',
  isTest: NODE_ENV === 'test'
};

// In production, force all services to use real data by default
if (dataSourceConfig.isProduction && !USE_MOCK_DATA) {
  dataSourceConfig.useMockData = false;
  Object.keys(dataSourceConfig.services).forEach(service => {
    dataSourceConfig.services[service].useMockData = false;
  });
}

// Log configuration in development
if (dataSourceConfig.isDevelopment) {
  console.log('Data Source Configuration:');
  console.log(`- Environment: ${NODE_ENV}`);
  console.log(`- Using Mock Data: ${dataSourceConfig.useMockData}`);
  console.log(`- Fallback to Mock: ${dataSourceConfig.fallbackToMock}`);
}

module.exports = dataSourceConfig;