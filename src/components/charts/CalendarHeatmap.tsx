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
    if (years && years.length > 0) {
      return years;
    }
    
    if (yearRange) {
      const [startYear, endYear] = yearRange;
      const result = [];
      for (let y = startYear; y <= endYear; y++) {
        result.push(y);
      }
      return result;
    }
    
    // Extract years from data as fallback
    const yearsFromData = new Set<number>();
    data.forEach(([dateStr]) => {
      const year = new Date(dateStr).getFullYear();
      yearsFromData.add(year);
    });
    
    return Array.from(yearsFromData).sort();
  };

  const dataByYear = groupDataByYear(data);
  const yearsToDisplay = determineYearsToDisplay();
  
  // Define a specific style for the calendar heatmap
  const calendarStyle: React.CSSProperties = {
    height: '600px',
    width: `${yearsToDisplay.length * 220 + 100}px`,
    paddingLeft: '20px',
    paddingBottom: '20px',
    ...style, // Allow any passed styles to override defaults
  };

  const option: EChartsOption = {
    title: title ? { text: title } : undefined,
    tooltip: {
      position: 'top',
      formatter: (params) => {
        if (Array.isArray(params)) {
          const p = params[0];
          const data = p.data as [string, number] | null;
          if (data) {
            const year = new Date(data[0]).getFullYear();
            return `${data[0]} (${year}): ${data[1]}`;
          }
        } else {
          const data = params.data as [string, number] | null;
          if (data) {
            const year = new Date(data[0]).getFullYear();
            return `${data[0]} (${year}): ${data[1]}`;
          }
        }
        return '';
      },
    },
    // legend: {
    //   data: yearsToDisplay.map(year => `${year}`),
    //   bottom: 20
    // },
calendar: yearsToDisplay.map((year, index) => ({
  orient: 'vertical',
  range: year.toString(),
  cellSize: [25, 'auto'],
  top: 40,
  bottom: 20,
  left: index * 220 + 60,
  yearLabel: { 
    show: true,
    margin: 18,
    // margin: 40,
    // position: 'top',
    // formatter: '{start}',
    // textStyle: {
    //   fontSize: 16,
    //   fontWeight: 'bold'
    // }
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
      color: '#000',
      width: 1,
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

  return <EChartsBase option={option} style={calendarStyle} className={className} theme={theme} />;
};
