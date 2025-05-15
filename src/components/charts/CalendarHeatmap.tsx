import React from 'react';
import type { EChartsOption } from 'echarts';
import { EChartsBase } from './echarts-base';

interface CalendarHeatmapProps {
  data: [string, number][];
  years?: number[];
  yearRange?: [number, number];
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  theme?: 'light' | 'dark';
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  data,
  years,
  yearRange,
  title,
  style,
  className,
  theme = 'light',
}) => {
  // Group data by year
  const groupDataByYear = (data: [string, number][]) => {
    const dataByYear: Record<number, [string, number][]> = {};
    
    data.forEach(([dateStr, value]) => {
      const year = new Date(dateStr).getFullYear();
      if (!dataByYear[year]) {
        dataByYear[year] = [];
      }
      dataByYear[year].push([dateStr, value]);
    });
    
    return dataByYear;
  };

  // Determine which years to display
  const determineYearsToDisplay = () => {
    // If years are explicitly provided, use them
    if (years && years.length > 0) {
      return years;
    }
    
    // If yearRange is provided, use it
    if (yearRange) {
      const [startYear, endYear] = yearRange;
      const result = [];
      for (let y = startYear; y <= endYear; y++) {
        result.push(y);
      }
      return result;
    }
    
    // Otherwise, extract years from data
    if (data.length > 0) {
      // Find min and max years from actual transaction data
      let minYear = Infinity;
      let maxYear = -Infinity;
      
      data.forEach(([dateStr]) => {
        const year = new Date(dateStr).getFullYear();
        minYear = Math.min(minYear, year);
        maxYear = Math.max(maxYear, year);
      });
      
      // Generate array of years between min and max
      const result = [];
      for (let y = minYear; y <= maxYear; y++) {
        result.push(y);
      }
      return result;
    }
    
    // Default to current year if no data
    return [new Date().getFullYear()];
  };

  const dataByYear = groupDataByYear(data);
  const yearsToDisplay = determineYearsToDisplay();
  
  // Define a specific style for the outer container with scrolling
  const containerStyle: React.CSSProperties = {
    height: '400px', // Fixed height for a single row
    overflowX: 'auto', // Enable horizontal scrolling
    paddingLeft: '20px',
    paddingBottom: '20px',
    ...style, // Allow any passed styles to override defaults
  };

  // Calculate the minimum width needed for all calendars
  const minWidth = yearsToDisplay.length * 220 + 100;
  
  // Style for the inner chart container
  const chartStyle: React.CSSProperties = {
    height: '100%',
    width: `${minWidth}px`, // Set explicit width to ensure scrolling works
  };

  const option: EChartsOption = {
    title: title ? { text: title } : undefined,
    tooltip: {
      position: 'top',
      formatter: (params) => {
        if (Array.isArray(params)) {
          const p = params[0];
          if (!p || !p.data) return '';
          const data = p.data as [string, number] | null;
          if (data) {
            const year = new Date(data[0]).getFullYear();
            return `${data[0]} (${year}): ${data[1]}`;
          }
        } else if (params && params.data) {
          const data = params.data as [string, number] | null;
          if (data) {
            const year = new Date(data[0]).getFullYear();
            return `${data[0]} (${year}): ${data[1]}`;
          }
        }
        return '';
      },
    },
    calendar: yearsToDisplay.map((year, index) => ({
      orient: 'vertical',
      range: year.toString(),
      cellSize: [25, 25], // Fixed cell size for consistency
      top: 40, // Fixed top margin
      bottom: 30,
      left: index * 220 + 60, // Position calendars horizontally in a single row
      yearLabel: { 
        show: true,
        margin: 18,
        position: 'top',
        formatter: '{start}',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      dayLabel: {
        firstDay: 1,
        nameMap: 'en'
      },
      monthLabel: {
        nameMap: 'en'
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#aaa',
          width: 1, // Thinner border (1px)
          type: 'solid'
        }
      },
      itemStyle: {
        borderWidth: 0.5
      }
    })),
    visualMap: {
      min: 0,
      max: Math.max(...data.map(d => d[1]), 10),
      calculable: true,
      orient: 'vertical',
      left: 'right',
      top: 'center',
      inRange: {
        color: ['#e0f3f8', '#08589e'],
      },
      seriesIndex: yearsToDisplay.map((_, index) => index),
    },
    series: yearsToDisplay.map((year, index) => ({
      name: `${year}`,
      type: 'heatmap',
      coordinateSystem: 'calendar',
      calendarIndex: index,
      data: dataByYear[year] || [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }))
  };

  // Wrap the EChartsBase in a div with scrolling
  return (
    <div style={containerStyle} className={className}>
      <div style={chartStyle}>
        <EChartsBase option={option} theme={theme} />
      </div>
    </div>
  );
};
