import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart, ReferenceArea, Label, Legend
} from 'recharts';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import './Dashboard.css';
import DashboardWidget from './DashboardWidget';
import TopIcons from '../TopIcons/index';
import { fredApi, blsApi, treasuryApi } from '../../services/api';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock data for initial development
const mockWatchlistItems = [
  { id: 1, name: 'S&P 500', value: 4782.21, change: 1.23, weekChange: 2.45, monthChange: 3.67, yearChange: 15.89 },
  { id: 2, name: 'NASDAQ', value: 16742.39, change: 1.78, weekChange: 3.12, monthChange: 4.56, yearChange: 20.34 },
  { id: 3, name: 'Dow Jones', value: 38239.98, change: 0.56, weekChange: 1.23, monthChange: 2.34, yearChange: 10.45 },
  { id: 4, name: '10Y Treasury', value: 4.21, change: -0.05, weekChange: -0.12, monthChange: 0.34, yearChange: 0.67 },
  { id: 5, name: 'VIX', value: 13.82, change: -2.34, weekChange: -5.67, monthChange: -8.90, yearChange: -15.43 },
  { id: 6, name: 'Gold', value: 2345.67, change: 0.45, weekChange: 1.23, monthChange: 3.45, yearChange: 12.34 },
  { id: 7, name: 'Bitcoin', value: 63245.78, change: 3.67, weekChange: 5.43, monthChange: 12.34, yearChange: 45.67 },
  { id: 8, name: 'EUR/USD', value: 1.0876, change: -0.12, weekChange: -0.34, monthChange: -0.56, yearChange: -2.34 },
  { id: 9, name: 'Unemployment Rate', value: 3.8, change: -0.1, weekChange: -0.1, monthChange: -0.2, yearChange: -0.5 },
  { id: 10, name: 'CPI', value: 3.2, change: 0.1, weekChange: 0.2, monthChange: 0.3, yearChange: 3.1 },
  { id: 11, name: 'GDP Growth', value: 2.1, change: 0.2, weekChange: 0.2, monthChange: 0.4, yearChange: 2.5 },
  { id: 12, name: 'Retail Sales', value: 0.7, change: 0.3, weekChange: 0.5, monthChange: 1.2, yearChange: 3.8 },
  { id: 13, name: 'Apple Inc.', value: 178.34, change: 0.87, weekChange: 1.45, monthChange: 3.21, yearChange: 12.34 },
  { id: 14, name: 'Microsoft', value: 412.65, change: 1.23, weekChange: 2.34, monthChange: 4.56, yearChange: 25.67 },
  { id: 15, name: 'Amazon', value: 178.92, change: 0.56, weekChange: 1.23, monthChange: 2.34, yearChange: 15.67 },
  { id: 16, name: 'Google', value: 142.56, change: 0.78, weekChange: 1.56, monthChange: 3.45, yearChange: 18.90 },
  { id: 17, name: 'Tesla', value: 172.82, change: -1.23, weekChange: -3.45, monthChange: -5.67, yearChange: -12.34 },
  { id: 18, name: 'Meta', value: 485.23, change: 2.34, weekChange: 4.56, monthChange: 8.90, yearChange: 32.45 },
  { id: 19, name: 'Nvidia', value: 875.19, change: 3.45, weekChange: 6.78, monthChange: 12.34, yearChange: 45.67 },
  { id: 20, name: 'JPMorgan Chase', value: 198.45, change: 0.34, weekChange: 0.78, monthChange: 1.56, yearChange: 8.90 },
  { id: 21, name: 'Bank of America', value: 38.76, change: -0.45, weekChange: -1.23, monthChange: -2.34, yearChange: -5.67 },
  { id: 22, name: 'Wells Fargo', value: 57.89, change: 0.23, weekChange: 0.56, monthChange: 1.23, yearChange: 6.78 },
  { id: 23, name: 'Citigroup', value: 63.45, change: -0.67, weekChange: -1.45, monthChange: -3.21, yearChange: -7.89 },
  { id: 24, name: 'Goldman Sachs', value: 456.78, change: 1.12, weekChange: 2.34, monthChange: 4.56, yearChange: 15.67 },
  { id: 25, name: 'Ethereum', value: 3456.78, change: 2.45, weekChange: 5.67, monthChange: 10.23, yearChange: 35.67 },
  { id: 26, name: 'Solana', value: 145.67, change: 4.56, weekChange: 8.90, monthChange: 15.67, yearChange: 56.78 },
  { id: 27, name: 'Cardano', value: 0.45, change: -1.23, weekChange: -3.45, monthChange: -5.67, yearChange: -12.34 },
  { id: 28, name: 'XRP', value: 0.56, change: 0.78, weekChange: 1.56, monthChange: 3.45, yearChange: 8.90 },
  { id: 29, name: 'Dogecoin', value: 0.12, change: -2.34, weekChange: -4.56, monthChange: -8.90, yearChange: -23.45 },
  { id: 30, name: 'Silver', value: 27.89, change: 0.45, weekChange: 1.23, monthChange: 2.34, yearChange: 7.89 },
  { id: 31, name: 'Platinum', value: 978.45, change: -0.67, weekChange: -1.45, monthChange: -3.21, yearChange: -8.90 },
  { id: 32, name: 'Palladium', value: 1234.56, change: 1.23, weekChange: 2.45, monthChange: 4.56, yearChange: 12.34 },
  { id: 33, name: 'Crude Oil', value: 78.45, change: 2.34, weekChange: 4.56, monthChange: 8.90, yearChange: 23.45 },
  { id: 34, name: 'Natural Gas', value: 2.34, change: -3.45, weekChange: -6.78, monthChange: -12.34, yearChange: -34.56 },
  { id: 35, name: 'Copper', value: 4.56, change: 0.78, weekChange: 1.56, monthChange: 3.45, yearChange: 9.87 },
  { id: 36, name: 'Aluminum', value: 2.45, change: -0.56, weekChange: -1.23, monthChange: -2.45, yearChange: -6.78 },
  { id: 37, name: 'Wheat', value: 567.89, change: 1.23, weekChange: 2.45, monthChange: 4.56, yearChange: 12.34 },
  { id: 38, name: 'Corn', value: 456.78, change: -0.67, weekChange: -1.45, monthChange: -3.21, yearChange: -8.90 },
  { id: 39, name: 'Soybeans', value: 1234.56, change: 0.45, weekChange: 1.23, monthChange: 2.34, yearChange: 7.89 },
  { id: 40, name: 'Coffee', value: 178.90, change: 2.34, weekChange: 4.56, monthChange: 8.90, yearChange: 23.45 },
];

// Mock data for charts with comparison and calculated metrics
const mockChartData = [
  { date: '2023-01', value: 100, comparison1: 200, comparison2: 50, calculated: 150, percentChange: 0 },
  { date: '2023-02', value: 120, comparison1: 210, comparison2: 55, calculated: 165, percentChange: 20 },
  { date: '2023-03', value: 115, comparison1: 205, comparison2: 60, calculated: 175, percentChange: 15 },
  { date: '2023-04', value: 130, comparison1: 220, comparison2: 65, calculated: 185, percentChange: 30 },
  { date: '2023-05', value: 145, comparison1: 235, comparison2: 70, calculated: 205, percentChange: 45 },
  { date: '2023-06', value: 160, comparison1: 250, comparison2: 75, calculated: 225, percentChange: 60 },
  { date: '2023-07', value: 170, comparison1: 260, comparison2: 80, calculated: 240, percentChange: 70 },
  { date: '2023-08', value: 165, comparison1: 255, comparison2: 85, calculated: 250, percentChange: 65 },
  { date: '2023-09', value: 180, comparison1: 270, comparison2: 90, calculated: 270, percentChange: 80 },
  { date: '2023-10', value: 195, comparison1: 285, comparison2: 95, calculated: 290, percentChange: 95 },
  { date: '2023-11', value: 210, comparison1: 300, comparison2: 100, calculated: 310, percentChange: 110 },
  { date: '2023-12', value: 230, comparison1: 320, comparison2: 110, calculated: 340, percentChange: 130 },
];

// Mock signal data
const mockSignals: Signal[] = [
  { id: 1, name: 'Market Trend', signal: 'buy', confidence: 78 },
  { id: 2, name: 'Economic Indicators', signal: 'neutral', confidence: 52 },
  { id: 3, name: 'Risk Assessment', signal: 'sell', confidence: 65 },
];

// Financial crisis events and black swan events for reference lines
const financialCrisisEvents = [
  // Historical market crashes (20%+ declines)
  { date: '1929-10', label: 'Great Crash' },
  { date: '1987-10', label: 'Black Monday' },
  { date: '2000-03', label: 'Dot-com Bubble' },
  { date: '2001-09', label: '9/11 Attacks' },
  { date: '2008-09', label: 'Financial Crisis' },
  { date: '2020-03', label: 'COVID-19 Crash' },
  // Recent events
  { date: '2022-01', label: 'Rate Hike Selloff' },
  { date: '2022-06', label: 'Bear Market' },
  { date: '2023-03', label: 'Banking Crisis' },
  { date: '2023-07', label: 'Market Correction' },
  { date: '2023-10', label: 'Policy Change' },
];

// Define a type for the metric IDs
type MetricId = 'sp500' | 'nasdaq' | 'djia' | 'treasury10y' | 'vix' | 'gold' | 'bitcoin' | 'unemployment' | 'cpi' | 'gdp' | 'retail';

// Define a type for calculation types
type CalculationType = 'add' | 'subtract' | 'multiply' | 'divide' | 'ratio' | 'average';

// Define the structure of a data point
interface DataSetPoint {
  date: string;
  value: number;
}

// Define the structure of a data set
interface DataSet {
  name: string;
  data: DataSetPoint[];
}

// This interface is defined again later in the file, so we'll remove this one

// Mock data sets for widgets
const mockDataSets: Record<MetricId, DataSet> = {
  sp500: {
    name: 'S&P 500',
    data: [
      { date: '2023-01', value: 3800 },
      { date: '2023-02', value: 4100 },
      { date: '2023-03', value: 3900 },
      { date: '2023-04', value: 4200 },
      { date: '2023-05', value: 4300 },
      { date: '2023-06', value: 4500 },
      { date: '2023-07', value: 4600 },
      { date: '2023-08', value: 4400 },
      { date: '2023-09', value: 4300 },
      { date: '2023-10', value: 4200 },
      { date: '2023-11', value: 4500 },
      { date: '2023-12', value: 4782 },
    ]
  },
  nasdaq: {
    name: 'NASDAQ',
    data: [
      { date: '2023-01', value: 10500 },
      { date: '2023-02', value: 11800 },
      { date: '2023-03', value: 11200 },
      { date: '2023-04', value: 12500 },
      { date: '2023-05', value: 13200 },
      { date: '2023-06', value: 14000 },
      { date: '2023-07', value: 14500 },
      { date: '2023-08', value: 14000 },
      { date: '2023-09', value: 13800 },
      { date: '2023-10', value: 14200 },
      { date: '2023-11', value: 15500 },
      { date: '2023-12', value: 16742 },
    ]
  },
  djia: {
    name: 'Dow Jones',
    data: [
      { date: '2023-01', value: 33000 },
      { date: '2023-02', value: 34500 },
      { date: '2023-03', value: 33800 },
      { date: '2023-04', value: 35000 },
      { date: '2023-05', value: 35800 },
      { date: '2023-06', value: 36500 },
      { date: '2023-07', value: 37000 },
      { date: '2023-08', value: 36500 },
      { date: '2023-09', value: 36000 },
      { date: '2023-10', value: 36800 },
      { date: '2023-11', value: 37500 },
      { date: '2023-12', value: 38240 },
    ]
  },
  treasury10y: {
    name: '10Y Treasury',
    data: [
      { date: '2023-01', value: 3.5 },
      { date: '2023-02', value: 3.7 },
      { date: '2023-03', value: 3.6 },
      { date: '2023-04', value: 3.8 },
      { date: '2023-05', value: 3.9 },
      { date: '2023-06', value: 4.0 },
      { date: '2023-07', value: 4.1 },
      { date: '2023-08', value: 4.3 },
      { date: '2023-09', value: 4.5 },
      { date: '2023-10', value: 4.4 },
      { date: '2023-11', value: 4.3 },
      { date: '2023-12', value: 4.2 },
    ]
  },
  vix: {
    name: 'VIX',
    data: [
      { date: '2023-01', value: 20.5 },
      { date: '2023-02', value: 18.2 },
      { date: '2023-03', value: 22.6 },
      { date: '2023-04', value: 17.8 },
      { date: '2023-05', value: 16.5 },
      { date: '2023-06', value: 15.2 },
      { date: '2023-07', value: 14.8 },
      { date: '2023-08', value: 16.2 },
      { date: '2023-09', value: 17.5 },
      { date: '2023-10', value: 16.8 },
      { date: '2023-11', value: 15.2 },
      { date: '2023-12', value: 13.8 },
    ]
  },
  gold: {
    name: 'Gold',
    data: [
      { date: '2023-01', value: 1900 },
      { date: '2023-02', value: 1950 },
      { date: '2023-03', value: 2000 },
      { date: '2023-04', value: 2050 },
      { date: '2023-05', value: 2100 },
      { date: '2023-06', value: 2150 },
      { date: '2023-07', value: 2200 },
      { date: '2023-08', value: 2250 },
      { date: '2023-09', value: 2300 },
      { date: '2023-10', value: 2320 },
      { date: '2023-11', value: 2330 },
      { date: '2023-12', value: 2346 },
    ]
  },
  bitcoin: {
    name: 'Bitcoin',
    data: [
      { date: '2023-01', value: 16500 },
      { date: '2023-02', value: 23000 },
      { date: '2023-03', value: 28000 },
      { date: '2023-04', value: 30000 },
      { date: '2023-05', value: 27000 },
      { date: '2023-06', value: 31000 },
      { date: '2023-07', value: 29500 },
      { date: '2023-08', value: 28000 },
      { date: '2023-09', value: 27000 },
      { date: '2023-10', value: 35000 },
      { date: '2023-11', value: 42000 },
      { date: '2023-12', value: 63246 },
    ]
  },
  unemployment: {
    name: 'Unemployment Rate',
    data: [
      { date: '2023-01', value: 4.0 },
      { date: '2023-02', value: 3.9 },
      { date: '2023-03', value: 3.8 },
      { date: '2023-04', value: 3.7 },
      { date: '2023-05', value: 3.7 },
      { date: '2023-06', value: 3.6 },
      { date: '2023-07', value: 3.5 },
      { date: '2023-08', value: 3.6 },
      { date: '2023-09', value: 3.7 },
      { date: '2023-10', value: 3.9 },
      { date: '2023-11', value: 3.8 },
      { date: '2023-12', value: 3.8 },
    ]
  },
  cpi: {
    name: 'CPI',
    data: [
      { date: '2023-01', value: 6.4 },
      { date: '2023-02', value: 6.0 },
      { date: '2023-03', value: 5.0 },
      { date: '2023-04', value: 4.9 },
      { date: '2023-05', value: 4.0 },
      { date: '2023-06', value: 3.7 },
      { date: '2023-07', value: 3.2 },
      { date: '2023-08', value: 3.2 },
      { date: '2023-09', value: 3.7 },
      { date: '2023-10', value: 3.2 },
      { date: '2023-11', value: 3.1 },
      { date: '2023-12', value: 3.2 },
    ]
  },
  gdp: {
    name: 'GDP Growth',
    data: [
      { date: '2023-01', value: 1.1 },
      { date: '2023-02', value: 1.2 },
      { date: '2023-03', value: 1.3 },
      { date: '2023-04', value: 1.4 },
      { date: '2023-05', value: 1.5 },
      { date: '2023-06', value: 1.6 },
      { date: '2023-07', value: 1.7 },
      { date: '2023-08', value: 1.8 },
      { date: '2023-09', value: 1.9 },
      { date: '2023-10', value: 2.0 },
      { date: '2023-11', value: 2.1 },
      { date: '2023-12', value: 2.1 },
    ]
  },
  retail: {
    name: 'Retail Sales',
    data: [
      { date: '2023-01', value: 0.2 },
      { date: '2023-02', value: 0.3 },
      { date: '2023-03', value: 0.4 },
      { date: '2023-04', value: 0.5 },
      { date: '2023-05', value: 0.4 },
      { date: '2023-06', value: 0.3 },
      { date: '2023-07', value: 0.4 },
      { date: '2023-08', value: 0.5 },
      { date: '2023-09', value: 0.6 },
      { date: '2023-10', value: 0.7 },
      { date: '2023-11', value: 0.7 },
      { date: '2023-12', value: 0.7 },
    ]
  }
};

interface WatchlistItem {
  id: number;
  name: string;
  value: number;
  change: number;
  weekChange: number;
  monthChange: number;
  yearChange: number;
}

interface ChartDataPoint {
  date: string;
  value: number;
  comparison1?: number;
  comparison2?: number;
  comparison1_original?: number;
  comparison2_original?: number;
  comparison1_percent?: number;
  comparison2_percent?: number;
  calculated?: number;
  calculation_type?: CalculationType;
  percentChange?: number;
  yearChange?: number;  // Added yearly change
  dailyChange?: number; // Added daily change
  weeklyChange?: number; // Added weekly change
  monthlyChange?: number; // Added monthly change
  [key: string]: number | string | undefined;
}

interface SignalMetric {
  id: string;
  name: string;
  weight: number;
  value?: number;
  source?: string; // e.g., 'sp500', 'unemployment', etc.
}

interface Signal {
  id: number;
  name: string;
  signal: 'buy' | 'sell' | 'neutral';
  confidence: number;
  isCustom?: boolean;
  metrics?: SignalMetric[]; // For custom signal pies
}

// Helper function to get a user-friendly display name
const getUserDisplayName = (user: any): string => {
  if (!user) return 'User';
  
  try {
    // Check if user has a name in user_metadata
    if (user.user_metadata) {
      if (user.user_metadata.full_name) {
        return user.user_metadata.full_name;
      }
      
      if (user.user_metadata.name) {
        return user.user_metadata.name;
      }
      
      if (user.user_metadata.preferred_username) {
        return user.user_metadata.preferred_username;
      }
    }
    
    // Check for app_metadata as well
    if (user.app_metadata && user.app_metadata.name) {
      return user.app_metadata.name;
    }
    
    // If no name is available, extract username from email
    if (user.email) {
      // Get the part before @ in the email
      const username = user.email.split('@')[0];
      // Capitalize first letter and replace dots/underscores with spaces
      return username
        .split(/[._-]/)
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    
    // If we have a phone number, use that
    if (user.phone) {
      return `User (${user.phone})`;
    }
    
    // If we have a user ID, use a shortened version
    if (user.id) {
      return `User ${user.id.substring(0, 6)}`;
    }
  } catch (error) {
    console.error('Error getting user display name:', error);
  }
  
  return 'User';
};

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [customSignals, setCustomSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardWidgets, setDashboardWidgets] = useState<string[]>([]);
  const [showWidgetSelector, setShowWidgetSelector] = useState<boolean>(false);
  const [showSignalEditor, setShowSignalEditor] = useState<boolean>(false);
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [timeFrame, setTimeFrame] = useState<'1d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'max'>('1m');
  const [dataSets, setDataSets] = useState<Record<MetricId, DataSet>>({} as Record<MetricId, DataSet>);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  
  // Fetch data from APIs based on the selected widgets
  useEffect(() => {
    const fetchData = async () => {
      if (dashboardWidgets.length === 0) return;
      
      setDataLoading(true);
      console.log('Fetching data for widgets:', dashboardWidgets);
      
      try {
        const newDataSets: Record<MetricId, DataSet> = {} as Record<MetricId, DataSet>;
        const newWatchlistItems: WatchlistItem[] = [];
        
        // Get current date and date 1 year ago for API calls
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;
        
        // Fetch data for each widget
        for (const widgetId of dashboardWidgets) {
          try {
            let data;
            let name = '';
            let value = 0;
            let change = 0;
            
            switch (widgetId) {
              case 'sp500':
                // S&P 500 (FRED series: SP500)
                data = await fredApi.getSeriesData('SP500', { startDate, endDate });
                name = 'S&P 500';
                break;
                
              case 'nasdaq':
                // NASDAQ (FRED series: NASDAQCOM)
                data = await fredApi.getSeriesData('NASDAQCOM', { startDate, endDate });
                name = 'NASDAQ';
                break;
                
              case 'djia':
                // Dow Jones (FRED series: DJIA)
                data = await fredApi.getSeriesData('DJIA', { startDate, endDate });
                name = 'Dow Jones';
                break;
                
              case 'treasury10y':
                // 10-Year Treasury (FRED series: DGS10)
                data = await fredApi.getSeriesData('DGS10', { startDate, endDate });
                name = '10Y Treasury';
                break;
                
              case 'vix':
                // VIX (FRED series: VIXCLS)
                data = await fredApi.getSeriesData('VIXCLS', { startDate, endDate });
                name = 'VIX';
                break;
                
              case 'gold':
                // Gold (FRED series: GOLDAMGBD228NLBM)
                data = await fredApi.getSeriesData('GOLDAMGBD228NLBM', { startDate, endDate });
                name = 'Gold';
                break;
                
              case 'bitcoin':
                // Bitcoin (FRED series: CBBTCUSD)
                data = await fredApi.getSeriesData('CBBTCUSD', { startDate, endDate });
                name = 'Bitcoin';
                break;
                
              case 'unemployment':
                // Unemployment Rate (BLS series)
                data = await blsApi.getUnemploymentData(lastYear, currentYear);
                name = 'Unemployment Rate';
                break;
                
              case 'cpi':
                // CPI (BLS series)
                data = await blsApi.getCPIData(lastYear, currentYear);
                name = 'CPI';
                break;
                
              case 'gdp':
                // GDP Growth (FRED series: A191RL1Q225SBEA)
                data = await fredApi.getSeriesData('A191RL1Q225SBEA', { startDate, endDate });
                name = 'GDP Growth';
                break;
                
              case 'retail':
                // Retail Sales (FRED series: RSXFS)
                data = await fredApi.getSeriesData('RSXFS', { startDate, endDate });
                name = 'Retail Sales';
                break;
                
              default:
                console.warn(`No API mapping for widget: ${widgetId}`);
                continue;
            }
            
            if (data && data.data && data.data.length > 0) {
              // Store the dataset
              newDataSets[widgetId as MetricId] = {
                name,
                data: data.data
              };
              
              // Calculate latest value and change
              const sortedData = [...data.data].sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
              );
              
              if (sortedData.length > 0) {
                value = sortedData[0].value;
                
                // Calculate change (if we have at least 2 data points)
                if (sortedData.length > 1) {
                  const previousValue = sortedData[1].value;
                  change = previousValue !== 0 ? ((value - previousValue) / previousValue) * 100 : 0;
                }
                
                // Add to watchlist items
                newWatchlistItems.push({
                  id: dashboardWidgets.indexOf(widgetId) + 1,
                  name,
                  value,
                  change,
                  weekChange: change, // Simplified for now
                  monthChange: change * 2, // Simplified for now
                  yearChange: change * 4 // Simplified for now
                });
              }
            }
          } catch (error) {
            console.error(`Error fetching data for widget ${widgetId}:`, error);
          }
        }
        
        // Update state with fetched data
        setDataSets(newDataSets);
        setWatchlistItems(newWatchlistItems);
        
        // Generate chart data for comparison
        if (Object.keys(newDataSets).length > 0) {
          const primaryDataset = newDataSets[dashboardWidgets[0] as MetricId];
          if (primaryDataset && primaryDataset.data.length > 0) {
            const newChartData: ChartDataPoint[] = primaryDataset.data.map(point => ({
              date: point.date,
              value: point.value,
              comparison1: 0,
              comparison2: 0,
              calculated: 0,
              percentChange: 0
            }));
            
            // Filter and update chart data
            const filteredData = filterDataByTimeFrame(newChartData, timeFrame);
            calculateYearlyChange(filteredData);
            setChartData(filteredData);
          }
        }
        
        // Generate signals based on data trends
        const newSignals: Signal[] = [
          { 
            id: 1, 
            name: 'Market Trend', 
            signal: newWatchlistItems.filter(item => ['S&P 500', 'NASDAQ', 'Dow Jones'].includes(item.name))
                    .reduce((acc, item) => acc + item.change, 0) > 0 ? 'buy' : 'sell',
            confidence: Math.floor(Math.random() * 30) + 50 // Random confidence between 50-80
          },
          {
            id: 2,
            name: 'Economic Indicators',
            signal: newWatchlistItems.filter(item => ['Unemployment Rate', 'CPI', 'GDP Growth'].includes(item.name))
                    .reduce((acc, item) => acc + item.change, 0) > 0 ? 'buy' : 'neutral',
            confidence: Math.floor(Math.random() * 30) + 50
          },
          {
            id: 3,
            name: 'Risk Assessment',
            signal: newWatchlistItems.filter(item => ['VIX', '10Y Treasury'].includes(item.name))
                    .reduce((acc, item) => acc + item.change, 0) > 0 ? 'sell' : 'buy',
            confidence: Math.floor(Math.random() * 30) + 50
          }
        ];
        setSignals(newSignals);
        
      } catch (error) {
        console.error('Error fetching data for dashboard:', error);
        // Fallback to mock data if API calls fail
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Falling back to mock data due to API error');
          setWatchlistItems(mockWatchlistItems);
          setChartData(mockChartData);
          setSignals(mockSignals);
        }
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchData();
  }, [dashboardWidgets, timeFrame]);
  
  // Calculate changes when time frame changes
  useEffect(() => {
    if (chartData.length > 0) {
      // Filter data based on time frame
      const filteredData = filterDataByTimeFrame([...chartData], timeFrame);
      
      // Calculate yearly change
      calculateYearlyChange(filteredData);
      
      // Update chart data
      setChartData(filteredData);
      
      console.log(`Updated chart data for time frame: ${timeFrame}`);
    }
  }, [timeFrame]); // Re-run when time frame changes
  
  // Function to filter data based on time frame
  const filterDataByTimeFrame = (data: ChartDataPoint[], tf: string): ChartDataPoint[] => {
    if (tf === 'max') return data; // Return all data for 'max' time frame
    
    const now = new Date();
    let startDate: Date;
    
    switch (tf) {
      case '1d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
        break;
      case '1w':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case '1m':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1); // Default to 1 month
    }
    
    // Filter data points that are after the start date
    return data.filter(point => {
      const pointDate = new Date(point.date);
      return pointDate >= startDate;
    });
  };
  
  // Chart control state
  const [selectedMetric, setSelectedMetric] = useState<MetricId>('sp500');
  const [calculationType, setCalculationType] = useState<'value' | 'percentChange' | 'compare' | 'calculate'>('value');
  const [comparisonMetrics, setComparisonMetrics] = useState<MetricId[]>([]);
  const [selectedCalculationType, setSelectedCalculationType] = useState<CalculationType>('average');
  
  // Function to calculate various changes for each data point
  const calculateYearlyChange = (data: ChartDataPoint[]) => {
    if (!data.length) return data;
    
    // Sort data by date to ensure proper calculation
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Get the first value as the reference point for yearly change
    const firstValue = sortedData[0].value;
    
    // Calculate changes for each data point
    sortedData.forEach((point, index) => {
      // Yearly change (from first data point)
      point.yearChange = ((point.value - firstValue) / firstValue) * 100;
      
      // Daily change (from previous data point)
      if (index > 0) {
        const prevValue = sortedData[index - 1].value;
        point.dailyChange = ((point.value - prevValue) / prevValue) * 100;
      } else {
        point.dailyChange = 0;
      }
      
      // Weekly change (from 7 data points ago or earliest available)
      const weeklyIndex = Math.max(0, index - 7);
      if (index > weeklyIndex) {
        const weeklyPrevValue = sortedData[weeklyIndex].value;
        point.weeklyChange = ((point.value - weeklyPrevValue) / weeklyPrevValue) * 100;
      } else {
        point.weeklyChange = 0;
      }
      
      // Monthly change (from 30 data points ago or earliest available)
      const monthlyIndex = Math.max(0, index - 30);
      if (index > monthlyIndex) {
        const monthlyPrevValue = sortedData[monthlyIndex].value;
        point.monthlyChange = ((point.value - monthlyPrevValue) / monthlyPrevValue) * 100;
      } else {
        point.monthlyChange = 0;
      }
    });
    
    return sortedData;
  };

  // Handle metric selection change
  const handleMetricChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMetric = e.target.value as MetricId;
    setSelectedMetric(newMetric);
    
    // Update chart data based on the selected metric
    const newData = mockDataSets[newMetric].data.map(point => {
      // Preserve comparison and calculated values if they exist
      const existingPoint = chartData.find(p => p.date === point.date);
      return {
        ...point,
        comparison1: existingPoint?.comparison1,
        comparison2: existingPoint?.comparison2,
        calculated: existingPoint?.calculated,
        percentChange: existingPoint?.percentChange
      };
    });
    
    // Apply normalization for comparison metrics if they exist
    if (comparisonMetrics.length > 0) {
      normalizeComparisonMetrics(newData, comparisonMetrics);
    }
    
    // Calculate yearly change
    calculateYearlyChange(newData);
    
    setChartData(newData);
  };
  
  // Function to normalize comparison metrics for proper scaling
  const normalizeComparisonMetrics = (data: ChartDataPoint[], metrics: MetricId[]) => {
    if (!data.length) return data;
    
    // Get min/max values for primary metric
    const primaryValues = data.map(point => point.value).filter(val => !isNaN(val));
    const primaryMin = Math.min(...primaryValues);
    const primaryMax = Math.max(...primaryValues);
    const primaryRange = primaryMax - primaryMin;
    const primaryMean = primaryValues.reduce((sum, val) => sum + val, 0) / primaryValues.length;
    
    // Normalize each comparison metric
    metrics.forEach((metricId, index) => {
      // Get the comparison data - try real data first, then fall back to mock if needed
      const comparisonData = dataSets[metricId]?.data || 
        (process.env.NODE_ENV !== 'production' ? mockDataSets[metricId]?.data : []);
      
      // Get min/max values for comparison metric
      const compValues = comparisonData.map(point => point.value).filter(val => !isNaN(val));
      const compMin = Math.min(...compValues);
      const compMax = Math.max(...compValues);
      const compRange = compMax - compMin;
      const compMean = compValues.reduce((sum, val) => sum + val, 0) / compValues.length;
      
      // Skip normalization if ranges are invalid
      if (primaryRange <= 0 || compRange <= 0) return;
      
      // Apply normalization to each data point
      data.forEach(point => {
        const compPoint = comparisonData.find(p => p.date === point.date);
        if (!compPoint) return;
        
        // Calculate normalized value that preserves the shape but scales to primary range
        const compValue = compPoint.value;
        
        // Enhanced normalization that preserves relative movements better
        // This approach centers both datasets around their means before scaling
        const normalizedValue = ((compValue - compMean) / compRange) * primaryRange + primaryMean;
        
        // Store in the appropriate comparison field
        if (index === 0) {
          point.comparison1 = normalizedValue;
          point.comparison1_original = compValue; // Store original for tooltip
          point.comparison1_scale_factor = primaryRange / compRange; // Store scale factor for reference
        } else if (index === 1) {
          point.comparison2 = normalizedValue;
          point.comparison2_original = compValue; // Store original for tooltip
          point.comparison2_scale_factor = primaryRange / compRange; // Store scale factor for reference
        }
      });
    });
    
    return data;
  };
  
  // Handle calculation type change
  const handleCalculationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCalcType = e.target.value as 'value' | 'percentChange' | 'compare' | 'calculate';
    setCalculationType(newCalcType);
    
    // Update chart data based on calculation type
    if (newCalcType === 'percentChange') {
      // Calculate percent changes from the first value
      const baseValue = chartData[0]?.value || 1;
      const newData = chartData.map(point => ({
        ...point,
        percentChange: ((point.value - baseValue) / baseValue) * 100
      }));
      
      // Also calculate percent changes for comparison metrics if they exist
      if (comparisonMetrics.length > 0) {
        comparisonMetrics.forEach((metricId, index) => {
          // Get the comparison data - try real data first, then fall back to mock if needed
          const compData = dataSets[metricId]?.data || 
            (process.env.NODE_ENV !== 'production' ? mockDataSets[metricId]?.data : []);
          if (!compData || compData.length === 0) return;
          
          const compBaseValue = compData[0]?.value || 1;
          
          newData.forEach(point => {
            const compPoint = compData.find(p => p.date === point.date);
            if (!compPoint) return;
            
            const percentChange = ((compPoint.value - compBaseValue) / compBaseValue) * 100;
            if (index === 0) {
              point.comparison1_percent = percentChange;
            } else if (index === 1) {
              point.comparison2_percent = percentChange;
            }
          });
        });
      }
      
      setChartData(newData);
    } else if (newCalcType === 'compare') {
      // Add comparison metrics if not already present
      let newComparisonMetrics = comparisonMetrics;
      
      if (comparisonMetrics.length === 0) {
        // Choose appropriate comparison metrics based on the selected metric
        if (selectedMetric === 'sp500') {
          newComparisonMetrics = ['nasdaq', 'djia'];
        } else if (selectedMetric === 'nasdaq') {
          newComparisonMetrics = ['sp500', 'djia'];
        } else if (selectedMetric === 'djia') {
          newComparisonMetrics = ['sp500', 'nasdaq'];
        } else if (selectedMetric === 'bitcoin') {
          newComparisonMetrics = ['gold', 'nasdaq'];
        } else if (selectedMetric === 'gold') {
          newComparisonMetrics = ['bitcoin', 'sp500'];
        } else if (selectedMetric === 'treasury10y') {
          newComparisonMetrics = ['vix', 'sp500'];
        } else if (selectedMetric === 'vix') {
          newComparisonMetrics = ['sp500', 'treasury10y'];
        } else if (selectedMetric === 'cpi') {
          newComparisonMetrics = ['unemployment', 'gdp'];
        } else if (selectedMetric === 'unemployment') {
          newComparisonMetrics = ['cpi', 'gdp'];
        } else if (selectedMetric === 'gdp') {
          newComparisonMetrics = ['cpi', 'unemployment'];
        } else {
          newComparisonMetrics = ['sp500', 'nasdaq'];
        }
        
        setComparisonMetrics(newComparisonMetrics);
      }
      
      // Create a copy of the current data
      const newData = [...chartData];
      
      // Apply normalization to ensure proper scaling
      normalizeComparisonMetrics(newData, newComparisonMetrics);
      
      setChartData(newData);
    } else if (newCalcType === 'calculate') {
      // Add comparison metrics if not already present
      let newComparisonMetrics = comparisonMetrics;
      
      if (comparisonMetrics.length === 0) {
        // Choose appropriate comparison metrics based on the selected metric
        if (selectedMetric === 'sp500') {
          newComparisonMetrics = ['nasdaq', 'djia'];
        } else if (selectedMetric === 'nasdaq') {
          newComparisonMetrics = ['sp500', 'djia'];
        } else if (selectedMetric === 'djia') {
          newComparisonMetrics = ['sp500', 'nasdaq'];
        } else if (selectedMetric === 'bitcoin') {
          newComparisonMetrics = ['gold', 'nasdaq'];
        } else if (selectedMetric === 'gold') {
          newComparisonMetrics = ['bitcoin', 'sp500'];
        } else if (selectedMetric === 'treasury10y') {
          newComparisonMetrics = ['vix', 'sp500'];
        } else if (selectedMetric === 'vix') {
          newComparisonMetrics = ['sp500', 'treasury10y'];
        } else if (selectedMetric === 'cpi') {
          newComparisonMetrics = ['unemployment', 'gdp'];
        } else if (selectedMetric === 'unemployment') {
          newComparisonMetrics = ['cpi', 'gdp'];
        } else if (selectedMetric === 'gdp') {
          newComparisonMetrics = ['cpi', 'unemployment'];
        } else {
          newComparisonMetrics = ['sp500', 'nasdaq'];
        }
        
        setComparisonMetrics(newComparisonMetrics);
      }
      
      // Create a copy of the current data
      const newData = [...chartData];
      
      // First normalize the comparison metrics to ensure proper scaling
      normalizeComparisonMetrics(newData, newComparisonMetrics);
      
      // Then perform the calculation
      newData.forEach(point => {
        let calculatedValue = point.value;
        
        // If we have comparison metrics, perform calculations
        if (point.comparison1 !== undefined) {
          // Use the selected calculation type
          const calcType = selectedCalculationType;
          
          // Calculate based on the calculation type
          if (calcType === 'add') {
            calculatedValue = point.value + point.comparison1;
            if (point.comparison2 !== undefined) {
              calculatedValue += point.comparison2;
            }
          } else if (calcType === 'subtract') {
            calculatedValue = point.value - point.comparison1;
            if (point.comparison2 !== undefined) {
              calculatedValue -= point.comparison2;
            }
          } else if (calcType === 'multiply') {
            calculatedValue = point.value * point.comparison1;
            if (point.comparison2 !== undefined) {
              calculatedValue *= point.comparison2;
            }
          } else if (calcType === 'divide') {
            calculatedValue = point.comparison1 !== 0 ? point.value / point.comparison1 : point.value;
            if (point.comparison2 !== undefined && point.comparison2 !== 0) {
              calculatedValue /= point.comparison2;
            }
          } else if (calcType === 'ratio') {
            calculatedValue = point.comparison1 !== 0 ? (point.value / point.comparison1) * 100 : 100;
          } else {
            // Average
            let sum = point.value + point.comparison1;
            let count = 2;
            if (point.comparison2 !== undefined) {
              sum += point.comparison2;
              count++;
            }
            calculatedValue = sum / count;
          }
        }
        
        point.calculated = calculatedValue;
        point.calculation_type = selectedCalculationType; // Store the type of calculation for the tooltip
      });
      
      setChartData(newData);
    }
  };

  const [widgetLayout, setWidgetLayout] = useState<'grid' | 'row'>('row');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('User data:', user); // Log user data for debugging
        setUser(user);
        
        if (user) {
          // Check if we're using mock data
          if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
            console.log('Using mock data for dashboard');
            // Use default widgets for mock data
            setDashboardWidgets(['sp500', 'nasdaq', 'djia', 'vix', 'treasury10y', 'gold', 'bitcoin', 'unemployment']);
          } else {
            // Get user settings from settings table
            try {
              const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();
              
              if (!error && data) {
                setUserSettings(data);
                // If user has saved dashboard widgets, use them
                if (data.dashboard_widgets && Array.isArray(data.dashboard_widgets)) {
                  setDashboardWidgets(data.dashboard_widgets);
                } else {
                  // Otherwise use default widgets
                  setDashboardWidgets(['sp500', 'nasdaq', 'djia', 'vix', 'treasury10y', 'gold', 'bitcoin', 'unemployment']);
                }
                
                // Load custom signals if available
                if (data.custom_signals && Array.isArray(data.custom_signals)) {
                  setCustomSignals(data.custom_signals);
                }
              } else {
                // Use default widgets if no settings found
                setDashboardWidgets(['sp500', 'nasdaq', 'djia', 'vix', 'treasury10y', 'gold', 'bitcoin', 'unemployment']);
              }
            } catch (settingsError) {
              console.error('Error fetching user settings:', settingsError);
              // Fallback to default widgets
              setDashboardWidgets(['sp500', 'nasdaq', 'djia', 'vix', 'treasury10y', 'gold', 'bitcoin', 'unemployment']);
            }
          }
        } else {
          // Use default widgets if no user
          setDashboardWidgets(['sp500', 'nasdaq', 'djia', 'vix', 'treasury10y', 'gold', 'bitcoin', 'unemployment']);
        }
      } catch (error) {
        console.error('Error getting user:', error);
        // Fallback to default widgets
        setDashboardWidgets(['sp500', 'nasdaq', 'djia', 'vix', 'treasury10y', 'gold', 'bitcoin', 'unemployment']);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);
  
  // Add a widget to the dashboard
  const addWidget = (id: string) => {
    if (dashboardWidgets.length >= 8) {
      alert('You can only add up to 8 widgets to your dashboard.');
      return;
    }
    
    if (!dashboardWidgets.includes(id)) {
      const newWidgets = [...dashboardWidgets, id];
      setDashboardWidgets(newWidgets);
      saveWidgets(newWidgets);
    }
    
    setShowWidgetSelector(false);
  };
  
  // Remove a widget from the dashboard
  const removeWidget = (id: string) => {
    const newWidgets = dashboardWidgets.filter(widgetId => widgetId !== id);
    setDashboardWidgets(newWidgets);
    saveWidgets(newWidgets);
  };
  
  // Save widgets to user settings
  const saveWidgets = async (widgets: string[]) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          dashboard_widgets: widgets,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving dashboard widgets:', error);
    }
  };
  
  // Create a new custom signal pie
  const createCustomSignal = () => {
    const newSignal: Signal = {
      id: customSignals.length > 0 ? Math.max(...customSignals.map(s => s.id)) + 1 : signals.length + 1,
      name: `Custom Signal ${customSignals.length + 1}`,
      signal: 'neutral',
      confidence: 50,
      isCustom: true,
      metrics: [] // Initialize with empty array
    };
    
    setEditingSignal(newSignal);
    setShowSignalEditor(true);
  };
  
  // Edit an existing signal pie
  const editSignal = (signal: Signal) => {
    setEditingSignal({...signal});
    setShowSignalEditor(true);
  };
  
  // Save a custom signal pie
  const saveCustomSignal = (signal: Signal) => {
    // Create a copy of the signal to avoid mutating the original
    const updatedSignal = {...signal, metrics: [...(signal.metrics || [])]};
    
    // Calculate signal value based on metrics
    let signalValue = 0;
    let totalWeight = 0;
    
    if (updatedSignal.metrics && updatedSignal.metrics.length > 0) {
      updatedSignal.metrics.forEach(metric => {
        if (metric.value !== undefined) {
          signalValue += metric.value * (metric.weight / 100);
          totalWeight += metric.weight;
        }
      });
      
      // Normalize if weights don't add up to 100
      if (totalWeight > 0 && totalWeight !== 100) {
        signalValue = (signalValue / totalWeight) * 100;
      }
      
      // Determine buy/sell/neutral signal
      if (signalValue > 60) {
        updatedSignal.signal = 'buy';
      } else if (signalValue < 40) {
        updatedSignal.signal = 'sell';
      } else {
        updatedSignal.signal = 'neutral';
      }
      
      // Set confidence based on strength of signal
      updatedSignal.confidence = Math.min(100, Math.max(0, Math.abs(signalValue - 50) * 2));
    }
    
    // Update or add the signal
    const existingIndex = customSignals.findIndex(s => s.id === updatedSignal.id);
    if (existingIndex >= 0) {
      const updatedSignals = [...customSignals];
      updatedSignals[existingIndex] = updatedSignal;
      setCustomSignals(updatedSignals);
      // Save to user settings
      saveCustomSignalsToSettings(updatedSignals);
    } else {
      const newSignals = [...customSignals, updatedSignal];
      setCustomSignals(newSignals);
      // Save to user settings
      saveCustomSignalsToSettings(newSignals);
    }
    
    setShowSignalEditor(false);
    setEditingSignal(null);
  };
  
  // Delete a custom signal pie
  const deleteCustomSignal = (signalId: number) => {
    const updatedSignals = customSignals.filter(s => s.id !== signalId);
    setCustomSignals(updatedSignals);
    saveCustomSignalsToSettings(updatedSignals);
  };
  
  // Add a metric to a signal pie
  const addMetricToSignal = (signal: Signal, metricId: string) => {
    // Ensure metrics array exists
    const updatedSignal = { 
      ...signal,
      metrics: signal.metrics || [] 
    };
    
    // Don't add if already exists
    if (updatedSignal.metrics.some(m => m.id === metricId)) {
      return updatedSignal;
    }
    
    const dataSet = dataSets[metricId as MetricId];
    const name = dataSet?.name || getWidgetName(metricId);
    
    // Calculate a default value based on recent performance
    let value = 50; // Neutral by default
    if (dataSet && dataSet.data && dataSet.data.length > 1) {
      const latestData = dataSet.data[dataSet.data.length - 1];
      const previousData = dataSet.data[dataSet.data.length - 2];
      
      if (latestData && previousData) {
        // If value is increasing, it's positive
        const change = ((latestData.value - previousData.value) / previousData.value) * 100;
        value = change > 0 ? 75 : (change < 0 ? 25 : 50);
      }
    }
    
    updatedSignal.metrics.push({
      id: metricId,
      name,
      weight: Math.floor(100 / (updatedSignal.metrics.length + 1)), // Distribute weights evenly
      value,
      source: metricId
    });
    
    // Rebalance weights to ensure they sum to 100
    const totalWeight = updatedSignal.metrics.reduce((sum, metric) => sum + metric.weight, 0);
    if (totalWeight !== 100) {
      updatedSignal.metrics.forEach(metric => {
        metric.weight = Math.floor((metric.weight / totalWeight) * 100);
      });
      
      // Adjust the last metric to ensure sum is exactly 100
      const adjustedTotal = updatedSignal.metrics.reduce((sum, metric) => sum + metric.weight, 0);
      if (adjustedTotal !== 100 && updatedSignal.metrics.length > 0) {
        updatedSignal.metrics[updatedSignal.metrics.length - 1].weight += (100 - adjustedTotal);
      }
    }
    
    return updatedSignal;
  };
  
  // Remove a metric from a signal pie
  const removeMetricFromSignal = (signal: Signal, metricId: string) => {
    if (!signal.metrics) return {...signal, metrics: []};
    
    // Create a new signal object with filtered metrics
    const updatedSignal = {
      ...signal,
      metrics: signal.metrics.filter(m => m.id !== metricId)
    };
    
    // Rebalance weights
    if (updatedSignal.metrics.length > 0) {
      const equalWeight = Math.floor(100 / updatedSignal.metrics.length);
      updatedSignal.metrics.forEach(metric => {
        metric.weight = equalWeight;
      });
      
      // Adjust the last metric to ensure sum is exactly 100
      const adjustedTotal = updatedSignal.metrics.reduce((sum, metric) => sum + metric.weight, 0);
      if (adjustedTotal !== 100 && updatedSignal.metrics.length > 0) {
        updatedSignal.metrics[updatedSignal.metrics.length - 1].weight += (100 - adjustedTotal);
      }
    }
    
    return updatedSignal;
  };
  
  // Update a metric's weight in a signal pie
  const updateMetricWeight = (signal: Signal, metricId: string, weight: number) => {
    if (!signal.metrics || signal.metrics.length === 0) {
      return {...signal, metrics: []};
    }
    
    // Create a new signal object with a copy of the metrics array
    const updatedSignal = {
      ...signal,
      metrics: [...signal.metrics]
    };
    
    const metricIndex = updatedSignal.metrics.findIndex(m => m.id === metricId);
    if (metricIndex === -1) return updatedSignal;
    
    // Update the weight
    updatedSignal.metrics[metricIndex].weight = weight;
    
    // Calculate how much we need to adjust other weights
    const totalWeight = updatedSignal.metrics.reduce((sum, metric) => sum + metric.weight, 0);
    const difference = 100 - totalWeight;
    
    if (difference !== 0 && updatedSignal.metrics.length > 1) {
      // Distribute the difference among other metrics proportionally
      const otherMetrics = updatedSignal.metrics.filter(m => m.id !== metricId);
      const otherTotalWeight = otherMetrics.reduce((sum, metric) => sum + metric.weight, 0);
      
      if (otherTotalWeight > 0) {
        updatedSignal.metrics.forEach(metric => {
          if (metric.id !== metricId) {
            metric.weight += (difference * (metric.weight / otherTotalWeight));
            metric.weight = Math.max(1, Math.min(99, Math.round(metric.weight)));
          }
        });
        
        // Final adjustment to ensure sum is exactly 100
        const finalTotal = updatedSignal.metrics.reduce((sum, metric) => sum + metric.weight, 0);
        if (finalTotal !== 100) {
          // Find the metric with the largest weight (other than the one we just changed)
          const largestMetric = updatedSignal.metrics
            .filter(m => m.id !== metricId)
            .sort((a, b) => b.weight - a.weight)[0];
            
          if (largestMetric) {
            largestMetric.weight += (100 - finalTotal);
          }
        }
      }
    }
    
    return updatedSignal;
  };
  
  // Save custom signals to user settings
  const saveCustomSignalsToSettings = async (signals: Signal[]) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          custom_signals: signals,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving custom signals:', error);
    }
  };
  
  // Helper function to get widget name from ID
  const getWidgetName = (widgetId: string): string => {
    switch (widgetId) {
      case 'sp500': return 'S&P 500';
      case 'nasdaq': return 'NASDAQ';
      case 'djia': return 'Dow Jones';
      case 'treasury10y': return '10Y Treasury';
      case 'vix': return 'VIX';
      case 'gold': return 'Gold';
      case 'bitcoin': return 'Bitcoin';
      case 'unemployment': return 'Unemployment Rate';
      case 'cpi': return 'CPI';
      case 'gdp': return 'GDP Growth';
      case 'retail': return 'Retail Sales';
      default: return widgetId.charAt(0).toUpperCase() + widgetId.slice(1);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Welcome, {getUserDisplayName(user)}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          This is your financial data dashboard. Monitor your watchlist, view market signals, and analyze data.
        </p>
      </div>
      
      {/* Top Icons */}
      <TopIcons />

      {/* Dashboard Widgets */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Dashboard Widgets</h2>
        <button
          type="button"
          onClick={() => setShowWidgetSelector(!showWidgetSelector)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showWidgetSelector ? 'Close' : 'Add Widget'}
        </button>
      </div>
      
      {/* Widget Selector */}
      {showWidgetSelector && (
        <div className="bg-white dark:bg-dark-card shadow rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select a widget to add (max 8)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {/* Use available metrics from real data if available, otherwise use predefined list */}
            {(Object.keys(dataSets).length > 0 
              ? Object.keys(dataSets) 
              : ['sp500', 'nasdaq', 'djia', 'treasury10y', 'vix', 'gold', 'bitcoin', 'unemployment', 'cpi', 'gdp', 'retail']
            ).map(key => (
              <button
                key={key}
                onClick={() => addWidget(key)}
                disabled={dashboardWidgets.includes(key)}
                className={`p-2 text-sm rounded-lg border ${
                  dashboardWidgets.includes(key)
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                }`}
              >
                {dataSets[key as MetricId]?.name || getWidgetName(key)}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Quick Links */}
      <div className="bg-white dark:bg-dark-card shadow rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Link to="/chart" className="flex flex-col items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Standard Charts</span>
          </Link>
          
          <Link to="/enhanced-chart" className="flex flex-col items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">TradingView Charts</span>
          </Link>
          
          <Link to="/explorer" className="flex flex-col items-center justify-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Data Explorer</span>
          </Link>
          
          <Link to="/watchlist" className="flex flex-col items-center justify-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Watchlist</span>
          </Link>
          
          <Link to="/signals" className="flex flex-col items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Signal Pies</span>
          </Link>
          
          <Link to="/ai-analysis" className="flex flex-col items-center justify-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">AI Analysis</span>
          </Link>
        </div>
      </div>
      
      {/* Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {dashboardWidgets.map(widgetId => {
          // Use real data from API if available
          const dataSet = dataSets[widgetId as MetricId];
          
          // If data is still loading, show loading state
          if (dataLoading) {
            return (
              <DashboardWidget
                key={widgetId}
                id={widgetId}
                name={getWidgetName(widgetId)}
                value={0}
                change={0}
                onRemove={removeWidget}
                loading={true}
              />
            );
          }
          
          // If no data is available yet, use mock data as fallback
          if (!dataSet || !dataSet.data || dataSet.data.length === 0) {
            // Only use mock data in development
            if (process.env.NODE_ENV !== 'production') {
              const mockDataSet = mockDataSets[widgetId as keyof typeof mockDataSets];
              if (mockDataSet) {
                const latestData = mockDataSet.data[mockDataSet.data.length - 1];
                if (latestData) {
                  const weeklyChange = mockDataSet.data.length > 4 
                    ? ((latestData.value - mockDataSet.data[mockDataSet.data.length - 5].value) / mockDataSet.data[mockDataSet.data.length - 5].value) * 100
                    : 0;
                  
                  return (
                    <DashboardWidget
                      key={widgetId}
                      id={widgetId}
                      name={mockDataSet.name}
                      value={latestData.value}
                      change={weeklyChange}
                      onRemove={removeWidget}
                      data={mockDataSet.data}
                    />
                  );
                }
              }
            }
            
            // In production, show empty widget with no data message
            return (
              <DashboardWidget
                key={widgetId}
                id={widgetId}
                name={getWidgetName(widgetId)}
                value={0}
                change={0}
                onRemove={removeWidget}
                data={[]}
              />
            );
          }
          
          // Get the latest data point from real API data
          const latestData = dataSet.data[dataSet.data.length - 1];
          if (!latestData) return null;
          
          // Calculate weekly change
          const weeklyChange = dataSet.data.length > 4 
            ? ((latestData.value - dataSet.data[dataSet.data.length - 5].value) / dataSet.data[dataSet.data.length - 5].value) * 100
            : 0;
          
          return (
            <DashboardWidget
              key={widgetId}
              id={widgetId}
              name={dataSet.name}
              value={latestData.value}
              change={weeklyChange}
              onRemove={removeWidget}
              data={dataSet.data}
            />
          );
        })}
        
        {dashboardWidgets.length === 0 && (
          <div className="col-span-full text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No widgets added yet. Click "Add Widget" to customize your dashboard.</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-card shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Market Overview 
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                [{timeFrame}]
              </span>
            </h2>
            <div className="flex space-x-2">
              <select 
                className="text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={selectedMetric}
                onChange={handleMetricChange}
                aria-label="Select primary metric"
              >
                {/* Use available metrics from real data if available, otherwise use predefined list */}
                {(Object.keys(dataSets).length > 0 
                  ? Object.keys(dataSets) 
                  : ['sp500', 'nasdaq', 'djia', 'treasury10y', 'vix', 'gold', 'bitcoin', 'unemployment', 'cpi', 'gdp', 'retail']
                ).map(metricId => (
                  <option key={metricId} value={metricId}>
                    {dataSets[metricId as MetricId]?.name || getWidgetName(metricId)}
                  </option>
                ))}
              </select>
              
              <select
                className="text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value as any)}
                aria-label="Select time frame"
              >
                <option value="1d">1 Day</option>
                <option value="1w">1 Week</option>
                <option value="1m">1 Month</option>
                <option value="3m">3 Months</option>
                <option value="6m">6 Months</option>
                <option value="1y">1 Year</option>
                <option value="max">Max</option>
              </select>
              
              <select 
                className="text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={calculationType}
                onChange={handleCalculationTypeChange}
                aria-label="Select calculation type"
              >
                <option value="value">Raw Value</option>
                <option value="percentChange">Percent Change</option>
                <option value="compare">Compare</option>
                <option value="calculate">Calculate</option>
              </select>
              
              {calculationType === 'calculate' && (
                <>
                  <select 
                    className="ml-2 text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={selectedCalculationType}
                    onChange={(e) => {
                      setSelectedCalculationType(e.target.value as CalculationType);
                      // Recalculate with the new calculation type
                      const newData = chartData.map(point => {
                        let calculatedValue = point.value;
                        if (point.comparison1 !== undefined) {
                          const calcType = e.target.value as CalculationType;
                          if (calcType === 'add') {
                            calculatedValue = point.value + point.comparison1;
                            if (point.comparison2 !== undefined) {
                              calculatedValue += point.comparison2;
                            }
                          } else if (calcType === 'subtract') {
                            calculatedValue = point.value - point.comparison1;
                            if (point.comparison2 !== undefined) {
                              calculatedValue -= point.comparison2;
                            }
                          } else if (calcType === 'multiply') {
                            calculatedValue = point.value * point.comparison1;
                            if (point.comparison2 !== undefined) {
                              calculatedValue *= point.comparison2;
                            }
                          } else if (calcType === 'divide') {
                            calculatedValue = point.comparison1 !== 0 ? point.value / point.comparison1 : point.value;
                            if (point.comparison2 !== undefined && point.comparison2 !== 0) {
                              calculatedValue /= point.comparison2;
                            }
                          } else if (calcType === 'ratio') {
                            calculatedValue = point.comparison1 !== 0 ? (point.value / point.comparison1) * 100 : 100;
                          } else {
                            // Average
                            let sum = point.value + point.comparison1;
                            let count = 2;
                            if (point.comparison2 !== undefined) {
                              sum += point.comparison2;
                              count++;
                            }
                            calculatedValue = sum / count;
                          }
                        }
                        return {
                          ...point,
                          calculated: calculatedValue,
                          calculation_type: e.target.value as CalculationType
                        };
                      });
                      setChartData(newData);
                    }}
                    aria-label="Select formula type"
                  >
                    <option value="average">Average</option>
                    <option value="add">Sum</option>
                    <option value="subtract">Difference</option>
                    <option value="multiply">Product</option>
                    <option value="divide">Quotient</option>
                    <option value="ratio">Ratio (%)</option>
                  </select>
                  
                  {/* Metric selector for comparison */}
                  <div className="ml-2 inline-flex">
                    <select 
                      className="text-sm border border-gray-300 dark:border-gray-700 rounded-l px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      value={comparisonMetrics[0] || ''}
                      onChange={(e) => {
                        const newMetrics = [...comparisonMetrics];
                        newMetrics[0] = e.target.value as MetricId;
                        setComparisonMetrics(newMetrics);
                        
                        // Update chart data with the new comparison metric
                        const newData = [...chartData];
                        normalizeComparisonMetrics(newData, newMetrics);
                        
                        // Recalculate with the new metrics
                        newData.forEach(point => {
                          let calculatedValue = point.value;
                          if (point.comparison1 !== undefined) {
                            const calcType = selectedCalculationType;
                            if (calcType === 'add') {
                              calculatedValue = point.value + point.comparison1;
                              if (point.comparison2 !== undefined) {
                                calculatedValue += point.comparison2;
                              }
                            } else if (calcType === 'subtract') {
                              calculatedValue = point.value - point.comparison1;
                              if (point.comparison2 !== undefined) {
                                calculatedValue -= point.comparison2;
                              }
                            } else if (calcType === 'multiply') {
                              calculatedValue = point.value * point.comparison1;
                              if (point.comparison2 !== undefined) {
                                calculatedValue *= point.comparison2;
                              }
                            } else if (calcType === 'divide') {
                              calculatedValue = point.comparison1 !== 0 ? point.value / point.comparison1 : point.value;
                              if (point.comparison2 !== undefined && point.comparison2 !== 0) {
                                calculatedValue /= point.comparison2;
                              }
                            } else if (calcType === 'ratio') {
                              calculatedValue = point.comparison1 !== 0 ? (point.value / point.comparison1) * 100 : 100;
                            } else {
                              // Average
                              let sum = point.value + point.comparison1;
                              let count = 2;
                              if (point.comparison2 !== undefined) {
                                sum += point.comparison2;
                                count++;
                              }
                              calculatedValue = sum / count;
                            }
                          }
                          point.calculated = calculatedValue;
                        });
                        
                        setChartData(newData);
                      }}
                      aria-label="Select first comparison metric"
                    >
                      <option value="">Select metric</option>
                      {(Object.keys(dataSets).length > 0 
                        ? Object.keys(dataSets) 
                        : ['sp500', 'nasdaq', 'djia', 'treasury10y', 'vix', 'gold', 'bitcoin', 'unemployment', 'cpi', 'gdp', 'retail']
                      )
                        .filter(id => id !== selectedMetric)
                        .map(metricId => (
                          <option key={metricId} value={metricId}>
                            {dataSets[metricId as MetricId]?.name || getWidgetName(metricId)}
                          </option>
                        ))
                      }
                    </select>
                    
                    <select 
                      className="text-sm border-t border-b border-r border-gray-300 dark:border-gray-700 rounded-r px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      value={comparisonMetrics[1] || ''}
                      onChange={(e) => {
                        const newMetrics = [...comparisonMetrics];
                        newMetrics[1] = e.target.value as MetricId;
                        setComparisonMetrics(newMetrics);
                        
                        // Update chart data with the new comparison metric
                        const newData = [...chartData];
                        normalizeComparisonMetrics(newData, newMetrics);
                        
                        // Recalculate with the new metrics
                        newData.forEach(point => {
                          let calculatedValue = point.value;
                          if (point.comparison1 !== undefined) {
                            const calcType = selectedCalculationType;
                            if (calcType === 'add') {
                              calculatedValue = point.value + point.comparison1;
                              if (point.comparison2 !== undefined) {
                                calculatedValue += point.comparison2;
                              }
                            } else if (calcType === 'subtract') {
                              calculatedValue = point.value - point.comparison1;
                              if (point.comparison2 !== undefined) {
                                calculatedValue -= point.comparison2;
                              }
                            } else if (calcType === 'multiply') {
                              calculatedValue = point.value * point.comparison1;
                              if (point.comparison2 !== undefined) {
                                calculatedValue *= point.comparison2;
                              }
                            } else if (calcType === 'divide') {
                              calculatedValue = point.comparison1 !== 0 ? point.value / point.comparison1 : point.value;
                              if (point.comparison2 !== undefined && point.comparison2 !== 0) {
                                calculatedValue /= point.comparison2;
                              }
                            } else if (calcType === 'ratio') {
                              calculatedValue = point.comparison1 !== 0 ? (point.value / point.comparison1) * 100 : 100;
                            } else {
                              // Average
                              let sum = point.value + point.comparison1;
                              let count = 2;
                              if (point.comparison2 !== undefined) {
                                sum += point.comparison2;
                                count++;
                              }
                              calculatedValue = sum / count;
                            }
                          }
                          point.calculated = calculatedValue;
                        });
                        
                        setChartData(newData);
                      }}
                      aria-label="Select second comparison metric"
                    >
                      <option value="">Select metric</option>
                      {(Object.keys(dataSets).length > 0 
                        ? Object.keys(dataSets) 
                        : ['sp500', 'nasdaq', 'djia', 'treasury10y', 'vix', 'gold', 'bitcoin', 'unemployment', 'cpi', 'gdp', 'retail']
                      )
                        .filter(id => id !== selectedMetric && id !== comparisonMetrics[0])
                        .map(metricId => (
                          <option key={metricId} value={metricId}>
                            {dataSets[metricId as MetricId]?.name || getWidgetName(metricId)}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </>
              )}
              
              <Link to="/chart" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                <span>Full Chart</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
          <div className="h-96 bg-white dark:bg-gray-900 rounded shadow-lg">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={chartData} 
                margin={{ top: 30, right: 30, left: 10, bottom: 20 }}
                className="dashboard-chart"
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
                  <filter id="shadow" height="200%">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(0, 0, 0, 0.3)" />
                  </filter>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={theme === 'dark' ? '#444' : '#eee'} 
                  vertical={true}
                  horizontal={true}
                  opacity={0.5}
                />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM yyyy')}
                  stroke={theme === 'dark' ? '#aaa' : '#666'}
                  tick={{ fontSize: 12, fill: theme === 'dark' ? '#aaa' : '#666' }}
                  tickLine={{ stroke: theme === 'dark' ? '#aaa' : '#666' }}
                  axisLine={{ stroke: theme === 'dark' ? '#aaa' : '#666' }}
                  padding={{ left: 10, right: 10 }}
                  minTickGap={30}
                />
                <YAxis 
                  stroke={theme === 'dark' ? '#aaa' : '#666'}
                  tick={{ fontSize: 12, fill: theme === 'dark' ? '#aaa' : '#666' }}
                  tickLine={{ stroke: theme === 'dark' ? '#aaa' : '#666' }}
                  axisLine={{ stroke: theme === 'dark' ? '#aaa' : '#666' }}
                  tickFormatter={(value) => {
                    // Format based on calculation type
                    const formattedValue = value.toLocaleString(undefined, { 
                      maximumFractionDigits: calculationType === 'percentChange' ? 1 : 0 
                    });
                    return calculationType === 'percentChange' ? `${formattedValue}%` : formattedValue;
                  }}
                  width={60}
                  domain={['auto', 'auto']} 
                  scale="auto"
                  allowDataOverflow={false}
                  allowDecimals={true}
                  label={{ 
                    value: calculationType === 'percentChange' ? 'Percent Change (%)' : 'Value', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { 
                      textAnchor: 'middle', 
                      fill: theme === 'dark' ? '#aaa' : '#666',
                      fontSize: 12
                    }
                  }}
                />
                
                {/* Second Y-axis for yearly change percentage */}
                {calculationType === 'value' && chartData[0] && chartData[0].yearChange !== undefined && (
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke={theme === 'dark' ? 'var(--dark-accent)' : 'var(--light-accent)'}
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: theme === 'dark' ? 'var(--dark-accent)' : 'var(--light-accent)' }}
                    axisLine={{ stroke: theme === 'dark' ? 'var(--dark-accent)' : 'var(--light-accent)' }}
                    tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}
                    width={60}
                    domain={['auto', 'auto']}
                    scale="auto"
                    allowDataOverflow={false}
                    allowDecimals={true}
                    label={{ 
                      value: 'Yearly Change', 
                      angle: 90, 
                      position: 'insideRight',
                      style: { 
                        textAnchor: 'middle', 
                        fill: theme === 'dark' ? 'var(--dark-accent)' : 'var(--light-accent)',
                        fontSize: 12
                      }
                    }}
                  />
                )}
                <Tooltip 
                  formatter={(value: number, name: string, props: { payload?: any }) => {
                    // Get the data point for this tooltip and cast it to ChartDataPoint
                    const dataPoint = props.payload ? (props.payload as ChartDataPoint) : {} as ChartDataPoint;
                    
                    // Format based on calculation type
                    const formattedValue = value.toLocaleString(undefined, { maximumFractionDigits: 2 });
                    
                    // Add % sign for percentage calculations
                    let displayValue = formattedValue;
                    
                    // Get proper name for the metric
                    let displayName = name;
                    
                    if (name === 'value') {
                      displayName = mockDataSets[selectedMetric]?.name || 'Value';
                    } else if (name === 'percentChange') {
                      displayName = `${mockDataSets[selectedMetric]?.name || 'Value'} (% Change)`;
                      displayValue = `${formattedValue}%`;
                    } else if (name === 'comparison1' && comparisonMetrics[0]) {
                      // For normalized comparison metrics, show both normalized and original values
                      displayName = mockDataSets[comparisonMetrics[0]]?.name || 'Comparison 1';
                      if (calculationType === 'compare' && dataPoint.comparison1_original !== undefined) {
                        displayValue = `${formattedValue} (Original: ${dataPoint.comparison1_original.toLocaleString(undefined, { maximumFractionDigits: 2 })})`;
                      }
                    } else if (name === 'comparison1_percent' && comparisonMetrics[0]) {
                      displayName = `${mockDataSets[comparisonMetrics[0]]?.name || 'Comparison 1'} (% Change)`;
                      displayValue = `${formattedValue}%`;
                    } else if (name === 'comparison2' && comparisonMetrics[1]) {
                      displayName = mockDataSets[comparisonMetrics[1]]?.name || 'Comparison 2';
                      if (calculationType === 'compare' && dataPoint.comparison2_original !== undefined) {
                        displayValue = `${formattedValue} (Original: ${dataPoint.comparison2_original.toLocaleString(undefined, { maximumFractionDigits: 2 })})`;
                      }
                    } else if (name === 'comparison2_percent' && comparisonMetrics[1]) {
                      displayName = `${mockDataSets[comparisonMetrics[1]]?.name || 'Comparison 2'} (% Change)`;
                      displayValue = `${formattedValue}%`;
                    } else if (name === 'calculated') {
                      // Show the calculation type
                      const calcType = (dataPoint.calculation_type || 'average') as CalculationType;
                      const calcNameMap: Record<CalculationType, string> = {
                        'add': 'Sum',
                        'subtract': 'Difference',
                        'multiply': 'Product',
                        'divide': 'Quotient',
                        'ratio': 'Ratio',
                        'average': 'Average'
                      };
                      const calcName = calcNameMap[calcType] || 'Calculated';
                      
                      // Build a more detailed description of the calculation
                      let calcDescription = `${mockDataSets[selectedMetric]?.name || 'Value'}`;
                      
                      if (comparisonMetrics[0]) {
                        const op = calcType === 'add' ? '+' : 
                                  calcType === 'subtract' ? '-' : 
                                  calcType === 'multiply' ? '×' : 
                                  calcType === 'divide' ? '÷' : 
                                  calcType === 'ratio' ? '÷' : 
                                  '+';
                        
                        calcDescription += ` ${op} ${mockDataSets[comparisonMetrics[0]]?.name || 'Comparison 1'}`;
                        
                        if (comparisonMetrics[1]) {
                          calcDescription += ` ${op} ${mockDataSets[comparisonMetrics[1]]?.name || 'Comparison 2'}`;
                        }
                        
                        if (calcType === 'average') {
                          const divisor = comparisonMetrics[1] ? 3 : 2;
                          calcDescription = `(${calcDescription}) ÷ ${divisor}`;
                        } else if (calcType === 'ratio') {
                          calcDescription = `(${mockDataSets[selectedMetric]?.name || 'Value'} ÷ ${mockDataSets[comparisonMetrics[0]]?.name || 'Comparison 1'}) × 100%`;
                        }
                      }
                      
                      displayName = `${calcName}: ${calcDescription}`;
                      
                      // Add original values to the tooltip
                      if (dataPoint.value !== undefined && dataPoint.comparison1_original !== undefined) {
                        const primaryValue = dataPoint.value.toLocaleString(undefined, { maximumFractionDigits: 2 });
                        const comp1Value = dataPoint.comparison1_original.toLocaleString(undefined, { maximumFractionDigits: 2 });
                        
                        let originalValues = `Original values: ${mockDataSets[selectedMetric]?.name || 'Value'} = ${primaryValue}, ${mockDataSets[comparisonMetrics[0]]?.name || 'Comparison 1'} = ${comp1Value}`;
                        
                        if (dataPoint.comparison2_original !== undefined && comparisonMetrics[1]) {
                          const comp2Value = dataPoint.comparison2_original.toLocaleString(undefined, { maximumFractionDigits: 2 });
                          originalValues += `, ${mockDataSets[comparisonMetrics[1]]?.name || 'Comparison 2'} = ${comp2Value}`;
                        }
                        
                        displayValue = `${formattedValue} (${originalValues})`;
                      }
                    } else if (name === 'yearChange') {
                      displayName = 'Yearly Change';
                      // Format with + or - sign
                      displayValue = `${value >= 0 ? '+' : ''}${formattedValue}%`;
                    }
                    
                    return [displayValue, displayName];
                  }}
                  labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? 'var(--dark-card)' : 'var(--light-card)',
                    borderColor: theme === 'dark' ? 'var(--dark-border)' : 'var(--light-border)',
                    color: theme === 'dark' ? 'var(--dark-text)' : 'var(--light-text)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    boxShadow: theme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                  itemStyle={{ 
                    color: theme === 'dark' ? 'var(--dark-text)' : 'var(--light-text)',
                    padding: '4px 0'
                  }}
                  cursor={{ 
                    stroke: theme === 'dark' ? 'var(--dark-text)' : 'var(--light-text)', 
                    strokeWidth: 1, 
                    strokeDasharray: '5 5' 
                  }}
                  wrapperStyle={{
                    zIndex: 1000
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey={calculationType === 'percentChange' ? 'percentChange' : 'value'} 
                  name={dataSets[selectedMetric]?.name || getWidgetName(selectedMetric) || 'Value'}
                  stroke={theme === 'dark' ? '#4dabf7' : '#0066cc'} 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ 
                    r: 8, 
                    fill: theme === 'dark' ? '#4dabf7' : '#0066cc', 
                    stroke: theme === 'dark' ? '#fff' : '#fff', 
                    strokeWidth: 2,
                    filter: "url(#shadow)"
                  }}
                  connectNulls={true}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
                
                {/* Support for comparison metrics */}
                {calculationType === 'compare' && chartData[0] && chartData[0].comparison1 !== undefined && (
                  <Line 
                    type="monotone" 
                    dataKey="comparison1" 
                    name={comparisonMetrics[0] ? (dataSets[comparisonMetrics[0]]?.name || getWidgetName(comparisonMetrics[0])) : 'Comparison 1'}
                    stroke={theme === 'dark' ? '#10b981' : '#059669'} 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ 
                      r: 8, 
                      fill: theme === 'dark' ? '#10b981' : '#059669', 
                      stroke: theme === 'dark' ? '#fff' : '#fff', 
                      strokeWidth: 2,
                      filter: "url(#shadow)"
                    }}
                    connectNulls={true}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                    animationBegin={300}
                  />
                )}
                
                {calculationType === 'compare' && chartData[0] && chartData[0].comparison2 !== undefined && (
                  <Line 
                    type="monotone" 
                    dataKey="comparison2" 
                    name={comparisonMetrics[1] ? (dataSets[comparisonMetrics[1]]?.name || getWidgetName(comparisonMetrics[1])) : 'Comparison 2'}
                    stroke={theme === 'dark' ? '#f59e0b' : '#d97706'} 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ 
                      r: 8, 
                      fill: theme === 'dark' ? '#f59e0b' : '#d97706', 
                      stroke: theme === 'dark' ? '#fff' : '#fff', 
                      strokeWidth: 2,
                      filter: "url(#shadow)"
                    }}
                    connectNulls={true}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                    animationBegin={600}
                  />
                )}
                
                {/* Support for percentage change comparison */}
                {calculationType === 'percentChange' && chartData[0] && chartData[0].comparison1_percent !== undefined && (
                  <Line 
                    type="monotone" 
                    dataKey="comparison1_percent" 
                    name={`${comparisonMetrics[0] ? (dataSets[comparisonMetrics[0]]?.name || getWidgetName(comparisonMetrics[0])) : 'Comparison 1'} %`}
                    stroke={theme === 'dark' ? '#10b981' : '#059669'} 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ 
                      r: 8, 
                      fill: theme === 'dark' ? '#10b981' : '#059669', 
                      stroke: theme === 'dark' ? '#fff' : '#fff', 
                      strokeWidth: 2,
                      filter: "url(#shadow)"
                    }}
                    connectNulls={true}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                    animationBegin={300}
                  />
                )}
                
                {calculationType === 'percentChange' && chartData[0] && chartData[0].comparison2_percent !== undefined && (
                  <Line 
                    type="linear" 
                    dataKey="comparison2_percent" 
                    name={`${comparisonMetrics[1] ? mockDataSets[comparisonMetrics[1]]?.name : 'Comparison 2'} %`}
                    stroke={theme === 'dark' ? '#f59e0b' : '#d97706'} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: theme === 'dark' ? '#f59e0b' : '#d97706', stroke: theme === 'dark' ? '#fff' : '#fff', strokeWidth: 2 }}
                    connectNulls={true}
                  />
                )}
                
                {/* Support for calculated metrics (mathematical operations) */}
                {calculationType === 'calculate' && chartData[0] && chartData[0].calculated !== undefined && (
                  <Line 
                    type="linear" 
                    dataKey="calculated" 
                    name="Calculated"
                    stroke={theme === 'dark' ? '#8b5cf6' : '#7c3aed'} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: theme === 'dark' ? '#8b5cf6' : '#7c3aed', stroke: theme === 'dark' ? '#fff' : '#fff', strokeWidth: 2 }}
                    connectNulls={true}
                    strokeDasharray="5 5"
                  />
                )}
                
                {/* Yearly change line */}
                {calculationType === 'value' && chartData[0] && chartData[0].yearChange !== undefined && (
                  <Line 
                    type="linear" 
                    dataKey="yearChange" 
                    name="Yearly Change"
                    stroke={theme === 'dark' ? '#ec4899' : '#db2777'} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: theme === 'dark' ? '#ec4899' : '#db2777', stroke: theme === 'dark' ? '#fff' : '#fff', strokeWidth: 2 }}
                    connectNulls={true}
                    yAxisId="right"
                  />
                )}
                {/* Zero reference line for percentage calculations */}
                {calculationType === 'percentChange' && (
                  <ReferenceLine 
                    y={0} 
                    stroke={theme === 'dark' ? '#666' : '#ccc'} 
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    label={{
                      value: '0%',
                      position: 'right',
                      fill: theme === 'dark' ? '#aaa' : '#666',
                      fontSize: 10
                    }}
                  />
                )}
                
                {/* Current value reference line */}
                <ReferenceLine 
                  y={calculationType === 'percentChange' 
                    ? chartData[chartData.length - 1]?.percentChange 
                    : chartData[chartData.length - 1]?.value} 
                  stroke={theme === 'dark' ? '#4dabf7' : '#0066cc'} 
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  opacity={0.7}
                >
                  <Label 
                    value={
                      calculationType === 'percentChange'
                        ? `${chartData[chartData.length - 1]?.percentChange?.toFixed(2)}%`
                        : chartData[chartData.length - 1]?.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    } 
                    position="right"
                    fill={theme === 'dark' ? '#aaa' : '#666'}
                    fontSize={10}
                  />
                </ReferenceLine>
                
                {/* Add Legend */}
                <Legend 
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{
                    paddingTop: '10px',
                    fontSize: '12px',
                    color: theme === 'dark' ? '#d1d5db' : '#1f2937'
                  }}
                />
                
                {/* Financial crisis events - FRED style */}
                {financialCrisisEvents.map((event, index) => (
                  <ReferenceLine
                    key={index}
                    x={event.date}
                    stroke={theme === 'dark' ? '#888' : '#aaa'}
                    strokeWidth={1.5}
                    strokeOpacity={0.7}
                    isFront={false}
                    ifOverflow="extendDomain"
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* FRED-style statistics section */}
          <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Value</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {chartData.length > 0 ? format(new Date(chartData[chartData.length - 1]?.date), 'MMM d, yyyy') : 'N/A'}
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {chartData[chartData.length - 1]?.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 'N/A'}
                </p>
              </div>
              
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">1-Day Change</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">vs. previous day</span>
                </div>
                {(() => {
                  const lastPoint = chartData[chartData.length - 1];
                  if (lastPoint && lastPoint.dailyChange !== undefined) {
                    const changePercent = lastPoint.dailyChange;
                    const isPositive = changePercent >= 0;
                    
                    return (
                      <div className="flex items-center">
                        <p className={`text-lg font-semibold ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                        </p>
                        <svg 
                          className={`w-4 h-4 ml-1 ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d={isPositive ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
                          />
                        </svg>
                      </div>
                    );
                  }
                  
                  return <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">N/A</p>;
                })()}
              </div>
              
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">1-Week Change</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">vs. previous week</span>
                </div>
                {(() => {
                  const lastPoint = chartData[chartData.length - 1];
                  if (lastPoint && lastPoint.weeklyChange !== undefined) {
                    const changePercent = lastPoint.weeklyChange;
                    const isPositive = changePercent >= 0;
                    
                    return (
                      <div className="flex items-center">
                        <p className={`text-lg font-semibold ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                        </p>
                        <svg 
                          className={`w-4 h-4 ml-1 ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d={isPositive ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
                          />
                        </svg>
                      </div>
                    );
                  }
                  
                  return <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">N/A</p>;
                })()}
              </div>
              
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">3-Month Change</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">vs. 3 months ago</span>
                </div>
                {(() => {
                  const lastPoint = chartData[chartData.length - 1];
                  if (lastPoint && lastPoint.monthlyChange !== undefined) {
                    const changePercent = lastPoint.monthlyChange;
                    const isPositive = changePercent >= 0;
                    
                    return (
                      <div className="flex items-center">
                        <p className={`text-lg font-semibold ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                        </p>
                        <svg 
                          className={`w-4 h-4 ml-1 ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d={isPositive ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
                          />
                        </svg>
                      </div>
                    );
                  }
                  
                  return <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">N/A</p>;
                })()}
              </div>
              
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">1-Year Change</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">vs. 1 year ago</span>
                </div>
                {(() => {
                  // If we have percentChange in the data, use it
                  if (chartData[chartData.length - 1]?.percentChange !== undefined) {
                    const changePercent = chartData[chartData.length - 1].percentChange!;
                    const isPositive = changePercent >= 0;
                    
                    return (
                      <div className="flex items-center">
                        <p className={`text-lg font-semibold ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                        </p>
                        <svg 
                          className={`w-4 h-4 ml-1 ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d={isPositive ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
                          />
                        </svg>
                      </div>
                    );
                  }
                  
                  // Otherwise calculate from the first data point if available
                  if (chartData.length > 1) {
                    const currentValue = chartData[chartData.length - 1].value;
                    const firstValue = chartData[0].value;
                    const changePercent = ((currentValue - firstValue) / firstValue) * 100;
                    const isPositive = changePercent >= 0;
                    
                    return (
                      <div className="flex items-center">
                        <p className={`text-lg font-semibold ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                        </p>
                        <svg 
                          className={`w-4 h-4 ml-1 ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d={isPositive ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
                          />
                        </svg>
                      </div>
                    );
                  }
                  
                  // Fallback if not enough data
                  return <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">N/A</p>;
                })()}
              </div>
            </div>
            
            {/* Add FRED-style source and update info */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
              <div>
                Source: {selectedMetric === 'sp500' ? 'S&P Dow Jones Indices LLC' : 
                         selectedMetric === 'nasdaq' ? 'NASDAQ OMX Group' : 
                         selectedMetric === 'djia' ? 'S&P Dow Jones Indices LLC' : 
                         selectedMetric === 'treasury10y' ? 'Federal Reserve' : 
                         selectedMetric === 'cpi' ? 'U.S. Bureau of Labor Statistics' : 
                         selectedMetric === 'unemployment' ? 'U.S. Bureau of Labor Statistics' : 
                         'Federal Reserve Economic Data'}
              </div>
              <div>
                Last Updated: {chartData.length > 0 ? format(new Date(chartData[chartData.length - 1]?.date), 'MMMM d, yyyy') : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Signal Pies */}
        <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Market Signals</h2>
            <div className="flex space-x-2">
              <button
                onClick={createCustomSignal}
                className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                Create Custom Signal
              </button>
              <Link to="/signals" className="text-sm text-light-accent hover:text-light-accent-hover dark:text-dark-accent dark:hover:text-dark-accent-hover transition-colors duration-200">
                View All Signals
              </Link>
            </div>
          </div>
          
          {/* Default Signals */}
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Signals</h3>
            {signals.map((signal) => (
              <div key={signal.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{signal.name}</h3>
                  <span 
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      signal.signal === 'buy' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                        : signal.signal === 'sell' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' 
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                    } transition-colors duration-200`}
                  >
                    {signal.signal.toUpperCase()}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-gray-600 dark:text-gray-400">
                          Confidence: {signal.confidence}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                      <div 
                        className={`confidence-bar confidence-bar-${signal.signal} confidence-width-${signal.confidence}`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Custom Signals */}
          {customSignals.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom Signals</h3>
              {customSignals.map((signal) => (
                <div key={signal.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{signal.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span 
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          signal.signal === 'buy' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                            : signal.signal === 'sell' 
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' 
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                        } transition-colors duration-200`}
                      >
                        {signal.signal.toUpperCase()}
                      </span>
                      <button
                        onClick={() => editSignal(signal)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label={`Edit ${signal.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteCustomSignal(signal.id)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        aria-label={`Delete ${signal.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block text-gray-600 dark:text-gray-400">
                            Confidence
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-gray-600 dark:text-gray-400">
                            {signal.confidence}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                        <div 
                          className={`confidence-bar confidence-width-${signal.confidence} confidence-bar-${
                            signal.signal === 'buy' 
                              ? 'buy' 
                              : signal.signal === 'sell' 
                                ? 'sell' 
                                : 'neutral'
                          }`}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Show metrics if available */}
                    {signal.metrics && signal.metrics.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Metrics</h4>
                        <div className="space-y-2">
                          {signal.metrics.map(metric => (
                            <div key={metric.id} className="flex justify-between items-center">
                              <span className="text-xs text-gray-700 dark:text-gray-300">{metric.name}</span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">{metric.weight}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Watchlist Preview */}
      <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Your Watchlist</h2>
          <Link to="/watchlist" className="text-sm text-light-accent hover:text-light-accent-hover dark:text-dark-accent dark:hover:text-dark-accent-hover transition-colors duration-200">
            View Full Watchlist
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Value
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Daily %
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Weekly %
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Monthly %
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Yearly %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
              {watchlistItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    <Link to={`/chart/${item.id}`} className="hover:text-light-accent dark:hover:text-dark-accent transition-colors duration-200">
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                    {item.value.toLocaleString()}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${item.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${item.weekChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {item.weekChange >= 0 ? '+' : ''}{item.weekChange.toFixed(2)}%
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${item.monthChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {item.monthChange >= 0 ? '+' : ''}{item.monthChange.toFixed(2)}%
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${item.yearChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {item.yearChange >= 0 ? '+' : ''}{item.yearChange.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Signal Editor Modal */}
      {showSignalEditor && editingSignal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                  {editingSignal.id ? 'Edit Signal Pie' : 'Create Signal Pie'}
                </h2>
                <button
                  onClick={() => setShowSignalEditor(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Signal Name */}
                <div>
                  <label htmlFor="signalName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Signal Name
                  </label>
                  <input
                    type="text"
                    id="signalName"
                    value={editingSignal.name}
                    onChange={(e) => setEditingSignal({...editingSignal, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                
                {/* Current Metrics */}
                {editingSignal.metrics && editingSignal.metrics.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Metrics</h3>
                    <div className="space-y-3">
                      {editingSignal.metrics.map(metric => (
                        <div key={metric.id} className="flex items-center space-x-2">
                          <div className="flex-grow">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-700 dark:text-gray-300">{metric.name}</span>
                              <button
                                onClick={() => setEditingSignal(removeMetricFromSignal(editingSignal, metric.id))}
                                className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                aria-label={`Remove ${metric.name}`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="range"
                                min="1"
                                max="100"
                                value={metric.weight}
                                onChange={(e) => setEditingSignal(updateMetricWeight(editingSignal, metric.id, parseInt(e.target.value)))}
                                className="flex-grow"
                                title={`Adjust weight for ${metric.name}`}
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">{metric.weight}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Add New Metric */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Metric</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(dataSets).length > 0 
                      ? Object.keys(dataSets) 
                      : ['sp500', 'nasdaq', 'djia', 'treasury10y', 'vix', 'gold', 'bitcoin', 'unemployment', 'cpi', 'gdp', 'retail']
                    )
                      .filter(id => !editingSignal.metrics?.some(m => m.id === id))
                      .map(metricId => (
                        <button
                          key={metricId}
                          onClick={() => setEditingSignal(addMetricToSignal(editingSignal, metricId))}
                          className="p-2 text-sm rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        >
                          {dataSets[metricId as MetricId]?.name || getWidgetName(metricId)}
                        </button>
                      ))
                    }
                  </div>
                </div>
                
                {/* Preview */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</h3>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{editingSignal.name}</span>
                      <span 
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          editingSignal.signal === 'buy' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                            : editingSignal.signal === 'sell' 
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' 
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                        }`}
                      >
                        {editingSignal.signal.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block text-gray-600 dark:text-gray-400">
                            Confidence
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-gray-600 dark:text-gray-400">
                            {editingSignal.confidence}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                        <div 
                          className={`confidence-bar confidence-width-${editingSignal.confidence} confidence-bar-${
                            editingSignal.signal === 'buy' 
                              ? 'buy' 
                              : editingSignal.signal === 'sell' 
                                ? 'sell' 
                                : 'neutral'
                          }`}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Metrics distribution */}
                    {editingSignal.metrics && editingSignal.metrics.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Metrics Distribution</h4>
                        <div className="overflow-hidden h-4 mb-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                          {editingSignal.metrics?.map((metric, index) => {
                            // Calculate the cumulative percentage for positioning
                            const previousWidth = editingSignal.metrics
                              ? editingSignal.metrics.slice(0, index).reduce((sum, m) => sum + m.weight, 0)
                              : 0;
                              
                            // Assign a color based on index
                            const colors = [
                              'bg-blue-500 dark:bg-blue-600',
                              'bg-green-500 dark:bg-green-600',
                              'bg-yellow-500 dark:bg-yellow-600',
                              'bg-red-500 dark:bg-red-600',
                              'bg-purple-500 dark:bg-purple-600',
                              'bg-pink-500 dark:bg-pink-600',
                              'bg-indigo-500 dark:bg-indigo-600',
                              'bg-gray-500 dark:bg-gray-600'
                            ];
                            const colorClass = colors[index % colors.length];
                            
                            return (
                              <div
                                key={metric.id}
                                className={`metric-weight confidence-width-${metric.weight} ${index === 0 ? 'metric-weight-first' : 'metric-weight-other'} ${colorClass}`}
                              ></div>
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {editingSignal.metrics?.map((metric, index) => {
                            const colors = [
                              'bg-blue-500 dark:bg-blue-600',
                              'bg-green-500 dark:bg-green-600',
                              'bg-yellow-500 dark:bg-yellow-600',
                              'bg-red-500 dark:bg-red-600',
                              'bg-purple-500 dark:bg-purple-600',
                              'bg-pink-500 dark:bg-pink-600',
                              'bg-indigo-500 dark:bg-indigo-600',
                              'bg-gray-500 dark:bg-gray-600'
                            ];
                            const colorClass = colors[index % colors.length];
                            
                            return (
                              <div key={metric.id} className="flex items-center space-x-1">
                                <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                                <span className="text-xs text-gray-700 dark:text-gray-300">{metric.name} ({metric.weight}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => setShowSignalEditor(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveCustomSignal(editingSignal)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                    disabled={!editingSignal.name || (editingSignal.metrics?.length || 0) === 0}
                  >
                    Save Signal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
