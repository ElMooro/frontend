import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi,
  LineStyle, 
  UTCTimestamp,
  LineSeries,
  AreaSeries
} from 'lightweight-charts';
import { useTheme } from '../../context/ThemeContext';
import './LightweightChart.css';

interface LineDataPoint {
  time: UTCTimestamp;
  value: number;
}

interface LightweightChartProps {
  data: Array<{ date: string; value: number }>;
  title?: string;
  height?: number;
  width?: string;
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
  };
  showVolume?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  showToolbar?: boolean;
  timeScale?: 'day' | 'week' | 'month' | 'year';
  chartType?: 'line' | 'area';
  onTimeRangeChange?: (from: number, to: number) => void;
}

const LightweightChart: React.FC<LightweightChartProps> = ({
  data,
  title = '',
  height = 400,
  width = '100%',
  colors = {},
  showVolume = false,
  showGrid = true,
  showLegend = true,
  showToolbar = true,
  timeScale = 'day',
  chartType = 'area',
  onTimeRangeChange,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const { theme } = useTheme();
  const [hoveredData, setHoveredData] = useState<{ time: string; value: number } | null>(null);
  
  // Define the crosshair move handler outside the effect so it can be referenced in cleanup
  const crosshairMoveHandlerRef = useRef<((param: any) => void) | null>(null);
  
  // Define the time range change handler outside the effect for cleanup
  const timeRangeChangeHandlerRef = useRef<((range: any) => void) | null>(null);

  // Convert data to the format expected by lightweight-charts
  // Filter out invalid values (Infinity, NaN, or values outside the allowed range)
  const MAX_ALLOWED_VALUE = 90071992547409.91;
  
  const formattedData = data
    .map(item => {
      const value = item.value;
      // Skip invalid dates or values
      if (!item.date || 
          Number.isNaN(value) || 
          !Number.isFinite(value) || 
          Math.abs(value) > MAX_ALLOWED_VALUE) {
        return null;
      }
      
      return {
        time: (new Date(item.date).getTime() / 1000) as UTCTimestamp,
        value: value
      } as LineDataPoint;
    })
    .filter((item): item is LineDataPoint => item !== null);

  // Set default colors based on theme
  const defaultColors = {
    backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
    lineColor: theme === 'dark' ? '#2962FF' : '#2962FF',
    textColor: theme === 'dark' ? '#D9D9D9' : '#191919',
    areaTopColor: theme === 'dark' ? 'rgba(41, 98, 255, 0.28)' : 'rgba(41, 98, 255, 0.28)',
    areaBottomColor: theme === 'dark' ? 'rgba(41, 98, 255, 0.05)' : 'rgba(41, 98, 255, 0.05)',
  };

  const chartColors = { ...defaultColors, ...colors };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with adjusted height to ensure text isn't cut off
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height + 20, // Add extra height for labels
      layout: {
        background: { color: chartColors.backgroundColor },
        textColor: chartColors.textColor,
      },
      grid: {
        vertLines: { color: showGrid ? (theme === 'dark' ? '#2B2B43' : '#E6E6E6') : 'transparent' },
        horzLines: { color: showGrid ? (theme === 'dark' ? '#2B2B43' : '#E6E6E6') : 'transparent' },
      },
      crosshair: {
        mode: 0, // Normal crosshair
        vertLine: {
          width: 1,
          color: theme === 'dark' ? '#758696' : '#9B9B9B',
          style: LineStyle.Solid,
        },
        horzLine: {
          width: 1,
          color: theme === 'dark' ? '#758696' : '#9B9B9B',
          style: LineStyle.Solid,
          labelBackgroundColor: theme === 'dark' ? '#758696' : '#9B9B9B',
        },
      },
      timeScale: {
        borderColor: theme === 'dark' ? '#2B2B43' : '#E6E6E6',
        timeVisible: true,
        secondsVisible: false,
        borderVisible: true,
        tickMarkFormatter: (time: UTCTimestamp) => {
          const date = new Date(time * 1000);
          return date.getDate().toString().padStart(2, '0') + '/' + 
                 (date.getMonth() + 1).toString().padStart(2, '0');
        },
      },
      rightPriceScale: {
        borderColor: theme === 'dark' ? '#2B2B43' : '#E6E6E6',
        borderVisible: true,
        scaleMargins: {
          top: 0.1,  // Leave 10% of space on top
          bottom: 0.2,  // Leave 20% of space at the bottom
        },
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    });

    // Create series based on chart type
    let series: ISeriesApi<any>;
    if (chartType === 'line') {
      series = chart.addSeries(LineSeries, {
        color: chartColors.lineColor,
        lineWidth: 2,
      });
    } else {
      // Default to area chart
      series = chart.addSeries(AreaSeries, {
        lineColor: chartColors.lineColor,
        topColor: chartColors.areaTopColor,
        bottomColor: chartColors.areaBottomColor,
        lineWidth: 2,
      });
    }

    // Set data
    if (formattedData.length > 0) {
      try {
        series.setData(formattedData);
      } catch (error) {
        console.error('Error setting chart data:', error);
        // If there's an error, try to set empty data to avoid crashing
        series.setData([]);
      }
    }

    // Fit content
    chart.timeScale().fitContent();

    // Set up crosshair move handler for legend
    if (showLegend && legendRef.current) {
      // Create the handler and store it in the ref
      crosshairMoveHandlerRef.current = (param) => {
        if (param.time) {
          const data = param.seriesData.get(series);
          if (data) {
            const time = new Date((param.time as number) * 1000).toLocaleDateString();
            const lineData = data as { value: number };
            setHoveredData({ 
              time, 
              value: lineData.value 
            });
          }
        } else {
          setHoveredData(null);
        }
      };
      
      // Subscribe with the handler from the ref
      chart.subscribeCrosshairMove(crosshairMoveHandlerRef.current);
    }

    // Set up time range change handler
    if (onTimeRangeChange) {
      // Create the handler and store it in the ref
      timeRangeChangeHandlerRef.current = (range) => {
        if (range) {
          onTimeRangeChange(range.from as number, range.to as number);
        }
      };
      
      // Subscribe with the handler from the ref
      chart.timeScale().subscribeVisibleTimeRangeChange(timeRangeChangeHandlerRef.current);
    }

    // Set up resize observer
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width } = entries[0].contentRect;
      chart.applyOptions({ width });
      chart.timeScale().fitContent();
    });

    resizeObserver.observe(chartContainerRef.current);
    resizeObserverRef.current = resizeObserver;

    // Save references
    chartRef.current = chart;
    seriesRef.current = series;

    // Cleanup
    return () => {
      // First disconnect the resize observer
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      // Then unsubscribe from any chart events
      if (chartRef.current) {
        // Unsubscribe from crosshair move events if we have a handler
        if (crosshairMoveHandlerRef.current) {
          chartRef.current.unsubscribeCrosshairMove(crosshairMoveHandlerRef.current);
        }
        
        // Unsubscribe from time range change events if they exist
        if (onTimeRangeChange && timeRangeChangeHandlerRef.current) {
          chartRef.current.timeScale().unsubscribeVisibleTimeRangeChange(timeRangeChangeHandlerRef.current);
        }
        
        // Remove the chart
        chartRef.current.remove();
        chartRef.current = null;
      }
      
      // Clear the series reference
      seriesRef.current = null;
    };
  }, [
    // Only recreate the chart when these essential props change
    // Using JSON.stringify for data to avoid unnecessary rerenders
    JSON.stringify(formattedData), 
    height, 
    chartType, 
    // Stringify objects to avoid reference equality issues
    JSON.stringify(chartColors),
    showGrid,
    showLegend
  ]);

  // Update chart when theme changes
  useEffect(() => {
    // Skip if chart is not initialized or has been disposed
    if (!chartRef.current) return;

    try {
      // Apply chart options safely
      chartRef.current.applyOptions({
        layout: {
          background: { color: chartColors.backgroundColor },
          textColor: chartColors.textColor,
        },
        grid: {
          vertLines: { color: showGrid ? (theme === 'dark' ? '#2B2B43' : '#E6E6E6') : 'transparent' },
          horzLines: { color: showGrid ? (theme === 'dark' ? '#2B2B43' : '#E6E6E6') : 'transparent' },
        },
        timeScale: {
          borderColor: theme === 'dark' ? '#2B2B43' : '#E6E6E6',
          borderVisible: true,
          tickMarkFormatter: (time: UTCTimestamp) => {
            const date = new Date(time * 1000);
            return date.getDate().toString().padStart(2, '0') + '/' + 
                   (date.getMonth() + 1).toString().padStart(2, '0');
          },
        },
        rightPriceScale: {
          borderColor: theme === 'dark' ? '#2B2B43' : '#E6E6E6',
          borderVisible: true,
          scaleMargins: {
            top: 0.1,  // Leave 10% of space on top
            bottom: 0.2,  // Leave 20% of space at the bottom
          },
        },
      });

      // Update series options if series exists
      if (seriesRef.current) {
        if (chartType === 'line') {
          seriesRef.current.applyOptions({
            color: chartColors.lineColor,
          });
        } else {
          // For area series
          seriesRef.current.applyOptions({
            lineColor: chartColors.lineColor,
            topColor: chartColors.areaTopColor,
            bottomColor: chartColors.areaBottomColor,
          });
        }
      }
    } catch (error) {
      // If we encounter an error (like "Object is disposed"), log it but don't crash
      console.warn('Error updating chart options:', error);
      
      // The chart might be in an invalid state, so we'll set the refs to null
      // to prevent further access attempts
      chartRef.current = null;
      seriesRef.current = null;
    }
  }, [theme, chartColors, showGrid, chartType]);

  // Toolbar buttons
  const handleZoomIn = () => {
    if (chartRef.current) {
      // Use the appropriate method for zooming in
      const timeScale = chartRef.current.timeScale();
      const visibleLogicalRange = timeScale.getVisibleLogicalRange();
      if (visibleLogicalRange !== null) {
        const rangeSize = visibleLogicalRange.to - visibleLogicalRange.from;
        const newRange = {
          from: visibleLogicalRange.from + rangeSize * 0.25,
          to: visibleLogicalRange.to - rangeSize * 0.25
        };
        timeScale.setVisibleLogicalRange(newRange);
      }
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      // Use the appropriate method for zooming out
      const timeScale = chartRef.current.timeScale();
      const visibleLogicalRange = timeScale.getVisibleLogicalRange();
      if (visibleLogicalRange !== null) {
        const newRange = {
          from: visibleLogicalRange.from - (visibleLogicalRange.to - visibleLogicalRange.from) * 0.25,
          to: visibleLogicalRange.to + (visibleLogicalRange.to - visibleLogicalRange.from) * 0.25
        };
        timeScale.setVisibleLogicalRange(newRange);
      }
    }
  };

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  return (
    <div className="lightweight-chart-container" data-width={width} data-theme={theme}>
      {title && <h3 className="chart-title">{title}</h3>}
      
      {showToolbar && (
        <div className="chart-toolbar" ref={toolbarRef}>
          <button onClick={handleZoomIn} className="toolbar-button">Zoom In</button>
          <button onClick={handleZoomOut} className="toolbar-button">Zoom Out</button>
          <button onClick={handleResetZoom} className="toolbar-button">Reset</button>
        </div>
      )}
      
      <div ref={chartContainerRef} className="chart-container" />
      
      {showLegend && (
        <div className="chart-legend" ref={legendRef}>
          {hoveredData ? (
            <div>
              <span className="legend-date">{hoveredData.time}</span>
              <span className="legend-value">{hoveredData.value.toFixed(2)}</span>
            </div>
          ) : (
            <div>
              <span className="legend-date">Hover chart for details</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LightweightChart;