import React, { useRef, useEffect } from 'react';
import { init, getInstanceByDom } from 'echarts';
import type { EChartsOption, ECharts } from 'echarts';
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
        // params is an array of series data points
        if (!Array.isArray(params)) return '';
        const axisValue = (params[0] as { axisValue?: string }).axisValue || '';
        let tooltipText = axisValue + '<br/>';
        let total = 0;
        params.forEach(p => {
          const value = typeof p.data === 'number' ? p.data : 0;
          tooltipText += `${p.seriesName}: ${formatDollarWholeNumber(value)}<br/>`;
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
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params) => {
        if (!Array.isArray(params)) return '';
        const axisValue = (params[0] as { axisValue?: string }).axisValue || '';
        let tooltipText = axisValue + '<br/>';
        let total = 0;
        params.forEach(p => {
          const value = typeof p.data === 'number' ? p.data : 0;
          tooltipText += `${p.seriesName}: ${formatDollarWholeNumber(value)}<br/>`;
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
      data: xAxisData,
    },
    yAxis: {
      type: 'value',
    },
    series: data.map(item => ({
      name: item.name,
      type: 'bar',
      data: item.data,
    })),
  };
  
  return <EChartsBase option={option} style={style} className={className} theme={theme} />;
};

/**
 * Pie chart component
 */
export const PieChart: React.FC<{
  data: { name: string; value: number }[];
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  theme?: 'light' | 'dark';
}> = ({ data, title, style, className, theme }) => {
  const option: EChartsOption = {
    title: title ? { text: title } : undefined,
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (typeof params === 'object' && params !== null) {
          const { seriesName, name, value, percent } = params as { seriesName?: string; name?: string; value?: number; percent?: number };
          return `${seriesName} <br/>${name}: ${formatDollarWholeNumber(value)} (${percent}%)`;
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
        data: data,
      },
    ],
  };
  
  return <EChartsBase option={option} style={style} className={className} theme={theme} />;
};
