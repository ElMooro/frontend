/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode colors
        'light-bg': '#f3f4f6',
        'light-card': '#ffffff',
        'light-text': '#1f2937',
        'light-border': '#e5e7eb',
        'light-accent': '#2563eb',
        'light-accent-hover': '#1d4ed8',
        'light-success': '#10b981',
        'light-warning': '#f59e0b',
        'light-danger': '#ef4444',
        'light-chart-grid': '#e5e7eb',
        
        // Dark mode colors (TradingView-like)
        'dark-bg': '#131722',
        'dark-card': '#1e222d',
        'dark-text': '#d1d5db',
        'dark-border': '#2a2e39',
        'dark-accent': '#2196f3',
        'dark-accent-hover': '#1e88e5',
        'dark-success': '#00c853',
        'dark-warning': '#ffab00',
        'dark-danger': '#ff5252',
        'dark-chart-grid': '#2a2e39',
        
        // Chart colors (consistent across themes)
        'chart-1': '#2196f3',
        'chart-2': '#4caf50',
        'chart-3': '#ff9800',
        'chart-4': '#e91e63',
        'chart-5': '#9c27b0',
        'chart-6': '#00bcd4',
        'chart-7': '#ffeb3b',
        'chart-8': '#795548',
        'chart-9': '#607d8b',
        'chart-10': '#3f51b5',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-dark': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'card-dark-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}