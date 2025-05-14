/**
 * Utility functions for data calculations
 */
const calculations = {
  /**
   * Calculate period-to-period change
   * @param {Array} data - Array of data points with date and value properties
   * @returns {Array} - Array of data points with date and value properties
   */
  calculateChange(data) {
    if (!data || data.length < 2) return data;
    
    const result = [];
    
    // First point has no previous point to compare with
    result.push({
      date: data[0].date,
      value: null
    });
    
    // Calculate change for remaining points
    for (let i = 1; i < data.length; i++) {
      const currentValue = data[i].value;
      const previousValue = data[i - 1].value;
      
      // Handle null or undefined values
      const change = (currentValue !== null && previousValue !== null)
        ? currentValue - previousValue
        : null;
      
      result.push({
        date: data[i].date,
        value: change
      });
    }
    
    return result;
  },
  
  /**
   * Calculate period-to-period percent change
   * @param {Array} data - Array of data points with date and value properties
   * @returns {Array} - Array of data points with date and value properties
   */
  calculatePercentChange(data) {
    if (!data || data.length < 2) return data;
    
    const result = [];
    
    // First point has no previous point to compare with
    result.push({
      date: data[0].date,
      value: null
    });
    
    // Calculate percent change for remaining points
    for (let i = 1; i < data.length; i++) {
      const currentValue = data[i].value;
      const previousValue = data[i - 1].value;
      
      // Handle null, undefined, or zero values
      const percentChange = (currentValue !== null && previousValue !== null && previousValue !== 0)
        ? ((currentValue - previousValue) / previousValue) * 100
        : null;
      
      result.push({
        date: data[i].date,
        value: percentChange
      });
    }
    
    return result;
  },
  
  /**
   * Calculate moving average
   * @param {Array} data - Array of data points with date and value properties
   * @param {number} windowSize - Size of the moving average window
   * @returns {Array} - Array of data points with date and value properties
   */
  calculateMovingAverage(data, windowSize = 7) {
    if (!data || data.length === 0) return data;
    
    const result = [];
    
    // Calculate moving average
    for (let i = 0; i < data.length; i++) {
      // Get window of data points
      const window = data.slice(Math.max(0, i - windowSize + 1), i + 1);
      
      // Filter out null or undefined values
      const validValues = window.map(d => d.value).filter(v => v !== null && v !== undefined);
      
      // Calculate average if there are valid values
      const average = validValues.length > 0
        ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length
        : null;
      
      result.push({
        date: data[i].date,
        value: average
      });
    }
    
    return result;
  },
  
  /**
   * Calculate year-over-year change
   * @param {Array} data - Array of data points with date and value properties
   * @returns {Array} - Array of data points with date and value properties
   */
  calculateYearOverYearChange(data) {
    if (!data || data.length === 0) return data;
    
    // Create a map of dates to values for quick lookup
    const dateValueMap = new Map();
    data.forEach(d => {
      dateValueMap.set(d.date.substring(0, 10), d.value);
    });
    
    const result = [];
    
    // Calculate year-over-year change
    for (const point of data) {
      const currentDate = new Date(point.date);
      const currentValue = point.value;
      
      // Get date from one year ago
      const lastYearDate = new Date(currentDate);
      lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);
      const lastYearDateString = lastYearDate.toISOString().substring(0, 10);
      
      // Get value from one year ago
      const lastYearValue = dateValueMap.get(lastYearDateString);
      
      // Calculate year-over-year change
      const yoyChange = (currentValue !== null && lastYearValue !== null)
        ? currentValue - lastYearValue
        : null;
      
      result.push({
        date: point.date,
        value: yoyChange
      });
    }
    
    return result;
  },
  
  /**
   * Calculate year-over-year percent change
   * @param {Array} data - Array of data points with date and value properties
   * @returns {Array} - Array of data points with date and value properties
   */
  calculateYearOverYearPercentChange(data) {
    if (!data || data.length === 0) return data;
    
    // Create a map of dates to values for quick lookup
    const dateValueMap = new Map();
    data.forEach(d => {
      dateValueMap.set(d.date.substring(0, 10), d.value);
    });
    
    const result = [];
    
    // Calculate year-over-year percent change
    for (const point of data) {
      const currentDate = new Date(point.date);
      const currentValue = point.value;
      
      // Get date from one year ago
      const lastYearDate = new Date(currentDate);
      lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);
      const lastYearDateString = lastYearDate.toISOString().substring(0, 10);
      
      // Get value from one year ago
      const lastYearValue = dateValueMap.get(lastYearDateString);
      
      // Calculate year-over-year percent change
      const yoyPercentChange = (currentValue !== null && lastYearValue !== null && lastYearValue !== 0)
        ? ((currentValue - lastYearValue) / lastYearValue) * 100
        : null;
      
      result.push({
        date: point.date,
        value: yoyPercentChange
      });
    }
    
    return result;
  },
  
  /**
   * Apply a custom formula to data
   * @param {Array} data - Array of data points with date and value properties
   * @param {string} formula - Custom formula to apply
   * @returns {Array} - Array of data points with date and value properties
   */
  applyCustomFormula(data, formula) {
    if (!data || data.length === 0) return data;
    
    try {
      const result = [];
      
      // Create a safe evaluation function
      const safeEval = (formula, value) => {
        // Only allow basic arithmetic operations and math functions
        const mathFunctions = Object.getOwnPropertyNames(Math)
          .filter(name => typeof Math[name] === 'function')
          .reduce((obj, name) => {
            obj[name] = Math[name];
            return obj;
          }, {});
        
        // Create a function with limited scope
        const evalFunction = new Function('x', 'Math', `return ${formula}`);
        
        return evalFunction(value, mathFunctions);
      };
      
      // Apply formula to each data point
      for (const point of data) {
        const value = point.value;
        
        // Skip null or undefined values
        if (value === null || value === undefined) {
          result.push({
            date: point.date,
            value: null
          });
          continue;
        }
        
        try {
          // Apply formula
          const calculatedValue = safeEval(formula, value);
          
          result.push({
            date: point.date,
            value: calculatedValue
          });
        } catch (error) {
          console.error(`Error applying formula to value ${value}:`, error);
          
          // If formula fails, keep original value
          result.push({
            date: point.date,
            value: null
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error applying custom formula:', error);
      return data;
    }
  }
};

module.exports = calculations;
