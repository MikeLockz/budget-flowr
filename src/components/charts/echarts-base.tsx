import React, { useRef, useEffect } from 'react';
import { init, getInstanceByDom } from 'echarts';
import type { EChartsOption, ECharts } from 'echarts';
import type { CallbackDataParams } from 'echarts/types/dist/shared';
import { formatDollarWholeNumber } from '@/lib/utils';

interface EChartsProps {
  option: EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  theme?: 'light' | 'dark';
  loading?: boolean;
  onChartReady?: (chart: ECharts) => void;
}

/**
 * Base ECharts component that can be used to create various chart types
 */
export const EChartsBase: React.FC<EChartsProps> = ({
  option,
  style,
  className,
  theme = 'light',
  loading = false,
  onChartReady,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initialize chart
    let chart: ECharts | undefined;

    const isTest = process.env.NODE_ENV === 'test';
    const optionWithAnimation = isTest
      ? { ...option, animation: false }
      : option;
    
    if (chartRef.current) {
      chart = getInstanceByDom(chartRef.current) || 
              init(chartRef.current, theme);
      
      // Apply options with animation disabled in test
      chart.setOption(optionWithAnimation, true);
      
      // Handle loading state
      if (loading) {
        chart.showLoading();
      } else {
        chart.hideLoading();
      }
      
      // Notify when chart is ready
      if (onChartReady) {
        onChartReady(chart);
      }
    }
    
    // Handle resize
    function handleResize() {
      if (chart) {
        chart.resize();
      }
    }
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart) {
        try {
          chart.clear();
          chart.dispose();
        } catch {
          // Ignore errors during dispose in test environment
        }
      }
    };
  }, [option, theme, loading, onChartReady]);
  
  return (
    <div 
      ref={chartRef} 
      style={{ width: '100%', height: '100%', minHeight: '300px', ...style }} 
      className={className}
    />
  );
};

/**
 * Line chart component
 */
export const LineChart: React.FC<{
  data: { name: string; data: number[] }[];
  xAxisData: string[];
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  theme?: 'light' | 'dark';
}> = ({ data, xAxisData, title, style, className, theme }) => {
  const option: EChartsOption = {
    title: title ? { text: title } : undefined,
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        if (!Array.isArray(params)) return '';
        const axisValue = (params[0] as { axisValue?: string }).axisValue || '';
        let tooltipText = axisValue + '<br/>';
        let total = 0;
        params.forEach(p => {
          const value = typeof p.data === 'number' ? p.data : 0;
          tooltipText += `${p.seriesName || ''}: ${formatDollarWholeNumber(value)}<br/>`;
          total += value;
        });
        tooltipText += `<b>Total: ${formatDollarWholeNumber(total)}</b>`;
        return tooltipText;
      },
    },
    legend: {
      data: data.map(item => item.name),
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
    },
    yAxis: {
      type: 'value',
    },
    series: data.map(item => ({
      name: item.name,
      type: 'line',
      data: item.data,
    })),
  };
  
  return <EChartsBase option={option} style={style} className={className} theme={theme} />;
};

/**
 * Bar chart component
 */
export const BarChart: React.FC<{
  data: { name: string; data: number[]; itemStyle?: Record<string, unknown> }[];
  xAxisData: string[];
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  theme?: 'light' | 'dark';
  horizontal?: boolean; // New prop for controlling orientation
  onCategoryClick?: (category: string) => void; // Callback for category click
}> = ({ data, xAxisData, title, style, className, theme, horizontal = false, onCategoryClick }) => {
  const option: EChartsOption = {
    title: title ? { text: title } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params) => {
        if (!Array.isArray(params)) return '';
        const item = params[0] as CallbackDataParams;
        const category = horizontal ? 
          (item.name as string) : 
          ((item as CallbackDataParams & { axisValue: string }).axisValue);
        const value = item.value;
        return `${category}: ${formatDollarWholeNumber(value as number)}`;
      },
    },
    legend: {
      show: false,
    },
    grid: {
      left: horizontal ? '15%' : '3%', // More space for category labels on left side
      right: '4%',
      bottom: '3%',
      top: '5%', // Less top spacing since legend is hidden
      containLabel: true,
    },
    // For horizontal bars, swap the axis configuration
    xAxis: horizontal ? {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => formatDollarWholeNumber(value)
      }
    } : {
      type: 'category',
      data: xAxisData,
    },
    yAxis: horizontal ? {
      type: 'category',
      data: xAxisData,
      axisLabel: {
        width: 100,
        overflow: 'truncate',
        margin: 16, // Add more space between labels
      },
      inverse: true, // Display categories from top to bottom (largest at top)
    } : {
      type: 'value',
    },
    series: data.map(item => ({
      name: item.name,
      type: 'bar',
      data: item.data,
      label: {
        show: false
      },
      itemStyle: item.itemStyle || {
        borderRadius: 2
      },
      barWidth: horizontal ? '70%' : undefined, // Thicker bars with more padding
      barGap: '20%', // Space between bars
    })),
  };
  
  const handleChartReady = (chart: ECharts) => {
    if (onCategoryClick) {
      chart.on('click', (params: CallbackDataParams) => {
        // For horizontal bar chart, the category is in the 'name' property
        // For vertical bar chart, the category is in the 'axisValue' property
        const category = horizontal ? 
          (params.name as string) : 
          ((params as CallbackDataParams & { axisValue: string }).axisValue);
        onCategoryClick(category);
      });
    }
  };
  
  return <EChartsBase 
    option={option} 
    style={style} 
    className={className} 
    theme={theme} 
    onChartReady={handleChartReady}
  />;
};

/**
 * Pie chart component
 */
export const PieChart: React.FC<{
  data: { name: string; value: number; itemStyle?: Record<string, unknown> }[];
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  theme?: 'light' | 'dark';
  onCategoryClick?: (category: string) => void; // Callback for category click
}> = ({ data, title, style, className, theme, onCategoryClick }) => {
  const option: EChartsOption = {
    title: title ? { text: title } : undefined,
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (typeof params === 'object' && params !== null) {
          const { seriesName, name, value, percent } = params as { seriesName?: string; name?: string; value?: number; percent?: number };
          return `${seriesName || ''} <br/>${name || ''}: ${formatDollarWholeNumber(value || 0)} (${percent || 0}%)`;
        }
        return '';
      }
    },
    legend: {
      show: false,
    },
    series: [
      {
        name: title || 'Data',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: data.map(item => ({
          ...item,
          // Apply default styles if no itemStyle is provided
          itemStyle: item.itemStyle || {
            borderRadius: 4,
            borderWidth: 2,
          }
        })),
      },
    ],
  };
  
  const handleChartReady = (chart: ECharts) => {
    if (onCategoryClick) {
      chart.on('click', (params: CallbackDataParams) => {
        // For pie chart, the category is in the 'name' property
        const category = params.name as string;
        onCategoryClick(category);
      });
    }
  };
  
  return <EChartsBase 
    option={option} 
    style={style} 
    className={className} 
    theme={theme} 
    onChartReady={handleChartReady}
  />;
};
