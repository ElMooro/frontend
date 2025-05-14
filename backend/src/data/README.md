# Mock Data System

This directory contains mock data for development and testing purposes. The mock data system is designed to provide a seamless development experience without requiring access to external APIs.

## Directory Structure

```
data/
├── mock/
│   ├── fred/
│   │   ├── gdp.json
│   │   ├── unrate.json
│   │   └── ...
│   ├── treasury/
│   │   ├── yield_curve.json
│   │   └── ...
│   ├── bls/
│   ├── bea/
│   └── census/
```

## How It Works

The mock data system works as follows:

1. In development mode, services will use mock data by default if `USE_MOCK_DATA=true` is set in the environment.
2. In production mode, real API data is always used unless explicitly overridden.
3. If a specific mock data file is not found, the system falls back to a generic mock data file.
4. If no mock data is available, the system generates random data in development mode.

## Generating Mock Data

You can generate mock data using the provided script:

```bash
npm run generate-mock-data
```

This will create mock data files for all supported services and indicators.

## Configuration

Mock data usage is controlled by the `dataSourceConfig.js` file in the `config` directory. You can configure:

- Global mock data usage
- Service-specific mock data settings
- Production vs. development behavior

## Adding New Mock Data

To add new mock data:

1. Create a JSON file in the appropriate service directory
2. Name it after the indicator or series ID (lowercase)
3. Follow the same structure as existing mock data files

## Production Deployment

In production:

1. Mock data is included in the Docker image as a fallback mechanism
2. By default, all services use real API data
3. If an API call fails, the system can fall back to mock data if configured to do so

## Environment Variables

- `NODE_ENV`: Set to `production` in production environments
- `USE_MOCK_DATA`: Set to `true` to use mock data in development, `false` in production