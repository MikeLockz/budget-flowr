import React, { useRef, useEffect } from 'react';
import { init, getInstanceByDom } from 'echarts';
import type { EChartsOption, ECharts } from 'echarts';

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
    
    if (chartRef.current) {
      chart = getInstanceByDom(chartRef.current) || 
              init(chartRef.current, theme);
      
      // Apply options
      chart.setOption(option, true);
      
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
      chart?.dispose();
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
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: data.map(item => item.name),
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
