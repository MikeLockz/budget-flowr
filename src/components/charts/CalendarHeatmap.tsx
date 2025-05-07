import React from 'react';
import type { EChartsOption } from 'echarts';
import { EChartsBase } from './echarts-base';

interface CalendarHeatmapProps {
  data: [string, number][];
  year: number;
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  theme?: 'light' | 'dark';
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  data,
  year,
  title,
  style,
  className,
  theme = 'light',
}) => {
  // Define a specific style for the calendar heatmap
  const calendarStyle: React.CSSProperties = {
    height: '1000px',
    paddingLeft: '20px',
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
            return `${data[0]}: ${data[1]}`;
          }
        } else {
          const data = params.data as [string, number] | null;
          if (data) {
            return `${data[0]}: ${data[1]}`;
          }
        }
        return '';
      },
    },
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
    },
    calendar: {
      orient: 'vertical',
      range: year.toString(),
      cellSize: [25, 25], // Set fixed width and height for each day cell
      yearLabel: { show: false },
      dayLabel: {
        firstDay: 1,
        nameMap: 'en',
      },
      monthLabel: {
        nameMap: 'en',
        margin: 10,
      },
      left: 20,
      top: 20,
      right: 20,
      bottom: 20,
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: data,
      },
    ],
  };

  return <EChartsBase option={option} style={calendarStyle} className={className} theme={theme} />;
};
