import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { fredApi, treasuryApi, blsApi } from '../../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceArea, ReferenceLine, Area, ComposedChart, Bar, Brush, Label, Scatter
} from 'recharts';
import { 
  format, parseISO, subMonths, subWeeks, subYears, subQuarters, 
  differenceInDays, differenceInWeeks, differenceInMonths, differenceInQuarters, differenceInYears,
  startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear,
  isAfter, isBefore, isEqual, addDays, getYear, getMonth
} from 'date-fns';
import { useGenerateImage } from 'recharts-to-png';
import { useTheme } from '../../context/ThemeContext';
import DatasetIndicator from './DatasetIndicator';
import './DataChart.css';

// Mock implementations for missing APIs
const beaApi = {
  getGDPData: async (startYear: number, endYear: number) => {
    console.warn('Using mock BEA GDP data');
    // Generate mock data
    const data = [];
    for (let year = startYear; year <= endYear; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        const month = (quarter * 3 - 2).toString().padStart(2, '0');
        data.push({
          date: `${year}-${month}-01`,
          value: 20000 + (year - startYear) * 1000 + Math.random() * 500
        });
      }
    }
    return { data };
  },
  getCustomSeriesData: async (seriesId: string, startYear: number, endYear: number) => {
    console.warn(`Using mock BEA data for series ${seriesId}`);
    // Generate mock data
    const data = [];
    for (let year = startYear; year <= endYear; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        const month = (quarter * 3 - 2).toString().padStart(2, '0');
        data.push({
          date: `${year}-${month}-01`,
          value: 1000 + (year - startYear) * 100 + Math.random() * 200
        });
      }
    }
    return { data };
  }
};

const censusApi = {
  getPopulationData: async () => {
    console.warn('Using mock Census population data');
    // Generate mock data for the last 5 years
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;
    const data = [];
    for (let year = startYear; year <= currentYear; year++) {
      data.push({
        date: `${year}-01-01`,
        value: 330000000 + (year - startYear) * 2000000 + Math.random() * 1000000
      });
    }
    return { data };
  },
  getHousingData: async () => {
    console.warn('Using mock Census housing data');
    // Generate mock data for the last 5 years
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;
    const data = [];
    for (let year = startYear; year <= currentYear; year++) {
      data.push({
        date: `${year}-01-01`,
        value: 140000000 + (year - startYear) * 1000000 + Math.random() * 500000
      });
    }
    return { data };
  },
  getCustomSeriesData: async (seriesId: string) => {
    console.warn(`Using mock Census data for series ${seriesId}`);
    // Generate mock data for the last 5 years
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;
    const data = [];
    for (let year = startYear; year <= currentYear; year++) {
      data.push({
        date: `${year}-01-01`,
        value: 1000 + (year - startYear) * 100 + Math.random() * 200
      });
    }
    return { data };
  }
};

// US Recession dates from FRED
const US_RECESSIONS = [
  { start: '1857-06-01', end: '1858-12-01' },
  { start: '1860-10-01', end: '1861-06-01' },
  { start: '1865-04-01', end: '1867-12-01' },
  { start: '1869-06-01', end: '1870-12-01' },
  { start: '1873-10-01', end: '1879-03-01' },
  { start: '1882-03-01', end: '1885-05-01' },
  { start: '1887-03-01', end: '1888-04-01' },
  { start: '1890-07-01', end: '1891-05-01' },
  { start: '1893-01-01', end: '1894-06-01' },
  { start: '1895-12-01', end: '1897-06-01' },
  { start: '1899-06-01', end: '1900-12-01' },
  { start: '1902-09-01', end: '1904-08-01' },
  { start: '1907-05-01', end: '1908-06-01' },
  { start: '1910-01-01', end: '1912-01-01' },
  { start: '1913-01-01', end: '1914-12-01' },
  { start: '1918-08-01', end: '1919-03-01' },
  { start: '1920-01-01', end: '1921-07-01' },
  { start: '1923-05-01', end: '1924-07-01' },
  { start: '1926-10-01', end: '1927-11-01' },
  { start: '1929-08-01', end: '1933-03-01' },
  { start: '1937-05-01', end: '1938-06-01' },
  { start: '1945-02-01', end: '1945-10-01' },
  { start: '1948-11-01', end: '1949-10-01' },
  { start: '1953-07-01', end: '1954-05-01' },
  { start: '1957-08-01', end: '1958-04-01' },
  { start: '1960-04-01', end: '1961-02-01' },
  { start: '1969-12-01', end: '1970-11-01' },
  { start: '1973-11-01', end: '1975-03-01' },
  { start: '1980-01-01', end: '1980-07-01' },
  { start: '1981-07-01', end: '1982-11-01' },
  { start: '1990-07-01', end: '1991-03-01' },
  { start: '2001-03-01', end: '2001-11-01' },
  { start: '2007-12-01', end: '2009-06-01' },
  { start: '2020-02-01', end: '2020-04-01' }
];

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Color indicator component to avoid inline styles
const ColorIndicator: React.FC<{ color: string }> = ({ color }) => {
  return (
    <span
      className="dynamic-color-indicator"
      data-color={color}
    ></span>
  );
};

// Using the imported DatasetIndicator component instead

// We'll only use real data from APIs

// We'll fetch financial crisis events from an API instead of using hardcoded data
const financialCrisisEvents: { date: string, name: string }[] = [];

// Using only real API data

type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | '1y' | '5y' | '10y' | 'max';
type ChangeCalculation = 
  'lin' |  // Linear (no transformation) - FRED default
  'chg' |  // Change from previous period
  'ch1' |  // Change from a year ago
  'pch' |  // Percent change from previous period
  'pc1' |  // Percent change from a year ago
  'pca' |  // Compounded annual rate of change
  'cch' |  // Continuously compounded rate of change
  'log' |  // Natural log
  'nbd' |  // n-th power
  'cca' |  // Continuously compounded annual rate of change
  'value' | // Raw value (no transformation)
  // Custom calculation types
  'period-to-period' |
  'period-to-period-percent' |
  'day-to-day' |
  'day-to-day-percent' |
  'week-to-week' |
  'week-to-week-percent' |
  'quarter-to-quarter' |
  'quarter-to-quarter-percent' |
  'year-to-year' |
  'year-to-year-percent' |
  // Mathematical operations between metrics
  'add' |       // Addition of metrics
  'subtract' |  // Subtraction of metrics
  'multiply' |  // Multiplication of metrics
  'divide' |    // Division of metrics
  'ratio' |     // Ratio between metrics (as percentage)
  'average';    // Average of metrics

interface DataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

interface DataSet {
  id: string;
  name: string;
  data: DataPoint[];
  color: string;
  visible: boolean;
  yAxisId?: string;
  formula?: string; // Store the formula for calculated datasets
  normalized?: boolean; // Indicates if the dataset is normalized
}

// Define the component with a named export first
export const DataChart: React.FC<{}> = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const chartRef = useRef<any>(null);
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // For API operations like adding metrics
  const [user, setUser] = useState<any>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('5y');
  const [calculation, setCalculation] = useState<ChangeCalculation>('lin');
  const [showRecessions, setShowRecessions] = useState<boolean>(true);
  const [dataSets, setDataSets] = useState<DataSet[]>([]);
  const [availableDataSets, setAvailableDataSets] = useState<{[key: string]: {name: string, color: string, source: string, seriesId: string}}>({});
  const [selectedDataSet, setSelectedDataSet] = useState<string>('');
  const [showEvents, setShowEvents] = useState(true);
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [getImage, { ref, isLoading: isImageLoading }] = useGenerateImage<HTMLDivElement>();
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [dateRange, setDateRange] = useState<[Date, Date]>([subYears(new Date(), 5), new Date()]);
  const [searchTerm, setSearchTerm] = useState('');
  // States for mathematical operations between metrics
  const [comparisonMetrics, setComparisonMetrics] = useState<string[]>([]);
  const [isNormalized, setIsNormalized] = useState(true); // Whether to normalize metrics for comparison
  const [showDataExplorer, setShowDataExplorer] = useState(false);
  const [customFormula, setCustomFormula] = useState('');
  const [customFormulaName, setCustomFormulaName] = useState<string>('');
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showAddMetricDropdown, setShowAddMetricDropdown] = useState(false);
  const [metricSuggestions, setMetricSuggestions] = useState<string[]>([]);
  const [showZeroLine, setShowZeroLine] = useState(true);
  const [chartLayout, setChartLayout] = useState<'overlay' | 'separate'>('overlay');
  const [activeMetrics, setActiveMetrics] = useState<string[]>([]);
  const [metricSettings, setMetricSettings] = useState<{[key: string]: {visible: boolean, yAxisId: string, type: 'line' | 'bar' | 'area'}}>({}); 
  const [showMetricSettings, setShowMetricSettings] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAddMetricDropdown(false);
        // Don't reset search term here to avoid conflicts with Data Explorer search
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!chartContainerRef.current) return;
    
    if (!isFullscreen) {
      if (chartContainerRef.current.requestFullscreen) {
        chartContainerRef.current.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(err => console.error('Error attempting to enable fullscreen:', err));
      } else if ((chartContainerRef.current as any).webkitRequestFullscreen) {
        (chartContainerRef.current as any).webkitRequestFullscreen();
        setIsFullscreen(true);
      } else if ((chartContainerRef.current as any).msRequestFullscreen) {
        (chartContainerRef.current as any).msRequestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(err => console.error('Error attempting to exit fullscreen:', err));
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
        setIsFullscreen(false);
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  
  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);
  
  // Initialize with default data
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Using API keys with fallbacks
      console.log('Using API keys with fallbacks');
      
      // Define available data sets with their API mappings
      const availableSets: {[key: string]: {name: string, color: string, source: string, seriesId: string}} = {
        // FRED data series
        'gdp': { name: 'GDP', color: '#8884d8', source: 'fred', seriesId: 'GDP' },
        'sp500': { name: 'S&P 500', color: '#82ca9d', source: 'fred', seriesId: 'SP500' },
        'unemployment': { name: 'Unemployment Rate', color: '#ffc658', source: 'fred', seriesId: 'UNRATE' },
        'cpi': { name: 'Consumer Price Index', color: '#ff8042', source: 'fred', seriesId: 'CPIAUCSL' },
        'treasury10y': { name: '10Y Treasury Yield', color: '#ff5722', source: 'fred', seriesId: 'DGS10' },
        'treasury2y': { name: '2Y Treasury Yield', color: '#8bc34a', source: 'fred', seriesId: 'DGS2' },
        'fedfunds': { name: 'Federal Funds Rate', color: '#03a9f4', source: 'fred', seriesId: 'FEDFUNDS' },
        'mortgage30y': { name: '30Y Mortgage Rate', color: '#9c27b0', source: 'fred', seriesId: 'MORTGAGE30US' },
        'ppi': { name: 'Producer Price Index', color: '#ff9800', source: 'fred', seriesId: 'PPIACO' },
        'industrial_production': { name: 'Industrial Production', color: '#795548', source: 'fred', seriesId: 'INDPRO' },
        'retail_sales': { name: 'Retail Sales', color: '#9e9e9e', source: 'fred', seriesId: 'RSXFS' },
        'housing_starts': { name: 'Housing Starts', color: '#4caf50', source: 'fred', seriesId: 'HOUST' },
        'personal_income': { name: 'Personal Income', color: '#2196f3', source: 'fred', seriesId: 'PI' },
        'personal_spending': { name: 'Personal Spending', color: '#f44336', source: 'fred', seriesId: 'PCE' },
        'consumer_sentiment': { name: 'Consumer Sentiment', color: '#9c27b0', source: 'fred', seriesId: 'UMCSENT' },
        'corporate_profits': { name: 'Corporate Profits', color: '#ffeb3b', source: 'fred', seriesId: 'CP' },
        
        // Treasury data series
        'debt': { name: 'US Public Debt', color: '#e91e63', source: 'treasury', seriesId: 'debt' },
        'yield_curve': { name: 'Yield Curve', color: '#673ab7', source: 'treasury', seriesId: 'yield_curve' },
        
        // BLS data series
        'bls_unemployment': { name: 'BLS Unemployment', color: '#795548', source: 'bls', seriesId: 'unemployment' },
        'bls_cpi': { name: 'BLS CPI', color: '#607d8b', source: 'bls', seriesId: 'cpi' },
        'bls_employment': { name: 'BLS Employment', color: '#009688', source: 'bls', seriesId: 'CEU0000000001' },
        'bls_wages': { name: 'BLS Wages', color: '#ff5722', source: 'bls', seriesId: 'CES0500000003' },
        
        // BEA data series
        'bea_gdp': { name: 'BEA GDP', color: '#3f51b5', source: 'bea', seriesId: 'gdp' },
        'bea_personal_income': { name: 'BEA Personal Income', color: '#00bcd4', source: 'bea', seriesId: 'T20100' },
        'bea_corporate_profits': { name: 'BEA Corporate Profits', color: '#cddc39', source: 'bea', seriesId: 'T61300' },
        
        // Census data series
        'census_population': { name: 'Census Population', color: '#9e9d24', source: 'census', seriesId: 'population' },
        'census_housing': { name: 'Census Housing', color: '#6d4c41', source: 'census', seriesId: 'housing' }
      };
      
      setAvailableDataSets(availableSets);
      
      // Initialize with data from API
      let initialDataSets: DataSet[] = [];
      
      try {
        // Check if we have an ID parameter to load a specific dataset
        if (id && availableSets[id]) {
          const dataSetInfo = availableSets[id];
          
          // Fetch data based on the source
          let apiData;
          
          switch (dataSetInfo.source) {
            case 'fred':
              // Convert our timeFrame to FRED frequency
              let frequency = 'm'; // Default to monthly
              if (timeFrame === 'daily') frequency = 'd';
              if (timeFrame === 'weekly') frequency = 'w';
              if (timeFrame === 'quarterly') frequency = 'q';
              if (timeFrame === 'yearly') frequency = 'a';
              
              const fredResponse = await fredApi.getSeriesData(dataSetInfo.seriesId, {
                frequency: frequency,
                units: calculation, // Use the FRED-style calculation type
                startDate: getStartDateForTimeFrame(timeFrame),
                endDate: new Date().toISOString().split('T')[0],
              });
              // Add type assertion to handle the response properly
              apiData = (fredResponse as { data: Array<{ date: string, value: number }> }).data.map((item) => ({
                date: item.date,
                value: item.value
              }));
              break;
              
            case 'treasury':
              if (dataSetInfo.seriesId === 'debt') {
                const treasuryResponse = await treasuryApi.getDebtData({
                  startDate: getStartDateForTimeFrame('5y'),
                  endDate: new Date().toISOString().split('T')[0],
                  limit: 1000
                });
                // Add type assertion to handle the response properly
                apiData = (treasuryResponse as { data: Array<{ date: string, value: number }> }).data.map((item) => ({
                  date: item.date,
                  value: item.value
                }));
              } else if (dataSetInfo.seriesId === 'yield_curve') {
                const treasuryResponse = await treasuryApi.getYieldCurveData({
                  startDate: getStartDateForTimeFrame('5y'),
                  endDate: new Date().toISOString().split('T')[0],
                  limit: 1000
                });
                // Add type assertion to handle the response properly
                apiData = (treasuryResponse as { data: Array<{ date: string, year10?: number }> }).data.map((item) => ({
                  date: item.date,
                  value: item.year10 || 0 // Use 10-year yield as the primary value
                }));
              }
              break;
              
            case 'bls':
              const currentYear = new Date().getFullYear();
              const startYear = currentYear - 5;
              
              if (dataSetInfo.seriesId === 'unemployment') {
                const blsResponse = await blsApi.getUnemploymentData(startYear, currentYear);
                apiData = (blsResponse as { data: Array<{ date: string, value: number }> }).data;
              } else if (dataSetInfo.seriesId === 'cpi') {
                const blsResponse = await blsApi.getCPIData(startYear, currentYear);
                apiData = (blsResponse as { data: Array<{ date: string, value: number }> }).data;
              } else {
                // Custom BLS series
                const blsResponse = await blsApi.getCustomSeriesData(dataSetInfo.seriesId, startYear, currentYear);
                apiData = (blsResponse as { data: Array<{ date: string, value: number }> }).data;
              }
              break;
              
            case 'bea':
              // Define variables for BEA case
              const beaCurrentYear = new Date().getFullYear();
              const beaStartYear = beaCurrentYear - 5;
              
              if (dataSetInfo.seriesId === 'gdp') {
                const beaResponse = await beaApi.getGDPData(beaStartYear, beaCurrentYear);
                apiData = (beaResponse as { data: Array<{ date: string, value: number }> }).data;
              } else {
                // Custom BEA series
                const beaResponse = await beaApi.getCustomSeriesData(dataSetInfo.seriesId, beaStartYear, beaCurrentYear);
                apiData = (beaResponse as { data: Array<{ date: string, value: number }> }).data;
              }
              break;
              
            case 'census':
              if (dataSetInfo.seriesId === 'population') {
                const censusResponse = await censusApi.getPopulationData();
                apiData = (censusResponse as { data: Array<{ date: string, value: number }> }).data;
              } else if (dataSetInfo.seriesId === 'housing') {
                const censusResponse = await censusApi.getHousingData();
                apiData = (censusResponse as { data: Array<{ date: string, value: number }> }).data;
              } else {
                // Custom Census series
                const censusResponse = await censusApi.getCustomSeriesData(dataSetInfo.seriesId);
                apiData = (censusResponse as { data: Array<{ date: string, value: number }> }).data;
              }
              break;
          }
          
          if (apiData) {
            initialDataSets.push({
              id: id,
              name: dataSetInfo.name,
              data: apiData,
              color: dataSetInfo.color,
              visible: true,
              yAxisId: 'left',
            });
          }
        }
      } catch (error: any) {
        console.error('Error fetching initial data:', error);
        // Don't use empty data, we'll try to fetch another dataset instead
        console.log('Unable to fetch initial data, will try another dataset');
        
        // Show a more detailed error message in the console
        if (error.message) {
          console.error(`Error details: ${error.message}`);
        }
        
        // If there's a response error, log it
        if (error.response) {
          console.error('API response error:', {
            status: error.response.status,
            data: error.response.data
          });
        }
      }
      
      // If no ID was provided or the ID wasn't found, initialize with S&P 500
      if (initialDataSets.length === 0) {
        try {
          // Try to fetch S&P 500 data from FRED
          const fredResponse = await fredApi.getSeriesData('SP500', {
            frequency: 'm', // Monthly data
            units: 'lin', // Linear units (no transformation)
            startDate: getStartDateForTimeFrame('5y'),
            endDate: new Date().toISOString().split('T')[0],
            calculation: 'value' // Raw values
          });
          
          // Add type assertion to handle the response properly
          const apiData = (fredResponse as { data: Array<{ date: string, value: number }> }).data.map((item) => ({
            date: item.date,
            value: item.value
          }));
          
          initialDataSets.push({
            id: 'sp500',
            name: 'S&P 500',
            data: apiData,
            color: '#82ca9d',
            visible: true,
            yAxisId: 'left',
          });
        } catch (error: any) {
          console.error('Error fetching S&P 500 data:', error);
          // Don't add S&P 500 if we can't get real data
          // We'll try to fetch another dataset instead
          console.log('Unable to fetch S&P 500 data, will try another dataset if available');
          
          // Show a more detailed error message in the console
          if (error.message) {
            console.error(`Error details: ${error.message}`);
          }
          
          // If there's a response error, log it
          if (error.response) {
            console.error('API response error:', {
              status: error.response.status,
              data: error.response.data
            });
          }
        }
      }
      
      setDataSets(initialDataSets);
      setChartData(processData(initialDataSets, timeFrame, calculation));
      
      // Initialize metric settings
      const initialMetricSettings: {[key: string]: {visible: boolean, yAxisId: string, type: 'line' | 'bar' | 'area'}} = {};
      initialDataSets.forEach((dataset, index) => {
        initialMetricSettings[dataset.id] = {
          visible: true,
          yAxisId: index === 0 ? 'left' : `right${index}`,
          type: 'line'
        };
      });
      setMetricSettings(initialMetricSettings);
      
      // Set active metrics
      setActiveMetrics(initialDataSets.map(ds => ds.id));
      
      setLoading(false);
    };

    getUser();
  }, [id]);
  
  // Filter available datasets based on search term - using useMemo to recalculate when searchTerm changes
  const filteredDataSets = useMemo(() => {
    // Make sure availableDataSets is not empty
    if (Object.keys(availableDataSets).length === 0) {
      return {};
    }
    
    return Object.keys(availableDataSets)
      .filter(key => {
        if (!searchTerm) return true;
        return availableDataSets[key]?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .reduce((obj, key) => {
        if (availableDataSets[key]) {
          obj[key] = availableDataSets[key];
        }
        return obj;
      }, {} as {[key: string]: {name: string, color: string, source: string, seriesId: string}});
  }, [availableDataSets, searchTerm]);

  // Process data based on timeframe and calculation type
  const processData = (datasets: DataSet[], timeframe: TimeFrame, calcType: ChangeCalculation): DataPoint[] => {
    if (datasets.length === 0) return [];
    
    // Get the primary dataset (first one)
    const primaryData = [...datasets[0].data];
    
    // Create a new array with the processed data
    const processedData = primaryData.map((point, index) => {
      const newPoint: DataPoint = { ...point };
      const currentDate = new Date(point.date);
      
      // Add data from other datasets with proper scaling
      datasets.forEach(dataset => {
        if (dataset.id !== datasets[0].id && dataset.visible) {
          const matchingPoint = dataset.data.find(p => p.date === point.date);
          if (matchingPoint) {
            // Store the original value
            newPoint[dataset.id] = matchingPoint.value;
            
            // For proper scaling, normalize values when showing raw values
            if (calcType === 'value') {
              // Calculate min/max for both datasets for normalization
              const primaryMin = Math.min(...datasets[0].data.map(p => p.value).filter(v => !isNaN(v)));
              const primaryMax = Math.max(...datasets[0].data.map(p => p.value).filter(v => !isNaN(v)));
              const primaryRange = primaryMax - primaryMin;
              
              const datasetMin = Math.min(...dataset.data.map(p => p.value).filter(v => !isNaN(v)));
              const datasetMax = Math.max(...dataset.data.map(p => p.value).filter(v => !isNaN(v)));
              const datasetRange = datasetMax - datasetMin;
              
              // Calculate normalized value that preserves the shape but scales to primary dataset range
              if (primaryRange > 0 && datasetRange > 0) {
                const normalizedValue = ((matchingPoint.value - datasetMin) / datasetRange) * primaryRange + primaryMin;
                newPoint[`${dataset.id}_normalized`] = normalizedValue;
              }
            }
          }
        }
      });
      
      // If we're showing actual values, no need for change calculations
      if (calcType === 'value') {
        newPoint.change = newPoint.value;
        return newPoint;
      }
      
      // Calculate changes based on the selected calculation type
      if (index > 0) {
        const prevPoint = primaryData[index - 1];
        const prevDate = new Date(prevPoint.date);
        
        // Period to period change (absolute)
        if (calcType === 'period-to-period') {
          newPoint.change = newPoint.value - prevPoint.value;
        }
        
        // Period to period change (percentage)
        else if (calcType === 'period-to-period-percent') {
          newPoint.change = ((newPoint.value - prevPoint.value) / prevPoint.value) * 100;
        }
        
        // Day to day change (absolute)
        else if (calcType === 'day-to-day') {
          // Find data point from previous day
          const dayDiff = differenceInDays(currentDate, prevDate);
          if (dayDiff === 1) {
            newPoint.change = newPoint.value - prevPoint.value;
          } else {
            // If we don't have data for the previous day, use the closest available
            newPoint.change = newPoint.value - prevPoint.value;
          }
        }
        
        // Day to day change (percentage)
        else if (calcType === 'day-to-day-percent') {
          const dayDiff = differenceInDays(currentDate, prevDate);
          if (dayDiff === 1 && prevPoint.value !== 0) {
            newPoint.change = ((newPoint.value - prevPoint.value) / prevPoint.value) * 100;
          } else {
            // If we don't have data for the previous day, use the closest available
            newPoint.change = prevPoint.value !== 0 ? ((newPoint.value - prevPoint.value) / prevPoint.value) * 100 : 0;
          }
        }
        
        // Week to week change (absolute)
        else if (calcType === 'week-to-week') {
          // Find data point from previous week
          const weekDiff = differenceInWeeks(currentDate, prevDate);
          if (weekDiff >= 1) {
            newPoint.change = newPoint.value - prevPoint.value;
          } else {
            // If we don't have data for the previous week, look for a point approximately 7 days ago
            const weekAgoIndex = primaryData.findIndex(p => {
              const pDate = new Date(p.date);
              return differenceInDays(currentDate, pDate) >= 7;
            });
            
            if (weekAgoIndex >= 0) {
              newPoint.change = newPoint.value - primaryData[weekAgoIndex].value;
            } else {
              newPoint.change = 0;
            }
          }
        }
        
        // Week to week change (percentage)
        else if (calcType === 'week-to-week-percent') {
          const weekDiff = differenceInWeeks(currentDate, prevDate);
          if (weekDiff >= 1 && prevPoint.value !== 0) {
            newPoint.change = ((newPoint.value - prevPoint.value) / prevPoint.value) * 100;
          } else {
            // If we don't have data for the previous week, look for a point approximately 7 days ago
            const weekAgoIndex = primaryData.findIndex(p => {
              const pDate = new Date(p.date);
              return differenceInDays(currentDate, pDate) >= 7;
            });
            
            if (weekAgoIndex >= 0 && primaryData[weekAgoIndex].value !== 0) {
              newPoint.change = ((newPoint.value - primaryData[weekAgoIndex].value) / primaryData[weekAgoIndex].value) * 100;
            } else {
              newPoint.change = 0;
            }
          }
        }
        
        // Quarter to quarter change (absolute)
        else if (calcType === 'quarter-to-quarter') {
          const quarterDiff = differenceInQuarters(currentDate, prevDate);
          if (quarterDiff >= 1) {
            newPoint.change = newPoint.value - prevPoint.value;
          } else {
            // If we don't have data for the previous quarter, look for a point approximately 3 months ago
            const quarterAgoIndex = primaryData.findIndex(p => {
              const pDate = new Date(p.date);
              return differenceInMonths(currentDate, pDate) >= 3;
            });
            
            if (quarterAgoIndex >= 0) {
              newPoint.change = newPoint.value - primaryData[quarterAgoIndex].value;
            } else {
              newPoint.change = 0;
            }
          }
        }
        
        // Quarter to quarter change (percentage)
        else if (calcType === 'quarter-to-quarter-percent') {
          const quarterDiff = differenceInQuarters(currentDate, prevDate);
          if (quarterDiff >= 1 && prevPoint.value !== 0) {
            newPoint.change = ((newPoint.value - prevPoint.value) / prevPoint.value) * 100;
          } else {
            // If we don't have data for the previous quarter, look for a point approximately 3 months ago
            const quarterAgoIndex = primaryData.findIndex(p => {
              const pDate = new Date(p.date);
              return differenceInMonths(currentDate, pDate) >= 3;
            });
            
            if (quarterAgoIndex >= 0 && primaryData[quarterAgoIndex].value !== 0) {
              newPoint.change = ((newPoint.value - primaryData[quarterAgoIndex].value) / primaryData[quarterAgoIndex].value) * 100;
            } else {
              newPoint.change = 0;
            }
          }
        }
        
        // Year to year change (absolute)
        else if (calcType === 'year-to-year') {
          const yearDiff = differenceInYears(currentDate, prevDate);
          if (yearDiff >= 1) {
            newPoint.change = newPoint.value - prevPoint.value;
          } else {
            // If we don't have data for the previous year, look for a point approximately 12 months ago
            const yearAgoIndex = primaryData.findIndex(p => {
              const pDate = new Date(p.date);
              return differenceInMonths(currentDate, pDate) >= 12;
            });
            
            if (yearAgoIndex >= 0) {
              newPoint.change = newPoint.value - primaryData[yearAgoIndex].value;
            } else {
              newPoint.change = 0;
            }
          }
        }
        
        // Year to year change (percentage)
        else if (calcType === 'year-to-year-percent') {
          const yearDiff = differenceInYears(currentDate, prevDate);
          if (yearDiff >= 1 && prevPoint.value !== 0) {
            newPoint.change = ((newPoint.value - prevPoint.value) / prevPoint.value) * 100;
          } else {
            // If we don't have data for the previous year, look for a point approximately 12 months ago
            const yearAgoIndex = primaryData.findIndex(p => {
              const pDate = new Date(p.date);
              return differenceInMonths(currentDate, pDate) >= 12;
            });
            
            if (yearAgoIndex >= 0 && primaryData[yearAgoIndex].value !== 0) {
              newPoint.change = ((newPoint.value - primaryData[yearAgoIndex].value) / primaryData[yearAgoIndex].value) * 100;
            } else {
              newPoint.change = 0;
            }
          }
        }
        
        // Default case
        else {
          newPoint.change = newPoint.value - prevPoint.value;
        }
      } else {
        newPoint.change = 0;
      }
      
      // Add change calculations for other datasets
      datasets.forEach(dataset => {
        if (dataset.id !== datasets[0].id && dataset.visible) {
          const matchingPoint = dataset.data.find(p => p.date === point.date);
          if (matchingPoint && index > 0) {
            const prevMatchingPoint = dataset.data.find(p => p.date === primaryData[index - 1].date);
            if (prevMatchingPoint && prevMatchingPoint.value !== 0) {
              newPoint[`${dataset.id}_change`] = ((matchingPoint.value - prevMatchingPoint.value) / prevMatchingPoint.value) * 100;
            } else {
              newPoint[`${dataset.id}_change`] = 0;
            }
          } else {
            newPoint[`${dataset.id}_change`] = 0;
          }
        }
      });
      
      return newPoint;
    });
    
    return processedData;
  };

  // Function to normalize comparison metrics for proper scaling
  const normalizeComparisonMetrics = (datasets: DataSet[]): DataSet[] => {
    if (datasets.length <= 1 || !isNormalized) return datasets;
    
    // Create a deep copy of the datasets to avoid modifying the originals
    const normalizedDatasets = JSON.parse(JSON.stringify(datasets)) as DataSet[];
    
    // Get the primary dataset (first one)
    const primaryDataset = normalizedDatasets[0];
    if (!primaryDataset.data || primaryDataset.data.length === 0) return normalizedDatasets;
    
    // Get min/max values for primary dataset
    const primaryValues = primaryDataset.data.map(point => point.value).filter(val => !isNaN(val));
    const primaryMin = Math.min(...primaryValues);
    const primaryMax = Math.max(...primaryValues);
    const primaryRange = primaryMax - primaryMin;
    const primaryMean = primaryValues.reduce((sum, val) => sum + val, 0) / primaryValues.length;
    
    // Skip normalization if primary range is invalid
    if (primaryRange <= 0) return normalizedDatasets;
    
    // Normalize each comparison dataset
    for (let i = 1; i < normalizedDatasets.length; i++) {
      const dataset = normalizedDatasets[i];
      if (!dataset.data || dataset.data.length === 0) continue;
      
      // Get min/max values for comparison dataset
      const compValues = dataset.data.map(point => point.value).filter(val => !isNaN(val));
      const compMin = Math.min(...compValues);
      const compMax = Math.max(...compValues);
      const compRange = compMax - compMin;
      const compMean = compValues.reduce((sum, val) => sum + val, 0) / compValues.length;
      
      // Skip normalization if comparison range is invalid
      if (compRange <= 0) continue;
      
      // Store original values and apply normalization
      dataset.data.forEach(point => {
        // Store original value
        point.original_value = point.value;
        
        // Enhanced normalization that preserves relative movements better
        // This approach centers both datasets around their means before scaling
        point.value = ((point.value - compMean) / compRange) * primaryRange + primaryMean;
        
        // Store scale factor for reference
        point.scale_factor = primaryRange / compRange;
        
        // Store additional metadata for tooltips and calculations
        point.original_mean = compMean;
        point.original_range = compRange;
        point.normalized_mean = primaryMean;
        point.normalized_range = primaryRange;
      });
      
      // Mark dataset as normalized
      dataset.normalized = true;
    }
    
    return normalizedDatasets;
  };

  // Function to refetch data with the current time frame
  const refetchDataWithTimeFrame = async () => {
    if (dataSets.length === 0) return;
    
    setIsLoading(true);
    console.log(`Refetching data with time frame: ${timeFrame}`);
    
    try {
      // Create a new array to hold the updated datasets
      const updatedDataSets = [...dataSets];
      
      // For each dataset, refetch the data with the new time frame
      for (let i = 0; i < updatedDataSets.length; i++) {
        const dataset = updatedDataSets[i];
        const dataSetId = dataset.id;
        
        // Skip calculated datasets (they don't need to be refetched)
        if (dataset.formula) continue;
        
        // Get dataset info
        const dataSetInfo = availableDataSets[dataSetId];
        if (!dataSetInfo) continue;
        
        // Fetch data based on the source
        let apiData;
        
        switch (dataSetInfo.source) {
          case 'fred':
            // Convert our timeFrame to FRED frequency
            let frequency = 'm'; // Default to monthly
            if (timeFrame === 'daily') frequency = 'd';
            if (timeFrame === 'weekly') frequency = 'w';
            if (timeFrame === 'quarterly') frequency = 'q';
            if (timeFrame === 'yearly') frequency = 'a';
            
            const fredResponse = await fredApi.getSeriesData(dataSetInfo.seriesId, {
              frequency: frequency,
              units: calculation, // Use the FRED-style calculation type
              startDate: getStartDateForTimeFrame(timeFrame),
              endDate: new Date().toISOString().split('T')[0],
            });
            
            apiData = (fredResponse as { data: Array<{ date: string, value: number }> }).data.map((item) => ({
              date: item.date,
              value: item.value
            }));
            break;
            
          case 'treasury':
            if (dataSetInfo.seriesId === 'debt') {
              const treasuryResponse = await treasuryApi.getDebtData({
                startDate: getStartDateForTimeFrame(timeFrame),
                endDate: new Date().toISOString().split('T')[0],
                limit: 1000
              });
              apiData = (treasuryResponse as { data: Array<{ date: string, value: number }> }).data.map((item) => ({
                date: item.date,
                value: item.value
              }));
            } else if (dataSetInfo.seriesId === 'yield_curve') {
              const treasuryResponse = await treasuryApi.getYieldCurveData({
                startDate: getStartDateForTimeFrame(timeFrame),
                endDate: new Date().toISOString().split('T')[0],
                limit: 1000
              });
              apiData = (treasuryResponse as { data: Array<{ date: string, year10?: number }> }).data.map((item) => ({
                date: item.date,
                value: item.year10 || 0
              }));
            }
            break;
            
          // Add other data sources as needed
          default:
            continue;
        }
        
        // Update the dataset with new data
        if (apiData && apiData.length > 0) {
          updatedDataSets[i] = {
            ...dataset,
            data: apiData
          };
        }
      }
      
      // Update the datasets state
      setDataSets(updatedDataSets);
      
    } catch (error) {
      console.error('Error refetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update chart data when timeframe or calculation changes
  useEffect(() => {
    // Check if we need to normalize for comparison or mathematical operations
    let processedDatasets = dataSets;
    if (['add', 'subtract', 'multiply', 'divide', 'ratio', 'average'].includes(calculation)) {
      // For mathematical operations, we need at least 2 datasets
      if (dataSets.length >= 2) {
        // Normalize datasets for proper scaling if needed
        processedDatasets = normalizeComparisonMetrics(dataSets);
      }
    }
    
    setChartData(processData(processedDatasets, timeFrame, calculation));
  }, [timeFrame, calculation, dataSets, isNormalized]);
  
  // Refetch data when time frame changes
  useEffect(() => {
    console.log(`Time frame changed to: ${timeFrame}`);
    
    if (dataSets.length > 0) {
      console.log(`Refetching data for ${dataSets.length} datasets with time frame: ${timeFrame}`);
      refetchDataWithTimeFrame();
    } else {
      console.log('No datasets to refetch');
    }
  }, [timeFrame]);

  // Helper function to get start date based on timeframe
  const getStartDateForTimeFrame = (tf: string): string => {
    const now = new Date();
    
    switch (tf) {
      // Duration-based time frames
      case '1m':
        return subMonths(now, 1).toISOString().split('T')[0];
      case '3m':
        return subMonths(now, 3).toISOString().split('T')[0];
      case '6m':
        return subMonths(now, 6).toISOString().split('T')[0];
      case '1y':
        return subYears(now, 1).toISOString().split('T')[0];
      case '5y':
        return subYears(now, 5).toISOString().split('T')[0];
      case '10y':
        return subYears(now, 10).toISOString().split('T')[0];
      case 'max':
        return '1900-01-01';
        
      // Frequency-based time frames - adjust the lookback period based on frequency
      case 'daily':
        return subMonths(now, 3).toISOString().split('T')[0]; // 3 months of daily data
      case 'weekly':
        return subYears(now, 1).toISOString().split('T')[0]; // 1 year of weekly data
      case 'monthly':
        return subYears(now, 5).toISOString().split('T')[0]; // 5 years of monthly data
      case 'quarterly':
        return subYears(now, 10).toISOString().split('T')[0]; // 10 years of quarterly data
      case 'yearly':
        return subYears(now, 30).toISOString().split('T')[0]; // 30 years of yearly data
      default:
        return subYears(now, 1).toISOString().split('T')[0];
    }
  };

  // Add a new dataset to the chart
  const addDataSet = async (id?: string) => {
    // Show loading indicator
    setIsLoading(true);
    
    try {
      const dataSetId = id || selectedDataSet;
      
      // Check if dataSetId is valid and not already added
      if (!dataSetId) {
        console.error("No dataset selected");
        return;
      }
      
      if (dataSets.some(ds => ds.id === dataSetId)) {
        console.log(`Dataset ${dataSetId} already added`);
        return;
      }
      
      // Limit the number of datasets to 10 (TradingView-like comparison limit)
      if (dataSets.length >= 10) {
        alert('You can only compare up to 10 metrics at a time.');
        return;
      }
      
      console.log(`Adding dataset ${dataSetId}...`);
    
      // Determine the yAxisId for the new dataset
      // First dataset uses 'left', others use 'right1', 'right2', etc.
      const yAxisId = dataSets.length === 0 ? 'left' : `right${dataSets.length}`;
      
      // Get dataset info
      const dataSetInfo = availableDataSets[dataSetId];
      
      if (!dataSetInfo) {
        console.error(`Dataset info not found for ID: ${dataSetId}`);
        return;
      }
      
      // Fetch data based on the source
      let apiData;
      
      switch (dataSetInfo.source) {
        case 'fred':
          const fredResponse = await fredApi.getSeriesData(dataSetInfo.seriesId, {
            frequency: 'm', // Monthly data
            units: 'lin', // Linear units (no transformation)
            startDate: getStartDateForTimeFrame('5y'),
            endDate: new Date().toISOString().split('T')[0],
            calculation: 'value' // Raw values
          });
          
          // Add type assertion to handle the response properly
          apiData = (fredResponse as { data: Array<{ date: string, value: number }> }).data.map((item) => ({
            date: item.date,
            value: item.value
          }));
          break;
          
        case 'treasury':
          if (dataSetInfo.seriesId === 'debt') {
            const treasuryResponse = await treasuryApi.getDebtData({
              startDate: getStartDateForTimeFrame('5y'),
              endDate: new Date().toISOString().split('T')[0],
              limit: 1000
            });
            // Add type assertion to handle the response properly
            apiData = (treasuryResponse as { data: Array<{ date: string, value: number }> }).data.map((item) => ({
              date: item.date,
              value: item.value
            }));
          } else if (dataSetInfo.seriesId === 'yield_curve') {
            const treasuryResponse = await treasuryApi.getYieldCurveData({
              startDate: getStartDateForTimeFrame('5y'),
              endDate: new Date().toISOString().split('T')[0],
              limit: 1000
            });
            // Add type assertion to handle the response properly
            apiData = (treasuryResponse as { data: Array<{ date: string, year10?: number }> }).data.map((item) => ({
              date: item.date,
              value: item.year10 || 0 // Use 10-year yield as the primary value
            }));
          }
          break;
          
        case 'bls':
          const currentYear = new Date().getFullYear();
          let startYear;
          
          // Determine start year based on timeframe
          // Convert TimeFrame to appropriate year range
          if (timeFrame === 'yearly') {
            startYear = currentYear - 1;
          } else if (timeFrame === 'quarterly' || timeFrame === 'monthly') {
            startYear = currentYear - 5;
          } else {
            // For 'daily' and 'weekly', use a shorter time range
            startYear = currentYear - 2;
          }
          
          if (dataSetInfo.seriesId === 'unemployment') {
            const blsResponse = await blsApi.getUnemploymentData(startYear, currentYear);
            apiData = (blsResponse as { data: Array<{ date: string, value: number }> }).data;
          } else if (dataSetInfo.seriesId === 'cpi') {
            const blsResponse = await blsApi.getCPIData(startYear, currentYear);
            apiData = (blsResponse as { data: Array<{ date: string, value: number }> }).data;
          } else {
            // Custom BLS series
            const blsResponse = await blsApi.getCustomSeriesData(dataSetInfo.seriesId, startYear, currentYear);
            apiData = (blsResponse as { data: Array<{ date: string, value: number }> }).data;
          }
          break;
          
        case 'bea':
          // Define variables for BEA case
          const beaCurrentYear = new Date().getFullYear();
          const beaStartYear = beaCurrentYear - 5;
          
          if (dataSetInfo.seriesId === 'gdp') {
            const beaResponse = await beaApi.getGDPData(beaStartYear, beaCurrentYear);
            apiData = (beaResponse as { data: Array<{ date: string, value: number }> }).data;
          } else {
            // Custom BEA series
            const beaResponse = await beaApi.getCustomSeriesData(dataSetInfo.seriesId, beaStartYear, beaCurrentYear);
            apiData = (beaResponse as { data: Array<{ date: string, value: number }> }).data;
          }
          break;
          
        case 'census':
          if (dataSetInfo.seriesId === 'population') {
            const censusResponse = await censusApi.getPopulationData();
            apiData = (censusResponse as { data: Array<{ date: string, value: number }> }).data;
          } else if (dataSetInfo.seriesId === 'housing') {
            const censusResponse = await censusApi.getHousingData();
            apiData = (censusResponse as { data: Array<{ date: string, value: number }> }).data;
          } else {
            // Custom Census series
            const censusResponse = await censusApi.getCustomSeriesData(dataSetInfo.seriesId);
            apiData = (censusResponse as { data: Array<{ date: string, value: number }> }).data;
          }
          break;
          
        default:
          throw new Error(`Unknown data source: ${dataSetInfo.source}`);
      }
      
      if (apiData && apiData.length > 0) {
        const newDataSet: DataSet = {
          id: dataSetId,
          name: dataSetInfo.name,
          data: apiData,
          color: dataSetInfo.color,
          visible: true,
          yAxisId: yAxisId,
        };
        
        const newDataSets = [...dataSets, newDataSet];
        setDataSets(newDataSets);
        setSelectedDataSet('');
        
        // Update metric settings
        setMetricSettings(prev => ({
          ...prev,
          [dataSetId]: {
            visible: true,
            yAxisId: yAxisId,
            type: 'line'
          }
        }));
        
        // Add to active metrics
        setActiveMetrics(prev => [...prev, dataSetId]);
        
        // Close the dropdown
        setShowAddMetricDropdown(false);
      } else {
        throw new Error('No data returned from API');
      }
    } catch (error: any) {
      console.error(`Error fetching data for ${id || selectedDataSet}:`, error);
      
      // Don't add the dataset if we can't get real data
      let errorMessage = `Could not fetch real data for ${availableDataSets[id || selectedDataSet]?.name || (id || selectedDataSet)}.`;
      
      // Add more detailed error information if available
      if (error.message) {
        errorMessage += ` Error: ${error.message}`;
      }
      
      // Show a more detailed error message
      alert(errorMessage + '\n\nPlease check the console for more details and try again later.');
      
      // Reset the selected dataset
      setSelectedDataSet('');
      
      // Close the dropdown
      setShowAddMetricDropdown(false);
    } finally {
      // Reset loading state
      setIsLoading(false);
    }
  };

  // Remove a dataset from the chart
  const removeDataSet = (id: string) => {
    setDataSets(dataSets.filter(ds => ds.id !== id));
  };

  // Toggle dataset visibility
  const toggleDataSetVisibility = (id: string) => {
    setDataSets(dataSets.map(ds => 
      ds.id === id ? { ...ds, visible: !ds.visible } : ds
    ));
  };

  // Export chart as PNG
  const handleExport = async () => {
    if (!ref.current) return;
    
    try {
      const png = await getImage();
      if (png) {
        const link = document.createElement('a');
        link.download = `chart-${new Date().toISOString()}.png`;
        link.href = png;
        link.click();
      }
    } catch (error) {
      console.error('Failed to export chart:', error);
    }
  };
  
  // Export chart data as CSV
  const handleExportCSV = () => {
    setIsExportingCSV(true);
    try {
      // Check if we have data to export
      if (!chartData || chartData.length === 0) {
        console.warn('No chart data available to export');
        return;
      }
      
      if (!dataSets || dataSets.length === 0) {
        console.warn('No datasets available to export');
        return;
      }
      
      // Create CSV header
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Add headers
      const headers = ["Date", "Value"];
      
      // Safely add additional headers from datasets
      if (dataSets.length > 1) {
        dataSets.forEach(ds => {
          if (ds && ds.id && ds.id !== dataSets[0].id && ds.visible) {
            headers.push(ds.name || `Dataset ${ds.id}`);
          }
        });
      }
      
      if (calculation !== 'value') {
        headers.push("Change");
      }
      
      csvContent += headers.join(",") + "\r\n";
      
      // Add data rows
      chartData.forEach(point => {
        if (!point) return; // Skip null/undefined points
        
        // Safely convert values to string with null/undefined checks
        const row = [
          point.date || "", 
          (point.value !== null && point.value !== undefined) ? point.value.toString() : ""
        ];
        
        // Safely add values from additional datasets
        if (dataSets.length > 1) {
          dataSets.forEach(ds => {
            if (ds && ds.id && ds.id !== dataSets[0].id && ds.visible) {
              // Safely access and convert nested properties
              const value = point[ds.id];
              row.push((value !== null && value !== undefined) ? value.toString() : "");
            }
          });
        }
        
        if (calculation !== 'value') {
          const change = point.change;
          row.push((change !== null && change !== undefined) ? change.toString() : "0");
        }
        
        csvContent += row.join(",") + "\r\n";
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `chart-data-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('There was an error exporting the CSV file. Please try again.');
    } finally {
      setIsExportingCSV(false);
    }
  };
  
  // Validate a formula
  const validateFormula = (formula: string) => {
    if (!formula.trim()) {
      setFormulaError(null);
      return false;
    }
    
    try {
      // Check for basic syntax errors
      // This is a simple check - in a real app, you'd want more robust validation
      new Function(`return ${formula}`);
      
      // Check for valid variable references
      const variablePattern = /\b([A-Z])\b/g;
      const variables = formula.match(variablePattern) || [];
      
      // Check if all variables are valid dataset references
      const invalidVariables = variables.filter(variable => {
        const index = variable.charCodeAt(0) - 65; // Convert A->0, B->1, etc.
        return index < 0 || index >= dataSets.length;
      });
      
      if (invalidVariables.length > 0) {
        setFormulaError(`Invalid variable(s): ${invalidVariables.join(', ')}. Available variables: ${dataSets.map((_, i) => String.fromCharCode(65 + i)).join(', ')}`);
        return false;
      }
      
      // Check for function calls
      const functionPattern = /\b([a-zA-Z]+)\(/g;
      const functionMatches = [...formula.matchAll(functionPattern)];
      const functionNames = functionMatches.map(match => match[1]);
      
      // List of allowed functions
      const mathFunctions = Object.getOwnPropertyNames(Math)
        .filter(name => typeof Math[name as keyof typeof Math] === 'function');
      
      const financialFunctions = ['SMA', 'EMA', 'ROC', 'RSI', 'STDEV'];
      const allowedFunctions = [...mathFunctions, ...financialFunctions];
      
      // Check if all function calls are valid
      const invalidFunctions = functionNames.filter(name => !allowedFunctions.includes(name));
      
      if (invalidFunctions.length > 0) {
        setFormulaError(`Invalid function(s): ${invalidFunctions.join(', ')}`);
        return false;
      }
      
      setFormulaError(null);
      return true;
    } catch (error) {
      setFormulaError('Invalid formula syntax');
      return false;
    }
  };
  
  // Create a custom calculated dataset
  const createCustomDataset = () => {
    if (!customFormulaName || !customFormula) return;
    
    try {
      // Generate a unique ID for the custom dataset
      const customId = `custom_${Date.now()}`;
      
      // Parse the formula and create a function to evaluate it
      const parseFormula = (formula: string) => {
        // Replace dataset variables (A, B, C, etc.) with array references
        let parsedFormula = formula;
        
        // Create a map of dataset variables
        const datasetMap: { [key: string]: DataSet } = {};
        dataSets.forEach((ds, index) => {
          const varName = String.fromCharCode(65 + index); // A, B, C, etc.
          datasetMap[varName] = ds;
        });
        
        // Create a function that evaluates the formula for a specific date index
        return (dateIndex: number) => {
          // Create a scope object with dataset values for this date
          const scope: { [key: string]: number | ((...args: any[]) => number) } = {};
          
          // Add dataset values to scope
          Object.keys(datasetMap).forEach(varName => {
            const dataset = datasetMap[varName];
            if (dataset && dataset.data && dataset.data[dateIndex]) {
              scope[varName] = dataset.data[dateIndex].value;
            } else {
              scope[varName] = NaN; // Use NaN for missing values
            }
          });
          
          // Add math functions to scope
          Object.getOwnPropertyNames(Math).forEach(name => {
            if (typeof Math[name as keyof typeof Math] === 'function') {
              // Cast the Math function to our expected function type
              scope[name] = Math[name as keyof typeof Math] as unknown as ((...args: any[]) => number);
            }
          });
          
          // Add basic arithmetic operations with dataset names
          scope.ADD = ((...args: any[]) => {
            if (args.length < 2) return NaN;
            let result = 0;
            for (const arg of args) {
              const varName = typeof arg === 'string' ? arg : String(arg);
              if (datasetMap[varName] && datasetMap[varName].data && datasetMap[varName].data[dateIndex]) {
                // Use original value if available (for normalized datasets)
                const point = datasetMap[varName].data[dateIndex];
                const value = point.original_value !== undefined ? point.original_value : point.value;
                result += value;
              } else if (!isNaN(Number(arg))) {
                result += Number(arg);
              }
            }
            return result;
          }) as ((...args: any[]) => number);
          
          scope.SUBTRACT = ((...args: any[]) => {
            if (args.length < 2) return NaN;
            const varName1 = typeof args[0] === 'string' ? args[0] : String(args[0]);
            const varName2 = typeof args[1] === 'string' ? args[1] : String(args[1]);
            
            let value1, value2;
            
            if (datasetMap[varName1] && datasetMap[varName1].data && datasetMap[varName1].data[dateIndex]) {
              // Use original value if available (for normalized datasets)
              const point = datasetMap[varName1].data[dateIndex];
              value1 = point.original_value !== undefined ? point.original_value : point.value;
            } else if (!isNaN(Number(args[0]))) {
              value1 = Number(args[0]);
            } else {
              return NaN;
            }
            
            if (datasetMap[varName2] && datasetMap[varName2].data && datasetMap[varName2].data[dateIndex]) {
              // Use original value if available (for normalized datasets)
              const point = datasetMap[varName2].data[dateIndex];
              value2 = point.original_value !== undefined ? point.original_value : point.value;
            } else if (!isNaN(Number(args[1]))) {
              value2 = Number(args[1]);
            } else {
              return NaN;
            }
            
            // Support for multiple arguments (subtract all from the first)
            let result = value1 - value2;
            for (let i = 2; i < args.length; i++) {
              const varName = typeof args[i] === 'string' ? args[i] : String(args[i]);
              let nextValue;
              
              if (datasetMap[varName] && datasetMap[varName].data && datasetMap[varName].data[dateIndex]) {
                // Use original value if available (for normalized datasets)
                const point = datasetMap[varName].data[dateIndex];
                nextValue = point.original_value !== undefined ? point.original_value : point.value;
              } else if (!isNaN(Number(args[i]))) {
                nextValue = Number(args[i]);
              } else {
                continue;
              }
              
              result -= nextValue;
            }
            
            return result;
          }) as ((...args: any[]) => number);
          
          scope.MULTIPLY = ((...args: any[]) => {
            if (args.length < 2) return NaN;
            let result = 1;
            for (const arg of args) {
              const varName = typeof arg === 'string' ? arg : String(arg);
              if (datasetMap[varName] && datasetMap[varName].data && datasetMap[varName].data[dateIndex]) {
                // Use original value if available (for normalized datasets)
                const point = datasetMap[varName].data[dateIndex];
                const value = point.original_value !== undefined ? point.original_value : point.value;
                result *= value;
              } else if (!isNaN(Number(arg))) {
                result *= Number(arg);
              }
            }
            return result;
          }) as ((...args: any[]) => number);
          
          scope.DIVIDE = ((...args: any[]) => {
            if (args.length < 2) return NaN;
            const varName1 = typeof args[0] === 'string' ? args[0] : String(args[0]);
            const varName2 = typeof args[1] === 'string' ? args[1] : String(args[1]);
            
            let value1, value2;
            
            if (datasetMap[varName1] && datasetMap[varName1].data && datasetMap[varName1].data[dateIndex]) {
              // Use original value if available (for normalized datasets)
              const point = datasetMap[varName1].data[dateIndex];
              value1 = point.original_value !== undefined ? point.original_value : point.value;
            } else if (!isNaN(Number(args[0]))) {
              value1 = Number(args[0]);
            } else {
              return NaN;
            }
            
            if (datasetMap[varName2] && datasetMap[varName2].data && datasetMap[varName2].data[dateIndex]) {
              // Use original value if available (for normalized datasets)
              const point = datasetMap[varName2].data[dateIndex];
              value2 = point.original_value !== undefined ? point.original_value : point.value;
            } else if (!isNaN(Number(args[1]))) {
              value2 = Number(args[1]);
            } else {
              return NaN;
            }
            
            if (value2 === 0) return NaN;
            
            // Support for multiple arguments (divide first by all others)
            let result = value1 / value2;
            for (let i = 2; i < args.length; i++) {
              const varName = typeof args[i] === 'string' ? args[i] : String(args[i]);
              let nextValue;
              
              if (datasetMap[varName] && datasetMap[varName].data && datasetMap[varName].data[dateIndex]) {
                // Use original value if available (for normalized datasets)
                const point = datasetMap[varName].data[dateIndex];
                nextValue = point.original_value !== undefined ? point.original_value : point.value;
              } else if (!isNaN(Number(args[i]))) {
                nextValue = Number(args[i]);
              } else {
                continue;
              }
              
              if (nextValue === 0) return NaN;
              result /= nextValue;
            }
            
            return result;
          }) as ((...args: any[]) => number);
          
          scope.RATIO = ((...args: any[]) => {
            if (args.length < 2) return NaN;
            const varName1 = typeof args[0] === 'string' ? args[0] : String(args[0]);
            const varName2 = typeof args[1] === 'string' ? args[1] : String(args[1]);
            
            let value1, value2;
            
            if (datasetMap[varName1] && datasetMap[varName1].data && datasetMap[varName1].data[dateIndex]) {
              // Use original value if available (for normalized datasets)
              const point = datasetMap[varName1].data[dateIndex];
              value1 = point.original_value !== undefined ? point.original_value : point.value;
            } else if (!isNaN(Number(args[0]))) {
              value1 = Number(args[0]);
            } else {
              return NaN;
            }
            
            if (datasetMap[varName2] && datasetMap[varName2].data && datasetMap[varName2].data[dateIndex]) {
              // Use original value if available (for normalized datasets)
              const point = datasetMap[varName2].data[dateIndex];
              value2 = point.original_value !== undefined ? point.original_value : point.value;
            } else if (!isNaN(Number(args[1]))) {
              value2 = Number(args[1]);
            } else {
              return NaN;
            }
            
            return value2 !== 0 ? (value1 / value2) * 100 : NaN;
          }) as ((...args: any[]) => number);
          
          // Add AVERAGE function
          scope.AVERAGE = ((...args: any[]) => {
            if (args.length < 1) return NaN;
            
            let sum = 0;
            let count = 0;
            
            for (const arg of args) {
              const varName = typeof arg === 'string' ? arg : String(arg);
              
              if (datasetMap[varName] && datasetMap[varName].data && datasetMap[varName].data[dateIndex]) {
                // Use original value if available (for normalized datasets)
                const point = datasetMap[varName].data[dateIndex];
                const value = point.original_value !== undefined ? point.original_value : point.value;
                
                if (!isNaN(value)) {
                  sum += value;
                  count++;
                }
              } else if (!isNaN(Number(arg))) {
                sum += Number(arg);
                count++;
              }
            }
            
            return count > 0 ? sum / count : NaN;
          }) as ((...args: any[]) => number);
          
          // Add financial functions to scope
          scope.SMA = ((...args: any[]) => {
            const varName = args[0] as string;
            const periods = args[1] as number;
            
            // Simple Moving Average
            if (!datasetMap[varName]) return NaN;
            
            const values: number[] = [];
            for (let i = Math.max(0, dateIndex - periods + 1); i <= dateIndex; i++) {
              if (datasetMap[varName].data[i] && datasetMap[varName].data[i].value !== null) {
                values.push(Number(datasetMap[varName].data[i].value));
              }
            }
            
            return values.length > 0 
              ? values.reduce((sum, val) => sum + val, 0) / values.length 
              : NaN;
          }) as ((...args: any[]) => number);
          
          scope.EMA = ((...args: any[]) => {
            const varName = args[0] as string;
            const periods = args[1] as number;
            
            // Exponential Moving Average
            if (!datasetMap[varName]) return NaN;
            
            const k = 2 / (periods + 1); // Smoothing factor
            
            // Get the initial value from scope and ensure it's a number
            const scopeValue = scope[varName];
            let ema: number = typeof scopeValue === 'number' ? scopeValue : 0;
            
            for (let i = dateIndex - 1; i >= Math.max(0, dateIndex - periods); i--) {
              if (datasetMap[varName].data[i] && datasetMap[varName].data[i].value !== null) {
                const dataValue = Number(datasetMap[varName].data[i].value);
                if (!isNaN(dataValue)) {
                  ema = dataValue * k + ema * (1 - k);
                }
              }
            }
            
            return ema;
          }) as ((...args: any[]) => number);
          
          scope.ROC = ((...args: any[]) => {
            const varName = args[0] as string;
            const periods = args[1] as number;
            
            // Rate of Change
            if (!datasetMap[varName]) return NaN;
            
            const scopeValue = scope[varName];
            const currentValue = typeof scopeValue === 'number' ? scopeValue : 0;
            
            const pastIndex = dateIndex - periods;
            
            if (pastIndex >= 0 && datasetMap[varName].data[pastIndex] && 
                datasetMap[varName].data[pastIndex].value !== null && 
                datasetMap[varName].data[pastIndex].value !== 0) {
              const pastValue = Number(datasetMap[varName].data[pastIndex].value);
              if (isNaN(pastValue) || pastValue === 0) return NaN;
              
              const result = ((currentValue - pastValue) / pastValue) * 100;
              return result;
            }
            
            return NaN;
          }) as ((...args: any[]) => number);
          
          scope.RSI = ((...args: any[]) => {
            const varName = args[0] as string;
            const periods = args.length > 1 ? args[1] as number : 14;
            
            // Relative Strength Index
            if (!datasetMap[varName]) return NaN;
            
            let gains = 0;
            let losses = 0;
            
            for (let i = Math.max(0, dateIndex - periods + 1); i <= dateIndex; i++) {
              if (i > 0 && datasetMap[varName].data[i] && datasetMap[varName].data[i-1] &&
                  datasetMap[varName].data[i].value !== null && datasetMap[varName].data[i-1].value !== null) {
                const currentValue = Number(datasetMap[varName].data[i].value);
                const previousValue = Number(datasetMap[varName].data[i-1].value);
                const change = currentValue - previousValue;
                if (change > 0) {
                  gains += change;
                } else {
                  losses -= change;
                }
              }
            }
            
            if (losses === 0) return 100;
            if (gains === 0) return 0;
            
            const rs = gains / losses;
            return 100 - (100 / (1 + rs));
          }) as ((...args: any[]) => number);
          
          scope.STDEV = ((...args: any[]) => {
            const varName = args[0] as string;
            const periods = args[1] as number;
            
            // Standard Deviation
            if (!datasetMap[varName]) return NaN;
            
            const values: number[] = [];
            for (let i = Math.max(0, dateIndex - periods + 1); i <= dateIndex; i++) {
              if (datasetMap[varName].data[i] && datasetMap[varName].data[i].value !== null) {
                values.push(Number(datasetMap[varName].data[i].value));
              }
            }
            
            if (values.length === 0) return NaN;
            
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
            const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
            
            return Math.sqrt(variance);
          }) as ((...args: any[]) => number);
          
          // Evaluate the formula
          try {
            // Create a function with the scope variables
            const evalFunction = new Function(...Object.keys(scope), `return ${parsedFormula}`);
            return evalFunction(...Object.values(scope));
          } catch (error) {
            console.error('Error evaluating formula:', error);
            return NaN;
          }
        };
      };
      
      // Create the formula evaluation function
      const evaluateFormula = parseFormula(customFormula);
      
      // Use the first dataset as a reference for dates
      const referenceDataset = dataSets[0];
      
      // Create a new dataset with calculated values
      const newData = referenceDataset.data.map((point, index) => {
        try {
          const calculatedValue = evaluateFormula(index);
          return {
            date: point.date,
            value: isNaN(calculatedValue) ? null : calculatedValue
          };
        } catch (error) {
          console.error('Error calculating value:', error);
          return {
            date: point.date,
            value: null
          };
        }
      });
      
      const newDataSet: DataSet = {
        id: customId,
        name: customFormulaName,
        data: newData,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color
        visible: true,
        yAxisId: dataSets.length > 0 ? 'right' : 'left',
        formula: customFormula // Store the formula for reference
      };
      
      setDataSets([...dataSets, newDataSet]);
      setCustomFormula('');
      setCustomFormulaName('');
      setShowFormulaModal(false);
    } catch (error) {
      console.error('Failed to create custom dataset:', error);
      alert('Failed to create custom dataset. Please check your formula.');
    }
  };

  // Calculate statistics for the current view
  const calculateStats = () => {
    if (chartData.length === 0 || dataSets.length === 0 || !dataSets[0]?.data?.length) return null;
    
    try {
      const lastPoint = chartData[chartData.length - 1];
      if (!lastPoint || lastPoint.value == null) return null;
      
      // Get previous day's point for daily change calculation
      const prevDayPoint = chartData.length > 1 ? chartData[chartData.length - 2] : null;
      
      const lastValue = lastPoint.value;
      const lastChange = prevDayPoint && prevDayPoint.value != null 
        ? lastValue - prevDayPoint.value 
        : (lastPoint.change || 0);
      const lastChangePercent = prevDayPoint && prevDayPoint.value != null && prevDayPoint.value !== 0
        ? (lastChange / prevDayPoint.value) * 100
        : 0;
      
      // Find data points for different time periods
      const now = new Date(lastPoint.date);
      const weekAgo = subWeeks(now, 1);
      const monthAgo = subMonths(now, 1);
      const quarterAgo = subQuarters(now, 1);
      const yearAgo = subYears(now, 1);
      
      // Find closest data points to these dates
      const findClosestPoint = (targetDate: Date) => {
        if (!dataSets[0]?.data?.length) return { date: now.toISOString(), value: lastValue };
        
        const targetTime = targetDate.getTime();
        return dataSets[0].data.reduce((closest, point) => {
          if (!point.date || point.value == null) return closest;
          
          const pointDate = new Date(point.date);
          const closestDate = new Date(closest.date);
          return Math.abs(pointDate.getTime() - targetTime) < Math.abs(closestDate.getTime() - targetTime)
            ? point
            : closest;
        }, dataSets[0].data[0]);
      };
      
      const weekAgoPoint = findClosestPoint(weekAgo);
      const monthAgoPoint = findClosestPoint(monthAgo);
      const quarterAgoPoint = findClosestPoint(quarterAgo);
      const yearAgoPoint = findClosestPoint(yearAgo);
      
      // Calculate changes
      const weeklyChange = lastValue - (weekAgoPoint.value || 0);
      const monthlyChange = lastValue - (monthAgoPoint.value || 0);
      const quarterlyChange = lastValue - (quarterAgoPoint.value || 0);
      const yearlyChange = lastValue - (yearAgoPoint.value || 0);
      
      return {
        lastValue,
        lastChange,
        lastChangePercent,
        weeklyChange,
        weeklyChangePercent: weekAgoPoint.value && weekAgoPoint.value !== 0 ? (weeklyChange / weekAgoPoint.value) * 100 : 0,
        monthlyChange,
        monthlyChangePercent: monthAgoPoint.value && monthAgoPoint.value !== 0 ? (monthlyChange / monthAgoPoint.value) * 100 : 0,
        quarterlyChange,
        quarterlyChangePercent: quarterAgoPoint.value && quarterAgoPoint.value !== 0 ? (quarterlyChange / quarterAgoPoint.value) * 100 : 0,
        yearlyChange,
        yearlyChangePercent: yearAgoPoint.value && yearAgoPoint.value !== 0 ? (yearlyChange / yearAgoPoint.value) * 100 : 0,
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return null;
    }
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
            Interactive Data Chart
            <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
              [{timeFrame}]
            </span>
            {isLoading && (
              <span className="ml-2 inline-block animate-pulse text-blue-500 text-sm">
                (Loading...)
              </span>
            )}
          </h1>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={isImageLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            >
              {isImageLoading ? 'Exporting...' : 'Export PNG'}
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExportingCSV || chartData.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isExportingCSV ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              type="button"
              onClick={() => setShowEvents(!showEvents)}
              className={`px-4 py-2 rounded transition-colors ${
                showEvents 
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {showEvents ? 'Hide Events' : 'Show Events'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDataExplorer(!showDataExplorer);
                setSearchTerm(''); // Reset search term when toggling Data Explorer
              }}
              className={`px-4 py-2 rounded transition-colors ${
                showDataExplorer 
                  ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-300 dark:hover:bg-blue-700' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {showDataExplorer ? 'Hide Data Explorer' : 'Data Explorer'}
            </button>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time Frame
            </label>
            <select
              id="timeframe"
              value={timeFrame}
              onChange={(e) => {
                const newTimeFrame = e.target.value as TimeFrame;
                console.log(`Changing time frame to: ${newTimeFrame}`);
                setTimeFrame(newTimeFrame);
                // Note: No need to call refetchDataWithTimeFrame here as the useEffect will handle it
              }}
              className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="daily">Daily (D)</option>
              <option value="weekly">Weekly (W)</option>
              <option value="monthly">Monthly (M)</option>
              <option value="1m">1 Month</option>
              <option value="3m">3 Months</option>
              <option value="6m">6 Months</option>
              <option value="1y">1 Year</option>
              <option value="5y">5 Years</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="calculation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Calculation Type
            </label>
            <select
              id="calculation"
              value={calculation}
              onChange={(e) => setCalculation(e.target.value as ChangeCalculation)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="value">Actual Value</option>
              <option value="period-to-period">Period to Period Change</option>
              <option value="period-to-period-percent">Period to Period % Change</option>
              <option value="day-to-day">Day to Day Change</option>
              <option value="day-to-day-percent">Day to Day % Change</option>
              <option value="week-to-week">Week to Week Change</option>
              <option value="week-to-week-percent">Week to Week % Change</option>
              <option value="quarter-to-quarter">Quarter to Quarter Change</option>
              <option value="quarter-to-quarter-percent">Quarter to Quarter % Change</option>
              <option value="year-to-year">Year to Year Change</option>
              <option value="year-to-year-percent">Year to Year % Change</option>
            </select>
          </div>
          
          <div className="flex space-x-2">
            <div className="flex-grow">
              <label htmlFor="dataset" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Add Data Set
              </label>
              <div className="flex">
                <select
                  id="dataset"
                  value={selectedDataSet}
                  onChange={(e) => setSelectedDataSet(e.target.value)}
                  className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a data set</option>
                  {Object.keys(filteredDataSets).map(key => (
                    <option key={key} value={key} disabled={dataSets.some(ds => ds.id === key)}>
                      {filteredDataSets[key].name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => addDataSet()}
                  disabled={!selectedDataSet || dataSets.some(ds => ds.id === selectedDataSet)}
                  className="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Data Explorer */}
        {showDataExplorer && (
          <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Data Explorer</h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowFormulaModal(true)}
                  className="px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                >
                  Create Custom Formula
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Data Sets
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name..."
                className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.keys(filteredDataSets).map(key => (
                <div 
                  key={key}
                  className={`p-3 rounded-lg border ${
                    dataSets.some(ds => ds.id === key)
                      ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className={`dataset-color-indicator dataset-color-${key}`}
                      ></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{filteredDataSets[key].name}</span>
                    </div>
                    {dataSets.some(ds => ds.id === key) ? (
                      <button
                        type="button"
                        onClick={() => removeDataSet(key)}
                        className="text-red-600 hover:text-red-800"
                        aria-label={`Remove ${filteredDataSets[key].name}`}
                        title={`Remove ${filteredDataSets[key].name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDataSet(key);
                          addDataSet();
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        aria-label={`Add ${filteredDataSets[key].name}`}
                        title={`Add ${filteredDataSets[key].name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Calculation Toolbar */}
        {dataSets.length > 1 && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Calculations</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  // Create a custom formula for adding the first two datasets
                  if (dataSets.length >= 2) {
                    setCustomFormulaName(`${dataSets[0].name} + ${dataSets[1].name}`);
                    setCustomFormula(`ADD(A, B)`);
                    createCustomDataset();
                  }
                }}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  // Create a custom formula for subtracting the second dataset from the first
                  if (dataSets.length >= 2) {
                    setCustomFormulaName(`${dataSets[0].name} - ${dataSets[1].name}`);
                    setCustomFormula(`SUBTRACT(A, B)`);
                    createCustomDataset();
                  }
                }}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                Subtract
              </button>
              <button
                type="button"
                onClick={() => {
                  // Create a custom formula for multiplying the first two datasets
                  if (dataSets.length >= 2) {
                    setCustomFormulaName(`${dataSets[0].name} × ${dataSets[1].name}`);
                    setCustomFormula(`MULTIPLY(A, B)`);
                    createCustomDataset();
                  }
                }}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                Multiply
              </button>
              <button
                type="button"
                onClick={() => {
                  // Create a custom formula for dividing the first dataset by the second
                  if (dataSets.length >= 2) {
                    setCustomFormulaName(`${dataSets[0].name} ÷ ${dataSets[1].name}`);
                    setCustomFormula(`DIVIDE(A, B)`);
                    createCustomDataset();
                  }
                }}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                Divide
              </button>
              <button
                type="button"
                onClick={() => {
                  // Create a custom formula for calculating the ratio between the first two datasets
                  if (dataSets.length >= 2) {
                    setCustomFormulaName(`${dataSets[0].name} / ${dataSets[1].name} (%)`);
                    setCustomFormula(`RATIO(A, B)`);
                    createCustomDataset();
                  }
                }}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                Ratio (%)
              </button>
              <button
                type="button"
                onClick={() => {
                  // Create a custom formula for calculating the average of all datasets
                  if (dataSets.length >= 2) {
                    const datasetNames = dataSets.slice(0, Math.min(dataSets.length, 5)).map(ds => ds.name).join(', ');
                    setCustomFormulaName(`Average (${datasetNames})`);
                    
                    // Create formula with all available datasets (up to 5)
                    const variables = Array.from({ length: Math.min(dataSets.length, 5) }, (_, i) => 
                      String.fromCharCode(65 + i)
                    ).join(', ');
                    
                    setCustomFormula(`AVERAGE(${variables})`);
                    createCustomDataset();
                  }
                }}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                Average
              </button>
              <button
                type="button"
                onClick={() => setShowFormulaModal(true)}
                className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm hover:bg-green-200 dark:hover:bg-green-800"
              >
                Custom Formula
              </button>
            </div>
          </div>
        )}

        {/* Active Data Sets with TradingView-like controls */}
        {dataSets.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active Data Sets</h3>
            <div className="flex flex-wrap gap-2">
              {dataSets.map(ds => (
                <div 
                  key={ds.id}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                    ds.visible ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <div 
                    className={`dataset-color-dot dataset-color-dot-${ds.id}`}
                    data-color={ds.color}
                  ></div>
                  <span>{ds.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleDataSetVisibility(ds.id)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    aria-label={ds.visible ? `Hide ${ds.name}` : `Show ${ds.name}`}
                    title={ds.visible ? `Hide ${ds.name}` : `Show ${ds.name}`}
                  >
                    {ds.visible ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                  {dataSets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDataSet(ds.id)}
                      className="text-gray-500 hover:text-red-600"
                      aria-label={`Remove ${ds.name}`}
                      title={`Remove ${ds.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              
              {/* TradingView-style Indicators/Metrics button */}
              {dataSets.length < 10 && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMetricDropdown(!showAddMetricDropdown);
                      setSearchTerm(''); // Reset search term when toggling Add Metric dropdown
                    }}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    aria-label="Add Indicator"
                    title="Add a new indicator to the chart"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                        </svg>
                        <span>Indicators</span>
                      </>
                    )}
                  </button>
                  
                  {/* TradingView-style dropdown for adding metrics */}
                  {showAddMetricDropdown && (
                    <div className="absolute z-50 mt-1 w-72 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 max-h-96 overflow-hidden flex flex-col">
                      {/* Search header */}
                      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="Search indicators..."
                            className="block w-full pl-10 pr-3 py-2 text-sm border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      {/* Indicators list with categories */}
                      <div className="overflow-y-auto">
                        {Object.keys(availableDataSets).length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            No indicators available
                          </div>
                        ) : Object.keys(filteredDataSets).length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            No indicators match your search
                          </div>
                        ) : (
                          <div className="py-1">
                            {/* Economic Indicators Category */}
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                              ECONOMIC INDICATORS
                            </div>
                            {Object.keys(filteredDataSets)
                              .filter(key => ['gdp', 'unemployment', 'cpi', 'ppi', 'industrial_production', 'retail_sales', 'housing_starts', 'personal_income', 'personal_spending', 'consumer_sentiment', 'corporate_profits'].includes(key))
                              .map(key => (
                                <button
                                  key={key}
                                  className={`block w-full text-left px-4 py-2 text-sm ${
                                    dataSets.some(ds => ds.id === key) || isLoading
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900'
                                  }`}
                                  onClick={async () => {
                                    if (!dataSets.some(ds => ds.id === key) && !isLoading) {
                                      try {
                                        setIsLoading(true);
                                        await addDataSet(key);
                                      } catch (error) {
                                        console.error('Error adding indicator:', error);
                                      }
                                    }
                                  }}
                                  disabled={dataSets.some(ds => ds.id === key) || isLoading}
                                >
                                  <div className="flex items-center">
                                    <span
                                      className={`w-3 h-3 rounded-full mr-2 dataset-color-dot`}
                                      data-color={filteredDataSets[key].color}
                                    ></span>
                                    <span className="flex-1">{filteredDataSets[key].name}</span>
                                    {dataSets.some(ds => ds.id === key) && (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </button>
                              ))}
                              
                            {/* Financial Markets Category */}
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                              FINANCIAL MARKETS
                            </div>
                            {Object.keys(filteredDataSets)
                              .filter(key => ['sp500', 'treasury10y', 'treasury2y', 'fedfunds', 'mortgage30y', 'yield_curve', 'debt'].includes(key))
                              .map(key => (
                                <button
                                  key={key}
                                  className={`block w-full text-left px-4 py-2 text-sm ${
                                    dataSets.some(ds => ds.id === key) || isLoading
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900'
                                  }`}
                                  onClick={async () => {
                                    if (!dataSets.some(ds => ds.id === key) && !isLoading) {
                                      try {
                                        setIsLoading(true);
                                        await addDataSet(key);
                                      } catch (error) {
                                        console.error('Error adding indicator:', error);
                                      }
                                    }
                                  }}
                                  disabled={dataSets.some(ds => ds.id === key) || isLoading}
                                >
                                  <div className="flex items-center">
                                    <span
                                      className="w-3 h-3 rounded-full mr-2 dataset-color-dot"
                                      data-color={filteredDataSets[key].color}
                                    ></span>
                                    <span className="flex-1">{filteredDataSets[key].name}</span>
                                    {dataSets.some(ds => ds.id === key) && (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </button>
                              ))}
                              
                            {/* Other Indicators Category */}
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                              OTHER INDICATORS
                            </div>
                            {Object.keys(filteredDataSets)
                              .filter(key => !['gdp', 'unemployment', 'cpi', 'ppi', 'industrial_production', 'retail_sales', 'housing_starts', 'personal_income', 'personal_spending', 'consumer_sentiment', 'corporate_profits', 'sp500', 'treasury10y', 'treasury2y', 'fedfunds', 'mortgage30y', 'yield_curve', 'debt'].includes(key))
                              .map(key => (
                                <button
                                  key={key}
                                  className={`block w-full text-left px-4 py-2 text-sm ${
                                    dataSets.some(ds => ds.id === key) || isLoading
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900'
                                  }`}
                                  onClick={async () => {
                                    if (!dataSets.some(ds => ds.id === key) && !isLoading) {
                                      try {
                                        setIsLoading(true);
                                        await addDataSet(key);
                                      } catch (error) {
                                        console.error('Error adding indicator:', error);
                                      }
                                    }
                                  }}
                                  disabled={dataSets.some(ds => ds.id === key) || isLoading}
                                >
                                  <div className="flex items-center">
                                    <span
                                      className={`w-3 h-3 rounded-full mr-2 dataset-color-dot`}
                                      data-color={filteredDataSets[key].color}
                                    ></span>
                                    <span className="flex-1">{filteredDataSets[key].name}</span>
                                    {dataSets.some(ds => ds.id === key) && (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Footer with additional options */}
                      <div className="border-t border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-700">
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                          onClick={() => {
                            setShowAddMetricDropdown(false);
                            setShowFormulaModal(true);
                          }}
                        >
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Create Custom Indicator
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Chart */}
        <div 
          className={`${isFullscreen ? 'h-screen w-screen' : 'h-96'} bg-white dark:bg-dark-card rounded-lg shadow-card dark:shadow-card-dark relative`} 
          ref={(el) => {
            // Handle both refs
            if (ref) {
              (ref as any).current = el;
            }
            chartContainerRef.current = el;
          }}
        >
          {/* Fullscreen Controls */}
          <div className={`${isFullscreen ? 'block' : 'hidden'} chart-fullscreen-controls absolute top-2 left-2 z-10 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md`}>
            {/* TradingView-style Indicators Button for Fullscreen Mode */}
            <div className="relative mb-2" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowAddMetricDropdown(!showAddMetricDropdown);
                  setSearchTerm(''); // Reset search term when toggling Add Metric dropdown
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                aria-label="Add Indicator"
                title="Add a new indicator to the chart"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                    </svg>
                    <span>Indicators</span>
                  </>
                )}
              </button>
              
              {/* TradingView-style dropdown for adding metrics */}
              {showAddMetricDropdown && (
                <div className="absolute z-50 mt-1 w-72 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 max-h-96 overflow-hidden flex flex-col">
                  {/* Search header */}
                  <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search indicators..."
                        className="block w-full pl-10 pr-3 py-2 text-sm border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    
                    </div>
                  </div>
                  
                  {/* Indicators list with categories */}
                  <div className="overflow-y-auto">
                    {Object.keys(availableDataSets).length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        No indicators available
                      </div>
                    ) : Object.keys(filteredDataSets).length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        No indicators match your search
                      </div>
                    ) : (
                      <div className="py-1">
                        {/* Economic Indicators Category */}
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                          ECONOMIC INDICATORS
                        </div>
                        {Object.keys(filteredDataSets)
                          .filter(key => ['gdp', 'unemployment', 'cpi', 'ppi', 'industrial_production', 'retail_sales', 'housing_starts', 'personal_income', 'personal_spending', 'consumer_sentiment', 'corporate_profits'].includes(key))
                          .map(key => (
                            <button
                              key={key}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                dataSets.some(ds => ds.id === key) || isLoading
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900'
                              }`}
                              onClick={async () => {
                                if (!dataSets.some(ds => ds.id === key) && !isLoading) {
                                  try {
                                    setIsLoading(true);
                                    await addDataSet(key);
                                  } catch (error) {
                                    console.error('Error adding indicator:', error);
                                  }
                                }
                              }}
                              disabled={dataSets.some(ds => ds.id === key) || isLoading}
                            >
                              <div className="flex items-center">
                                <ColorIndicator color={filteredDataSets[key].color} />
                                <span className="flex-1">{filteredDataSets[key].name}</span>
                                {dataSets.some(ds => ds.id === key) && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          ))}
                          
                        {/* Financial Markets Category */}
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                          FINANCIAL MARKETS
                        </div>
                        {Object.keys(filteredDataSets)
                          .filter(key => ['sp500', 'treasury10y', 'treasury2y', 'fedfunds', 'mortgage30y', 'yield_curve', 'debt'].includes(key))
                          .map(key => (
                            <button
                              key={key}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                dataSets.some(ds => ds.id === key) || isLoading
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900'
                              }`}
                              onClick={async () => {
                                if (!dataSets.some(ds => ds.id === key) && !isLoading) {
                                  try {
                                    setIsLoading(true);
                                    await addDataSet(key);
                                  } catch (error) {
                                    console.error('Error adding indicator:', error);
                                  }
                                }
                              }}
                              disabled={dataSets.some(ds => ds.id === key) || isLoading}
                            >
                              <div className="flex items-center">
                                <ColorIndicator color={filteredDataSets[key].color} />
                                <span className="flex-1">{filteredDataSets[key].name}</span>
                                {dataSets.some(ds => ds.id === key) && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          ))}
                          
                        {/* Other Indicators Category */}
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                          OTHER INDICATORS
                        </div>
                        {Object.keys(filteredDataSets)
                          .filter(key => !['gdp', 'unemployment', 'cpi', 'ppi', 'industrial_production', 'retail_sales', 'housing_starts', 'personal_income', 'personal_spending', 'consumer_sentiment', 'corporate_profits', 'sp500', 'treasury10y', 'treasury2y', 'fedfunds', 'mortgage30y', 'yield_curve', 'debt'].includes(key))
                          .map(key => (
                            <button
                              key={key}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                dataSets.some(ds => ds.id === key) || isLoading
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900'
                              }`}
                              onClick={async () => {
                                if (!dataSets.some(ds => ds.id === key) && !isLoading) {
                                  try {
                                    setIsLoading(true);
                                    await addDataSet(key);
                                  } catch (error) {
                                    console.error('Error adding indicator:', error);
                                  }
                                }
                              }}
                              disabled={dataSets.some(ds => ds.id === key) || isLoading}
                            >
                              <div className="flex items-center">
                                <span
                                  className="w-3 h-3 rounded-full mr-2 dataset-color-dot"
                                  data-color={filteredDataSets[key].color}
                                ></span>
                                <span className="flex-1">{filteredDataSets[key].name}</span>
                                {dataSets.some(ds => ds.id === key) && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Footer with additional options */}
                  <div className="border-t border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-700">
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                      onClick={() => {
                        setShowAddMetricDropdown(false);
                        setShowFormulaModal(true);
                      }}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create Custom Indicator
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Active Data Sets in Fullscreen Mode */}
            {dataSets.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {dataSets.map(ds => (
                  <div 
                    key={ds.id}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                      ds.visible ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div 
                      className={`dataset-color-dot dataset-color-dot-${ds.id}`}
                      data-color={ds.color}
                    ></div>
                    <span>{ds.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleDataSetVisibility(ds.id)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      aria-label={ds.visible ? `Hide ${ds.name}` : `Show ${ds.name}`}
                      title={ds.visible ? `Hide ${ds.name}` : `Show ${ds.name}`}
                    >
                      {ds.visible ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDataSet(ds.id)}
                      className="text-gray-500 hover:text-red-600"
                      aria-label={`Remove ${ds.name}`}
                      title={`Remove ${ds.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Time Frame Controls in Fullscreen Mode */}
            <div className="flex space-x-2">
              <label htmlFor="timeFrameSelect" className="sr-only">Time Frame</label>
              <select
                id="timeFrameSelect"
                value={timeFrame}
                onChange={(e) => {
                  const newTimeFrame = e.target.value as TimeFrame;
                  console.log(`Changing time frame to: ${newTimeFrame} (fullscreen)`);
                  setTimeFrame(newTimeFrame);
                  // Note: No need to call refetchDataWithTimeFrame here as the useEffect will handle it
                }}
                className="text-xs rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="daily">Daily (D)</option>
                <option value="weekly">Weekly (W)</option>
                <option value="monthly">Monthly (M)</option>
                <option value="quarterly">Quarterly (Q)</option>
                <option value="yearly">Yearly (Y)</option>
              </select>
              
              <label htmlFor="calculationSelect" className="sr-only">Calculation Type</label>
              <select
                id="calculationSelect"
                value={calculation}
                onChange={(e) => setCalculation(e.target.value as ChangeCalculation)}
                className="text-xs rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                aria-label="Calculation Type"
              >
                <option value="value">Raw Value</option>
                <option value="period-to-period">Period Change</option>
                <option value="period-to-period-percent">Period % Change</option>
                <option value="year-to-year">Year-over-Year</option>
                <option value="year-to-year-percent">Year-over-Year %</option>
              </select>
            </div>
          </div>
          
          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-2 right-2 z-10 p-1 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v4a1 1 0 01-1 1H1a1 1 0 010-2h1V5a3 3 0 013-3h4a1 1 0 010 2H5zm10 0a1 1 0 00-1 1v4a1 1 0 001 1h2a1 1 0 010 2h-2a3 3 0 01-3-3V5a1 1 0 011-1h4a1 1 0 110 2h-2zm-3 10a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 112 0v4a3 3 0 01-3 3h-4a1 1 0 01-1-1zm-7 0a1 1 0 001 1h2a1 1 0 100-2H6v-1a1 1 0 10-2 0v2a1 1 0 001 1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 50, left: 10, bottom: 30 }}
              ref={chartRef}
              className="enhanced-chart"
            >
              <defs>
                <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2962FF" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2962FF" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00C49F" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorTertiary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0.1}/>
                </linearGradient>
                <filter id="shadow" height="200%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(0, 0, 0, 0.3)" />
                </filter>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme === 'dark' ? '#2a2e39' : '#e5e7eb'} 
                opacity={0.5}
                vertical={true}
                horizontal={true}
              />
              <XAxis 
                dataKey="date" 
                stroke={theme === 'dark' ? '#d1d5db' : '#1f2937'}
                tickFormatter={(date) => {
                  const dateObj = new Date(date);
                  if (timeFrame === 'daily') return format(dateObj, 'MMM dd'); // Month name instead of number
                  if (timeFrame === 'weekly') {
                    // Ensure weekly data is properly formatted differently from daily
                    return `W${format(dateObj, 'w')} ${format(dateObj, 'yyyy')}`;
                  }
                  if (timeFrame === 'monthly') return format(dateObj, 'MMM yyyy');
                  if (timeFrame === 'quarterly') return format(dateObj, 'QQ yyyy');
                  return format(dateObj, 'yyyy');
                }}
              />
              
              {/* Zero reference line for percentage change calculations */}
              {showZeroLine && calculation.includes('percent') && dataSets.length > 0 && (
                <ReferenceLine 
                  y={0} 
                  stroke="#888" 
                  strokeDasharray="3 3" 
                  yAxisId="left" 
                />
              )}
              
              {/* Primary Y-axis (left) */}
              <YAxis 
                yAxisId="left" 
                orientation="left"
                stroke={dataSets.length > 0 && dataSets[0].visible ? dataSets[0].color : (theme === 'dark' ? '#d1d5db' : '#1f2937')}
                label={{ 
                  value: calculation.includes('percent') ? 'Percent Change (%)' : 'Value', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: theme === 'dark' ? '#d1d5db' : '#1f2937' }
                }}
                hide={dataSets.length === 0 || !dataSets[0].visible}
                domain={['auto', 'auto']} 
                scale="auto"
                allowDataOverflow={false}
                allowDecimals={true}
                tickFormatter={(value) => value.toLocaleString()}
              />
              
              {/* We're using a single Y-axis for all datasets with auto-scaling */}
              
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1e222d' : '#ffffff',
                  borderColor: theme === 'dark' ? '#2a2e39' : '#e5e7eb',
                  color: theme === 'dark' ? '#d1d5db' : '#1f2937'
                }}
                formatter={(value, name, props) => {
                  // Convert name to string to ensure we can use string methods
                  const nameStr = String(name);
                  
                  // Find the dataset this value belongs to
                  const datasetId = nameStr.includes('_') ? nameStr.split('_')[0] : nameStr;
                  const dataset = dataSets.find(ds => ds.id === datasetId);
                  
                  // Handle null or undefined values
                  const numValue = value as number | null | undefined;
                  const formattedValue = numValue != null 
                    ? numValue.toLocaleString(undefined, { maximumFractionDigits: 2 }) 
                    : 'N/A';
                  
                  // Get the data point for additional information
                  const dataPoint = props?.payload;
                  let displayValue = formattedValue + (numValue != null && (nameStr.includes('change') || calculation.includes('percent')) ? '%' : '');
                  let displayName = dataset?.name || nameStr;
                  
                  // Add original value information for normalized datasets
                  if (dataset?.normalized && dataPoint) {
                    const originalKey = `${datasetId}_original_value`;
                    if (dataPoint[originalKey] !== undefined) {
                      const originalValue = dataPoint[originalKey];
                      displayValue += ` (Original: ${originalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })})`;
                    }
                  }
                  
                  // Add formula information for calculated datasets
                  if (dataset?.formula) {
                    displayName += ` (Formula: ${dataset.formula})`;
                  }
                  
                  return [displayValue, displayName];
                }}
                labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
              />
              <Legend 
                wrapperStyle={{
                  color: theme === 'dark' ? '#d1d5db' : '#1f2937'
                }}
                onClick={(e) => {
                  // Toggle visibility of the clicked dataset
                  const updatedDataSets = dataSets.map(ds => {
                    if (ds.id === e.dataKey) {
                      return { ...ds, visible: !ds.visible };
                    }
                    return ds;
                  });
                  setDataSets(updatedDataSets);
                }}
              />
              
              {/* Financial crisis events and market crashes as simple gray vertical lines */}
              {showEvents && dataSets.length > 0 && [
                // Major market crashes (>20% drops)
                { date: '1987-10-19', name: 'Black Monday', drop: '-22.6%' },
                { date: '2000-03-10', name: 'Dot-com Bubble Burst', drop: '-27.2%' },
                { date: '2008-09-15', name: 'Financial Crisis', drop: '-38.5%' },
                { date: '2020-03-16', name: 'COVID-19 Crash', drop: '-33.9%' },
                { date: '2022-01-24', name: '2022 Correction', drop: '-20.0%' },
                
                // Other financial crisis events
                { date: '2011-08-05', name: 'US Credit Rating Downgrade' },
                { date: '1997-10-27', name: 'Asian Financial Crisis' },
                { date: '1998-08-17', name: 'Russian Financial Crisis' },
                { date: '2001-09-11', name: '9/11 Attacks' },
                { date: '2010-05-06', name: 'Flash Crash' },
                { date: '2015-08-24', name: 'China Stock Market Crash' },
                { date: '2018-12-24', name: 'Christmas Eve Crash' }
              ].map((event, index) => (
                <ReferenceLine
                  key={`event-${index}`}
                  x={event.date}
                  yAxisId="left"
                  stroke={theme === 'dark' ? '#888' : '#aaa'}
                  strokeWidth={1}
                  strokeOpacity={0.7}
                  isFront={false}
                  label={{
                    position: 'top',
                    value: ' ',
                    fill: 'transparent',
                    fontSize: 0
                  }}
                  ifOverflow="extendDomain"
                >
                  <Tooltip 
                    cursor={false}
                    content={
                      <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-md text-xs">
                        <div className="font-medium">{event.name}</div>
                        <div className="text-gray-500 dark:text-gray-400">{format(new Date(event.date), 'MMM d, yyyy')}</div>
                        {event.drop && <div className="text-red-500 dark:text-red-400">{event.drop}</div>}
                      </div>
                    }
                  />
                </ReferenceLine>
              ))}
              
              {/* Lines for each data set */}
              {dataSets.map((ds) => {
                // Force all datasets to use the same yAxisId
                const settings = { 
                  ...metricSettings[ds.id] || { visible: true, type: 'line' },
                  yAxisId: 'left'
                };
                if (!settings.visible) return null;
                
                const dataKey = calculation === 'value' ? 
                  (ds.id === dataSets[0]?.id ? 'value' : 
                   // Use normalized values for secondary datasets to ensure proper scaling
                   `${ds.id}_normalized` in chartData[0] ? `${ds.id}_normalized` : ds.id) : 
                  (ds.id === dataSets[0]?.id ? 'change' : `${ds.id}_change`);
                
                // Render different chart types based on settings
                if (settings.type === 'line') {
                  return (
                    <Line
                      key={ds.id}
                      type="monotone"
                      dataKey={dataKey}
                      name={ds.name}
                      stroke={ds.color}
                      yAxisId={settings.yAxisId}
                      dot={false}
                      activeDot={{ r: 6 }}
                      connectNulls={true}
                      strokeWidth={2}
                    />
                  );
                } else if (settings.type === 'area') {
                  return (
                    <Area
                      key={ds.id}
                      type="monotone"
                      dataKey={dataKey}
                      name={ds.name}
                      stroke={ds.color}
                      fill={ds.color}
                      fillOpacity={0.2}
                      yAxisId={settings.yAxisId}
                      dot={false}
                      activeDot={{ r: 6 }}
                      connectNulls={true}
                    />
                  );
                } else if (settings.type === 'bar') {
                  return (
                    <Bar
                      key={ds.id}
                      dataKey={dataKey}
                      name={ds.name}
                      fill={ds.color}
                      yAxisId={settings.yAxisId}
                      opacity={0.8}
                      barSize={6}
                    />
                  );
                }
                return null;
              })}
              
              {/* Time brush for zooming */}
              <Brush 
                dataKey="date" 
                height={30} 
                stroke={theme === 'dark' ? '#2196f3' : '#8884d8'} 
                fill={theme === 'dark' ? '#1e222d' : '#f3f4f6'}
                tickFormatter={(date) => format(new Date(date), 'MM/yyyy')}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* FRED-style Statistics */}
        {stats && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex flex-wrap items-center">
              <div className="mr-8 mb-2">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {stats.lastValue?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 'N/A'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  {chartData.length > 0 ? format(new Date(chartData[chartData.length - 1].date), 'MMM d, yyyy') : ''}
                </span>
              </div>
              
              <div className="flex flex-wrap">
                {/* Daily Change */}
                <div className="mr-6 mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">1 Day</span>
                  <span className={`text-sm font-medium ${(stats.lastChangePercent || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {(stats.lastChangePercent || 0) >= 0 ? '+' : ''}{stats.lastChangePercent?.toFixed(2) || '0.00'}%
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      ({(stats.lastChange || 0) >= 0 ? '+' : ''}{stats.lastChange?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0'})
                    </span>
                  </span>
                </div>
                
                {/* Weekly Change */}
                <div className="mr-6 mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">1 Week</span>
                  <span className={`text-sm font-medium ${(stats.weeklyChangePercent || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {(stats.weeklyChangePercent || 0) >= 0 ? '+' : ''}{stats.weeklyChangePercent?.toFixed(2) || '0.00'}%
                  </span>
                </div>
                
                {/* Monthly Change */}
                <div className="mr-6 mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">1 Month</span>
                  <span className={`text-sm font-medium ${(stats.monthlyChangePercent || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {(stats.monthlyChangePercent || 0) >= 0 ? '+' : ''}{stats.monthlyChangePercent?.toFixed(2) || '0.00'}%
                  </span>
                </div>
                
                {/* Quarterly Change */}
                <div className="mr-6 mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">1 Quarter</span>
                  <span className={`text-sm font-medium ${(stats.quarterlyChangePercent || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {(stats.quarterlyChangePercent || 0) >= 0 ? '+' : ''}{stats.quarterlyChangePercent?.toFixed(2) || '0.00'}%
                  </span>
                </div>
                
                {/* Yearly Change */}
                <div className="mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">1 Year</span>
                  <span className={`text-sm font-medium ${(stats.yearlyChangePercent || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {(stats.yearlyChangePercent || 0) >= 0 ? '+' : ''}{stats.yearlyChangePercent?.toFixed(2) || '0.00'}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Data Range: {chartData.length > 0 ? (
                `${format(new Date(chartData[0].date), 'MMM d, yyyy')} - ${format(new Date(chartData[chartData.length - 1].date), 'MMM d, yyyy')}`
              ) : 'No data available'}
            </div>
          </div>
        )}
      </div>
      
      {/* Custom Formula Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-dark-card">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Create Custom Formula</h3>
              <div className="mt-2 px-7 py-3">
                <div className="mb-4">
                  <label htmlFor="formulaName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1">
                    Formula Name
                  </label>
                  <input
                    type="text"
                    id="formulaName"
                    className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="My Custom Formula"
                    value={customFormulaName}
                    onChange={(e) => setCustomFormulaName(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="formula" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1">
                    Formula
                  </label>
                  <input
                    type="text"
                    id="formula"
                    className={`block w-full pl-3 pr-3 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${formulaError ? 'border-red-500 dark:border-red-500' : ''}`}
                    placeholder="e.g., (A + B) / 2"
                    value={customFormula}
                    onChange={(e) => {
                      setCustomFormula(e.target.value);
                      validateFormula(e.target.value);
                    }}
                  />
                  {formulaError && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400 text-left">
                      {formulaError}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-left">
                    Use formulas with variables (A, B, C...) and the following functions:
                  </p>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-left bg-gray-50 dark:bg-gray-800 p-2 rounded-md overflow-y-auto max-h-32">
                    <p className="font-semibold mb-1">Basic Operations:</p>
                    <p>A + B, A - B, A * B, A / B, (A + B) / 2</p>
                    
                    <p className="font-semibold mt-2 mb-1">Math Functions:</p>
                    <p>abs(A), sqrt(A), pow(A, 2), log(A), max(A, B), min(A, B)</p>
                    
                    <p className="font-semibold mt-2 mb-1">Financial Functions:</p>
                    <p>SMA(A, 20) - Simple Moving Average of A over 20 periods</p>
                    <p>EMA(A, 14) - Exponential Moving Average of A over 14 periods</p>
                    <p>ROC(A, 10) - Rate of Change of A over 10 periods (%)</p>
                    <p>RSI(A, 14) - Relative Strength Index of A over 14 periods</p>
                    <p>STDEV(A, 20) - Standard Deviation of A over 20 periods</p>
                    
                    <p className="font-semibold mt-2 mb-1">Examples:</p>
                    <p>A / B * 100 - Ratio of A to B as percentage</p>
                    <p>(A - SMA(A, 20)) / STDEV(A, 20) - Z-score</p>
                    <p>EMA(A, 12) - EMA(A, 26) - MACD line</p>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Available Variables
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 text-left">
                    {dataSets.length === 0 ? (
                      <p className="text-sm text-gray-500">No datasets available</p>
                    ) : (
                      dataSets.map((ds, index) => (
                        <div key={ds.id} className="text-sm py-1">
                          {String.fromCharCode(65 + index)}: {ds.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-between px-4 py-3">
                <button
                  type="button"
                  onClick={() => setShowFormulaModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateFormula(customFormula)) {
                      createCustomDataset();
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!customFormulaName || !customFormula || formulaError !== null || dataSets.length < 1}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Also export as default for backward compatibility
export default DataChart;

