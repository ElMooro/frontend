import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock data for initial development
const mockDataSources = [
  { id: 'economic', name: 'Economic Indicators', items: ['GDP', 'Unemployment Rate', 'CPI', 'PPI', 'Retail Sales'] },
  { id: 'market', name: 'Market Indices', items: ['S&P 500', 'NASDAQ', 'Dow Jones', 'Russell 2000', 'VIX'] },
  { id: 'bonds', name: 'Bond Yields', items: ['2Y Treasury', '5Y Treasury', '10Y Treasury', '30Y Treasury', 'Corporate AAA'] },
  { id: 'commodities', name: 'Commodities', items: ['Gold', 'Silver', 'Crude Oil', 'Natural Gas', 'Copper'] },
  { id: 'forex', name: 'Forex', items: ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CAD', 'USD/CNY'] },
  { id: 'crypto', name: 'Cryptocurrencies', items: ['Bitcoin', 'Ethereum', 'Solana', 'XRP', 'Cardano'] },
];

// Mock signal pies
const mockSignalPies = [
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

interface DataSource {
  id: string;
  name: string;
  items: string[];
}

const PieSignals: React.FC = () => {
  const { theme } = useTheme();
  // We'll store the user in state but not display it yet
  const [, setUser] = useState<any>(null);
  const [signalPies, setSignalPies] = useState<SignalPie[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedPie, setSelectedPie] = useState<SignalPie | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newPieName, setNewPieName] = useState('');
  const [newPieType, setNewPieType] = useState<'buy' | 'sell' | 'neutral'>('buy');
  const [newPieComponents, setNewPieComponents] = useState<{name: string, weight: number}[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState('');
  const [selectedDataItem, setSelectedDataItem] = useState('');
  const [selectedWeight, setSelectedWeight] = useState(10);
  const [editingPieId, setEditingPieId] = useState<number | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // In a real app, you would fetch the user's signal pies from the database
      // For now, we're using mock data
      // Cast the mock data to ensure it matches the expected type
      setSignalPies(mockSignalPies as SignalPie[]);
      setDataSources(mockDataSources);
      setLoading(false);
    };

    getUser();
  }, []);

  // Set the first pie as selected by default
  useEffect(() => {
    if (signalPies.length > 0 && !selectedPie) {
      setSelectedPie(signalPies[0]);
    }
  }, [signalPies, selectedPie]);

  // Handle pie sector hover
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  // Render active shape with more details and enhanced visuals
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    const textColor = theme === 'dark' ? '#e5e7eb' : '#333'; // Gray-100 for dark mode, dark gray for light mode
    const subTextColor = theme === 'dark' ? '#9ca3af' : '#999'; // Gray-400 for dark mode, light gray for light mode
    
    // Calculate the angle for the text label
    const sin = Math.sin(-startAngle * Math.PI / 180);
    const cos = Math.cos(-startAngle * Math.PI / 180);
    
    // Add a subtle shadow effect
    const shadowColor = theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)';
    
    return (
      <g>
        {/* Main sector with shadow effect */}
        <defs>
          <filter id={`shadow-${payload.name.replace(/\s+/g, '-')}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={shadowColor} />
          </filter>
        </defs>
        
        {/* Outer highlighted sector */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          filter={`url(#shadow-${payload.name.replace(/\s+/g, '-')})`}
          stroke={theme === 'dark' ? '#fff' : '#000'}
          strokeWidth={0.5}
          strokeOpacity={0.2}
        />
        
        {/* Inner ring */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 5}
          outerRadius={innerRadius - 2}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.8}
        />
        
        {/* Radial line connecting to label */}
        <path 
          d={`M${cx},${cy} L${cx + (outerRadius + 30) * Math.cos(-endAngle * Math.PI / 180)},${cy + (outerRadius + 30) * Math.sin(-endAngle * Math.PI / 180)}`} 
          stroke={fill}
          strokeWidth={2}
          fill="none"
          opacity={0.6}
        />
        
        {/* Center text information */}
        <text x={cx} y={cy} dy={-25} textAnchor="middle" fill={textColor} fontSize={14} fontWeight="500">
          {payload.name}
        </text>
        <text x={cx} y={cy} textAnchor="middle" fill={textColor} fontSize={18} fontWeight="bold">
          {`${value}%`}
        </text>
        <text x={cx} y={cy} dy={25} textAnchor="middle" fill={subTextColor} fontSize={13}>
          {`Contribution: ${payload.contribution}%`}
        </text>
        <text x={cx} y={cy} dy={45} textAnchor="middle" fill={subTextColor} fontSize={11}>
          {`Value: ${payload.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        </text>
      </g>
    );
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

  // Create a new signal pie
  const createSignalPie = () => {
    console.log('Creating signal pie...');
    
    // Validation checks with detailed logging
    if (!newPieName) {
      console.log('Cannot create pie: No name provided');
      alert('Please provide a name for your signal pie');
      return;
    }
    
    if (newPieComponents.length === 0) {
      console.log('Cannot create pie: No components added');
      alert('Please add at least one component to your signal pie');
      return;
    }
    
    // Check if weights sum to 100%
    const totalWeight = newPieComponents.reduce((sum, comp) => sum + comp.weight, 0);
    console.log('Total weight of components:', totalWeight);
    
    if (totalWeight !== 100) {
      console.log('Cannot create pie: Total weight is not 100%');
      alert(`Component weights must sum to 100%. Current total: ${totalWeight}%`);
      return;
    }
    
    try {
      // In a real app, you would save this to the database
      const newId = signalPies.length > 0 ? Math.max(...signalPies.map(p => p.id)) + 1 : 1;
      console.log('Creating new pie with ID:', newId);
      
      const newPie: SignalPie = {
        id: newId,
        name: newPieName,
        type: newPieType,
        confidence: Math.floor(Math.random() * 40) + 60, // Random confidence between 60-100
        lastUpdated: new Date().toISOString(),
        components: newPieComponents.map(comp => ({
          name: comp.name,
          weight: comp.weight,
          value: Math.random() * 1000, // Mock value
          contribution: Math.floor(comp.weight * (Math.random() * 0.5 + 0.5)), // Random contribution based on weight
        })),
      };
      
      console.log('New pie created:', newPie);
      const updatedPies = [...signalPies, newPie];
      console.log('Updated pies array:', updatedPies);
      
      setSignalPies(updatedPies);
      setSelectedPie(newPie);
      setShowCreateModal(false);
      resetNewPieForm();
      
      console.log('Signal pie created successfully!');
    } catch (error) {
      console.error('Error creating signal pie:', error);
      alert('An error occurred while creating the signal pie. Please try again.');
    }
  };

  // Add a component to the new pie
  const addComponent = () => {
    if (!selectedDataItem || selectedWeight <= 0) return;
    
    // Check if component already exists
    if (newPieComponents.some(comp => comp.name === selectedDataItem)) {
      alert('This component is already added');
      return;
    }
    
    // Check if adding this would exceed 100%
    const currentTotal = newPieComponents.reduce((sum, comp) => sum + comp.weight, 0);
    if (currentTotal + selectedWeight > 100) {
      alert(`Cannot add ${selectedWeight}%. Total would exceed 100%. You can add up to ${100 - currentTotal}%`);
      return;
    }
    
    setNewPieComponents([...newPieComponents, { name: selectedDataItem, weight: selectedWeight }]);
    setSelectedDataItem('');
    setSelectedWeight(10);
  };

  // Remove a component from the new pie
  const removeComponent = (name: string) => {
    setNewPieComponents(newPieComponents.filter(comp => comp.name !== name));
  };

  // Reset the new pie form
  const resetNewPieForm = () => {
    setNewPieName('');
    setNewPieType('buy');
    setNewPieComponents([]);
    setSelectedDataSource('');
    setSelectedDataItem('');
    setSelectedWeight(10);
    setEditingPieId(null);
  };
  
  // Start editing a pie
  const startEditingPie = (pie: SignalPie) => {
    setEditingPieId(pie.id);
    setNewPieName(pie.name);
    setNewPieType(pie.type);
    setNewPieComponents(pie.components.map(comp => ({
      name: comp.name,
      weight: comp.weight
    })));
    setShowEditModal(true);
  };
  
  // Update an existing pie
  const updateSignalPie = () => {
    if (!editingPieId) return;
    
    // Validation checks
    if (!newPieName) {
      alert('Please provide a name for your signal pie');
      return;
    }
    
    if (newPieComponents.length === 0) {
      alert('Please add at least one component to your signal pie');
      return;
    }
    
    // Check if weights sum to 100%
    const totalWeight = newPieComponents.reduce((sum, comp) => sum + comp.weight, 0);
    
    if (totalWeight !== 100) {
      alert(`Component weights must sum to 100%. Current total: ${totalWeight}%`);
      return;
    }
    
    try {
      // Find the pie to update
      const pieToUpdate = signalPies.find(p => p.id === editingPieId);
      
      if (!pieToUpdate) {
        alert('Could not find the pie to update');
        return;
      }
      
      // Create updated pie
      const updatedPie: SignalPie = {
        ...pieToUpdate,
        name: newPieName,
        type: newPieType,
        lastUpdated: new Date().toISOString(),
        components: newPieComponents.map(comp => {
          // Try to find existing component to preserve its value
          const existingComp = pieToUpdate.components.find(c => c.name === comp.name);
          
          return {
            name: comp.name,
            weight: comp.weight,
            value: existingComp?.value || Math.random() * 1000, // Use existing value or generate new one
            contribution: Math.floor(comp.weight * (Math.random() * 0.5 + 0.5)), // Recalculate contribution
          };
        }),
      };
      
      // Update the pies array
      const updatedPies = signalPies.map(p => 
        p.id === editingPieId ? updatedPie : p
      );
      
      setSignalPies(updatedPies);
      setSelectedPie(updatedPie);
      setShowEditModal(false);
      resetNewPieForm();
      
      console.log('Signal pie updated successfully!');
    } catch (error) {
      console.error('Error updating signal pie:', error);
      alert('An error occurred while updating the signal pie. Please try again.');
    }
  };

  // Delete a signal pie
  const deletePie = (id: number) => {
    setSignalPies(signalPies.filter(pie => pie.id !== id));
    if (selectedPie?.id === id) {
      setSelectedPie(signalPies.length > 1 ? signalPies.find(pie => pie.id !== id) || null : null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Signal Pies</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create New Signal Pie
          </button>
        </div>

        {signalPies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">You don't have any signal pies yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Create Your First Signal Pie
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Signal Pie List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Your Signal Pies</h2>
              <div className="space-y-2">
                {signalPies.map((pie) => (
                  <div 
                    key={pie.id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedPie?.id === pie.id 
                        ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700' 
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => setSelectedPie(pie)}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">{pie.name}</h3>
                      <span 
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          pie.type === 'buy' 
                            ? 'bg-green-100 text-green-800' 
                            : pie.type === 'sell' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {pie.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Confidence: {pie.confidence}%
                      </p>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          aria-label="Edit signal pie"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingPie(pie);
                          }}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          aria-label="Delete signal pie"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePie(pie.id);
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Pie Details */}
            {selectedPie && (
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{selectedPie.name}</h2>
                  <div className="flex items-center space-x-2">
                    <Link 
                      to={`/ai-analysis/${selectedPie.id}`}
                      className="px-3 py-1 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      AI Analysis
                    </Link>
                    <span 
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        selectedPie.type === 'buy' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                          : selectedPie.type === 'sell' 
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      }`}
                    >
                      {selectedPie.type.toUpperCase()} SIGNAL ({selectedPie.confidence}% Confidence)
                    </span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  Last updated: {formatDate(selectedPie.lastUpdated)}
                </div>
                
                {/* Enhanced Interactive Pie Chart */}
                <div className="h-96 mt-4 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)'} />
                        </filter>
                        {/* Create gradients for each color in the pie */}
                        {selectedPie.components.map((entry, index) => {
                          const color = getSignalColors(selectedPie.type)[index % getSignalColors(selectedPie.type).length];
                          return (
                            <linearGradient key={`gradient-${index}`} id={`colorGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={color} stopOpacity={1} />
                              <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                            </linearGradient>
                          );
                        })}
                      </defs>
                      <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={selectedPie.components}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        dataKey="weight"
                        onMouseEnter={onPieEnter}
                        paddingAngle={2}
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                        filter="url(#shadow)"
                        stroke={theme === 'dark' ? '#1f2937' : '#ffffff'}
                        strokeWidth={2}
                      >
                        {selectedPie.components.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`url(#colorGradient-${index})`}
                            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          borderRadius: '8px',
                          padding: '10px',
                          border: 'none',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          color: theme === 'dark' ? '#e5e7eb' : '#333333'
                        }}
                        formatter={(value: number, name: string, props: any) => [
                          `${value}% (Contribution: ${props.payload.contribution}%)`,
                          name
                        ]}
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
                
                {/* Components Table */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">Signal Components</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Component
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Weight
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Value
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Contribution
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedPie.components.map((component, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                              {component.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                              {component.weight}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                              {component.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                              {component.contribution}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* AI Analysis */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-2">AI Analysis</h3>
                  <p className="text-sm text-gray-600">
                    Based on historical data and current market conditions, our AI model predicts a 
                    <span className={`font-medium ${
                      selectedPie.type === 'buy' 
                        ? 'text-green-600' 
                        : selectedPie.type === 'sell' 
                          ? 'text-red-600' 
                          : 'text-yellow-600'
                    }`}> {selectedPie.confidence}% probability </span> 
                    of this signal being accurate. The model has analyzed patterns from past market behavior and identified 
                    {selectedPie.type === 'buy' 
                      ? ' positive trends that suggest potential upside.' 
                      : selectedPie.type === 'sell' 
                        ? ' concerning indicators that suggest caution is warranted.' 
                        : ' mixed signals that suggest a wait-and-see approach.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Signal Pie Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">Create New Signal Pie</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="pieName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Signal Pie Name
                  </label>
                  <input
                    type="text"
                    id="pieName"
                    className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    placeholder="e.g., Market Trend Signal"
                    value={newPieName}
                    onChange={(e) => setNewPieName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="pieType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Signal Type
                  </label>
                  <select
                    id="pieType"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={newPieType}
                    onChange={(e) => setNewPieType(e.target.value as 'buy' | 'sell' | 'neutral')}
                  >
                    <option value="buy">Buy Signal</option>
                    <option value="sell">Sell Signal</option>
                    <option value="neutral">Neutral Signal</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Components</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label htmlFor="dataSource" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data Source
                    </label>
                    <select
                      id="dataSource"
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={selectedDataSource}
                      onChange={(e) => {
                        setSelectedDataSource(e.target.value);
                        setSelectedDataItem('');
                      }}
                    >
                      <option value="">Select a data source</option>
                      {dataSources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="dataItem" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data Item
                    </label>
                    <select
                      id="dataItem"
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={selectedDataItem}
                      onChange={(e) => setSelectedDataItem(e.target.value)}
                      disabled={!selectedDataSource}
                    >
                      <option value="">Select a data item</option>
                      {selectedDataSource && dataSources.find(s => s.id === selectedDataSource)?.items.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (%)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        id="weight"
                        min="1"
                        max="100"
                        className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={selectedWeight}
                        onChange={(e) => setSelectedWeight(parseInt(e.target.value) || 0)}
                      />
                      <button
                        onClick={addComponent}
                        disabled={!selectedDataItem || selectedWeight <= 0}
                        className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Components List */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Components</h5>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Total: {newPieComponents.reduce((sum, comp) => sum + comp.weight, 0)}%
                    </span>
                  </div>
                  {newPieComponents.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No components added yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Component
                            </th>
                            <th scope="col" className="px-6 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Weight
                            </th>
                            <th scope="col" className="px-6 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {newPieComponents.map((component, index) => (
                            <tr key={index}>
                              <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                {component.name}
                              </td>
                              <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                                {component.weight}%
                              </td>
                              <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => removeComponent(component.name)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetNewPieForm();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Create button clicked');
                    console.log('Pie name:', newPieName);
                    console.log('Components:', newPieComponents);
                    console.log('Total weight:', newPieComponents.reduce((sum, comp) => sum + comp.weight, 0));
                    createSignalPie();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Create Signal Pie ({newPieComponents.reduce((sum, comp) => sum + comp.weight, 0)}%)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Signal Pie Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">Edit Signal Pie</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="editPieName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Signal Pie Name
                  </label>
                  <input
                    type="text"
                    id="editPieName"
                    className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    placeholder="e.g., Market Trend Signal"
                    value={newPieName}
                    onChange={(e) => setNewPieName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="editPieType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Signal Type
                  </label>
                  <select
                    id="editPieType"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={newPieType}
                    onChange={(e) => setNewPieType(e.target.value as 'buy' | 'sell' | 'neutral')}
                  >
                    <option value="buy">Buy Signal</option>
                    <option value="sell">Sell Signal</option>
                    <option value="neutral">Neutral Signal</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Components</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label htmlFor="editDataSource" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data Source
                    </label>
                    <select
                      id="editDataSource"
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={selectedDataSource}
                      onChange={(e) => {
                        setSelectedDataSource(e.target.value);
                        setSelectedDataItem('');
                      }}
                    >
                      <option value="">Select a data source</option>
                      {dataSources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="editDataItem" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data Item
                    </label>
                    <select
                      id="editDataItem"
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={selectedDataItem}
                      onChange={(e) => setSelectedDataItem(e.target.value)}
                      disabled={!selectedDataSource}
                    >
                      <option value="">Select a data item</option>
                      {selectedDataSource && dataSources.find(s => s.id === selectedDataSource)?.items.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="editWeight" className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (%)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        id="editWeight"
                        min="1"
                        max="100"
                        className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={selectedWeight}
                        onChange={(e) => setSelectedWeight(parseInt(e.target.value) || 0)}
                      />
                      <button
                        onClick={addComponent}
                        disabled={!selectedDataItem || selectedWeight <= 0}
                        className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Components List */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Components</h5>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Total: {newPieComponents.reduce((sum, comp) => sum + comp.weight, 0)}%
                    </span>
                  </div>
                  {newPieComponents.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No components added yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Component
                            </th>
                            <th scope="col" className="px-6 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Weight
                            </th>
                            <th scope="col" className="px-6 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {newPieComponents.map((component, index) => (
                            <tr key={index}>
                              <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                {component.name}
                              </td>
                              <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                                {component.weight}%
                              </td>
                              <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => removeComponent(component.name)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetNewPieForm();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Update button clicked');
                    console.log('Pie name:', newPieName);
                    console.log('Components:', newPieComponents);
                    console.log('Total weight:', newPieComponents.reduce((sum, comp) => sum + comp.weight, 0));
                    updateSignalPie();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Update Signal Pie ({newPieComponents.reduce((sum, comp) => sum + comp.weight, 0)}%)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PieSignals;
