import axios from 'axios';

// API Keys
const API_KEYS = {
  FRED: process.env.REACT_APP_FRED_API_KEY || process.env.FRED_API_KEY || 'a8df6aeca3b71980ad53ebccecb3cb3e',
  BEA: process.env.REACT_APP_BEA_API_KEY || process.env.BEA_API_KEY || '997E5691-4F0E-4774-8B4E-CAE836D4AC47',
  BLS: process.env.REACT_APP_BLS_API_KEY || process.env.BLS_API_KEY || 'a759447531f04f1f861f29a381aab863',
  CENSUS: process.env.REACT_APP_CENSUS_API_KEY || process.env.CENSUS_API_KEY || '8423ffa543d0e95cdba580f2e381649b6772f515'
};

// Log API key status (without revealing the actual keys)
console.log('API Key Status:', {
  FRED: 'Using API key',
  BEA: 'Using API key',
  BLS: 'Using API key',
  CENSUS: 'Using API key'
});

// Base URLs
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';
const BEA_BASE_URL = 'https://apps.bea.gov/api/data';
const BLS_BASE_URL = 'https://api.bls.gov/publicAPI/v2';
const TREASURY_BASE_URL = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';
const CENSUS_BASE_URL = 'https://api.census.gov/data';

// FRED API
interface FredSeriesParams {
  frequency?: string;
  units?: string;
  startDate?: string;
  endDate?: string;
  calculation?: string;
  limit?: number;
}

const fredApi = {
  getSeriesData: async (seriesId: string, params: FredSeriesParams = {}) => {
    try {
      console.log(`Fetching FRED data for series ${seriesId} with params:`, params);
      
      // Add timeout to prevent hanging requests
      const response = await axios.get(`${FRED_BASE_URL}/series/observations`, {
        params: {
          series_id: seriesId,
          api_key: API_KEYS.FRED,
          file_type: 'json',
          frequency: params.frequency || 'm',
          units: params.units || 'lin',
          observation_start: params.startDate,
          observation_end: params.endDate,
          sort_order: 'asc',
          limit: params.limit || 1000
        },
        timeout: 10000 // 10 second timeout
      });

      if (!response.data || !response.data.observations) {
        console.error('Invalid FRED API response:', response.data);
        throw new Error('Invalid API response format');
      }

      // Transform the data to our standard format
      const data = response.data.observations.map((obs: any) => ({
        date: obs.date,
        value: parseFloat(obs.value) || 0
      }));

      if (data.length === 0) {
        console.warn(`No data returned for FRED series ${seriesId}`);
      } else {
        console.log(`Successfully fetched ${data.length} data points for FRED series ${seriesId}`);
      }

      return { data };
    } catch (error: any) {
      console.error('Error fetching FRED data:', error);
      
      // Provide more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('API response error:', {
          status: error.response.status,
          data: error.response.data
        });
        throw new Error(`FRED API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        throw new Error('No response received from FRED API');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(`FRED API error: ${error.message}`);
      }
    }
  },

  searchSeries: async (searchTerm: string, limit: number = 20) => {
    try {
      const response = await axios.get(`${FRED_BASE_URL}/series/search`, {
        params: {
          search_text: searchTerm,
          api_key: API_KEYS.FRED,
          file_type: 'json',
          limit
        }
      });

      return response.data.seriess || [];
    } catch (error) {
      console.error('Error searching FRED series:', error);
      return [];
    }
  },

  getSeriesInfo: async (seriesId: string) => {
    try {
      const response = await axios.get(`${FRED_BASE_URL}/series`, {
        params: {
          series_id: seriesId,
          api_key: API_KEYS.FRED,
          file_type: 'json'
        }
      });

      return response.data.seriess[0] || null;
    } catch (error) {
      console.error('Error fetching FRED series info:', error);
      return null;
    }
  }
};

// BLS API
interface BlsSeriesParams {
  startYear: number;
  endYear: number;
  seriesId?: string;
}

const blsApi = {
  getUnemploymentData: async (startYear: number, endYear: number) => {
    try {
      console.log(`Fetching BLS unemployment data for years ${startYear}-${endYear}`);
      
      const response = await axios.post(`${BLS_BASE_URL}/timeseries/data/`, {
        seriesid: ['LNS14000000'], // Unemployment rate
        startyear: startYear.toString(),
        endyear: endYear.toString(),
        registrationkey: API_KEYS.BLS
      });

      console.log('BLS API response status:', response.data.status);
      
      if (response.data.status !== 'REQUEST_SUCCEEDED') {
        console.error('BLS API request failed:', response.data);
        throw new Error(response.data.message || 'BLS API request failed');
      }

      if (!response.data.Results || !response.data.Results.series || !response.data.Results.series[0] || !response.data.Results.series[0].data) {
        console.error('Invalid BLS API response format:', response.data);
        throw new Error('Invalid BLS API response format');
      }

      // Transform the data to our standard format
      const data = response.data.Results.series[0].data.map((item: any) => {
        // Convert period (e.g., M01) to month number
        const month = parseInt(item.period.substring(1));
        const date = `${item.year}-${month.toString().padStart(2, '0')}-01`;
        
        return {
          date,
          value: parseFloat(item.value)
        };
      });

      // Sort by date
      data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      console.log(`Successfully fetched ${data.length} unemployment data points`);
      
      return { data };
    } catch (error: any) {
      console.error('Error fetching BLS unemployment data:', error);
      
      // Provide more detailed error information
      if (error.response) {
        console.error('BLS API response error:', {
          status: error.response.status,
          data: error.response.data
        });
        throw new Error(`BLS API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error('No response received from BLS API:', error.request);
        throw new Error('No response received from BLS API');
      } else {
        throw new Error(`BLS API error: ${error.message}`);
      }
    }
  },

  getCPIData: async (startYear: number, endYear: number) => {
    try {
      console.log(`Fetching BLS CPI data for years ${startYear}-${endYear}`);
      
      const response = await axios.post(`${BLS_BASE_URL}/timeseries/data/`, {
        seriesid: ['CUUR0000SA0'], // Consumer Price Index for All Urban Consumers
        startyear: startYear.toString(),
        endyear: endYear.toString(),
        registrationkey: API_KEYS.BLS
      });

      if (response.data.status !== 'REQUEST_SUCCEEDED') {
        throw new Error(response.data.message || 'BLS API request failed');
      }

      // Transform the data to our standard format
      const data = response.data.Results.series[0].data.map((item: any) => {
        // Convert period (e.g., M01) to month number
        const month = parseInt(item.period.substring(1));
        const date = `${item.year}-${month.toString().padStart(2, '0')}-01`;
        
        return {
          date,
          value: parseFloat(item.value)
        };
      });

      // Sort by date
      data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return { data };
    } catch (error) {
      console.error('Error fetching BLS CPI data:', error);
      return { data: [] };
    }
  },

  getCustomSeriesData: async (seriesId: string, startYear: number, endYear: number) => {
    try {
      const response = await axios.post(`${BLS_BASE_URL}/timeseries/data/`, {
        seriesid: [seriesId],
        startyear: startYear.toString(),
        endyear: endYear.toString(),
        registrationkey: API_KEYS.BLS
      });

      if (response.data.status !== 'REQUEST_SUCCEEDED') {
        throw new Error(response.data.message || 'BLS API request failed');
      }

      // Transform the data to our standard format
      const data = response.data.Results.series[0].data.map((item: any) => {
        // Convert period (e.g., M01) to month number
        const month = parseInt(item.period.substring(1));
        const date = `${item.year}-${month.toString().padStart(2, '0')}-01`;
        
        return {
          date,
          value: parseFloat(item.value)
        };
      });

      // Sort by date
      data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return { data };
    } catch (error) {
      console.error(`Error fetching BLS data for series ${seriesId}:`, error);
      return { data: [] };
    }
  }
};

// Treasury API
interface TreasuryParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

const treasuryApi = {
  getDebtData: async (params: TreasuryParams = {}) => {
    try {
      console.log(`Fetching Treasury debt data with params:`, params);
      
      const requestParams: Record<string, any> = {
        fields: 'record_date,tot_pub_debt_out_amt',
        filter: `record_date:gte:${params.startDate},record_date:lte:${params.endDate}`,
        sort: 'record_date'
      };
      requestParams['page[size]'] = params.limit || 1000;
      
      console.log('Treasury API request params:', requestParams);
      
      const response = await axios.get(`${TREASURY_BASE_URL}/debt/mspd/mspd_table_1`, {
        params: requestParams
      });

      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        console.error('Invalid Treasury API response format:', response.data);
        throw new Error('Invalid Treasury API response format');
      }

      // Transform the data to our standard format
      const data = response.data.data.map((item: any) => ({
        date: item.record_date,
        value: parseFloat(item.tot_pub_debt_out_amt) / 1000000 // Convert to millions
      }));

      console.log(`Successfully fetched ${data.length} Treasury debt data points`);
      
      return { data };
    } catch (error: any) {
      console.error('Error fetching Treasury debt data:', error);
      
      // Provide more detailed error information
      if (error.response) {
        console.error('Treasury API response error:', {
          status: error.response.status,
          data: error.response.data
        });
        throw new Error(`Treasury API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error('No response received from Treasury API:', error.request);
        throw new Error('No response received from Treasury API');
      } else {
        throw new Error(`Treasury API error: ${error.message}`);
      }
    }
  },

  getYieldCurveData: async (params: TreasuryParams = {}) => {
    try {
      console.log(`Fetching Treasury yield curve data with params:`, params);
      
      const requestParams: Record<string, any> = {
        fields: 'record_date,bc_1month,bc_3month,bc_6month,bc_1year,bc_2year,bc_3year,bc_5year,bc_7year,bc_10year,bc_20year,bc_30year',
        filter: `record_date:gte:${params.startDate},record_date:lte:${params.endDate}`,
        sort: 'record_date'
      };
      requestParams['page[size]'] = params.limit || 1000;
      
      console.log('Treasury yield curve API request params:', requestParams);
      
      const response = await axios.get(`${TREASURY_BASE_URL}/rates/treasury-yield-curve`, {
        params: requestParams
      });

      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        console.error('Invalid Treasury yield curve API response format:', response.data);
        throw new Error('Invalid Treasury yield curve API response format');
      }

      // Transform the data to our standard format
      const data = response.data.data.map((item: any) => ({
        date: item.record_date,
        month1: parseFloat(item.bc_1month) || null,
        month3: parseFloat(item.bc_3month) || null,
        month6: parseFloat(item.bc_6month) || null,
        year1: parseFloat(item.bc_1year) || null,
        year2: parseFloat(item.bc_2year) || null,
        year3: parseFloat(item.bc_3year) || null,
        year5: parseFloat(item.bc_5year) || null,
        year7: parseFloat(item.bc_7year) || null,
        year10: parseFloat(item.bc_10year) || null,
        year20: parseFloat(item.bc_20year) || null,
        year30: parseFloat(item.bc_30year) || null,
        // Use 10-year yield as the default value
        value: parseFloat(item.bc_10year) || 0
      }));

      console.log(`Successfully fetched ${data.length} Treasury yield curve data points`);
      
      return { data };
    } catch (error: any) {
      console.error('Error fetching Treasury yield curve data:', error);
      
      // Provide more detailed error information
      if (error.response) {
        console.error('Treasury yield curve API response error:', {
          status: error.response.status,
          data: error.response.data
        });
        throw new Error(`Treasury yield curve API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error('No response received from Treasury yield curve API:', error.request);
        throw new Error('No response received from Treasury yield curve API');
      } else {
        throw new Error(`Treasury yield curve API error: ${error.message}`);
      }
    }
  }
};

// BEA API (Bureau of Economic Analysis)
interface BeaParams {
  tableName: string;
  frequency: string;
  year?: string;
  quarter?: string;
  industry?: string;
  area?: string;
}

const beaApi = {
  getGDPData: async (startYear: number, endYear: number) => {
    try {
      const response = await axios.get(BEA_BASE_URL, {
        params: {
          UserID: API_KEYS.BEA,
          method: 'GetData',
          datasetname: 'NIPA',
          TableName: 'T10101',
          Frequency: 'Q',
          Year: `${startYear},${endYear}`,
          GeoFips: 'ALL',
          ResultFormat: 'JSON'
        }
      });

      // Extract GDP data (Real GDP, Billions of chained dollars)
      const gdpData = response.data.BEAAPI.Results.Data.filter(
        (item: any) => item.SeriesCode === 'A191RX'
      );

      // Transform to our standard format
      const data = gdpData.map((item: any) => {
        const year = item.TimePeriod.substring(0, 4);
        const quarter = item.TimePeriod.substring(4, 5);
        const month = (parseInt(quarter) * 3 - 2).toString().padStart(2, '0');
        const date = `${year}-${month}-01`;
        
        return {
          date,
          value: parseFloat(item.DataValue)
        };
      });

      // Sort by date
      data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return { data };
    } catch (error) {
      console.error('Error fetching BEA GDP data:', error);
      return { data: [] };
    }
  },

  getCustomSeriesData: async (seriesId: string, startYear: number, endYear: number) => {
    try {
      // Map seriesId to appropriate BEA table and series code
      let tableName = 'T10101'; // Default to GDP table
      let seriesCode = 'A191RX'; // Default to Real GDP
      
      // Map common series IDs to their BEA equivalents
      if (seriesId === 'T20100') {
        tableName = 'T20100'; // Personal Income table
        seriesCode = 'A065RC'; // Personal Income
      } else if (seriesId === 'T61300') {
        tableName = 'T61300'; // Corporate Profits table
        seriesCode = 'A445RC'; // Corporate Profits
      }
      
      const response = await axios.get(BEA_BASE_URL, {
        params: {
          UserID: API_KEYS.BEA,
          method: 'GetData',
          datasetname: 'NIPA',
          TableName: tableName,
          Frequency: 'Q',
          Year: `${startYear},${endYear}`,
          GeoFips: 'ALL',
          ResultFormat: 'JSON'
        }
      });

      // Extract the specific series data
      const seriesData = response.data.BEAAPI.Results.Data.filter(
        (item: any) => item.SeriesCode === seriesCode
      );

      // Transform to our standard format
      const data = seriesData.map((item: any) => {
        const year = item.TimePeriod.substring(0, 4);
        const quarter = item.TimePeriod.substring(4, 5);
        const month = (parseInt(quarter) * 3 - 2).toString().padStart(2, '0');
        const date = `${year}-${month}-01`;
        
        return {
          date,
          value: parseFloat(item.DataValue)
        };
      });

      // Sort by date
      data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return { data };
    } catch (error) {
      console.error(`Error fetching BEA data for series ${seriesId}:`, error);
      return { data: [] };
    }
  },
  
  getCustomTableData: async (params: BeaParams) => {
    try {
      const queryParams: any = {
        UserID: API_KEYS.BEA,
        method: 'GetData',
        datasetname: 'NIPA',
        TableName: params.tableName,
        Frequency: params.frequency,
        ResultFormat: 'JSON'
      };

      if (params.year) {
        queryParams.Year = params.year;
      }

      if (params.industry) {
        queryParams.Industry = params.industry;
      }

      if (params.area) {
        queryParams.GeoFips = params.area;
      }

      const response = await axios.get(BEA_BASE_URL, { params: queryParams });

      // Transform to our standard format
      const data = response.data.BEAAPI.Results.Data.map((item: any) => {
        let date;
        if (params.frequency === 'A') {
          // Annual data
          date = `${item.TimePeriod}-01-01`;
        } else if (params.frequency === 'Q') {
          // Quarterly data
          const year = item.TimePeriod.substring(0, 4);
          const quarter = item.TimePeriod.substring(4, 5);
          const month = (parseInt(quarter) * 3 - 2).toString().padStart(2, '0');
          date = `${year}-${month}-01`;
        } else if (params.frequency === 'M') {
          // Monthly data
          const year = item.TimePeriod.substring(0, 4);
          const month = item.TimePeriod.substring(4, 6);
          date = `${year}-${month}-01`;
        }
        
        return {
          date,
          value: parseFloat(item.DataValue),
          seriesCode: item.SeriesCode,
          seriesName: item.SeriesName
        };
      });

      return { data };
    } catch (error) {
      console.error('Error fetching BEA data:', error);
      return { data: [] };
    }
  }
};

// Census API
interface CensusParams {
  dataset: string;
  year: string;
  variables: string[];
  location?: string;
}

const censusApi = {
  getPopulationData: async () => {
    // Get population data for the last 5 years
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;
    try {
      // Census API only allows one year at a time, so we need to make multiple requests
      const requests = [];
      for (let year = startYear; year <= currentYear; year++) {
        requests.push(
          axios.get(`${CENSUS_BASE_URL}/${year}/pep/population`, {
            params: {
              get: 'POP,NAME',
              for: 'us:*',
              key: API_KEYS.CENSUS
            }
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // Transform to our standard format
      const data = responses.flatMap((response, index) => {
        const year = startYear + index;
        const populationData = response.data;
        
        // Skip header row
        const dataRows = populationData.slice(1);
        
        return dataRows.map((row: any) => ({
          date: `${year}-01-01`,
          value: parseInt(row[0]), // Population value
          name: row[1] // Location name
        }));
      });

      // Sort by date
      data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return { data };
    } catch (error) {
      console.error('Error fetching Census population data:', error);
      return { data: [] };
    }
  },

  getHousingData: async () => {
    try {
      // Get housing data for the last 5 years
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 5;
      
      // Census API only allows one year at a time, so we need to make multiple requests
      const requests = [];
      for (let year = startYear; year <= currentYear; year++) {
        requests.push(
          axios.get(`${CENSUS_BASE_URL}/${year}/acs/acs1`, {
            params: {
              get: 'NAME,B25001_001E', // B25001_001E is total housing units
              for: 'us:*',
              key: API_KEYS.CENSUS
            }
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // Transform to our standard format
      const data = responses.flatMap((response, index) => {
        const year = startYear + index;
        const housingData = response.data;
        
        // Skip header row
        const dataRows = housingData.slice(1);
        
        return dataRows.map((row: any) => ({
          date: `${year}-01-01`,
          value: parseInt(row[1]), // Housing units value
          name: row[0] // Location name
        }));
      });

      // Sort by date
      data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return { data };
    } catch (error) {
      console.error('Error fetching Census housing data:', error);
      return { data: [] };
    }
  },
  
  getCustomSeriesData: async (seriesId: string) => {
    try {
      // Get data for the last 5 years
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 5;
      
      // Map seriesId to appropriate Census dataset and variables
      let dataset = 'pep/population';
      let variables = ['POP'];
      
      if (seriesId === 'housing') {
        dataset = 'acs/acs1';
        variables = ['B25001_001E']; // Total housing units
      }
      
      // Census API only allows one year at a time, so we need to make multiple requests
      const requests = [];
      for (let year = startYear; year <= currentYear; year++) {
        requests.push(
          axios.get(`${CENSUS_BASE_URL}/${year}/${dataset}`, {
            params: {
              get: [...variables, 'NAME'].join(','),
              for: 'us:*',
              key: API_KEYS.CENSUS
            }
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // Transform to our standard format
      const data = responses.flatMap((response, index) => {
        const year = startYear + index;
        const responseData = response.data;
        
        // Skip header row
        const dataRows = responseData.slice(1);
        
        return dataRows.map((row: any) => ({
          date: `${year}-01-01`,
          value: parseInt(row[0]), // First variable value
          name: row[1] // Location name
        }));
      });

      // Sort by date
      data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return { data };
    } catch (error) {
      console.error(`Error fetching Census data for series ${seriesId}:`, error);
      return { data: [] };
    }
  },
  
  getCustomData: async (params: CensusParams) => {
    try {
      const response = await axios.get(`${CENSUS_BASE_URL}/${params.year}/${params.dataset}`, {
        params: {
          get: params.variables.join(','),
          for: params.location || 'us:*',
          key: API_KEYS.CENSUS
        }
      });

      // Transform to our standard format
      const headers = response.data[0];
      const dataRows = response.data.slice(1);
      
      const data = dataRows.map((row: any) => {
        const result: any = {
          date: `${params.year}-01-01`
        };
        
        // Map each column to its header
        headers.forEach((header: string, index: number) => {
          if (index < params.variables.length) {
            result[header] = isNaN(row[index]) ? row[index] : parseFloat(row[index]);
          }
        });
        
        // Use the first variable as the default value
        result.value = isNaN(row[0]) ? 0 : parseFloat(row[0]);
        
        return result;
      });

      return { data };
    } catch (error) {
      console.error('Error fetching Census data:', error);
      return { data: [] };
    }
  }
};

export { fredApi, blsApi, treasuryApi, beaApi, censusApi };