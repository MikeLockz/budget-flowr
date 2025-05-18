import { describe, it, expect, beforeEach } from 'vitest';
import { 
  calculateTotalIncome, 
  calculateTotalExpenses, 
  prepareCategoryChartData,
  prepareMonthlyChartData
} from '../lib/dashboard-utils';

describe('Visualization Data Aggregation', () => {
  let transactions: Array<{ 
    id?: string;
    date?: string;
    description?: string;
    categoryId?: string;
    categoryName?: string;
    amount: number;
    type: string;
    status?: string;
  }>;

  let typeClassifications: { [key: string]: string };

  beforeEach(() => {
    transactions = [
      { 
        id: '1',
        date: '2025-01-01',
        description: 'Salary',
        categoryId: 'income',
        categoryName: 'Income',
        amount: 3000,
        type: 'Capital Inflow',
        status: 'completed'
      },
      { 
        id: '2',
        date: '2025-01-15',
        description: 'Side Gig',
        categoryId: 'income',
        categoryName: 'Income',
        amount: 500,
        type: 'income',
        status: 'completed'
      },
      { 
        id: '3',
        date: '2025-01-05',
        description: 'Rent',
        categoryId: 'housing',
        categoryName: 'Housing',
        amount: 1500,
        type: 'True Expense',
        status: 'completed'
      },
      { 
        id: '4',
        date: '2025-01-10',
        description: 'Groceries',
        categoryId: 'food',
        categoryName: 'Food',
        amount: 250,
        type: 'True Expense',
        status: 'completed'
      },
      { 
        id: '5',
        date: '2025-01-20',
        description: 'Phone',
        categoryId: 'utilities',
        categoryName: 'Utilities',
        amount: 80,
        type: 'True Expense',
        status: 'completed'
      }
    ];

    typeClassifications = {
      'income': 'income',
      'Capital Inflow': 'income',
      'expense': 'expense',
      'True Expense': 'expense',
      'Capital Expense': 'expense',
      'Reversed Capital Expense': 'income',
      'Reversed True Expense': 'income',
      'Capital Transfer': 'transfer'
    };
  });

  describe('calculateTotalIncome', () => {
    it('correctly sums income transactions based on type classifications', () => {
      const result = calculateTotalIncome(transactions, typeClassifications);
      // Should sum: 3000 + 500 = 3500
      expect(result).toBe(3500);
    });

    it('handles transactions with zero amounts correctly', () => {
      const transactionsWithZero = [
        ...transactions,
        { 
          id: '6',
          date: '2025-01-25',
          description: 'Bonus (pending)',
          categoryId: 'income',
          categoryName: 'Income',
          amount: 0, // Zero amount
          type: 'Capital Inflow',
          status: 'pending'
        }
      ];

      const result = calculateTotalIncome(transactionsWithZero, typeClassifications);
      // Should still be 3500 since zero amounts don't affect the sum
      expect(result).toBe(3500);
    });

    it('handles non-numeric amount values correctly', () => {
      const transactionsWithNonNumeric = [
        ...transactions,
        { 
          id: '7',
          date: '2025-01-26',
          description: 'Bad Data',
          categoryId: 'income',
          categoryName: 'Income',
          amount: 'not-a-number',
          type: 'Capital Inflow',
          status: 'completed'
        }
      ];

      const result = calculateTotalIncome(transactionsWithNonNumeric as Array<{ type: string; amount: number }>, typeClassifications);
      // Should still be 3500 since non-numeric amount is skipped
      expect(result).toBe(3500);
    });

    it('correctly handles string amount values that can be converted to numbers', () => {
      const transactionsWithStringAmount = [
        ...transactions,
        { 
          id: '8',
          date: '2025-01-27',
          description: 'String Amount',
          categoryId: 'income',
          categoryName: 'Income',
          amount: '1000',
          type: 'Capital Inflow',
          status: 'completed'
        }
      ];

      const result = calculateTotalIncome(transactionsWithStringAmount as Array<{ type: string; amount: number }>, typeClassifications);
      // Should be 3500 + 1000 = 4500
      expect(result).toBe(4500);
    });

    it('handles reversed transactions correctly', () => {
      const transactionsWithReversals = [
        ...transactions,
        { 
          id: '9',
          date: '2025-01-28',
          description: 'Refund',
          categoryId: 'shopping',
          categoryName: 'Shopping',
          amount: 200,
          type: 'Reversed True Expense', // This should be classified as income
          status: 'completed'
        }
      ];

      const result = calculateTotalIncome(transactionsWithReversals, typeClassifications);
      // Should be 3500 + 200 = 3700
      expect(result).toBe(3700);
    });
  });

  describe('calculateTotalExpenses', () => {
    it('correctly sums expense transactions based on type classifications', () => {
      const result = calculateTotalExpenses(transactions, typeClassifications);
      // Should sum: 1500 + 250 + 80 = 1830
      expect(result).toBe(1830);
    });

    it('handles transactions with zero amounts correctly', () => {
      const transactionsWithZero = [
        ...transactions,
        { 
          id: '6',
          date: '2025-01-25',
          description: 'Planned Purchase',
          categoryId: 'shopping',
          categoryName: 'Shopping',
          amount: 0, // Zero amount
          type: 'True Expense',
          status: 'upcoming'
        }
      ];

      const result = calculateTotalExpenses(transactionsWithZero, typeClassifications);
      // Should still be 1830 since zero amounts don't affect the sum
      expect(result).toBe(1830);
    });
  });

  describe('prepareCategoryChartData', () => {
    it('correctly aggregates expenses by category', () => {
      const categories = ['Income', 'Housing', 'Food', 'Utilities', 'Shopping'];
      
      const result = prepareCategoryChartData(transactions, categories, typeClassifications);
      
      // Check the data structure
      expect(result.categories).toBeDefined();
      expect(result.barChartData).toBeDefined();
      expect(result.pieChartData).toBeDefined();
      
      // Should have data for each non-zero category
      expect(result.categories).toContain('Housing');
      expect(result.categories).toContain('Food');
      expect(result.categories).toContain('Utilities');
      
      // Should not include income in expense categories
      expect(result.categories).not.toContain('Income');
      
      // Verify amounts
      const expenseData = result.barChartData[0].data;
      
      // Find index for each category
      const housingIndex = result.categories.indexOf('Housing');
      const foodIndex = result.categories.indexOf('Food');
      const utilitiesIndex = result.categories.indexOf('Utilities');
      
      // Check amounts
      expect(expenseData[housingIndex]).toBe(1500);
      expect(expenseData[foodIndex]).toBe(250);
      expect(expenseData[utilitiesIndex]).toBe(80);
    });

    it('filters out transactions not classified as expenses', () => {
      const categories = ['Income', 'Housing', 'Food', 'Utilities', 'Transfer'];
      
      // Add a Capital Transfer transaction which shouldn't be counted as expense
      const transactionsWithTransfer = [
        ...transactions,
        { 
          id: '10',
          date: '2025-01-30',
          description: 'Move to Savings',
          categoryId: 'transfer',
          categoryName: 'Transfer',
          amount: 500,
          type: 'Capital Transfer', // This is classified as 'transfer', not 'expense'
          status: 'completed'
        }
      ];
      
      const result = prepareCategoryChartData(transactionsWithTransfer, categories, typeClassifications);
      
      // Should not include transfers in expense categories
      const transferIndex = result.categories.indexOf('Transfer');
      expect(transferIndex).toBe(-1); // Should not be found
    });

    it('correctly maps transactions without a category name', () => {
      // Create a transaction with the categoryName explicitly set to "Uncategorized"
      const transactionsWithExplicitUncategorized = [
        ...transactions,
        { 
          id: '11',
          date: '2025-01-31',
          description: 'Misc Expense',
          categoryId: 'unknown',
          categoryName: 'Uncategorized', // Explicitly set to Uncategorized
          amount: 45,
          type: 'True Expense',
          status: 'completed'
        }
      ];
      
      // Include the Uncategorized category in the list
      const categories = ['Income', 'Housing', 'Food', 'Utilities', 'Uncategorized'];
      const result = prepareCategoryChartData(transactionsWithExplicitUncategorized, categories, typeClassifications);
      
      // Should contain the Uncategorized category
      expect(result.categories).toContain('Uncategorized');
      
      // Find index for Uncategorized
      const uncategorizedIndex = result.categories.indexOf('Uncategorized');
      expect(result.barChartData[0].data[uncategorizedIndex]).toBe(45);
    });
  });
  
  describe('prepareMonthlyChartData', () => {
    it('correctly formats transaction data by month', () => {
      // Add transactions from different months
      const multiMonthTransactions = [
        // January
        { 
          date: '2025-01-15',
          description: 'January Salary',
          amount: 3000,
          type: 'Capital Inflow',
        },
        { 
          date: '2025-01-20',
          description: 'January Rent',
          amount: 1500,
          type: 'True Expense',
        },
        // February
        { 
          date: '2025-02-15',
          description: 'February Salary',
          amount: 3000,
          type: 'Capital Inflow',
        },
        { 
          date: '2025-02-20',
          description: 'February Rent',
          amount: 1500,
          type: 'True Expense',
        },
        // March
        { 
          date: '2025-03-15',
          description: 'March Salary',
          amount: 3500, // Increased salary
          type: 'Capital Inflow',
        },
        { 
          date: '2025-03-20',
          description: 'March Rent',
          amount: 1500,
          type: 'True Expense',
        },
        { 
          date: '2025-03-25',
          description: 'March Utilities',
          amount: 200,
          type: 'True Expense',
        },
      ];
      
      const result = prepareMonthlyChartData(multiMonthTransactions, typeClassifications);
      
      // Check structure
      expect(result.months).toHaveLength(3); // Jan, Feb, Mar
      expect(result.lineChartData).toHaveLength(2); // Income, Expenses
      expect(result.lineChartData[0].name).toBe('Income');
      expect(result.lineChartData[1].name).toBe('Expenses');
      
      // Check data
      expect(result.months[0]).toBe('Jan 2025');
      expect(result.months[1]).toBe('Feb 2025');
      expect(result.months[2]).toBe('Mar 2025');
      
      // Check income values
      expect(result.lineChartData[0].data[0]).toBe(3000); // Jan
      expect(result.lineChartData[0].data[1]).toBe(3000); // Feb
      expect(result.lineChartData[0].data[2]).toBe(3500); // Mar
      
      // Check expense values
      expect(result.lineChartData[1].data[0]).toBe(1500); // Jan
      expect(result.lineChartData[1].data[1]).toBe(1500); // Feb
      expect(result.lineChartData[1].data[2]).toBe(1700); // Mar (1500 + 200)
    });

    it('ignores transactions with unclassified types', () => {
      const transactionsWithUnclassified = [
        { 
          date: '2025-01-15',
          description: 'Income',
          amount: 3000,
          type: 'Capital Inflow', // Classified as income
        },
        { 
          date: '2025-01-20',
          description: 'Expense',
          amount: 1500,
          type: 'True Expense', // Classified as expense
        },
        { 
          date: '2025-01-25',
          description: 'Transfer',
          amount: 1000,
          type: 'Capital Transfer', // Classified as transfer, not income or expense
        },
        { 
          date: '2025-01-30',
          description: 'Unknown',
          amount: 500,
          type: 'Unknown Type', // Not classified
        },
      ];
      
      const result = prepareMonthlyChartData(transactionsWithUnclassified, typeClassifications);
      
      // Only income and expense should be counted, not transfer or unknown
      expect(result.lineChartData[0].data[0]).toBe(3000); // Income
      expect(result.lineChartData[1].data[0]).toBe(1500); // Expense
    });

    it('handles zero-amount transactions properly', () => {
      const transactionsWithZeros = [
        { 
          date: '2025-01-15',
          description: 'Income',
          amount: 3000,
          type: 'Capital Inflow',
        },
        { 
          date: '2025-01-20',
          description: 'Planned Expense',
          amount: 0, // Zero amount
          type: 'True Expense',
        },
      ];
      
      const result = prepareMonthlyChartData(transactionsWithZeros, typeClassifications);
      
      expect(result.lineChartData[0].data[0]).toBe(3000); // Income
      expect(result.lineChartData[1].data[0]).toBe(0);    // Expense (zero)
    });
  });
});