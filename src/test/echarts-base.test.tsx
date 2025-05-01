import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EChartsBase, LineChart, BarChart, PieChart } from '../components/charts/echarts-base';
import type { EChartsOption } from 'echarts';

// Mock the echarts module
vi.mock('echarts', () => ({
  init: vi.fn(),
  getInstanceByDom: vi.fn(),
}));

// Import the mocked module
import * as echarts from 'echarts';

describe('EChartsBase component', () => {
  const mockOption: EChartsOption = {
    title: { text: 'Test Chart' },
    series: [{ type: 'line', data: [1, 2, 3] }]
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock chart instance for each test
    const mockChart = {
      setOption: vi.fn(),
      showLoading: vi.fn(),
      hideLoading: vi.fn(),
      resize: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn(),
    };
    
    // Configure init to return the mock chart
    (echarts.init as any).mockReturnValue(mockChart);
    (echarts.getInstanceByDom as any).mockReturnValue(null);
  });
  
  it('renders with required props', () => {
    const { container } = render(
      <EChartsBase option={mockOption} />
    );
    
    // Check if the component renders
    expect(container).toBeTruthy();
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });
  
  it('applies custom className and style', () => {
    const { container } = render(
      <EChartsBase 
        option={mockOption} 
        className="custom-chart-class"
        style={{ height: '500px' }}
      />
    );
    
    // Check if custom class is applied
    expect(container.firstChild).toHaveClass('custom-chart-class');
    
    // Check if custom style is applied
    const chartDiv = container.firstChild as HTMLElement;
    expect(chartDiv.style.height).toBe('500px');
  });
});

describe('LineChart component', () => {
  it('renders without errors', () => {
    const mockData = [
      { name: 'Series 1', data: [1, 2, 3] },
      { name: 'Series 2', data: [4, 5, 6] }
    ];
    
    const mockXAxisData = ['Jan', 'Feb', 'Mar'];
    
    const { container } = render(
      <LineChart 
        data={mockData} 
        xAxisData={mockXAxisData}
      />
    );
    
    expect(container).toBeTruthy();
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });
});

describe('BarChart component', () => {
  it('renders without errors', () => {
    const mockData = [
      { name: 'Series 1', data: [1, 2, 3] },
      { name: 'Series 2', data: [4, 5, 6] }
    ];
    
    const mockXAxisData = ['Jan', 'Feb', 'Mar'];
    
    const { container } = render(
      <BarChart 
        data={mockData} 
        xAxisData={mockXAxisData}
      />
    );
    
    expect(container).toBeTruthy();
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });
});

describe('PieChart component', () => {
  it('renders without errors', () => {
    const mockData = [
      { name: 'Category 1', value: 30 },
      { name: 'Category 2', value: 70 }
    ];
    
    const { container } = render(
      <PieChart data={mockData} />
    );
    
    expect(container).toBeTruthy();
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });
});
