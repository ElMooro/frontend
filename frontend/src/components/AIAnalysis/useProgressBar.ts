import { useMemo } from 'react';

/**
 * Custom hook to calculate progress bar width with safety bounds
 * @param value The value to convert to a percentage
 * @param multiplier Multiplier to apply to the value (default: 1)
 * @param absolute Whether to use the absolute value (default: false)
 * @returns Data attribute for the progress bar width (percentage value)
 */
export const useProgressBar = (
  value: number | undefined, 
  multiplier: number = 1, 
  absolute: boolean = false
): { progressAttr: string } => {
  return useMemo(() => {
    const safeValue = value || 0;
    const calculatedValue = absolute 
      ? Math.abs(safeValue * multiplier) 
      : safeValue * multiplier;
    
    // Ensure the value is between 0 and 100
    let boundedValue = Math.max(0, Math.min(100, calculatedValue));
    
    // Round to the nearest 5 for better CSS compatibility
    boundedValue = Math.round(boundedValue / 5) * 5;
    
    // Return only the progress attribute - CSS will handle the styling
    return {
      progressAttr: `${boundedValue}`
    };
  }, [value, multiplier, absolute]);
};