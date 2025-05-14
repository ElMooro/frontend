/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '../../context/ThemeContext';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock data for initial development
const mockTopItems: TopItem[] = [
  { id: 1, name: 'S&P 500', value: 4782.21, weekChange: 2.45, type: 'watchlist' },
  { id: 2, name: 'NASDAQ', value: 16742.39, weekChange: 3.12, type: 'watchlist' },
  { id: 3, name: 'Market Trend', value: 78, weekChange: 5.2, type: 'signal', signal: 'buy' },
  { id: 4, name: '10Y Treasury', value: 4.21, weekChange: -0.12, type: 'datapoint' },
  { id: 5, name: 'VIX', value: 13.82, weekChange: -5.67, type: 'datapoint' },
  { id: 6, name: 'COVID-19 Crash', value: '2020-03-16', weekChange: 0, type: 'event' },
  { id: 7, name: 'Gold', value: 2345.67, weekChange: 1.23, type: 'watchlist' },
  { id: 8, name: 'Bitcoin', value: 63245.78, weekChange: 5.43, type: 'watchlist' },
];

type ItemType = 'watchlist' | 'signal' | 'datapoint' | 'event';
type SignalType = 'buy' | 'sell' | 'neutral';

interface TopItem {
  id: number;
  name: string;
  value: any;
  weekChange: number;
  type: ItemType;
  signal?: SignalType;
}

const TopIcons: React.FC = () => {
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);
  const [availableItems, setAvailableItems] = useState<TopItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // In a real app, you would fetch the user's top icons from the database
      // For now, we're using mock data
      setTopItems(mockTopItems);
      
      // In a real app, you would fetch all available items from the database
      // For now, we're using the same mock data
      setAvailableItems(mockTopItems);
      
      setLoading(false);
    };

    getUser();
  }, []);

  // Format value based on item type
  const formatValue = (item: TopItem) => {
    switch (item.type) {
      case 'watchlist':
      case 'datapoint':
        return item.value.toLocaleString(undefined, { 
          maximumFractionDigits: item.value >= 100 ? 0 : 2 
        });
      case 'signal':
        return `${item.value}%`;
      case 'event':
        return new Date(item.value).toLocaleDateString();
      default:
        return item.value;
    }
  };

  // Get icon based on item type
  const getIcon = (item: TopItem) => {
    switch (item.type) {
      case 'watchlist':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
        );
      case 'signal':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'datapoint':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 100 2h10a1 1 0 100-2H3z" clipRule="evenodd" />
          </svg>
        );
      case 'event':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Get background color based on item type and signal
  const getBackgroundColor = (item: TopItem) => {
    if (item.type === 'signal') {
      switch (item.signal) {
        case 'buy':
          return theme === 'dark' ? 'bg-green-800' : 'bg-green-100';
        case 'sell':
          return theme === 'dark' ? 'bg-red-800' : 'bg-red-100';
        case 'neutral':
          return theme === 'dark' ? 'bg-yellow-800' : 'bg-yellow-100';
        default:
          return theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
      }
    }
    return theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
  };

  // Get text color based on item type and signal
  const getTextColor = (item: TopItem) => {
    if (item.type === 'signal') {
      switch (item.signal) {
        case 'buy':
          return theme === 'dark' ? 'text-green-200' : 'text-green-800';
        case 'sell':
          return theme === 'dark' ? 'text-red-200' : 'text-red-800';
        case 'neutral':
          return theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800';
        default:
          return theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
      }
    }
    return theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
  };

  // Replace an item at a specific position
  const replaceItem = (itemId: number, position: number) => {
    const newItem = availableItems.find(item => item.id === itemId);
    if (!newItem) return;
    
    const newTopItems = [...topItems];
    newTopItems[position] = newItem;
    setTopItems(newTopItems);
    
    // In a real app, you would save this to the database
    
    setShowSelector(false);
    setSelectedItemId(null);
    setSelectedPosition(null);
  };

  // Open selector for a specific position
  const openSelector = (position: number) => {
    setSelectedPosition(position);
    setShowSelector(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-16">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Quick View</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSelector(true)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
            </svg>
            Customize
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 w-full">
        {topItems.map((item, index) => (
          <div 
            key={index}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${getBackgroundColor(item)}`}
            onClick={() => openSelector(index)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className={`${getTextColor(item)}`}>
                {getIcon(item)}
              </div>
              <div className={`text-xs font-medium ${item.weekChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {item.weekChange >= 0 ? '+' : ''}{item.weekChange}%
              </div>
            </div>
            <div className={`text-sm font-medium ${getTextColor(item)} truncate`} title={item.name}>
              {item.name}
            </div>
            <div className={`text-lg font-bold ${getTextColor(item)}`}>
              {formatValue(item)}
            </div>
          </div>
        ))}
      </div>
      
      {/* Enhanced Item Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-dark-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                Customize Quick View Icons
              </h3>
              <button
                onClick={() => {
                  setShowSelector(false);
                  setSelectedItemId(null);
                  setSelectedPosition(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close dialog"
                title="Close dialog"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Current Icons */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Icons</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {topItems.map((item, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg cursor-pointer transition-colors border-2 ${
                      selectedPosition === index 
                        ? 'border-blue-500 dark:border-blue-400' 
                        : 'border-transparent'
                    } ${getBackgroundColor(item)}`}
                    onClick={() => setSelectedPosition(index)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className={`${getTextColor(item)}`}>
                        {getIcon(item)}
                      </div>
                      <div className={`text-xs font-medium ${item.weekChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {item.weekChange >= 0 ? '+' : ''}{item.weekChange}%
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${getTextColor(item)} truncate`} title={item.name}>
                      {item.name}
                    </div>
                    <div className={`text-lg font-bold ${getTextColor(item)}`}>
                      {formatValue(item)}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Click on an icon to select it for replacement
              </p>
            </div>
            
            {selectedPosition !== null ? (
              <>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select a replacement for position {selectedPosition + 1}
                </h4>
                
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search available items..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Available Items */}
                <div className="max-h-96 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {availableItems.map((item) => (
                    <div 
                      key={item.id}
                      className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                        selectedItemId === item.id 
                          ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700' 
                          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                      onClick={() => setSelectedItemId(item.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2">
                            {getIcon(item)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {item.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                            </div>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${item.weekChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {item.weekChange >= 0 ? '+' : ''}{item.weekChange}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPosition(null);
                      setSelectedItemId(null);
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
                  >
                    Cancel Selection
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedItemId !== null && selectedPosition !== null) {
                        replaceItem(selectedItemId, selectedPosition);
                        setSelectedPosition(null);
                        setSelectedItemId(null);
                      }
                    }}
                    disabled={selectedItemId === null}
                    className={`px-4 py-2 text-white text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      selectedItemId === null
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    }`}
                  >
                    Replace Icon
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                Select an icon above to replace it
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowSelector(false);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // In a real app, save the current configuration to the database
                    setShowSelector(false);
                    alert('Your Quick View configuration has been saved!');
                  }}
                  className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopIcons;