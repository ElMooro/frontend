import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Area, Bar
} from 'recharts';
import { format } from 'date-fns';
import './DataExplorer.css';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock data for initial development
const generateMockData = (length: number, startValue: number, volatility: number) => {
  const data = [];
  let currentValue = startValue;
  const now = new Date();
  
  for (let i = length - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const dateStr = date.toISOString().split('T')[0];
    const change = (Math.random() - 0.5) * volatility;
    currentValue = currentValue * (1 + change);
    data.push({
      date: dateStr,
      value: currentValue,
    });
  }
  
  return data;
};

// Mock data for comparison
const mockDataSets = {
  'sp500': { name: 'S&P 500', data: generateMockData(120, 3000, 0.05), color: '#8884d8' },
  'nasdaq': { name: 'NASDAQ', data: generateMockData(120, 10000, 0.07), color: '#82ca9d' },
  'djia': { name: 'Dow Jones', data: generateMockData(120, 30000, 0.04), color: '#ffc658' },
  'treasury10y': { name: '10Y Treasury', data: generateMockData(120, 3, 0.02), color: '#ff8042' },
  'treasury2y': { name: '2Y Treasury', data: generateMockData(120, 1.5, 0.03), color: '#ff5722' },
  'gold': { name: 'Gold', data: generateMockData(120, 1800, 0.03), color: '#ffbb28' },
  'bitcoin': { name: 'Bitcoin', data: generateMockData(120, 40000, 0.1), color: '#ff8042' },
  'vix': { name: 'VIX', data: generateMockData(120, 20, 0.15), color: '#ff0000' },
  'unemployment': { name: 'Unemployment Rate', data: generateMockData(120, 4, 0.08), color: '#9c27b0' },
  'cpi': { name: 'CPI', data: generateMockData(120, 300, 0.02), color: '#2196f3' },
  'gdp': { name: 'GDP', data: generateMockData(120, 23000, 0.03), color: '#4caf50' },
  'retailSales': { name: 'Retail Sales', data: generateMockData(120, 550, 0.04), color: '#795548' },
  'housingStarts': { name: 'Housing Starts', data: generateMockData(120, 1500, 0.06), color: '#607d8b' },
  'industrialProduction': { name: 'Industrial Production', data: generateMockData(120, 105, 0.03), color: '#ff9800' },
  'pmi': { name: 'PMI', data: generateMockData(120, 52, 0.05), color: '#3f51b5' },
  'consumerConfidence': { name: 'Consumer Confidence', data: generateMockData(120, 110, 0.06), color: '#e91e63' },
  'retailSalesYoY': { name: 'Retail Sales YoY', data: generateMockData(120, 4.5, 0.2), color: '#9e9e9e' },
  'fedFunds': { name: 'Fed Funds Rate', data: generateMockData(120, 5.25, 0.01), color: '#673ab7' },
  'eurusd': { name: 'EUR/USD', data: generateMockData(120, 1.08, 0.02), color: '#00bcd4' },
  'usdjpy': { name: 'USD/JPY', data: generateMockData(120, 150, 0.03), color: '#cddc39' },
  'usdcny': { name: 'USD/CNY', data: generateMockData(120, 7.2, 0.01), color: '#ff5722' },
  'wti': { name: 'WTI Crude Oil', data: generateMockData(120, 75, 0.08), color: '#795548' },
  'naturalGas': { name: 'Natural Gas', data: generateMockData(120, 2.5, 0.1), color: '#607d8b' },
  'copper': { name: 'Copper', data: generateMockData(120, 3.8, 0.05), color: '#ff9800' },
};

interface DataPoint {
  date: string;
  value: number;
}

interface DataSet {
  id: string;
  name: string;
  data: DataPoint[];
  color: string;
}

interface MetricStats {
  lastValue: number;
  weeklyChange: number;
  monthlyChange: number;
  quarterlyChange: number;
  yearlyChange: number;
}

const DataExplorer: React.FC = () => {
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDataSets, setSelectedDataSets] = useState<DataSet[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'weeklyChange' | 'monthlyChange' | 'quarterlyChange' | 'yearlyChange'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, []);

  // Filter available datasets based on search term
  const filteredDataSets = Object.keys(mockDataSets)
    .filter(key => {
      if (!searchTerm) return true;
      return mockDataSets[key as keyof typeof mockDataSets].name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .reduce((obj, key) => {
      obj[key] = mockDataSets[key as keyof typeof mockDataSets];
      return obj;
    }, {} as {[key: string]: {name: string, data: DataPoint[], color: string}});

  // Enhanced auto-suggestions as user types
  useEffect(() => {
    if (searchTerm.length > 0) {
      // First, find exact matches at the beginning of the name
      const exactStartMatches = Object.keys(mockDataSets)
        .filter(key => 
          mockDataSets[key as keyof typeof mockDataSets].name
            .toLowerCase()
            .startsWith(searchTerm.toLowerCase())
        )
        .map(key => mockDataSets[key as keyof typeof mockDataSets].name);
      
      // Then find partial matches anywhere in the name
      const partialMatches = Object.keys(mockDataSets)
        .filter(key => 
          !mockDataSets[key as keyof typeof mockDataSets].name
            .toLowerCase()
            .startsWith(searchTerm.toLowerCase()) && 
          mockDataSets[key as keyof typeof mockDataSets].name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
        .map(key => mockDataSets[key as keyof typeof mockDataSets].name);
      
      // Combine the matches, prioritizing exact start matches
      const allMatches = [...exactStartMatches, ...partialMatches].slice(0, 10);
      
      setSuggestions(allMatches);
    } else {
      // When search is empty, show popular/recent metrics
      const popularMetrics = [
        'S&P 500', 'NASDAQ', 'Dow Jones', 'Russell 2000', 'Bitcoin', 
        'Gold', 'Crude Oil', 'EUR/USD', 'Treasury 10Y', 'VIX'
      ].filter(
        name => Object.values(mockDataSets).some(ds => ds.name === name)
      );
      setSuggestions(popularMetrics);
    }
  }, [searchTerm]);

  // Add a dataset to the explorer
  const addDataSet = (id: string) => {
    // Limit to 20 metrics
    if (selectedDataSets.length >= 20) {
      alert('You can only add up to 20 metrics to the explorer.');
      return;
    }
    
    // Check if already added
    if (selectedDataSets.some(ds => ds.id === id)) {
      return;
    }
    
    const dataSetKey = id as keyof typeof mockDataSets;
    if (mockDataSets[dataSetKey]) {
      const newDataSet: DataSet = {
        id: dataSetKey,
        name: mockDataSets[dataSetKey].name,
        data: mockDataSets[dataSetKey].data,
        color: mockDataSets[dataSetKey].color,
      };
      
      setSelectedDataSets([...selectedDataSets, newDataSet]);
    }
  };

  // Remove a dataset from the explorer
  const removeDataSet = (id: string) => {
    setSelectedDataSets(selectedDataSets.filter(ds => ds.id !== id));
  };

  // Calculate statistics for a dataset
  const calculateStats = (data: DataPoint[]): MetricStats => {
    if (!data || data.length === 0) {
      return {
        lastValue: 0,
        weeklyChange: 0,
        monthlyChange: 0,
        quarterlyChange: 0,
        yearlyChange: 0,
      };
    }
    
    const lastValue = data[data.length - 1].value;
    
    // Weekly change (assuming weekly data points)
    const weeklyChange = data.length > 1 
      ? ((lastValue - data[data.length - 2].value) / data[data.length - 2].value) * 100
      : 0;
    
    // Monthly change (assuming monthly data points)
    const monthlyChange = data.length > 4 
      ? ((lastValue - data[data.length - 5].value) / data[data.length - 5].value) * 100
      : 0;
    
    // Quarterly change (3 months)
    const quarterlyChange = data.length > 12 
      ? ((lastValue - data[data.length - 13].value) / data[data.length - 13].value) * 100
      : 0;
    
    // Yearly change
    const yearlyChange = data.length > 52 
      ? ((lastValue - data[data.length - 53].value) / data[data.length - 53].value) * 100
      : 0;
    
    return {
      lastValue,
      weeklyChange,
      monthlyChange,
      quarterlyChange,
      yearlyChange,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Sort the selected datasets
  const sortedDataSets = [...selectedDataSets].sort((a, b) => {
    const statsA = calculateStats(a.data);
    const statsB = calculateStats(b.data);
    
    let valueA, valueB;
    
    switch (sortBy) {
      case 'name':
        valueA = a.name;
        valueB = b.name;
        break;
      case 'value':
        valueA = statsA.lastValue;
        valueB = statsB.lastValue;
        break;
      case 'weeklyChange':
        valueA = statsA.weeklyChange;
        valueB = statsB.weeklyChange;
        break;
      case 'monthlyChange':
        valueA = statsA.monthlyChange;
        valueB = statsB.monthlyChange;
        break;
      case 'quarterlyChange':
        valueA = statsA.quarterlyChange;
        valueB = statsB.quarterlyChange;
        break;
      case 'yearlyChange':
        valueA = statsA.yearlyChange;
        valueB = statsB.yearlyChange;
        break;
      default:
        valueA = a.name;
        valueB = b.name;
    }
    
    if (sortDirection === 'asc') {
      return typeof valueA === 'string' 
        ? valueA.localeCompare(valueB as string) 
        : (valueA as number) - (valueB as number);
    } else {
      return typeof valueA === 'string' 
        ? (valueB as string).localeCompare(valueA as string) 
        : (valueB as number) - (valueA as number);
    }
  });
  
  // Function to toggle sort
  const toggleSort = (column: 'name' | 'value' | 'weeklyChange' | 'monthlyChange' | 'quarterlyChange' | 'yearlyChange') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };
  
  // Function to compare selected metrics
  const compareSelectedMetrics = () => {
    if (selectedDataSets.length < 2) {
      alert('Please select at least 2 metrics to compare');
      return;
    }
    
    // Create URL with all selected dataset IDs
    const ids = selectedDataSets.map(ds => ds.id).join(',');
    
    // Use the enhanced DataChart component with all our new features
    window.open(`/chart?compare=${ids}&normalized=true&showEvents=true`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-card shadow-card dark:shadow-card-dark rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Data Explorer</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Search and compare up to 20 different metrics. View key statistics and click on any metric to see detailed charts.
        </p>
        
        {/* Quick Chart Preview for selected metrics */}
        {selectedDataSets.length > 0 && (
          <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Quick Chart Preview</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={selectedDataSets[0]?.data || []}
                  margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="date" 
                    stroke={theme === 'dark' ? '#d1d5db' : '#1f2937'}
                    tickFormatter={(date) => {
                      try {
                        return format(new Date(date), 'MMM yyyy');
                      } catch (e) {
                        return date;
                      }
                    }}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#d1d5db' : '#1f2937'} 
                    domain={['auto', 'auto']}
                    scale="auto"
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1e222d' : '#ffffff',
                      borderColor: theme === 'dark' ? '#2a2e39' : '#e5e7eb',
                      color: theme === 'dark' ? '#d1d5db' : '#1f2937'
                    }}
                    formatter={(value: any) => [value.toLocaleString(), '']}
                    labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
                  />
                  <Legend />
                  {selectedDataSets.map((dataset, index) => (
                    <Line
                      key={dataset.id}
                      type="monotone"
                      data={dataset.data}
                      dataKey="value"
                      name={dataset.name}
                      stroke={dataset.color}
                      dot={false}
                      activeDot={{ r: 6 }}
                      strokeWidth={2}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={compareSelectedMetrics}
                className="px-4 py-2 bg-blue-600 dark:bg-dark-accent text-white rounded-md hover:bg-blue-700 dark:hover:bg-dark-accent-hover transition-colors"
              >
                Open Full Chart
              </button>
            </div>
          </div>
        )}
        
        {/* Search Box */}
        <div className="relative mb-6">
          <div className="flex">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for metrics..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
              />
            </div>
            <button
              onClick={compareSelectedMetrics}
              disabled={selectedDataSets.length < 2}
              className="px-4 py-3 bg-blue-600 dark:bg-dark-accent text-white rounded-r-md hover:bg-blue-700 dark:hover:bg-dark-accent-hover transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Compare Selected
            </button>
          </div>
          
          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-md shadow-lg p-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                {searchTerm ? 'Search Results' : 'Popular Metrics'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {suggestions.map((suggestion, index) => {
                  const matchingKey = Object.keys(mockDataSets).find(
                    key => mockDataSets[key as keyof typeof mockDataSets].name === suggestion
                  );
                  
                  // Get the color for this metric if available
                  const metricColor = matchingKey ? 
                    mockDataSets[matchingKey as keyof typeof mockDataSets].color : 
                    '#3B82F6'; // Default blue color
                  
                  // Determine category based on the metric name
                  let category = 'Other';
                  if (suggestion.includes('S&P') || suggestion.includes('NASDAQ') || 
                      suggestion.includes('Dow') || suggestion.includes('Russell')) {
                    category = 'Index';
                  } else if (suggestion.includes('Gold') || suggestion.includes('Oil') || 
                             suggestion.includes('Gas') || suggestion.includes('Copper')) {
                    category = 'Commodity';
                  } else if (suggestion.includes('Bitcoin') || suggestion.includes('Ethereum')) {
                    category = 'Crypto';
                  } else if (suggestion.includes('USD') || suggestion.includes('EUR') || 
                             suggestion.includes('JPY') || suggestion.includes('CNY')) {
                    category = 'Forex';
                  } else if (suggestion.includes('Rate') || suggestion.includes('Treasury') || 
                             suggestion.includes('Yield')) {
                    category = 'Rate';
                  } else if (suggestion.includes('VIX')) {
                    category = 'Volatility';
                  } else if (suggestion.includes('GDP') || suggestion.includes('CPI') || 
                             suggestion.includes('Unemployment') || suggestion.includes('Sales') || 
                             suggestion.includes('Production') || suggestion.includes('PMI') || 
                             suggestion.includes('Confidence')) {
                    category = 'Economic';
                  }
                  
                  return (
                    <div
                      key={index}
                      className="flex flex-col p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => {
                        if (matchingKey) {
                          addDataSet(matchingKey);
                          setSearchTerm('');
                          setSuggestions([]);
                        }
                      }}
                    >
                      <div className="flex items-center mb-1">
                        <div 
                          className={`w-3 h-3 rounded-full mr-2 metric-color`} 
                          data-color={metricColor}
                        ></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {suggestion}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                        {category}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Available Datasets */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Available Metrics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.keys(filteredDataSets).map(key => (
              <button
                key={key}
                onClick={() => addDataSet(key)}
                disabled={selectedDataSets.some(ds => ds.id === key)}
                className={`p-2 text-sm rounded-lg border ${
                  selectedDataSets.some(ds => ds.id === key)
                    ? 'border-gray-200 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'border-blue-200 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50'
                }`}
              >
                {filteredDataSets[key].name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Selected Metrics Table */}
        {selectedDataSets.length > 0 ? (
          <div className="overflow-x-auto bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('name')}>
                    <div className="flex items-center">
                      <span>Metric</span>
                      {sortBy === 'name' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('value')}>
                    <div className="flex items-center justify-end">
                      <span>Last Value</span>
                      {sortBy === 'value' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('weeklyChange')}>
                    <div className="flex items-center justify-end">
                      <span>Weekly Change</span>
                      {sortBy === 'weeklyChange' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('monthlyChange')}>
                    <div className="flex items-center justify-end">
                      <span>Monthly Change</span>
                      {sortBy === 'monthlyChange' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('quarterlyChange')}>
                    <div className="flex items-center justify-end">
                      <span>Quarterly Change</span>
                      {sortBy === 'quarterlyChange' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('yearlyChange')}>
                    <div className="flex items-center justify-end">
                      <span>Yearly Change</span>
                      {sortBy === 'yearlyChange' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                {sortedDataSets.map(dataset => {
                  const stats = calculateStats(dataset.data);
                  
                  return (
                    <tr key={dataset.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Link to={`/chart/${dataset.id}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                          {dataset.name}
                        </Link>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100 font-medium">
                        {stats.lastValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-right text-sm font-medium ${stats.weeklyChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stats.weeklyChange >= 0 ? '+' : ''}{stats.weeklyChange.toFixed(2)}%
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-right text-sm font-medium ${stats.monthlyChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stats.monthlyChange >= 0 ? '+' : ''}{stats.monthlyChange.toFixed(2)}%
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-right text-sm font-medium ${stats.quarterlyChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stats.quarterlyChange >= 0 ? '+' : ''}{stats.quarterlyChange.toFixed(2)}%
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-right text-sm font-medium ${stats.yearlyChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stats.yearlyChange >= 0 ? '+' : ''}{stats.yearlyChange.toFixed(2)}%
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link 
                            to={`/chart/${dataset.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            aria-label={`View ${dataset.name} chart`}
                            title={`View ${dataset.name} chart`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => removeDataSet(dataset.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            aria-label={`Remove ${dataset.name}`}
                            title={`Remove ${dataset.name}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No metrics selected yet. Search and add metrics to compare them.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataExplorer;