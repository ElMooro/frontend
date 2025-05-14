import React from 'react';
import './DataChart.css';

// Dataset color indicator component using CSS custom properties instead of inline styles
const DatasetIndicator: React.FC<{ color: string }> = ({ color }) => {
  return (
    <span
      className={`dataset-indicator dataset-indicator--${color.replace('#', '')}`}
      data-indicator-color={color}
    ></span>
  );
};

export default DatasetIndicator;