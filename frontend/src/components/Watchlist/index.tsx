/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
// import axios from 'axios';  // Uncomment when needed
import { useTheme } from '../../context/ThemeContext';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock data for initial development
const mockWatchlistItems = [
  { id: 1, name: 'S&P 500', symbol: 'SPX', category: 'Index', value: 4782.21, dayChange: 1.23, weekChange: 2.45, monthChange: 3.67, yearChange: 15.89 },
  { id: 2, name: 'NASDAQ', symbol: 'IXIC', category: 'Index', value: 16742.39, dayChange: 1.78, weekChange: 3.12, monthChange: 4.56, yearChange: 20.34 },
  { id: 3, name: 'Dow Jones', symbol: 'DJI', category: 'Index', value: 38239.98, dayChange: 0.56, weekChange: 1.23, monthChange: 2.34, yearChange: 10.45 },
  { id: 4, name: '10Y Treasury', symbol: 'US10Y', category: 'Bond', value: 4.21, dayChange: -0.05, weekChange: -0.12, monthChange: 0.34, yearChange: 0.67 },
  { id: 5, name: 'VIX', symbol: 'VIX', category: 'Volatility', value: 13.82, dayChange: -2.34, weekChange: -5.67, monthChange: -8.90, yearChange: -15.43 },
  { id: 6, name: 'Gold', symbol: 'GC=F', category: 'Commodity', value: 2345.67, dayChange: 0.45, weekChange: 1.23, monthChange: 3.45, yearChange: 12.34 },
  { id: 7, name: 'Bitcoin', symbol: 'BTC-USD', category: 'Crypto', value: 63245.78, dayChange: 3.67, weekChange: 5.43, monthChange: 12.34, yearChange: 45.67 },
  { id: 8, name: 'EUR/USD', symbol: 'EURUSD=X', category: 'Forex', value: 1.0876, dayChange: -0.12, weekChange: -0.34, monthChange: -0.56, yearChange: -2.34 },
  { id: 9, name: 'Crude Oil', symbol: 'CL=F', category: 'Commodity', value: 78.45, dayChange: 1.23, weekChange: 2.34, monthChange: -1.23, yearChange: 5.67 },
  { id: 10, name: 'Apple Inc.', symbol: 'AAPL', category: 'Stock', value: 178.34, dayChange: 0.87, weekChange: 1.45, monthChange: 3.21, yearChange: 12.34 },
  { id: 11, name: 'Microsoft', symbol: 'MSFT', category: 'Stock', value: 412.65, dayChange: 1.23, weekChange: 2.34, monthChange: 4.56, yearChange: 25.67 },
  { id: 12, name: 'Amazon', symbol: 'AMZN', category: 'Stock', value: 178.92, dayChange: 0.56, weekChange: 1.23, monthChange: 2.34, yearChange: 15.67 },
];

// Mock data for available data sources
const mockDataSources = [
  { id: 'economic', name: 'Economic Indicators', items: ['GDP', 'Unemployment Rate', 'CPI', 'PPI', 'Retail Sales'] },
  { id: 'market', name: 'Market Indices', items: ['S&P 500', 'NASDAQ', 'Dow Jones', 'Russell 2000', 'VIX'] },
  { id: 'bonds', name: 'Bond Yields', items: ['2Y Treasury', '5Y Treasury', '10Y Treasury', '30Y Treasury', 'Corporate AAA'] },
  { id: 'commodities', name: 'Commodities', items: ['Gold', 'Silver', 'Crude Oil', 'Natural Gas', 'Copper'] },
  { id: 'forex', name: 'Forex', items: ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CAD', 'USD/CNY'] },
  { id: 'crypto', name: 'Cryptocurrencies', items: ['Bitcoin', 'Ethereum', 'Solana', 'XRP', 'Cardano'] },
];

interface WatchlistItem {
  id: number;
  name: string;
  symbol: string;
  category: string;
  value: number;
  dayChange: number;
  weekChange: number;
  monthChange: number;
  yearChange: number;
  formula?: string;
  isCalculated?: boolean;
  colorLabel?: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | null;
}

interface DataSource {
  id: string;
  name: string;
  items: string[];
}

const Watchlist: React.FC = () => {
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [calculationFormula, setCalculationFormula] = useState('');
  const [calculationName, setCalculationName] = useState('');
  const [showColorLabelMenu, setShowColorLabelMenu] = useState<number | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // In a real app, you would fetch the user's watchlist from the database
      // For now, we're using mock data
      setWatchlistItems(mockWatchlistItems);
      setDataSources(mockDataSources);
      setLoading(false);
    };

    getUser();
  }, []);

  // Filter watchlist items based on search term and category
  const filteredItems = watchlistItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter dropdown
  // Using a different approach to avoid Set iteration issues
  const uniqueCategories = watchlistItems
    .map(item => item.category)
    .filter((category, index, self) => self.indexOf(category) === index);
  const categories = ['all', ...uniqueCategories];

  // Add a new item to the watchlist
  const addItemToWatchlist = (name: string, category: string) => {
    // In a real app, you would save this to the database
    const newItem: WatchlistItem = {
      id: watchlistItems.length + 1,
      name,
      symbol: name.replace(/[^A-Z0-9]/gi, '').toUpperCase(),
      category,
      value: Math.random() * 1000,
      dayChange: (Math.random() - 0.5) * 5,
      weekChange: (Math.random() - 0.5) * 10,
      monthChange: (Math.random() - 0.5) * 15,
      yearChange: (Math.random() - 0.5) * 30,
    };
    
    setWatchlistItems([...watchlistItems, newItem]);
    setShowAddItemModal(false);
  };

  // Remove an item from the watchlist
  const removeItem = (id: number) => {
    setWatchlistItems(watchlistItems.filter(item => item.id !== id));
    setSelectedItems(selectedItems.filter(itemId => itemId !== id));
  };

  // Toggle item selection for calculations
  const toggleItemSelection = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Create a calculated item
  const createCalculatedItem = () => {
    console.log("Creating calculated item...");
    console.log("Name:", calculationName);
    console.log("Formula:", calculationFormula);
    console.log("Selected items:", selectedItems);
    
    // Validate inputs
    if (!calculationName || calculationName.trim() === '') {
      alert("Please enter a calculation name");
      return;
    }
    
    if (!calculationFormula || calculationFormula.trim() === '') {
      alert("Please enter a formula");
      return;
    }
    
    if (selectedItems.length < 1) {
      alert("Please select at least one item for the calculation");
      return;
    }
    
    try {
      // In a real app, you would validate the formula and calculate the actual value
      // For now, we'll create a mock calculated item
      const selectedItemsData = selectedItems.map(id => {
        const item = watchlistItems.find(item => item.id === id);
        if (!item) {
          throw new Error(`Item with ID ${id} not found`);
        }
        return item;
      });
      
      // Simple average calculation for demo purposes
      const calculatedValue = selectedItemsData.reduce((sum, item) => sum + (item?.value || 0), 0) / selectedItems.length;
      
      // Generate a unique ID
      const newId = Math.max(...watchlistItems.map(item => item.id), 0) + 1;
      
      const newItem: WatchlistItem = {
        id: newId,
        name: calculationName,
        symbol: 'CALC',
        category: 'Calculated',
        value: calculatedValue,
        dayChange: (Math.random() - 0.5) * 5,
        weekChange: (Math.random() - 0.5) * 10,
        monthChange: (Math.random() - 0.5) * 15,
        yearChange: (Math.random() - 0.5) * 30,
        formula: calculationFormula,
        isCalculated: true,
      };
      
      console.log("New calculated item:", newItem);
      
      // Update the watchlist with the new item
      setWatchlistItems([...watchlistItems, newItem]);
      
      // Reset the form and close the modal
      setShowCalculatorModal(false);
      setCalculationName('');
      setCalculationFormula('');
      setSelectedItems([]);
      
      console.log("Calculation created successfully");
    } catch (error) {
      console.error("Error creating calculation:", error);
      alert(`Error creating calculation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // View item in chart
  const viewInChart = (id: number) => {
    // In a real app, this would navigate to the chart page with the item's data
    console.log(`View item ${id} in chart`);
  };
  
  // Set color label for an item
  const setColorLabel = (id: number, color: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | null) => {
    setWatchlistItems(
      watchlistItems.map(item => 
        item.id === id ? { ...item, colorLabel: color } : item
      )
    );
    setShowColorLabelMenu(null);
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Your Watchlist</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddItemModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add Item
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowCalculatorModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={watchlistItems.length === 0}
              type="button"
            >
              Create Calculation
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
          <div className="md:w-1/2">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by name or symbol"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="md:w-1/4">
            <label htmlFor="category" className="sr-only">Category</label>
            <select
              id="category"
              name="category"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Watchlist Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="Select all items"
                    title="Select all items"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredItems.map(item => item.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symbol
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day %
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week %
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month %
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year %
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No items found. Try adjusting your search or filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className={item.isCalculated ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        aria-label={`Select ${item.name}`}
                        title={`Select ${item.name}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                      {item.formula && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({item.formula})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${item.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.dayChange >= 0 ? '+' : ''}{item.dayChange.toFixed(2)}%
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${item.weekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.weekChange >= 0 ? '+' : ''}{item.weekChange.toFixed(2)}%
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${item.monthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.monthChange >= 0 ? '+' : ''}{item.monthChange.toFixed(2)}%
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${item.yearChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.yearChange >= 0 ? '+' : ''}{item.yearChange.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {/* Color label indicator */}
                      <div className="flex items-center justify-end space-x-2">
                        {/* Color label indicator */}
                        <div className="relative">
                          <button
                            onClick={() => setShowColorLabelMenu(showColorLabelMenu === item.id ? null : item.id)}
                            className={`w-5 h-5 rounded-full border ${
                              item.colorLabel 
                                ? `bg-${item.colorLabel}-500 border-${item.colorLabel}-600` 
                                : 'bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600'
                            }`}
                            title="Set color label"
                          ></button>
                          
                          {/* Color label dropdown */}
                          {showColorLabelMenu === item.id && (
                            <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 p-1 flex space-x-1">
                              <button 
                                onClick={() => setColorLabel(item.id, 'red')}
                                className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600"
                                title="Red"
                              ></button>
                              <button 
                                onClick={() => setColorLabel(item.id, 'orange')}
                                className="w-6 h-6 rounded-full bg-orange-500 hover:bg-orange-600"
                                title="Orange"
                              ></button>
                              <button 
                                onClick={() => setColorLabel(item.id, 'yellow')}
                                className="w-6 h-6 rounded-full bg-yellow-500 hover:bg-yellow-600"
                                title="Yellow"
                              ></button>
                              <button 
                                onClick={() => setColorLabel(item.id, 'green')}
                                className="w-6 h-6 rounded-full bg-green-500 hover:bg-green-600"
                                title="Green"
                              ></button>
                              <button 
                                onClick={() => setColorLabel(item.id, 'blue')}
                                className="w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600"
                                title="Blue"
                              ></button>
                              {item.colorLabel && (
                                <button 
                                  onClick={() => setColorLabel(item.id, null)}
                                  className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center"
                                  title="Remove color"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <Link
                          to={`/chart/${item.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Chart
                        </Link>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Add to Watchlist</h3>
              <div className="mt-2 px-7 py-3">
                <div className="mb-4">
                  <label htmlFor="dataSource" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1">
                    Data Source
                  </label>
                  <select
                    id="dataSource"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    {dataSources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="dataItem" className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Data Item
                  </label>
                  <select
                    id="dataItem"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    {dataSources[0]?.items.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-between px-4 py-3">
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addItemToWatchlist(dataSources[0]?.items[0] || 'New Item', dataSources[0]?.name || 'Other')}
                  className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculatorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Create Calculation</h3>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  createCalculatedItem();
                }}
                className="mt-2 px-7 py-3"
              >
                <div className="mb-4">
                  <label htmlFor="calculationName" className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Calculation Name
                  </label>
                  <input
                    type="text"
                    id="calculationName"
                    className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    placeholder="My Calculation"
                    value={calculationName}
                    onChange={(e) => setCalculationName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="formula" className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Formula
                  </label>
                  <input
                    type="text"
                    id="formula"
                    className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    placeholder="e.g., (A + B) / 2"
                    value={calculationFormula}
                    onChange={(e) => setCalculationFormula(e.target.value)}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 text-left">
                    Use simple formulas like A+B, A-B, A*B, A/B, (A+B)/2, etc.
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Selected Items ({selectedItems.length})
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 text-left">
                    {selectedItems.length === 0 ? (
                      <p className="text-sm text-gray-500">No items selected</p>
                    ) : (
                      selectedItems.map((id, index) => {
                        const item = watchlistItems.find(item => item.id === id);
                        return (
                          <div key={id} className="text-sm py-1">
                            {String.fromCharCode(65 + index)}: {item?.name}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setShowCalculatorModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!calculationName || !calculationFormula || selectedItems.length < 1}
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
