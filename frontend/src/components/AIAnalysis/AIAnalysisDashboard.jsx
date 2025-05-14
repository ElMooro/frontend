import React, { useState, useEffect, useMemo } from 'react';
import aiAnalysisApi from '../../services/aiAnalysisApi';
import { useTheme } from '../../context/ThemeContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  ReferenceLine
} from 'recharts';

/**
 * AI Analysis Dashboard Component
 * 
 * This component provides a user interface for the AI analysis features:
 * - Market trend prediction
 * - Turning points detection
 * - Liquidity regime prediction
 */
const AIAnalysisDashboard = () => {
  const { theme } = useTheme();
  const [symbol, setSymbol] = useState('SPY');
  const [timeframe, setTimeframe] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [marketData, setMarketData] = useState([]);
  const [chartDisplayMode, setChartDisplayMode] = useState('raw'); // 'raw', 'delta', 'percent'
  const [showTrendlineSlope, setShowTrendlineSlope] = useState(true);
  
  // Popular symbols for quick selection
  const popularSymbols = ['SPY', 'QQQ', 'DIA', 'IWM', 'GLD', 'TLT', 'VIX'];
  
  // Timeframe options
  const timeframeOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];
  
  // Chart display options
  const chartDisplayOptions = [
    { value: 'raw', label: 'Raw Values' },
    { value: 'delta', label: 'Delta (Change)' },
    { value: 'percent', label: 'Percent Change' }
  ];
  
  // Fetch analysis when symbol or timeframe changes
  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await aiAnalysisApi.analyzeMarket(symbol, timeframe);
        
        // If no analysis data returned, create mock data
        if (!result.analysis) {
          result.analysis = {};
        }
        
        // Generate mock price data
        const mockPriceData = generateMockPriceData(symbol, 30);
        setMarketData(mockPriceData);
        
        // If no trend data, add mock data
        if (!result.analysis.trend) {
          const uptrend = mockPriceData[mockPriceData.length - 1].price > mockPriceData[0].price;
          result.analysis.trend = {
            trendDirection: uptrend ? 'up' : 'down',
            confidence: 0.7 + Math.random() * 0.25,
            probabilities: {
              up: uptrend ? 0.7 + Math.random() * 0.25 : 0.1 + Math.random() * 0.15,
              down: !uptrend ? 0.7 + Math.random() * 0.25 : 0.1 + Math.random() * 0.15,
              stable: 0.1 + Math.random() * 0.1
            },
            metrics: {
              priceChange: ((mockPriceData[mockPriceData.length - 1].price / mockPriceData[0].price) - 1) * 100,
              sma5: mockPriceData[mockPriceData.length - 1].price * (1 + (Math.random() - 0.5) * 0.02),
              sma20: mockPriceData[mockPriceData.length - 1].price * (1 + (Math.random() - 0.5) * 0.05)
            }
          };
          
          // Normalize probabilities to sum to 1
          const sum = result.analysis.trend.probabilities.up + 
                      result.analysis.trend.probabilities.down + 
                      result.analysis.trend.probabilities.stable;
          
          result.analysis.trend.probabilities.up /= sum;
          result.analysis.trend.probabilities.down /= sum;
          result.analysis.trend.probabilities.stable /= sum;
        }
        
        // If no turning points data, add mock data
        if (!result.analysis.turningPoints) {
          // Calculate if we're near a turning point based on trendline slope
          const recentSlopes = mockPriceData.slice(-5).map(d => d.trendlineSlope);
          const avgSlope = recentSlopes.reduce((a, b) => a + b, 0) / recentSlopes.length;
          const isNearZero = Math.abs(avgSlope) < 0.1;
          const isChangingSign = recentSlopes[0] * recentSlopes[recentSlopes.length - 1] < 0;
          
          const isAnomalous = isNearZero || isChangingSign;
          const turningPointType = avgSlope > 0 ? 'bottom' : 'top';
          
          result.analysis.turningPoints = {
            isAnomalous: isAnomalous,
            turningPointType: isAnomalous ? turningPointType : null,
            confidence: isAnomalous ? 0.6 + Math.random() * 0.3 : 0,
            anomalyScore: isAnomalous ? 0.7 + Math.random() * 0.25 : 0.1 + Math.random() * 0.2,
            metrics: {
              rsi: turningPointType === 'top' ? 70 + Math.random() * 15 : 30 - Math.random() * 15,
              volatility: 0.1 + Math.random() * 0.2,
              distanceToUpper: turningPointType === 'top' ? 0.01 + Math.random() * 0.02 : 0.05 + Math.random() * 0.1,
              distanceToLower: turningPointType === 'bottom' ? 0.01 + Math.random() * 0.02 : 0.05 + Math.random() * 0.1
            }
          };
        }
        
        // If no liquidity regime data, add mock data
        if (!result.analysis.liquidityRegime) {
          result.analysis.liquidityRegime = {
            liquidityRegime: Math.random() > 0.5 ? 'easing' : 'tightening',
            confidence: 0.65 + Math.random() * 0.3,
            probabilities: {
              tightening: 0.4 + Math.random() * 0.2,
              easing: 0.4 + Math.random() * 0.2
            },
            metrics: {
              fedFundsTrend: (Math.random() - 0.5) * 0.02,
              yieldCurveTrend: (Math.random() - 0.5) * 0.01,
              currentFedFunds: 5.25 + (Math.random() - 0.5) * 0.5,
              yieldCurve: -0.5 + Math.random() * 1.0
            }
          };
          
          // Normalize probabilities to sum to 1
          const sum = result.analysis.liquidityRegime.probabilities.tightening + 
                      result.analysis.liquidityRegime.probabilities.easing;
          
          result.analysis.liquidityRegime.probabilities.tightening /= sum;
          result.analysis.liquidityRegime.probabilities.easing /= sum;
        }
        
        setAnalysis(result.analysis);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch analysis');
        console.error('Error fetching analysis:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalysis();
  }, [symbol, timeframe]);
  
  // Generate mock price data for demonstration
  const generateMockPriceData = (symbol, days) => {
    const data = [];
    let price = symbol === 'SPY' ? 450 : 
                symbol === 'QQQ' ? 380 : 
                symbol === 'DIA' ? 350 : 
                symbol === 'IWM' ? 200 : 
                symbol === 'GLD' ? 180 : 
                symbol === 'TLT' ? 90 : 
                symbol === 'VIX' ? 15 : 100;
    
    const today = new Date();
    let prevPrice = price;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Random price movement
      const change = (Math.random() - 0.5) * 0.02 * price;
      price += change;
      
      // Calculate delta and percent change
      const delta = price - prevPrice;
      const percentChange = prevPrice !== 0 ? (delta / prevPrice) * 100 : 0;
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(price.toFixed(2)),
        delta: parseFloat(delta.toFixed(2)),
        percentChange: parseFloat(percentChange.toFixed(2)),
        volume: Math.floor(Math.random() * 10000000) + 1000000
      });
      
      prevPrice = price;
    }
    
    // Calculate 7-day rolling linear regression for trendline slope
    const windowSize = 7;
    
    for (let i = 0; i < data.length; i++) {
      if (i >= windowSize - 1) {
        // Get window of data for regression
        const window = data.slice(i - windowSize + 1, i + 1);
        
        // Calculate trendline slope using linear regression
        const slope = calculateLinearRegressionSlope(window.map((d, index) => ({
          x: index,
          y: d.price
        })));
        
        data[i].trendlineSlope = parseFloat(slope.toFixed(4));
      } else {
        data[i].trendlineSlope = 0;
      }
    }
    
    return data;
  };
  
  // Calculate linear regression slope
  const calculateLinearRegressionSlope = (data) => {
    const n = data.length;
    
    // Calculate means
    let sumX = 0;
    let sumY = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += data[i].x;
      sumY += data[i].y;
    }
    
    const meanX = sumX / n;
    const meanY = sumY / n;
    
    // Calculate slope
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (data[i].x - meanX) * (data[i].y - meanY);
      denominator += Math.pow(data[i].x - meanX, 2);
    }
    
    // Avoid division by zero
    if (denominator === 0) return 0;
    
    return numerator / denominator;
  };
  
  // Render trend direction badge
  const renderTrendBadge = (trend) => {
    if (!trend) return null;
    
    const badgeClass = trend.trendDirection === 'up' ? 'bg-green-100 text-green-800' :
                       trend.trendDirection === 'down' ? 'bg-red-100 text-red-800' :
                       'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-sm font-semibold ${badgeClass}`}>
        {trend.trendDirection.toUpperCase()} ({Math.round(trend.confidence * 100)}%)
      </span>
    );
  };
  
  // Render turning point badge
  const renderTurningPointBadge = (turningPoints) => {
    if (!turningPoints || !turningPoints.isAnomalous) return null;
    
    const badgeClass = turningPoints.turningPointType === 'top' ? 'bg-red-100 text-red-800' :
                       turningPoints.turningPointType === 'bottom' ? 'bg-green-100 text-green-800' :
                       'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-sm font-semibold ${badgeClass}`}>
        {turningPoints.turningPointType.toUpperCase()} ({Math.round(turningPoints.confidence * 100)}%)
      </span>
    );
  };
  
  // Render liquidity regime badge
  const renderLiquidityBadge = (liquidityRegime) => {
    if (!liquidityRegime) return null;
    
    const badgeClass = liquidityRegime.liquidityRegime === 'easing' ? 'bg-green-100 text-green-800' :
                       liquidityRegime.liquidityRegime === 'tightening' ? 'bg-red-100 text-red-800' :
                       'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-sm font-semibold ${badgeClass}`}>
        {liquidityRegime.liquidityRegime.toUpperCase()} ({Math.round(liquidityRegime.confidence * 100)}%)
      </span>
    );
  };
  
  return (
    <div className="p-4 dark:bg-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">AI Market Analysis</h1>
      
      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symbol</label>
          <div className="flex gap-2">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="block w-32 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {popularSymbols.map((sym) => (
                <option key={sym} value={sym}>{sym}</option>
              ))}
            </select>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Custom symbol"
              className="block w-32 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="block w-32 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {timeframeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={() => {
              setLoading(true);
              aiAnalysisApi.analyzeMarket(symbol, timeframe)
                .then(result => {
                  setAnalysis(result.analysis);
                  setLoading(false);
                })
                .catch(err => {
                  setError(err.response?.data?.error || 'Failed to fetch analysis');
                  setLoading(false);
                });
            }}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {/* Analysis results */}
      {!loading && analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Price chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold dark:text-white">Price Chart with AI Signals</h2>
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Mode</label>
                  <select
                    value={chartDisplayMode}
                    onChange={(e) => setChartDisplayMode(e.target.value)}
                    className="block w-32 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {chartDisplayOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showTrendlineSlope"
                    checked={showTrendlineSlope}
                    onChange={(e) => setShowTrendlineSlope(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="showTrendlineSlope" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Show Trendline Slope
                  </label>
                </div>
              </div>
            </div>
            
            {/* Main price chart */}
            <div className={`h-${showTrendlineSlope ? '60' : '80'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={marketData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={theme === 'dark' ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.6)'}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="date" 
                    stroke={theme === 'dark' ? '#d1d5db' : '#374151'}
                  />
                  <YAxis 
                    domain={chartDisplayMode === 'raw' ? ['auto', 'auto'] : [dataMin => Math.min(dataMin, 0), 'auto']}
                    tickFormatter={val => chartDisplayMode === 'percent' ? `${val}%` : val}
                    stroke={theme === 'dark' ? '#d1d5db' : '#374151'}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'price' && chartDisplayMode === 'raw') return ['$' + value, 'Price'];
                      if (name === 'delta' && chartDisplayMode === 'delta') {
                        const sign = parseFloat(value) >= 0 ? '+' : '';
                        return [`${sign}${value}`, 'Change'];
                      }
                      if (name === 'percentChange' && chartDisplayMode === 'percent') {
                        const sign = parseFloat(value) >= 0 ? '+' : '';
                        return [`${sign}${value}%`, '% Change'];
                      }
                      if (name === 'Volume') return [`${(value / 1000000).toFixed(2)}M`, name];
                      return [value, name];
                    }}
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      borderColor: theme === 'dark' ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.8)',
                      borderRadius: '6px',
                      boxShadow: theme === 'dark' 
                        ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' 
                        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      color: theme === 'dark' ? '#f3f4f6' : '#111827',
                      padding: '10px 12px'
                    }}
                    labelStyle={{
                      fontWeight: 'bold',
                      marginBottom: '6px',
                      color: theme === 'dark' ? '#f3f4f6' : '#111827'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{
                      color: theme === 'dark' ? '#f3f4f6' : '#111827'
                    }}
                  />
                  
                  {/* Display different data based on chart mode */}
                  {chartDisplayMode === 'raw' && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="price"
                        name="Price"
                        stroke={theme === 'dark' ? "#6366f1" : "#4f46e5"} // Indigo color
                        fill={theme === 'dark' ? "rgba(99, 102, 241, 0.2)" : "rgba(79, 70, 229, 0.1)"} // Transparent indigo
                        activeDot={{ r: 8, fill: theme === 'dark' ? "#818cf8" : "#6366f1" }}
                        dot={false}
                        strokeWidth={2}
                        animationDuration={750}
                        animationEasing="ease-in-out"
                      />
                    </>
                  )}
                  
                  {chartDisplayMode === 'delta' && (
                    <>
                      <ReferenceLine y={0} stroke={theme === 'dark' ? "#555" : "#aaa"} strokeDasharray="3 3" />
                      <Bar 
                        dataKey="delta" 
                        name="Change" 
                        fill={(entry) => {
                          // Enhanced color scheme for delta mode
                          if (entry.delta >= 0) {
                            // Gradient for positive values based on magnitude
                            const intensity = Math.min(1, Math.abs(entry.delta) / 5); // Normalize to 0-1 range
                            return theme === 'dark' 
                              ? `rgba(72, 187, 120, ${0.5 + intensity * 0.5})` // Dark theme green
                              : `rgba(56, 161, 105, ${0.5 + intensity * 0.5})`; // Light theme green
                          } else {
                            // Gradient for negative values based on magnitude
                            const intensity = Math.min(1, Math.abs(entry.delta) / 5); // Normalize to 0-1 range
                            return theme === 'dark'
                              ? `rgba(245, 101, 101, ${0.5 + intensity * 0.5})` // Dark theme red
                              : `rgba(229, 62, 62, ${0.5 + intensity * 0.5})`; // Light theme red
                          }
                        }}
                        barSize={20}
                        animationDuration={750}
                        animationEasing="ease-in-out"
                      />
                    </>
                  )}
                  
                  {chartDisplayMode === 'percent' && (
                    <>
                      <ReferenceLine y={0} stroke={theme === 'dark' ? "#555" : "#aaa"} strokeDasharray="3 3" />
                      <Bar 
                        dataKey="percentChange" 
                        name="% Change" 
                        fill={(entry) => {
                          // Enhanced color scheme for percent mode
                          if (entry.percentChange >= 0) {
                            // Gradient for positive values based on magnitude
                            const intensity = Math.min(1, Math.abs(entry.percentChange) / 3); // Normalize to 0-1 range
                            return theme === 'dark' 
                              ? `rgba(72, 187, 120, ${0.5 + intensity * 0.5})` // Dark theme green
                              : `rgba(56, 161, 105, ${0.5 + intensity * 0.5})`; // Light theme green
                          } else {
                            // Gradient for negative values based on magnitude
                            const intensity = Math.min(1, Math.abs(entry.percentChange) / 3); // Normalize to 0-1 range
                            return theme === 'dark'
                              ? `rgba(245, 101, 101, ${0.5 + intensity * 0.5})` // Dark theme red
                              : `rgba(229, 62, 62, ${0.5 + intensity * 0.5})`; // Light theme red
                          }
                        }}
                        barSize={20}
                        animationDuration={750}
                        animationEasing="ease-in-out"
                      />
                    </>
                  )}
                  
                  {/* Add volume as area chart */}
                  <Area 
                    type="monotone" 
                    dataKey="volume" 
                    name="Volume" 
                    fill={theme === 'dark' ? "rgba(129, 140, 248, 0.2)" : "rgba(99, 102, 241, 0.15)"} 
                    stroke={theme === 'dark' ? "rgba(129, 140, 248, 0.5)" : "rgba(99, 102, 241, 0.4)"}
                    fillOpacity={0.8}
                    yAxisId={1}
                    animationDuration={750}
                    animationEasing="ease-in-out"
                  />
                  <YAxis 
                    yAxisId={1} 
                    orientation="right" 
                    domain={['auto', 'auto']}
                    tickFormatter={val => (val / 1000000).toFixed(1) + 'M'}
                  />
                  
                  {/* Add AI signals if available */}
                  {analysis.turningPoints?.isAnomalous && analysis.turningPoints.turningPointType === 'top' && (
                    <ReferenceLine 
                      x={marketData[marketData.length - 1]?.date} 
                      stroke="red" 
                      strokeWidth={2}
                      label={{ value: 'Potential Top', position: 'top', fill: 'red' }}
                    />
                  )}
                  
                  {analysis.turningPoints?.isAnomalous && analysis.turningPoints.turningPointType === 'bottom' && (
                    <ReferenceLine 
                      x={marketData[marketData.length - 1]?.date} 
                      stroke="green" 
                      strokeWidth={2}
                      label={{ value: 'Potential Bottom', position: 'bottom', fill: 'green' }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Trendline slope chart */}
            {showTrendlineSlope && (
              <div className="h-20 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={marketData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={theme === 'dark' ? '#374151' : '#d1d5db'}
                    />
                    <XAxis dataKey="date" hide />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke={theme === 'dark' ? '#d1d5db' : '#374151'}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}`, 'Slope']} 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                        borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                        color: theme === 'dark' ? '#f3f4f6' : '#111827'
                      }}
                      labelStyle={{
                        color: theme === 'dark' ? '#f3f4f6' : '#111827'
                      }}
                    />
                    <ReferenceLine y={0} stroke={theme === 'dark' ? '#d1d5db' : '#000'} strokeDasharray="3 3" />
                    <Line 
                      type="monotone" 
                      dataKey="trendlineSlope" 
                      name="Trendline Slope" 
                      stroke="#ff7675" 
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  7-day Rolling Linear Regression Slope (crosses zero at trend reversals)
                </div>
              </div>
            )}
          </div>
          
          {/* Analysis summary */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">AI Analysis Summary</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Trend Direction</h3>
                <div className="mt-1">{renderTrendBadge(analysis.trend)}</div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Turning Points</h3>
                <div className="mt-1">
                  {analysis.turningPoints?.isAnomalous ? 
                    renderTurningPointBadge(analysis.turningPoints) : 
                    <span className="text-gray-700 dark:text-gray-300">No significant turning points detected</span>
                  }
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Liquidity Regime</h3>
                <div className="mt-1">{renderLiquidityBadge(analysis.liquidityRegime)}</div>
              </div>
              
              <div className="pt-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Analysis Summary</h3>
                <div className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {analysis.summary}
                </div>
              </div>
            </div>
          </div>
          
          {/* Detailed metrics */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Detailed Metrics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Trend metrics */}
              <div className="border dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Trend Probabilities</h3>
                {analysis.trend?.probabilities && (
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm dark:text-gray-300">
                        <span>Uptrend</span>
                        <span>{Math.round(analysis.trend.probabilities.up * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${analysis.trend.probabilities.up * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm dark:text-gray-300">
                        <span>Downtrend</span>
                        <span>{Math.round(analysis.trend.probabilities.down * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ width: `${analysis.trend.probabilities.down * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm dark:text-gray-300">
                        <span>Stable</span>
                        <span>{Math.round(analysis.trend.probabilities.stable * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gray-600 h-2 rounded-full" 
                          style={{ width: `${analysis.trend.probabilities.stable * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Turning points metrics */}
              <div className="border dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Turning Point Detection</h3>
                {analysis.turningPoints && (
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm dark:text-gray-300">
                        <span>Anomaly Score</span>
                        <span>{analysis.turningPoints.anomalyScore.toFixed(4)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(analysis.turningPoints.anomalyScore * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm dark:text-gray-300">
                        <span>Confidence</span>
                        <span>{Math.round(analysis.turningPoints.confidence * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            analysis.turningPoints.turningPointType === 'top' ? 'bg-red-600' :
                            analysis.turningPoints.turningPointType === 'bottom' ? 'bg-green-600' :
                            'bg-gray-600'
                          }`}
                          style={{ width: `${analysis.turningPoints.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                      {analysis.turningPoints.isAnomalous ? 
                        `Potential ${analysis.turningPoints.turningPointType} detected with ${Math.round(analysis.turningPoints.confidence * 100)}% confidence` : 
                        'No significant turning points detected in current data'
                      }
                    </div>
                  </div>
                )}
              </div>
              
              {/* Liquidity regime metrics */}
              <div className="border dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Liquidity Regime</h3>
                {analysis.liquidityRegime?.probabilities && (
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm dark:text-gray-300">
                        <span>Tightening</span>
                        <span>{Math.round(analysis.liquidityRegime.probabilities.tightening * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ width: `${analysis.liquidityRegime.probabilities.tightening * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm dark:text-gray-300">
                        <span>Easing</span>
                        <span>{Math.round(analysis.liquidityRegime.probabilities.easing * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${analysis.liquidityRegime.probabilities.easing * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                      {`Current liquidity conditions are ${analysis.liquidityRegime.liquidityRegime} with ${Math.round(analysis.liquidityRegime.confidence * 100)}% confidence`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisDashboard;