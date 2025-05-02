import { describe, it, expect, vi } from 'vitest';
import { 
  calculateTotalIncome, 
  calculateTotalExpenses, 
  calculateBalance,
  prepareMonthlyChartData,
  prepareCategoryChartData
} from '../pages/dashboard';
import { Transaction } from '../lib/db';
import { categoryRepository } from '../lib/repositories';

describe('Dashboard utility functions', () => {
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

  describe('calculateTotalIncome', () => {
    it('calculates the total income from transactions', () => {
      const result = calculateTotalIncome(mockTransactions);
      expect(result).toBe(3500); // 3000 + 500
    });

    it('returns 0 when no transactions are provided', () => {
      const result = calculateTotalIncome();
      expect(result).toBe(0);
    });

    it('returns 0 when no income transactions exist', () => {
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
      const incomeOnly = mockTransactions.filter(t => t.type === 'income');
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
    it('returns the expected data structure', async () => {
      // Mock the categoryRepository.getAll method
      vi.spyOn(categoryRepository, 'getAll').mockResolvedValue([
        { id: 'housing', name: 'Housing' },
        { id: 'food', name: 'Food' },
        { id: 'transportation', name: 'Transportation' },
        { id: 'utilities', name: 'Utilities' },
        { id: 'entertainment', name: 'Entertainment' },
      ]);

      const result = await prepareCategoryChartData([
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
      ]);

      // Check categories array
      expect(result.categories).toEqual([
        'Housing', 'Food', 'Transportation', 'Utilities', 'Entertainment'
      ]);

      // Check bar chart data structure
      expect(result.barChartData).toHaveLength(1);
      expect(result.barChartData[0].name).toBe('Expenses');
      expect(result.barChartData[0].data).toHaveLength(5);

      // Check pie chart data structure
      expect(result.pieChartData).toHaveLength(5);
      expect(result.pieChartData[0].name).toBe('Housing');
      expect(result.pieChartData[0].value).toBe(1200);

      // Check that bar chart and pie chart data are consistent
      result.categories.forEach((category, index) => {
        const barValue = result.barChartData[0].data[index];
        const pieItem = result.pieChartData.find(item => item.name === category);
        expect(pieItem?.value).toBe(barValue);
      });
    });
  });
});
