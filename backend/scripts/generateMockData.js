/**
 * Script to generate mock data for development and testing
 * Run with: node scripts/generateMockData.js
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const MOCK_DATA_DIR = path.resolve(__dirname, '../src/data/mock');
const SERVICES = ['fred', 'treasury', 'bls', 'bea', 'census'];

// Common economic indicators to generate mock data for
const INDICATORS = {
  fred: ['GDP', 'UNRATE', 'CPIAUCSL', 'FEDFUNDS', 'INDPRO', 'HOUST', 'PCE', 'RSAFS'],
  treasury: ['yield_curve', 'daily_treasury_rates', 'monthly_statement'],
  bls: ['LAUCN040010000000005', 'CUUR0000SA0', 'LNS14000000'],
  bea: ['gdp', 'personal_income', 'international_trade'],
  census: ['population', 'housing', 'income', 'economic_indicators']
};

/**
 * Generate random time series data
 * @param {string} indicator - Indicator name
 * @param {Object} options - Options for data generation
 * @returns {Object} - Generated data
 */
function generateTimeSeriesData(indicator, options = {}) {
  const numPoints = options.numPoints || 20;
  const frequency = options.frequency || 'Monthly';
  const startDate = new Date();
  const data = [];
  
  // Generate random time series data with realistic patterns
  let baseValue = 100 + Math.random() * 900;
  let trend = 0.005 - Math.random() * 0.01; // Random trend between -0.5% and +0.5%
  
  for (let i = 0; i < numPoints; i++) {
    const date = new Date(startDate);
    
    // Adjust date based on frequency
    if (frequency === 'Daily') {
      date.setDate(date.getDate() - i);
    } else if (frequency === 'Weekly') {
      date.setDate(date.getDate() - (i * 7));
    } else if (frequency === 'Monthly') {
      date.setMonth(date.getMonth() - i);
    } else if (frequency === 'Quarterly') {
      date.setMonth(date.getMonth() - (i * 3));
    } else if (frequency === 'Annually') {
      date.setFullYear(date.getFullYear() - i);
    }
    
    // Add some randomness but maintain a trend
    const randomFactor = 0.98 + Math.random() * 0.04;
    const trendFactor = 1 + trend;
    baseValue = baseValue * randomFactor * trendFactor;
    
    // Add seasonal patterns for some indicators
    if (['UNRATE', 'HOUST', 'RSAFS'].includes(indicator)) {
      const month = date.getMonth();
      // Add seasonal variation (higher unemployment in winter, higher retail in December)
      if (indicator === 'UNRATE' && (month === 0 || month === 1)) {
        baseValue *= 1.02; // Higher unemployment in January/February
      } else if (indicator === 'RSAFS' && month === 11) {
        baseValue *= 1.15; // Higher retail sales in December
      } else if (indicator === 'HOUST' && (month >= 4 && month <= 8)) {
        baseValue *= 1.08; // Higher housing starts in summer
      }
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: parseFloat(baseValue.toFixed(2))
    });
  }
  
  // Reverse to get chronological order
  data.reverse();
  
  return {
    success: true,
    seriesId: indicator,
    title: `${indicator} Data`,
    units: getUnits(indicator),
    frequency: frequency,
    data: data
  };
}

/**
 * Get appropriate units for an indicator
 * @param {string} indicator - Indicator name
 * @returns {string} - Units
 */
function getUnits(indicator) {
  const unitsMap = {
    'GDP': 'Billions of Dollars',
    'UNRATE': 'Percent',
    'CPIAUCSL': 'Index 1982-1984=100',
    'FEDFUNDS': 'Percent',
    'INDPRO': 'Index 2017=100',
    'HOUST': 'Thousands of Units',
    'PCE': 'Billions of Dollars',
    'RSAFS': 'Millions of Dollars',
    'yield_curve': 'Percent',
    'daily_treasury_rates': 'Percent',
    'monthly_statement': 'Millions of Dollars',
    'LAUCN040010000000005': 'Percent',
    'CUUR0000SA0': 'Index 1982-1984=100',
    'LNS14000000': 'Percent',
    'gdp': 'Billions of Dollars',
    'personal_income': 'Billions of Dollars',
    'international_trade': 'Millions of Dollars',
    'population': 'Thousands of Persons',
    'housing': 'Thousands of Units',
    'income': 'Dollars',
    'economic_indicators': 'Various'
  };
  
  return unitsMap[indicator] || 'Units';
}

/**
 * Generate mock data for all services and indicators
 */
async function generateAllMockData() {
  try {
    console.log('Generating mock data...');
    
    // Ensure mock data directories exist
    for (const service of SERVICES) {
      const serviceDir = path.join(MOCK_DATA_DIR, service);
      try {
        await fs.mkdir(serviceDir, { recursive: true });
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err;
        }
      }
    }
    
    // Generate mock data for each service and indicator
    for (const service of SERVICES) {
      console.log(`Generating mock data for ${service}...`);
      
      const indicators = INDICATORS[service] || [];
      for (const indicator of indicators) {
        // Generate appropriate data based on service and indicator
        let mockData;
        
        if (service === 'fred') {
          mockData = generateTimeSeriesData(indicator, {
            frequency: indicator === 'GDP' ? 'Quarterly' : 'Monthly',
            numPoints: 30
          });
        } else if (service === 'treasury') {
          if (indicator === 'yield_curve') {
            mockData = generateYieldCurveData();
          } else {
            mockData = generateTimeSeriesData(indicator, {
              frequency: indicator === 'monthly_statement' ? 'Monthly' : 'Daily',
              numPoints: indicator === 'monthly_statement' ? 24 : 90
            });
          }
        } else if (service === 'bls') {
          mockData = generateTimeSeriesData(indicator, {
            frequency: 'Monthly',
            numPoints: 24
          });
        } else if (service === 'bea') {
          mockData = generateTimeSeriesData(indicator, {
            frequency: indicator === 'gdp' ? 'Quarterly' : 'Monthly',
            numPoints: indicator === 'gdp' ? 20 : 30
          });
        } else if (service === 'census') {
          mockData = generateTimeSeriesData(indicator, {
            frequency: indicator === 'population' ? 'Annually' : 'Monthly',
            numPoints: indicator === 'population' ? 10 : 24
          });
        }
        
        // Write mock data to file
        const filePath = path.join(MOCK_DATA_DIR, service, `${indicator.toLowerCase()}.json`);
        await fs.writeFile(filePath, JSON.stringify(mockData, null, 2));
        console.log(`  - Generated ${filePath}`);
      }
    }
    
    // Generate generic mock data for each service
    for (const service of SERVICES) {
      const genericData = generateTimeSeriesData('generic', {
        frequency: 'Monthly',
        numPoints: 24
      });
      
      const filePath = path.join(MOCK_DATA_DIR, service, 'generic.json');
      await fs.writeFile(filePath, JSON.stringify(genericData, null, 2));
      console.log(`  - Generated ${filePath}`);
    }
    
    console.log('Mock data generation completed successfully!');
  } catch (error) {
    console.error('Error generating mock data:', error);
    process.exit(1);
  }
}

/**
 * Generate yield curve data
 * @returns {Object} - Generated yield curve data
 */
function generateYieldCurveData() {
  const dates = [];
  const data = [];
  
  // Generate dates for the last 30 days
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.unshift(date.toISOString().split('T')[0]);
  }
  
  // Define maturities
  const maturities = ['1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y'];
  
  // Base yield curve (roughly based on a normal yield curve)
  const baseYields = {
    '1M': 1.5,
    '3M': 1.6,
    '6M': 1.7,
    '1Y': 1.9,
    '2Y': 2.1,
    '3Y': 2.3,
    '5Y': 2.5,
    '7Y': 2.7,
    '10Y': 2.9,
    '20Y': 3.1,
    '30Y': 3.2
  };
  
  // Generate yield curve data for each date
  for (const date of dates) {
    const dailyData = { date };
    
    // Add random variation to each maturity
    for (const maturity of maturities) {
      const baseYield = baseYields[maturity];
      const randomFactor = 0.95 + Math.random() * 0.1; // Random factor between 0.95 and 1.05
      dailyData[maturity] = parseFloat((baseYield * randomFactor).toFixed(2));
    }
    
    data.push(dailyData);
  }
  
  return {
    success: true,
    title: 'Treasury Yield Curve',
    maturities: maturities,
    data: data
  };
}

// Run the script
generateAllMockData();