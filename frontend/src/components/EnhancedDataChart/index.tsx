import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { fredApi, treasuryApi, blsApi } from '../../services/api';
import { 
  format, parseISO, subMonths, subWeeks, subYears, subQuarters, 
  differenceInDays, differenceInWeeks, differenceInMonths, differenceInQuarters, differenceInYears,
  startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear,
  isAfter, isBefore, isEqual, addDays
} from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import LightweightChart from '../LightweightChart';
import './EnhancedDataChart.css';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Types
type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | '1m' | '3m' | '6m' | '1y' | '5y' | '10y' | 'max';
type ChangeCalculation = 
  'value' |
  'period-to-period' | 
  'period-to-period-percent' | 
  'day-to-day' | 
  'day-to-day-percent' | 
  'week-to-week' | 
  'week-to-week-percent' | 
  'quarter-to-quarter' | 
  'quarter-to-quarter-percent' | 
  'year-to-year' | 
  'year-to-year-percent';

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
}

// Financial crisis events
const financialCrisisEvents = [
  { date: '2008-09-15', name: 'Lehman Brothers Bankruptcy' },
  { date: '2020-03-16', name: 'COVID-19 Market Crash' },
  { date: '2000-03-10', name: 'Dot-com Bubble Burst' },
  { date: '1987-10-19', name: 'Black Monday' },
  { date: '2011-08-05', name: 'US Credit Rating Downgrade' },
  { date: '1997-10-27', name: 'Asian Financial Crisis' },
  { date: '1998-08-17', name: 'Russian Financial Crisis' },
  { date: '2001-09-11', name: '9/11 Attacks' },
  { date: '2010-05-06', name: 'Flash Crash' },
  { date: '2015-08-24', name: 'China Stock Market Crash' },
  { date: '2018-12-24', name: 'Christmas Eve Crash' },
  { date: '2022-01-24', name: 'January 2022 Stock Market Correction' },
];

const EnhancedDataChart: React.FC<{}> = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('monthly');
  const [calculation, setCalculation] = useState<ChangeCalculation>('value');
  const [dataSets, setDataSets] = useState<DataSet[]>([]);
  const [availableDataSets, setAvailableDataSets] = useState<{[key: string]: {name: string, color: string, source: string, seriesId: string}}>({});
  const [selectedDataSet, setSelectedDataSet] = useState<string>('');
  const [showEvents, setShowEvents] = useState(true);
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date]>([subYears(new Date(), 5), new Date()]);
  const [searchTerm, setSearchTerm] = useState('');
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
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  const [isExporting, setIsExporting] = useState(false);

  // Helper function to get start date based on timeframe
  const getStartDateForTimeFrame = (timeframe: TimeFrame): string => {
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '1m':
        startDate = subMonths(now, 1);
        break;
      case '3m':
        startDate = subMonths(now, 3);
        break;
      case '6m':
        startDate = subMonths(now, 6);
        break;
      case '1y':
        startDate = subYears(now, 1);
        break;
      case '5y':
        startDate = subYears(now, 5);
        break;
      case '10y':
        startDate = subYears(now, 10);
        break;
      case 'max':
        startDate = new Date(1900, 0, 1); // Very old date to get all data
        break;
      default:
        startDate = subYears(now, 5); // Default to 5 years
    }
    
    return startDate.toISOString().split('T')[0];
  };
  
  // Function to aggregate data based on timeFrame
  const aggregateDataByTimeFrame = (data: DataPoint[], timeFrame: TimeFrame): DataPoint[] => {
    // If no data or daily timeframe, return original data
    if (!data || data.length === 0 || timeFrame === 'daily') return data;
    
    const aggregatedData: DataPoint[] = [];
    const groupedData: {[key: string]: DataPoint[]} = {};
    
    // Group data points by time period
    data.forEach(point => {
      let periodKey: string;
      const date = new Date(point.date);
      
      if (timeFrame === 'weekly') {
        // Get the week start date as key
        const weekStart = startOfWeek(date);
        periodKey = format(weekStart, 'yyyy-MM-dd');
      } else if (timeFrame === 'monthly') {
        // Get the month as key
        periodKey = format(date, 'yyyy-MM');
      } else if (timeFrame === 'quarterly') {
        // Get the quarter as key
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        periodKey = `${date.getFullYear()}-Q${quarter}`;
      } else if (timeFrame === 'yearly') {
        // Get the year as key
        periodKey = `${date.getFullYear()}`;
      } else if (timeFrame === '1m' || timeFrame === '3m' || 
                 timeFrame === '6m' || timeFrame === '1y' || 
                 timeFrame === '5y' || timeFrame === '10y' || 
                 timeFrame === 'max') {
        // For these timeframes, we're just filtering by date range, not aggregating
        periodKey = point.date;
      } else {
        // Default to daily
        periodKey = point.date;
      }
      
      if (!groupedData[periodKey]) {
        groupedData[periodKey] = [];
      }
      groupedData[periodKey].push(point);
    });
    
    // Calculate aggregate value for each period (e.g., average)
    Object.keys(groupedData).forEach(periodKey => {
      const periodData = groupedData[periodKey];
      
      // Calculate the aggregate value (average)
      const sum = periodData.reduce((acc, point) => acc + point.value, 0);
      const avgValue = sum / periodData.length;
      
      // For display purposes, use the last date in the period for timeframes like weekly, monthly, etc.
      let displayDate = periodKey;
      
      if (timeFrame === 'weekly' || timeFrame === 'monthly' || 
          timeFrame === 'quarterly' || timeFrame === 'yearly') {
        // Sort the period data by date to get the last one
        const sortedPeriodData = [...periodData].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        displayDate = sortedPeriodData[0].date;
      }
      
      // Create aggregated data point
      const aggregatedPoint: DataPoint = {
        // Preserve any additional properties by merging from the last point in the period
        ...periodData[periodData.length - 1],
        // Override with our calculated value and date
        date: displayDate,
        value: avgValue
      };
      
      aggregatedData.push(aggregatedPoint);
    });
    
    // Sort by date
    return aggregatedData.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  // Initialize with default data
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
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
        
        // Treasury data series
        'debt': { name: 'US Public Debt', color: '#e91e63', source: 'treasury', seriesId: 'debt' },
        'yield_curve': { name: 'Yield Curve', color: '#673ab7', source: 'treasury', seriesId: 'yield_curve' },
        
        // BLS data series
        'bls_unemployment': { name: 'BLS Unemployment', color: '#795548', source: 'bls', seriesId: 'unemployment' },
        'bls_cpi': { name: 'BLS CPI', color: '#607d8b', source: 'bls', seriesId: 'cpi' }
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
              const fredResponse = await fredApi.getSeriesData(dataSetInfo.seriesId, {
                frequency: 'm', // Monthly data
                units: 'lin', // Linear units (no transformation)
                startDate: getStartDateForTimeFrame('5y'), // Default to 5 years of data
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
              const startYear = currentYear - 5;
              
              if (dataSetInfo.seriesId === 'unemployment') {
                const blsResponse = await blsApi.getUnemploymentData(startYear, currentYear);
                // Add type assertion to specify the structure
                const responseData = (blsResponse as any).data;
                apiData = responseData.map((item: any) => ({
                  date: item.date,
                  value: item.value
                }));
              } else if (dataSetInfo.seriesId === 'cpi') {
                const blsResponse = await blsApi.getCPIData(startYear, currentYear);
                // Add type assertion to specify the structure
                const responseData = (blsResponse as any).data;
                apiData = responseData.map((item: any) => ({
                  date: item.date,
                  value: item.value
                }));
              }
              break;
          }
          
          if (apiData && apiData.length > 0) {
            initialDataSets.push({
              id: id,
              name: dataSetInfo.name,
              data: apiData,
              color: dataSetInfo.color,
              visible: true
            });
            
            setActiveMetrics([id]);
            setMetricSettings({
              [id]: {
                visible: true,
                yAxisId: 'left',
                type: 'area'
              }
            });
          }
        } else {
          // Default to S&P 500 if no ID is provided
          const defaultId = 'sp500';
          const defaultDataSetInfo = availableSets[defaultId];
          
          const fredResponse = await fredApi.getSeriesData(defaultDataSetInfo.seriesId, {
            frequency: 'm',
            units: 'lin',
            startDate: getStartDateForTimeFrame('5y'),
            endDate: new Date().toISOString().split('T')[0],
            calculation: 'value'
          });
          
          const apiData = (fredResponse as { data: Array<{ date: string, value: number }> }).data.map((item) => ({
            date: item.date,
            value: item.value
          }));
          
          if (apiData && apiData.length > 0) {
            initialDataSets.push({
              id: defaultId,
              name: defaultDataSetInfo.name,
              data: apiData,
              color: defaultDataSetInfo.color,
              visible: true
            });
            
            setActiveMetrics([defaultId]);
            setMetricSettings({
              [defaultId]: {
                visible: true,
                yAxisId: 'left',
                type: 'area'
              }
            });
          }
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      }
      
      setDataSets(initialDataSets);
      setLoading(false);
    };
    
    getUser();
  }, [id]);

  // Update chart data when datasets, calculation, or timeFrame changes
  useEffect(() => {
    if (dataSets.length === 0) return;
    
    // Get the visible datasets
    const visibleDataSets = dataSets.filter(ds => ds.visible);
    
    if (visibleDataSets.length === 0) {
      setChartData([]);
      return;
    }
    
    // If we're showing multiple datasets, use the first one as the primary
    const primaryDataSet = visibleDataSets[0];
    
    // First, aggregate data based on timeFrame
    const aggregatedData = aggregateDataByTimeFrame(primaryDataSet.data, timeFrame);
    
    // Apply calculation transformation if needed
    let transformedData: DataPoint[] = [];
    
    if (calculation === 'value') {
      // Just use the aggregated values
      transformedData = [...aggregatedData];
    } else {
      // Apply the selected calculation
      const data = [...aggregatedData];
      
      // Sort by date ascending
      data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Apply the calculation
      for (let i = 1; i < data.length; i++) {
        const current = data[i];
        const previous = data[i - 1];
        
        let calculatedValue = 0;
        
        switch (calculation) {
          case 'period-to-period':
            calculatedValue = current.value - previous.value;
            break;
          case 'period-to-period-percent':
            calculatedValue = ((current.value - previous.value) / previous.value) * 100;
            break;
          case 'day-to-day':
            // Calculate day-to-day change
            const dayDiff = differenceInDays(new Date(current.date), new Date(previous.date));
            calculatedValue = dayDiff > 0 ? (current.value - previous.value) / dayDiff : 0;
            break;
          case 'day-to-day-percent':
            // Calculate day-to-day percent change
            const dayDiffPct = differenceInDays(new Date(current.date), new Date(previous.date));
            calculatedValue = dayDiffPct > 0 ? ((current.value - previous.value) / previous.value) * 100 / dayDiffPct : 0;
            break;
          case 'week-to-week':
            // Calculate week-to-week change
            const weekDiff = differenceInWeeks(new Date(current.date), new Date(previous.date));
            calculatedValue = weekDiff > 0 ? (current.value - previous.value) / weekDiff : 0;
            break;
          case 'week-to-week-percent':
            // Calculate week-to-week percent change
            const weekDiffPct = differenceInWeeks(new Date(current.date), new Date(previous.date));
            calculatedValue = weekDiffPct > 0 ? ((current.value - previous.value) / previous.value) * 100 / weekDiffPct : 0;
            break;
          case 'quarter-to-quarter':
            // Calculate quarter-to-quarter change
            const quarterDiff = differenceInQuarters(new Date(current.date), new Date(previous.date));
            calculatedValue = quarterDiff > 0 ? (current.value - previous.value) / quarterDiff : 0;
            break;
          case 'quarter-to-quarter-percent':
            // Calculate quarter-to-quarter percent change
            const quarterDiffPct = differenceInQuarters(new Date(current.date), new Date(previous.date));
            calculatedValue = quarterDiffPct > 0 ? ((current.value - previous.value) / previous.value) * 100 / quarterDiffPct : 0;
            break;
          case 'year-to-year':
            // Calculate year-to-year change
            const yearDiff = differenceInYears(new Date(current.date), new Date(previous.date));
            calculatedValue = yearDiff > 0 ? (current.value - previous.value) / yearDiff : 0;
            break;
          case 'year-to-year-percent':
            // Calculate year-to-year percent change
            const yearDiffPct = differenceInYears(new Date(current.date), new Date(previous.date));
            calculatedValue = yearDiffPct > 0 ? ((current.value - previous.value) / previous.value) * 100 / yearDiffPct : 0;
            break;
          default:
            calculatedValue = current.value;
        }
        
        transformedData.push({
          ...current,
          value: calculatedValue
        });
      }
      
      // The first point doesn't have a previous point for calculation
      if (data.length > 0) {
        transformedData.unshift({
          ...data[0],
          value: 0 // No change for the first point
        });
      }
    }
    
    setChartData(transformedData);
  }, [dataSets, calculation, timeFrame]);

  // Handle adding a new dataset
  const handleAddDataSet = async (dataSetId: string) => {
    if (!availableDataSets[dataSetId]) return;
    
    // Check if we already have this dataset
    if (dataSets.some(ds => ds.id === dataSetId)) {
      // Just make it visible if it's already loaded
      setDataSets(prevDataSets => 
        prevDataSets.map(ds => 
          ds.id === dataSetId ? { ...ds, visible: true } : ds
        )
      );
      
      if (!activeMetrics.includes(dataSetId)) {
        setActiveMetrics(prev => [...prev, dataSetId]);
      }
      
      setMetricSettings(prev => ({
        ...prev,
        [dataSetId]: {
          visible: true,
          yAxisId: 'left',
          type: 'area'
        }
      }));
      
      return;
    }
    
    // Otherwise, fetch the data
    setLoading(true);
    
    try {
      const dataSetInfo = availableDataSets[dataSetId];
      let apiData: DataPoint[] = [];
      
      switch (dataSetInfo.source) {
        case 'fred':
          const fredResponse = await fredApi.getSeriesData(dataSetInfo.seriesId, {
            frequency: 'm',
            units: 'lin',
            startDate: getStartDateForTimeFrame('5y'),
            endDate: new Date().toISOString().split('T')[0],
            calculation: 'value'
          });
          
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
            
            apiData = (treasuryResponse as { data: Array<{ date: string, year10?: number }> }).data.map((item) => ({
              date: item.date,
              value: item.year10 || 0
            }));
          }
          break;
          
        case 'bls':
          const currentYear = new Date().getFullYear();
          const startYear = currentYear - 5;
          
          if (dataSetInfo.seriesId === 'unemployment') {
            const blsResponse = await blsApi.getUnemploymentData(startYear, currentYear);
            const responseData = (blsResponse as any).data;
            apiData = responseData.map((item: any) => ({
              date: item.date,
              value: item.value
            }));
          } else if (dataSetInfo.seriesId === 'cpi') {
            const blsResponse = await blsApi.getCPIData(startYear, currentYear);
            const responseData = (blsResponse as any).data;
            apiData = responseData.map((item: any) => ({
              date: item.date,
              value: item.value
            }));
          }
          break;
      }
      
      if (apiData && apiData.length > 0) {
        setDataSets(prevDataSets => [
          ...prevDataSets,
          {
            id: dataSetId,
            name: dataSetInfo.name,
            data: apiData,
            color: dataSetInfo.color,
            visible: true
          }
        ]);
        
        setActiveMetrics(prev => [...prev, dataSetId]);
        
        setMetricSettings(prev => ({
          ...prev,
          [dataSetId]: {
            visible: true,
            yAxisId: 'left',
            type: 'area'
          }
        }));
      }
    } catch (error) {
      console.error(`Error fetching data for ${dataSetId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Handle removing a dataset
  const handleRemoveDataSet = (dataSetId: string) => {
    setDataSets(prevDataSets => 
      prevDataSets.map(ds => 
        ds.id === dataSetId ? { ...ds, visible: false } : ds
      )
    );
    
    setActiveMetrics(prev => prev.filter(id => id !== dataSetId));
    
    setMetricSettings(prev => ({
      ...prev,
      [dataSetId]: {
        ...prev[dataSetId],
        visible: false
      }
    }));
  };

  // Handle time frame change
  const handleTimeFrameChange = async (newTimeFrame: TimeFrame) => {
    setLoading(true);
    setTimeFrame(newTimeFrame);
    
    try {
      // Update all datasets with the new time frame
      const updatedDataSets = [...dataSets];
      
      for (let i = 0; i < updatedDataSets.length; i++) {
        const ds = updatedDataSets[i];
        const dataSetInfo = availableDataSets[ds.id];
        
        if (!dataSetInfo) continue;
        
        let apiData;
        
        switch (dataSetInfo.source) {
          case 'fred':
            const fredResponse = await fredApi.getSeriesData(dataSetInfo.seriesId, {
              frequency: 'm',
              units: 'lin',
              startDate: getStartDateForTimeFrame(newTimeFrame),
              endDate: new Date().toISOString().split('T')[0],
              calculation: 'value'
            });
            
            apiData = (fredResponse as { data: Array<{ date: string, value: number }> }).data.map((item) => ({
              date: item.date,
              value: item.value
            }));
            break;
            
          case 'treasury':
            if (dataSetInfo.seriesId === 'debt') {
              const treasuryResponse = await treasuryApi.getDebtData({
                startDate: getStartDateForTimeFrame(newTimeFrame),
                endDate: new Date().toISOString().split('T')[0],
                limit: 1000
              });
              
              apiData = (treasuryResponse as { data: Array<{ date: string, value: number }> }).data.map((item) => ({
                date: item.date,
                value: item.value
              }));
            } else if (dataSetInfo.seriesId === 'yield_curve') {
              const treasuryResponse = await treasuryApi.getYieldCurveData({
                startDate: getStartDateForTimeFrame(newTimeFrame),
                endDate: new Date().toISOString().split('T')[0],
                limit: 1000
              });
              
              apiData = (treasuryResponse as { data: Array<{ date: string, year10?: number }> }).data.map((item) => ({
                date: item.date,
                value: item.year10 || 0
              }));
            }
            break;
            
          case 'bls':
            const currentYear = new Date().getFullYear();
            let startYear;
            
            switch (newTimeFrame) {
              case '1y':
                startYear = currentYear - 1;
                break;
              case '5y':
                startYear = currentYear - 5;
                break;
              case '10y':
                startYear = currentYear - 10;
                break;
              case 'max':
                startYear = 1990; // Arbitrary old year for BLS data
                break;
              default:
                startYear = currentYear - 5;
            }
            
            if (dataSetInfo.seriesId === 'unemployment') {
              const blsResponse = await blsApi.getUnemploymentData(startYear, currentYear);
              const responseData = (blsResponse as any).data;
              apiData = responseData.map((item: any) => ({
                date: item.date,
                value: item.value
              }));
            } else if (dataSetInfo.seriesId === 'cpi') {
              const blsResponse = await blsApi.getCPIData(startYear, currentYear);
              const responseData = (blsResponse as any).data;
              apiData = responseData.map((item: any) => ({
                date: item.date,
                value: item.value
              }));
            }
            break;
        }
        
        if (apiData && apiData.length > 0) {
          updatedDataSets[i] = {
            ...ds,
            data: apiData
          };
        }
      }
      
      setDataSets(updatedDataSets);
    } catch (error) {
      console.error('Error updating time frame:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle chart type change
  const handleChartTypeChange = (type: 'line' | 'area') => {
    setChartType(type);
  };

  // Export data as CSV
  const handleExportCSV = () => {
    if (chartData.length === 0) return;
    
    setIsExporting(true);
    
    try {
      // Create CSV content
      let csvContent = 'date,value\n';
      
      chartData.forEach(point => {
        csvContent += `${point.date},${point.value}\n`;
      });
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `chart_data_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Render the component
  return (
    <div className="enhanced-data-chart">
      <div className="chart-header">
        <h2>Economic Data Explorer</h2>
        
        <div className="chart-controls">
          <div className="control-group">
            <label>Time Range:</label>
            <div className="button-group">
              <button 
                className={`control-button ${timeFrame === '1m' ? 'active' : ''}`}
                onClick={() => handleTimeFrameChange('1m')}
              >
                1M
              </button>
              <button 
                className={`control-button ${timeFrame === '3m' ? 'active' : ''}`}
                onClick={() => handleTimeFrameChange('3m')}
              >
                3M
              </button>
              <button 
                className={`control-button ${timeFrame === '6m' ? 'active' : ''}`}
                onClick={() => handleTimeFrameChange('6m')}
              >
                6M
              </button>
              <button 
                className={`control-button ${timeFrame === '1y' ? 'active' : ''}`}
                onClick={() => handleTimeFrameChange('1y')}
              >
                1Y
              </button>
              <button 
                className={`control-button ${timeFrame === '5y' ? 'active' : ''}`}
                onClick={() => handleTimeFrameChange('5y')}
              >
                5Y
              </button>
              <button 
                className={`control-button ${timeFrame === '10y' ? 'active' : ''}`}
                onClick={() => handleTimeFrameChange('10y')}
              >
                10Y
              </button>
              <button 
                className={`control-button ${timeFrame === 'max' ? 'active' : ''}`}
                onClick={() => handleTimeFrameChange('max')}
              >
                MAX
              </button>
            </div>
          </div>
          
          <div className="control-group">
            <label>Chart Type:</label>
            <div className="button-group">
              <button 
                className={`control-button ${chartType === 'line' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('line')}
              >
                Line
              </button>
              <button 
                className={`control-button ${chartType === 'area' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('area')}
              >
                Area
              </button>
            </div>
          </div>
          
          <div className="control-group">
            <label htmlFor="calculation-select">Calculation:</label>
            <select 
              id="calculation-select"
              value={calculation}
              onChange={(e) => setCalculation(e.target.value as ChangeCalculation)}
              className="select-control"
              aria-label="Calculation type"
            >
              <option value="value">Raw Value</option>
              <option value="period-to-period">Period-to-Period Change</option>
              <option value="period-to-period-percent">Period-to-Period % Change</option>
              <option value="year-to-year">Year-over-Year Change</option>
              <option value="year-to-year-percent">Year-over-Year % Change</option>
            </select>
          </div>
          
          <div className="control-group">
            <button 
              className="control-button"
              onClick={() => setShowAddMetricDropdown(!showAddMetricDropdown)}
            >
              Add Metric
            </button>
            
            {showAddMetricDropdown && (
              <div className="metric-dropdown">
                <input
                  type="text"
                  placeholder="Search metrics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                
                <div className="metric-list">
                  {Object.entries(availableDataSets)
                    .filter(([id, info]) => 
                      info.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      id.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(([id, info]) => (
                      <div 
                        key={id}
                        className="metric-item"
                        onClick={() => {
                          handleAddDataSet(id);
                          setShowAddMetricDropdown(false);
                        }}
                      >
                        <div className="metric-color" data-color={info.color}></div>
                        <div className="metric-name">{info.name}</div>
                        <div className="metric-source">{info.source.toUpperCase()}</div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
          
          <div className="control-group">
            <button 
              className="control-button"
              onClick={handleExportCSV}
              disabled={isExporting || chartData.length === 0}
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="active-metrics">
        {activeMetrics.map(metricId => {
          const dataset = dataSets.find(ds => ds.id === metricId);
          if (!dataset) return null;
          
          return (
            <div key={metricId} className="active-metric">
              <div className="metric-color" data-color={dataset.color}></div>
              <div className="metric-name">{dataset.name}</div>
              <button 
                className="remove-metric"
                onClick={() => handleRemoveDataSet(metricId)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="chart-container">
        {loading ? (
          <div className="loading-indicator">Loading data...</div>
        ) : chartData.length > 0 ? (
          <LightweightChart
            data={chartData}
            height={500}
            chartType={chartType}
            showVolume={false}
            showGrid={true}
            showLegend={true}
            showToolbar={true}
            colors={{
              lineColor: dataSets.find(ds => ds.visible)?.color || '#2962FF',
              areaTopColor: `${dataSets.find(ds => ds.visible)?.color || '#2962FF'}40`,
              areaBottomColor: `${dataSets.find(ds => ds.visible)?.color || '#2962FF'}10`,
            }}
          />
        ) : (
          <div className="no-data">No data available. Please select a metric to display.</div>
        )}
      </div>
      
      {showEvents && (
        <div className="events-container">
          <h3>Major Financial Events</h3>
          <div className="events-list">
            {financialCrisisEvents.map(event => (
              <div key={event.date} className="event-item">
                <div className="event-date">{event.date}</div>
                <div className="event-name">{event.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDataChart;