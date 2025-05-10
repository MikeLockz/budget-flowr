import { describe, it, expect, vi } from 'vitest';
import { mapToTransactions } from '../lib/import/transaction-mapper';
/**
 * Mock UUID generation for consistent test results
 */
vi.mock('../lib/db', async () => {
  const actual = await vi.importActual('../lib/db');
  return {
    ...actual as object,
    generateUUID: vi.fn().mockReturnValue('test-uuid')
  };
});

describe('Transaction Mapper', () => {
  it('should map CSV data to transactions', () => {
    const csvData = [
      { date: '2025-01-01', description: 'Groceries', amount: '100.00' },
      { date: '2025-01-02', description: 'Rent', amount: '-1000.00' }
    ];
    
    const transactions = mapToTransactions(csvData);
    
    expect(transactions).toHaveLength(2);
    expect(transactions[0]).toEqual({
      id: 'test-uuid',
      date: '2025-01-01',
      description: 'Groceries',
      categoryId: 'uncategorized',
      amount: 100,
      type: 'income',
      status: 'completed',
      accountId: 'default'
    });
    
    expect(transactions[1].type).toBe('expense');
    expect(transactions[1].amount).toBe(-1000);
  });
  
  it('should handle new transaction types from CSV data', () => {
    const csvData = [
      { date: '2025-01-01', description: 'Asset Purchase', amount: '1000.00', type: 'Capital Transfer' },
      { date: '2025-01-02', description: 'Investment', amount: '500.00', type: 'Capital Inflow' },
      { date: '2025-01-03', description: 'Insurance', amount: '200.00', type: 'True Expense' },
      { date: '2025-01-04', description: 'Refund', amount: '50.00', type: 'Reversed Capital Expense' },
      { date: '2025-01-05', description: 'Return', amount: '75.00', type: 'Reversed True Expense' }
    ];
    
    const transactions = mapToTransactions(csvData);
    
    expect(transactions).toHaveLength(5);
    expect(transactions[0].type).toBe('Capital Transfer');
    expect(transactions[1].type).toBe('Capital Inflow');
    expect(transactions[2].type).toBe('True Expense');
    expect(transactions[3].type).toBe('Reversed Capital Expense');
    expect(transactions[4].type).toBe('Reversed True Expense');
  });
  
  it('should handle different field names', () => {
    const csvData = [
      { Date: '2025-01-01', Description: 'Groceries', Amount: '100.00' }
    ];
    
    const transactions = mapToTransactions(csvData);
    
    expect(transactions[0].date).toBe('2025-01-01');
    expect(transactions[0].description).toBe('Groceries');
    expect(transactions[0].amount).toBe(100);
  });
  
  it('should handle missing fields', () => {
    const csvData = [{ someOtherField: 'value' }];
    
    const transactions = mapToTransactions(csvData);
    
    expect(transactions[0].description).toBe('Imported Transaction');
    expect(transactions[0].amount).toBe(0);
  });
});
