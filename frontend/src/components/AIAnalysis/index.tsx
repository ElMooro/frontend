import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '../../context/ThemeContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import AIAnalysisDashboard from './AIAnalysisDashboard';
import { useProgressBar } from './useProgressBar';
import aiAnalysisApi, { 
  HistoricalSignal, 
  SignalAccuracyStats, 
  HistoricalSignalsResponse 
} from '../../services/aiAnalysisApi';
import './AIAnalysis.css';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock data for initial development - will be replaced with real API data
const mockSignalPies: SignalPie[] = [
  {
    id: 1,
    name: 'Market Trend Signal',
    type: 'buy',
    confidence: 78,
    lastUpdated: '2023-05-15T10:30:00Z',
    components: [
      { name: 'S&P 500', weight: 25, value: 4782.21, contribution: 21 },
      { name: '10Y Treasury', weight: 20, value: 4.21, contribution: 15 },
      { name: 'VIX', weight: 15, value: 13.82, contribution: 12 },
      { name: 'Unemployment Rate', weight: 15, value: 3.8, contribution: 12 },
      { name: 'CPI', weight: 15, value: 3.2, contribution: 10 },
      { name: 'Gold', weight: 10, value: 2345.67, contribution: 8 },
    ],
  },
  {
    id: 2,
    name: 'Economic Health Signal',
    type: 'neutral',
    confidence: 52,
    lastUpdated: '2023-05-15T10:30:00Z',
    components: [
      { name: 'GDP', weight: 30, value: 2.1, contribution: 15 },
      { name: 'Unemployment Rate', weight: 25, value: 3.8, contribution: 12 },
      { name: 'CPI', weight: 20, value: 3.2, contribution: 10 },
      { name: 'Retail Sales', weight: 15, value: 0.7, contribution: 8 },
      { name: 'Consumer Sentiment', weight: 10, value: 79.2, contribution: 7 },
    ],
  },
  {
    id: 3,
    name: 'Black Swan Detector',
    type: 'sell',
    confidence: 65,
    lastUpdated: '2023-05-15T10:30:00Z',
    components: [
      { name: 'VIX', weight: 30, value: 13.82, contribution: 20 },
      { name: 'Credit Spreads', weight: 20, value: 3.45, contribution: 15 },
      { name: 'Treasury Yield Curve', weight: 20, value: -0.15, contribution: 15 },
      { name: 'S&P 500', weight: 15, value: 4782.21, contribution: 10 },
      { name: 'Gold/S&P Ratio', weight: 15, value: 0.49, contribution: 5 },
    ],
  },
];

// Mock AI predictions
const mockAIPredictions: {
  buy: AIPrediction;
  sell: AIPrediction;
  blackSwan: AIPrediction;
} = {
  buy: {
    probability: 0.65,
    expectedReturn: 3.8,
    confidence: 'high',
    factors: [
      { name: 'Market Momentum', impact: 'positive', weight: 0.3 },
      { name: 'Economic Growth', impact: 'positive', weight: 0.25 },
      { name: 'Sentiment', impact: 'positive', weight: 0.2 },
      { name: 'Valuation', impact: 'negative', weight: 0.15 },
      { name: 'Volatility', impact: 'neutral', weight: 0.1 },
    ],
  },
  sell: {
    probability: 0.25,
    expectedReturn: -2.5,
    confidence: 'medium',
    factors: [
      { name: 'Market Momentum', impact: 'negative', weight: 0.3 },
      { name: 'Economic Growth', impact: 'neutral', weight: 0.25 },
      { name: 'Sentiment', impact: 'negative', weight: 0.2 },
      { name: 'Valuation', impact: 'negative', weight: 0.15 },
      { name: 'Volatility', impact: 'negative', weight: 0.1 },
    ],
  },
  blackSwan: {
    probability: 0.1,
    expectedReturn: -15.0,
    confidence: 'low',
    factors: [
      { name: 'Market Momentum', impact: 'negative', weight: 0.3 },
      { name: 'Economic Growth', impact: 'negative', weight: 0.25 },
      { name: 'Sentiment', impact: 'negative', weight: 0.2 },
      { name: 'Valuation', impact: 'negative', weight: 0.15 },
      { name: 'Volatility', impact: 'negative', weight: 0.1 },
    ],
  },
};

interface PieComponent {
  name: string;
  weight: number;
  value: number;
  contribution: number;
}

interface SignalPie {
  id: number;
  name: string;
  type: 'buy' | 'sell' | 'neutral';
  confidence: number;
  lastUpdated: string;
  components: PieComponent[];
}

interface AIPredictionFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
}

interface AIPrediction {
  probability: number;
  expectedReturn: number;
  confidence: 'high' | 'medium' | 'low';
  factors: AIPredictionFactor[];
}

// Fix the mock data types
type SignalType = 'buy' | 'sell' | 'neutral';

interface AIAnalysisProps {
  selectedPieId?: number;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ selectedPieId }) => {
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [signalPies, setSignalPies] = useState<SignalPie[]>([]);
  const [selectedPie, setSelectedPie] = useState<SignalPie | null>(null);
  const [historicalSignals, setHistoricalSignals] = useState<HistoricalSignal[]>([]);
  const [aiPredictions, setAIPredictions] = useState<{
    buy: AIPrediction;
    sell: AIPrediction;
    blackSwan: AIPrediction;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accuracyStats, setAccuracyStats] = useState<SignalAccuracyStats>({
    buy: { correct: 0, total: 0, accuracy: 0 },
    sell: { correct: 0, total: 0, accuracy: 0 },
    neutral: { correct: 0, total: 0, accuracy: 0 },
    overall: { correct: 0, total: 0, accuracy: 0 },
  });
  
  // Calculate progress bar values at the top level
  const { progressAttr: buyProgressAttr } = useProgressBar(aiPredictions?.buy.expectedReturn, 10);
  const { progressAttr: sellProgressAttr } = useProgressBar(aiPredictions?.sell.expectedReturn, 10, true);
  const { progressAttr: blackSwanProgressAttr } = useProgressBar(aiPredictions?.blackSwan.expectedReturn, 2, true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get user data
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // Set signal pies (still using mock data for now)
        setSignalPies(mockSignalPies);
        
        // Fetch real historical signals from API
        try {
          const symbol = 'SPY'; // Default symbol, could be made configurable
          const historicalData = await aiAnalysisApi.getHistoricalSignals(symbol) as HistoricalSignalsResponse;
          
          if (historicalData && historicalData.signals) {
            setHistoricalSignals(historicalData.signals);
            
            // If the API returns pre-calculated stats, use them
            if (historicalData.stats) {
              setAccuracyStats(historicalData.stats);
            } else {
              // Otherwise calculate stats from the signals
              calculateAccuracyStats(historicalData.signals);
            }
          } else {
            // Fallback to empty arrays if no data
            setHistoricalSignals([]);
            setAccuracyStats({
              buy: { correct: 0, total: 0, accuracy: 0 },
              sell: { correct: 0, total: 0, accuracy: 0 },
              neutral: { correct: 0, total: 0, accuracy: 0 },
              overall: { correct: 0, total: 0, accuracy: 0 },
            });
          }
        } catch (error) {
          console.error('Error fetching historical signals:', error);
          // Fallback to empty data on error
          setHistoricalSignals([]);
        }
        
        // Fetch real AI predictions (still using mock for now)
        setAIPredictions(mockAIPredictions);
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing AI Analysis:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Set the selected pie based on the prop or default to the first pie
    if (selectedPieId && signalPies.length > 0) {
      const pie = signalPies.find(p => p.id === selectedPieId);
      if (pie) {
        setSelectedPie(pie);
      } else {
        setSelectedPie(signalPies[0]);
      }
    } else if (signalPies.length > 0) {
      setSelectedPie(signalPies[0]);
    }
  }, [selectedPieId, signalPies]);

  // Calculate accuracy statistics from historical signals
  const calculateAccuracyStats = (signals: HistoricalSignal[]): void => {
    const stats: SignalAccuracyStats = {
      buy: { correct: 0, total: 0, accuracy: 0 },
      sell: { correct: 0, total: 0, accuracy: 0 },
      neutral: { correct: 0, total: 0, accuracy: 0 },
      overall: { correct: 0, total: 0, accuracy: 0 },
    };
    
    signals.forEach(signal => {
      // Count total signals by type
      stats[signal.signal].total += 1;
      stats.overall.total += 1;
      
      // Count correct signals (buy with positive return, sell with negative return, neutral with small return)
      if (
        (signal.signal === 'buy' && signal.actualReturn > 0) ||
        (signal.signal === 'sell' && signal.actualReturn < 0) ||
        (signal.signal === 'neutral' && Math.abs(signal.actualReturn) < 2)
      ) {
        stats[signal.signal].correct += 1;
        stats.overall.correct += 1;
      }
    });
    
    // Calculate accuracy percentages
    stats.buy.accuracy = stats.buy.total > 0 ? (stats.buy.correct / stats.buy.total) * 100 : 0;
    stats.sell.accuracy = stats.sell.total > 0 ? (stats.sell.correct / stats.sell.total) * 100 : 0;
    stats.neutral.accuracy = stats.neutral.total > 0 ? (stats.neutral.correct / stats.neutral.total) * 100 : 0;
    stats.overall.accuracy = stats.overall.total > 0 ? (stats.overall.correct / stats.overall.total) * 100 : 0;
    
    setAccuracyStats(stats);
  };

  // Get enhanced colors based on signal type - using more vibrant and professional color schemes
  const getSignalColors = (type: 'buy' | 'sell' | 'neutral') => {
    switch (type) {
      case 'buy':
        // Professional green palette with better contrast
        return [
          '#00A36C', // Emerald Green
          '#2E8B57', // Sea Green
          '#3CB371', // Medium Sea Green
          '#00C957', // Emerald
          '#32CD32', // Lime Green
          '#228B22', // Forest Green
          '#008000', // Green
          '#006400', // Dark Green
          '#4CBB17', // Kelly Green
          '#00A86B'  // Jade
        ];
      case 'sell':
        // Professional red palette with better contrast
        return [
          '#B22222', // Firebrick
          '#DC143C', // Crimson
          '#E34234', // Vermilion
          '#CD5C5C', // Indian Red
          '#FF6347', // Tomato
          '#FF4500', // Orange Red
          '#D2042D', // Ruby
          '#C04000', // Mahogany
          '#800000', // Maroon
          '#8B0000'  // Dark Red
        ];
      case 'neutral':
        // Professional yellow/gold palette with better contrast
        return [
          '#FFD700', // Gold
          '#DAA520', // Goldenrod
          '#FFA500', // Orange
          '#FF8C00', // Dark Orange
          '#F0E68C', // Khaki
          '#BDB76B', // Dark Khaki
          '#FFBF00', // Amber
          '#E6BE8A', // Buff
          '#CD853F', // Peru
          '#D2B48C'  // Tan
        ];
      default:
        // Professional blue palette with better contrast
        return [
          '#0047AB', // Cobalt Blue
          '#4169E1', // Royal Blue
          '#1E90FF', // Dodger Blue
          '#00BFFF', // Deep Sky Blue
          '#007BA7', // Cerulean
          '#0073CF', // True Blue
          '#5F9EA0', // Cadet Blue
          '#4682B4', // Steel Blue
          '#6495ED', // Cornflower Blue
          '#00008B'  // Dark Blue
        ];
    }
  };

  // Get color for impact
  const getImpactColor = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive':
        return theme === 'dark' ? 'text-green-400' : 'text-green-600';
      case 'negative':
        return theme === 'dark' ? 'text-red-400' : 'text-red-600';
      case 'neutral':
        return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600';
      default:
        return theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Prepare data for probability pie chart
  const probabilityData = [
    { name: 'Buy Signal', value: aiPredictions?.buy.probability || 0 },
    { name: 'Sell Signal', value: aiPredictions?.sell.probability || 0 },
    { name: 'Black Swan', value: aiPredictions?.blackSwan.probability || 0 },
  ];

  // Enhanced colors for probability pie chart
  const PROBABILITY_COLORS = [
    '#00A36C', // Emerald Green for Buy
    '#B22222', // Firebrick for Sell
    '#8A2BE2'  // Blue Violet for Black Swan
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Analysis Dashboard with Delta and Trendline Slope features */}
      <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">AI Market Analysis Dashboard</h1>
        <AIAnalysisDashboard />
      </div>
      
      {/* Original AI Signal Analysis */}
      <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">AI Signal Analysis</h1>
          <div className="flex space-x-2">
            <select
              aria-label="Select signal pie"
              value={selectedPie?.id || ''}
              onChange={(e) => {
                const pieId = parseInt(e.target.value);
                const pie = signalPies.find(p => p.id === pieId);
                if (pie) setSelectedPie(pie);
              }}
              className="block rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {signalPies.map(pie => (
                <option key={pie.id} value={pie.id}>
                  {pie.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedPie && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Signal Pie Visualization */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Signal Components</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="aiAnalysisShadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)'} />
                      </filter>
                      {/* Create gradients for each color in the pie */}
                      {selectedPie.components.map((entry, index) => {
                        const color = getSignalColors(selectedPie.type)[index % getSignalColors(selectedPie.type).length];
                        return (
                          <linearGradient key={`ai-gradient-${index}`} id={`aiColorGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <Pie
                      data={selectedPie.components}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      innerRadius={30}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="weight"
                      nameKey="name"
                      paddingAngle={2}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                      filter="url(#aiAnalysisShadow)"
                      stroke={theme === 'dark' ? '#1f2937' : '#ffffff'}
                      strokeWidth={2}
                    >
                      {selectedPie.components.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#aiColorGradient-${index})`}
                          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value}% (Value: ${props.payload.value?.toLocaleString(undefined, { maximumFractionDigits: 2 })})`,
                        name
                      ]}
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                        borderRadius: '8px',
                        padding: '10px',
                        border: 'none',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        color: theme === 'dark' ? '#e5e7eb' : '#333333'
                      }}
                      animationDuration={300}
                      animationEasing="ease-out"
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      iconSize={10}
                      iconType="circle"
                      wrapperStyle={{
                        paddingTop: '20px',
                        fontSize: '12px',
                        color: theme === 'dark' ? '#e5e7eb' : '#333333'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">Signal Summary</h3>
                  <span 
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedPie.type === 'buy' 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                        : selectedPie.type === 'sell' 
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    }`}
                  >
                    {selectedPie.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Confidence: <span className="font-medium">{selectedPie.confidence}%</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Last Updated: <span className="font-medium">{formatDate(selectedPie.lastUpdated)}</span>
                </p>
              </div>
            </div>

            {/* AI Prediction */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">AI Prediction</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">Signal Probabilities</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          <filter id="probabilityShadow" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)'} />
                          </filter>
                          {/* Create gradients for each probability */}
                          {probabilityData.map((entry, index) => (
                            <linearGradient key={`prob-gradient-${index}`} id={`probGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={PROBABILITY_COLORS[index % PROBABILITY_COLORS.length]} stopOpacity={1} />
                              <stop offset="100%" stopColor={PROBABILITY_COLORS[index % PROBABILITY_COLORS.length]} stopOpacity={0.8} />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={probabilityData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          innerRadius={25}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                          paddingAngle={3}
                          animationBegin={0}
                          animationDuration={800}
                          animationEasing="ease-out"
                          filter="url(#probabilityShadow)"
                          stroke={theme === 'dark' ? '#1f2937' : '#ffffff'}
                          strokeWidth={1.5}
                        >
                          {probabilityData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={`url(#probGradient-${index})`}
                              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            `${(value * 100).toFixed(1)}%`, 
                            name === 'value' ? 'Probability' : name
                          ]}
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                            borderRadius: '8px',
                            padding: '10px',
                            border: 'none',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            color: theme === 'dark' ? '#e5e7eb' : '#333333'
                          }}
                          animationDuration={300}
                          animationEasing="ease-out"
                        />
                        <Legend 
                          layout="horizontal" 
                          verticalAlign="bottom" 
                          align="center"
                          iconSize={10}
                          iconType="circle"
                          wrapperStyle={{
                            paddingTop: '15px',
                            fontSize: '12px',
                            color: theme === 'dark' ? '#e5e7eb' : '#333333'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">Expected Returns</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Buy Signal</span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {aiPredictions?.buy.expectedReturn.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="progress-bar-buy" 
                          data-progress={buyProgressAttr}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Sell Signal</span>
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                          {aiPredictions?.sell.expectedReturn.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="progress-bar-sell" 
                          data-progress={sellProgressAttr}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Black Swan Event</span>
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          {aiPredictions?.blackSwan.expectedReturn.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="progress-bar-black-swan" 
                          data-progress={blackSwanProgressAttr}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">Key Factors</h3>
                <div className="space-y-2">
                  {aiPredictions?.buy.factors.map((factor, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{factor.name}</span>
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${getImpactColor(factor.impact)} mr-2`}>
                          {factor.impact.charAt(0).toUpperCase() + factor.impact.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {(factor.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Historical Accuracy */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Historical Signal Accuracy</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">Overall</h3>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {accuracyStats.overall.accuracy.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {accuracyStats.overall.correct} correct out of {accuracyStats.overall.total} signals
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-md font-medium text-green-600 dark:text-green-400 mb-2">Buy Signals</h3>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {accuracyStats.buy.accuracy.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {accuracyStats.buy.correct} correct out of {accuracyStats.buy.total} signals
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-md font-medium text-red-600 dark:text-red-400 mb-2">Sell Signals</h3>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {accuracyStats.sell.accuracy.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {accuracyStats.sell.correct} correct out of {accuracyStats.sell.total} signals
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-md font-medium text-yellow-600 dark:text-yellow-400 mb-2">Neutral Signals</h3>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {accuracyStats.neutral.accuracy.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {accuracyStats.neutral.correct} correct out of {accuracyStats.neutral.total} signals
              </p>
            </div>
          </div>
          
          <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">Recent Signals</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Signal
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actual Return
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Outcome
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {historicalSignals.slice(0, 5).map((signal, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(signal.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          signal.signal === 'buy' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                            : signal.signal === 'sell' 
                              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {signal.signal.toUpperCase()}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                        signal.actualReturn >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {signal.actualReturn >= 0 ? '+' : ''}{signal.actualReturn.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {(
                          (signal.signal === 'buy' && signal.actualReturn > 0) ||
                          (signal.signal === 'sell' && signal.actualReturn < 0) ||
                          (signal.signal === 'neutral' && Math.abs(signal.actualReturn) < 2)
                        ) ? (
                          <span className="text-green-600 dark:text-green-400">✓ Correct</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">✗ Incorrect</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysis;