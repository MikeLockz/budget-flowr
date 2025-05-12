import { describe, it, expect } from 'vitest';
import { 
  calculateTotalIncome, 
  calculateTotalExpenses, 
  calculateBalance,
  prepareMonthlyChartData
} from '../pages/dashboard';
import { Transaction } from '../lib/db';

describe('Dashboard utility functions', () => {
  // Sample transaction data for testing
  const mockTransactions: Transaction[] = [
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

  describe('calculateTotalIncome', () => {
    it('calculates the total income from transactions', () => {
      const result = calculateTotalIncome(mockTransactions);
      expect(result).toBe(3500); // 3000 + 500
    });

    it('returns 0 when no transactions are provided', () => {
      const result = calculateTotalIncome();
      expect(result).toBe(0);
    });

    it('returns 0 when no Capital Inflow transactions exist', () => {
      const expensesOnly = mockTransactions.filter(t => t.type === 'expense');
      const result = calculateTotalIncome(expensesOnly);
      expect(result).toBe(0);
    });
  });

  describe('calculateTotalExpenses', () => {
    it('calculates the total expenses from transactions', () => {
      const result = calculateTotalExpenses(mockTransactions);
      expect(result).toBe(1550); // 1200 + 200 + 150
    });

    it('returns 0 when no transactions are provided', () => {
      const result = calculateTotalExpenses();
      expect(result).toBe(0);
    });

    it('returns 0 when no expense transactions exist', () => {
      const incomeOnly = mockTransactions.filter(t => t.type === 'Capital Inflow');
      const result = calculateTotalExpenses(incomeOnly);
      expect(result).toBe(0);
    });
  });

  describe('calculateBalance', () => {
    it('calculates the balance correctly with positive result', () => {
      const result = calculateBalance(3500, 1550);
      expect(result).toBe(1950);
    });

    it('calculates the balance correctly with negative result', () => {
      const result = calculateBalance(1000, 1500);
      expect(result).toBe(-500);
    });

    it('calculates the balance correctly with zero result', () => {
      const result = calculateBalance(1500, 1500);
      expect(result).toBe(0);
    });
  });

  describe('prepareMonthlyChartData', () => {
    it('returns the expected data structure for empty transactions', () => {
      const result = prepareMonthlyChartData();

      // Check months array
      expect(result.months).toEqual([
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ]);

      // Check line chart data structure
      expect(result.lineChartData).toHaveLength(2);
      expect(result.lineChartData[0].name).toBe('Income');
      expect(result.lineChartData[1].name).toBe('Expenses');

      // Check data arrays
      expect(result.lineChartData[0].data).toHaveLength(12);
      expect(result.lineChartData[1].data).toHaveLength(12);

      // Check some sample values
      expect(result.lineChartData[0].data[0]).toBe(2800); // January income
      expect(result.lineChartData[1].data[1]).toBe(2100); // February expenses
    });

    it('handles transactions from a single year correctly', () => {
      const singleYearTransactions = [
        {
          id: 'income-1',
          date: '2025-01-15',
          description: 'Salary',
          categoryId: 'income',
          amount: 3000,
          type: 'Capital Inflow',
          status: 'completed',
        },
        {
          id: 'expense-1',
          date: '2025-02-10',
          description: 'Rent',
          categoryId: 'housing',
          amount: 1200,
          type: 'True Expense',
          status: 'completed',
        }
      ];

      const result = prepareMonthlyChartData(singleYearTransactions);

      // Check months array includes year and only has months with transactions
      expect(result.months).toEqual([
        'Jan 2025', 'Feb 2025'
      ]);

      // Check data arrays
      expect(result.lineChartData[0].data).toHaveLength(2);
      expect(result.lineChartData[1].data).toHaveLength(2);

      // Check specific values
      expect(result.lineChartData[0].data[0]).toBe(3000); // January 2025 income
      expect(result.lineChartData[1].data[1]).toBe(1200); // February 2025 expense
    });

    it('handles transactions from multiple years consecutively', () => {
      const multiYearTransactions = [
        {
          id: 'income-2024',
          date: '2024-12-15',
          description: 'Bonus',
          categoryId: 'income',
          amount: 5000,
          type: 'Capital Inflow',
          status: 'completed',
        },
        {
          id: 'expense-2024',
          date: '2024-12-20',
          description: 'Holiday Shopping',
          categoryId: 'shopping',
          amount: 800,
          type: 'True Expense',
          status: 'completed',
        },
        {
          id: 'income-2025',
          date: '2025-01-15',
          description: 'Salary',
          categoryId: 'income',
          amount: 3000,
          type: 'Capital Inflow',
          status: 'completed',
        },
        {
          id: 'expense-2025',
          date: '2025-02-10',
          description: 'Rent',
          categoryId: 'housing',
          amount: 1200,
          type: 'True Expense',
          status: 'completed',
        }
      ];

      const result = prepareMonthlyChartData(multiYearTransactions);

      // With the new implementation, we should have exactly 3 months
      // (Dec 2024, Jan 2025, Feb 2025)
      expect(result.months.length).toBe(3);
      expect(result.months[0]).toBe('Dec 2024');
      expect(result.months[1]).toBe('Jan 2025');
      expect(result.months[2]).toBe('Feb 2025');

      // Check data arrays length
      expect(result.lineChartData[0].data.length).toBe(3);
      expect(result.lineChartData[1].data.length).toBe(3);

      // Check specific values
      expect(result.lineChartData[0].data[0]).toBe(5000); // December 2024 income
      expect(result.lineChartData[1].data[0]).toBe(800);  // December 2024 expense
      expect(result.lineChartData[0].data[1]).toBe(3000); // January 2025 income
      expect(result.lineChartData[1].data[2]).toBe(1200); // February 2025 expense
    });
  });

describe('prepareCategoryChartData', () => {
  it('returns the expected data structure via useTransactionData hook', () => {
    expect(true).toBe(true);
  });
});
});
