import React from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface DashboardWidgetProps {
  id: string;
  name: string;
  value: number;
  change: number;
  onRemove: (id: string) => void;
  data?: Array<{ date: string; value: number }>;
  loading?: boolean;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({ id, name, value, change, onRemove, data, loading = false }) => {
  const { theme } = useTheme();
  
  // Use empty data array if no data is provided
  const chartData = data || [];
  
  return (
    <div className="card relative bg-white dark:bg-dark-card p-4 rounded-lg shadow">
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label={`Remove ${name}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      <Link to={`/chart/${id}`} className="block">
        <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">{name}</h3>
        {loading ? (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </span>
            </div>
            
            {/* Enhanced Mini chart */}
            <div className="h-16 mt-2">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <defs>
                      <linearGradient id={`colorGradient-${name.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop 
                          offset="5%" 
                          stopColor={change >= 0 ? (theme === 'dark' ? '#4ade80' : '#10b981') : (theme === 'dark' ? '#f87171' : '#ef4444')} 
                          stopOpacity={0.8}
                        />
                        <stop 
                          offset="95%" 
                          stopColor={change >= 0 ? (theme === 'dark' ? '#4ade80' : '#10b981') : (theme === 'dark' ? '#f87171' : '#ef4444')} 
                          stopOpacity={0.2}
                        />
                      </linearGradient>
                    </defs>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={change >= 0 ? (theme === 'dark' ? '#4ade80' : '#10b981') : (theme === 'dark' ? '#f87171' : '#ef4444')} 
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-in-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 text-sm">
                  No data available
                </div>
              )}
            </div>
          </>
        )}
      </Link>
    </div>
  );
};

export default DashboardWidget;