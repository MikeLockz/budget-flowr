import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dashboard } from '../pages/dashboard';
import { useTransactions } from '../hooks/use-transactions';
import { formatCurrency } from '../lib/utils';
import { Transaction } from '../lib/db';

// Mock the useTransactions hook
vi.mock('../hooks/use-transactions', () => ({
  useTransactions: vi.fn(),
}));

// Mock the chart components
vi.mock('../components/charts/echarts-base', () => ({
  LineChart: () => <div data-testid="line-chart">Line Chart</div>,
  BarChart: () => <div data-testid="bar-chart">Bar Chart</div>,
  PieChart: () => <div data-testid="pie-chart">Pie Chart</div>,
}));

// Mock the data grid component
vi.mock('../components/data-grid/ag-grid-base', () => ({
  ExampleDataGrid: () => <div data-testid="data-grid">Data Grid</div>,
}));

describe('Dashboard component', () => {
  // Sample transaction data for testing
  const mockTransactions: Transaction[] = [
    {
      id: 'income-1',
      date: '2025-05-01',
      description: 'Salary',
      categoryId: 'income',
      amount: 3000,
      type: 'income',
      status: 'completed',
    },
    {
      id: 'income-2',
      date: '2025-05-02',
      description: 'Freelance',
      categoryId: 'income',
      amount: 500,
      type: 'income',
      status: 'completed',
    },
    {
      id: 'expense-1',
      date: '2025-05-03',
      description: 'Rent',
      categoryId: 'housing',
      amount: 1200,
      type: 'expense',
      status: 'completed',
    },
    {
      id: 'expense-2',
      date: '2025-05-04',
      description: 'Groceries',
      categoryId: 'food',
      amount: 200,
      type: 'expense',
      status: 'completed',
    },
    {
      id: 'expense-3',
      date: '2025-05-05',
      description: 'Utilities',
      categoryId: 'utilities',
      amount: 150,
      type: 'expense',
      status: 'completed',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard with title and add transaction button', () => {
    // Mock the useTransactions hook to return loading state
    (useTransactions as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [],
      isLoading: true,
    });

    render(<Dashboard />);

    // Check if the dashboard title is rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Check if the Add Transaction button is rendered
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
  });

  it('displays loading state when transactions are loading', () => {
    // Mock the useTransactions hook to return loading state
    (useTransactions as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<Dashboard />);

    // Check if loading message is displayed
    expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
    
    // Summary cards should still be rendered with zero values
    const zeroAmounts = screen.getAllByText(formatCurrency(0));
    expect(zeroAmounts.length).toBe(3); // Income, Expenses, and Balance cards
  });

  it('calculates and displays correct summary data from transactions', () => {
    // Mock the useTransactions hook to return transaction data
    (useTransactions as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });

    render(<Dashboard />);

    // Calculate expected values
    const totalIncome = 3500; // 3000 + 500
    const totalExpenses = 1550; // 1200 + 200 + 150
    const balance = totalIncome - totalExpenses; // 1950

    // Check if summary cards display correct values
    expect(screen.getByText(formatCurrency(totalIncome))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(totalExpenses))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(balance))).toBeInTheDocument();
  });

  it('renders all chart components', () => {
    // Mock the useTransactions hook to return transaction data
    (useTransactions as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });

    render(<Dashboard />);

    // Check if all chart components are rendered
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('renders the data grid when not loading', () => {
    // Mock the useTransactions hook to return transaction data
    (useTransactions as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });

    render(<Dashboard />);

    // Check if the data grid is rendered
    expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    expect(screen.queryByText('Loading transactions...')).not.toBeInTheDocument();
  });

  it('applies correct CSS classes for positive and negative balance', () => {
    // Test with positive balance
    (useTransactions as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [
        {
          id: 'income-1',
          date: '2025-05-01',
          description: 'Salary',
          categoryId: 'income',
          amount: 3000,
          type: 'income',
          status: 'completed',
        },
        {
          id: 'expense-1',
          date: '2025-05-03',
          description: 'Rent',
          categoryId: 'housing',
          amount: 1200,
          type: 'expense',
          status: 'completed',
        },
      ],
      isLoading: false,
    });

    const { rerender } = render(<Dashboard />);
    
    // Get the balance element
    const positiveBalance = screen.getByText(formatCurrency(1800));
    expect(positiveBalance.className).toContain('text-green-600');
    
    // Test with negative balance
    (useTransactions as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [
        {
          id: 'income-1',
          date: '2025-05-01',
          description: 'Salary',
          categoryId: 'income',
          amount: 1000,
          type: 'income',
          status: 'completed',
        },
        {
          id: 'expense-1',
          date: '2025-05-03',
          description: 'Rent',
          categoryId: 'housing',
          amount: 1500,
          type: 'expense',
          status: 'completed',
        },
      ],
      isLoading: false,
    });
    
    rerender(<Dashboard />);
    
    // Get the balance element
    const negativeBalance = screen.getByText(formatCurrency(-500));
    expect(negativeBalance.className).toContain('text-red-600');
  });

  it('handles empty transaction data gracefully', () => {
    // Mock the useTransactions hook to return empty array
    (useTransactions as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<Dashboard />);

    // Summary cards should display zero values
    const zeroAmounts = screen.getAllByText(formatCurrency(0));
    expect(zeroAmounts.length).toBe(3); // Income, Expenses, and Balance cards
    
    // Charts and data grid should still be rendered
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('data-grid')).toBeInTheDocument();
  });
});
