# Economic Data API Integration Platform

## Overview

This platform integrates with major economic and financial data APIs, providing a unified access point to comprehensive economic data. All APIs are pre-configured and ready to use with valid API keys.

## Integrated APIs

### Federal Reserve (FRED)
- **GDP Data**: Access quarterly GDP figures
- **Latest Value**: $29,977.632 billion (Q1 2025)
- **Example**: node test-fred-api.js

### Bureau of Economic Analysis (BEA)
- **NIPA Tables**: National Income and Product Accounts
- **GDP Growth Rates**: Quarterly percentage changes
- **Example**: node test_bea_api.sh

### Census Bureau
- **Population Data**: State and national demographics
- **California Population**: 39,237,836 (2021)
- **Example**: See Census API section in test_all_economic_apis.js

### Bureau of Labor Statistics (BLS)
- **Unemployment Rate**: Monthly national figures
- **Latest Rate**: 4.2% (April 2025)
- **Example**: node test_bls_api.sh

### European Central Bank (ECB)
- **Exchange Rates**: EUR/USD and other currency pairs
- **Example**: node check-ecb-api-health.js

### New York Federal Reserve (NY Fed)
- **SOFR Rate**: Secured Overnight Financing Rate
- **Latest Rate**: 4.29% (May 8, 2025)
- **Example**: node test-nyfed-api.js

### US Treasury
- **Interest Rates**: Average rates on Treasury securities
- **Treasury Auctions**: Results of recent auctions
- **Buyback Operations**: Treasury securities buybacks
- **Examples**:
  - node test-avg-rates.js
  - node test-record-auctions.js
  - node test-treasury-buybacks-v1.js

## Getting Started

1. **Install Dependencies**
   Run: npm install

2. **Test API Connections**
   Run: node test_all_economic_apis.js

3. **Use in Your Application**
   Import the configured clients and use them in your code:
   
   // Import the configured clients
   const { fred, bea, census, bls, treasury, nyFed, ecb } = require('./path/to/index');

   // Example: Get latest GDP data
   async function getLatestGDP() {
     const gdpData = await fred.getObservations('GDP', { 
       sort_order: 'desc', 
       limit: 1 
     });
     return gdpData.observations[0].value;
   }

## API Documentation

### FRED API
- Base URL: https://api.stlouisfed.org/fred
- Key Data: GDP, Inflation, Interest Rates, Employment
- Usage: fred.getSeries(seriesId) or fred.getObservations(seriesId, options)

### Treasury API
- Base URL: https://api.fiscaldata.treasury.gov/services/api/fiscal_service
- Key Data: Interest Rates, Auctions, Buybacks
- Usage: treasury.getAverageInterestRates() or treasury.getBuybacksOperations()

### BLS API
- Base URL: https://api.bls.gov/publicAPI/v2/timeseries/data
- Key Data: Unemployment, Labor Force, CPI
- Usage: bls.getUnemploymentRate()

## Restoring Working State

If you need to revert to a known working state:
Run: git checkout all-apis-working-v1.0

## Troubleshooting

If you encounter API connection issues:
1. Verify API keys are correct in .env file
2. Check network connectivity
3. Confirm API endpoints are available
4. Verify API rate limits haven't been exceeded

## Examples

Check the /examples directory for sample code showing how to use each API.

## Working Reference Setup

Commit `c3604600bd7b6f3a2c2fd38a6e941d4ed7807d96` contains a fully working configuration with all economic APIs connected (FRED, BEA, Census, BLS, ECB, NY Fed, Treasury). Use this as a reference point by running:

```bash
git checkout c3604600bd7b6f3a2c2fd38a6e941d4ed7807d96
```

Or restore these files:
- server.js
- src/setupProxy.js
- src/services/apiService.js
- .devcontainer/devcontainer.json

