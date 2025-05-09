import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dashboard } from '../pages/dashboard';
import { useTransactionData } from '../hooks/use-transactions';
import { FilterProvider } from '../contexts/FilterContext';
import { formatCurrency } from '../lib/utils';

// Mock the useTransactions and useTransactionData hooks
vi.mock('../hooks/use-transactions', () => ({
  useTransactions: vi.fn(),
  useTransactionData: vi.fn(() => ({
    transactions: [],
    categoryChartData: { categories: [], barChartData: [], pieChartData: [] },
    isLoading: false,
  })),
}));

// Mock the chart components
vi.mock('../components/charts/echarts-base', () => ({
  EChartsBase: ({ style, className }: { style?: React.CSSProperties; className?: string }) => (
    <div data-testid="echarts-base" style={style} className={className}>ECharts Base</div>
  ),
  LineChart: () => <div data-testid="line-chart">Line Chart</div>,
  BarChart: () => <div data-testid="bar-chart">Bar Chart</div>,
  PieChart: () => <div data-testid="pie-chart">Pie Chart</div>,
}));

vi.mock('../components/data-grid/ag-grid-base', () => ({
  AgGridBase: () => <div data-testid="data-grid">Data Grid</div>,
}));

describe('Dashboard component', () => {
  // Sample transaction data for testing
    const mockTransactions = [
      {
        id: 'capital-inflow-1',
        date: '2025-05-01',
        description: 'Salary',
        categoryId: 'income',
        amount: 3000,
        type: 'Capital Inflow',
        status: 'completed',
      },
      {
        id: 'capital-inflow-2',
        date: '2025-05-02',
        description: 'Freelance',
        categoryId: 'income',
        amount: 500,
        type: 'Capital Inflow',
        status: 'completed',
      },
    {
      id: 'true-expense-1',
      date: '2025-05-03',
      description: 'Rent',
      categoryId: 'housing',
      amount: 1200,
      type: 'True Expense',
      status: 'completed',
    },
    {
      id: 'capital-expense-1',
      date: '2025-05-04',
      description: 'Groceries',
      categoryId: 'food',
      amount: 200,
      type: 'Capital Expense',
      status: 'completed',
    },
    {
      id: 'true-expense-2',
      date: '2025-05-05',
      description: 'Utilities',
      categoryId: 'utilities',
      amount: 150,
      type: 'True Expense',
      status: 'completed',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = (ui: React.ReactElement) => {
    const utils = render(<FilterProvider>{ui}</FilterProvider>);
    return {
      ...utils,
      rerender: (newUi: React.ReactElement) => utils.rerender(<FilterProvider>{newUi}</FilterProvider>),
    };
  };

  // Wrap all tests with FilterProvider to avoid useFilterContext errors
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard with title and add transaction button', () => {
    // Mock the useTransactionData hook to return loading state
    (useTransactionData as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      transactions: [],
      categoryChartData: { categories: [], barChartData: [], pieChartData: [] },
      isLoading: true,
    });

    renderWithProvider(<Dashboard />);

    // Check if the dashboard title is rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // Check if the Add Transaction button is rendered
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
  });

  it('displays loading state when transactions are loading', () => {
    // Mock the useTransactionData hook to return loading state
    (useTransactionData as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      transactions: undefined,
      categoryChartData: { categories: [], barChartData: [], pieChartData: [] },
      isLoading: true,
    });

    renderWithProvider(<Dashboard />);

    // Check if loading message is displayed
    expect(screen.getByText('Loading transactions...')).toBeInTheDocument();

    // Summary cards should still be rendered with zero values
    const zeroAmounts = screen.getAllByText(formatCurrency(0));
    expect(zeroAmounts.length).toBe(3); // Income, Expenses, and Balance cards
  });

  it('calculates and displays correct summary data from transactions', () => {
    // Mock the useTransactionData hook to return transaction data
    (useTransactionData as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      transactions: mockTransactions,
      categoryChartData: { categories: [], barChartData: [], pieChartData: [] },
      isLoading: false,
    });

    renderWithProvider(<Dashboard />);

    // Calculate expected values
    const totalIncome = 3500; // 3000 + 500
    const totalExpenses = 1550; // 1200 + 200 + 150
    const balance = totalIncome - totalExpenses; // 1950

    // Check if summary cards display correct values using test ids
    expect(screen.getByTestId('total-income')).toHaveTextContent(formatCurrency(totalIncome));
    expect(screen.getByTestId('total-expenses')).toHaveTextContent(formatCurrency(totalExpenses));
    expect(screen.getByTestId('balance')).toHaveTextContent(formatCurrency(balance));
  });

  it('renders all chart components', () => {
    // Mock the useTransactionData hook to return transaction data
    (useTransactionData as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      transactions: mockTransactions,
      categoryChartData: { categories: [], barChartData: [], pieChartData: [] },
      isLoading: false,
    });

    renderWithProvider(<Dashboard />);

    // Check if all chart components are rendered
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('renders the data grid when not loading', () => {
    // Mock the useTransactionData hook to return transaction data
    (useTransactionData as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      transactions: mockTransactions,
      categoryChartData: { categories: [], barChartData: [], pieChartData: [] },
      isLoading: false,
    });

    renderWithProvider(<Dashboard />);

    // Check if the data grid is rendered
    expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    expect(screen.queryByText('Loading transactions...')).not.toBeInTheDocument();
  });

  it('applies correct CSS classes for positive and negative balance', () => {
    // Test with positive balance
    (useTransactionData as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      transactions: [
        {
          id: 'income-1',
          date: '2025-05-01',
          description: 'Salary',
          categoryId: 'income',
          amount: 3000,
          type: 'Capital Inflow',
          status: 'completed',
        },
        {
          id: 'true-expense-1',
          date: '2025-05-03',
          description: 'Rent',
          categoryId: 'housing',
          amount: 1200,
          type: 'True Expense',
          status: 'completed',
        },
      ],
      categoryChartData: { categories: [], barChartData: [], pieChartData: [] },
      isLoading: false,
    });

    const { rerender } = renderWithProvider(<Dashboard />);

    // Get the balance element
    const positiveBalance = screen.getByText(formatCurrency(1800));
    expect(positiveBalance.className).toContain('text-green-600');

    // Test with negative balance
    (useTransactionData as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      transactions: [
        {
          id: 'income-1',
          date: '2025-05-01',
          description: 'Salary',
          categoryId: 'income',
          amount: 1000,
          type: 'Capital Inflow',
          status: 'completed',
        },
        {
          id: 'true-expense-1',
          date: '2025-05-03',
          description: 'Rent',
          categoryId: 'housing',
          amount: 1500,
          type: 'True Expense',
          status: 'completed',
        },
      ],
      categoryChartData: { categories: [], barChartData: [], pieChartData: [] },
      isLoading: false,
    });

    rerender(<Dashboard />);

    // Get the balance element
    const negativeBalance = screen.getByText(formatCurrency(-500));
    expect(negativeBalance.className).toContain('text-red-600');
  });

  it('handles empty transaction data gracefully', () => {
    // Mock the useTransactionData hook to return empty array
    (useTransactionData as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      transactions: [],
      categoryChartData: { categories: [], barChartData: [], pieChartData: [] },
      isLoading: false,
    });

    renderWithProvider(<Dashboard />);

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
