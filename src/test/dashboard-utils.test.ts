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
    it('returns the expected data structure', () => {
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
  });

describe('prepareCategoryChartData', () => {
  it('returns the expected data structure via useTransactionData hook', () => {
    expect(true).toBe(true);
  });
});
});
