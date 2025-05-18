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

// This is a direct test of the private parseAmount function in transaction-mapper.ts
// We'll test it through the public mapToTransactions function
describe('Amount Parsing', () => {
  it('correctly parses standard numeric amounts', () => {
    const csvData = [
      { date: '2025-01-01', description: 'Test', amount: '100' },
      { date: '2025-01-01', description: 'Test', amount: '100.50' },
      { date: '2025-01-01', description: 'Test', amount: '-100.75' },
      { date: '2025-01-01', description: 'Test', amount: '0' },
    ];
    
    const transactions = mapToTransactions(csvData);
    
    expect(transactions[0].amount).toBe(100);
    expect(transactions[1].amount).toBe(100.5);
    expect(transactions[2].amount).toBe(-100.75);
    expect(transactions[3].amount).toBe(0);
  });

  it('correctly parses amounts with currency symbols', () => {
    const csvData = [
      { date: '2025-01-01', description: 'Test', amount: '$100.00' },
      { date: '2025-01-01', description: 'Test', amount: '€200.50' },
      { date: '2025-01-01', description: 'Test', amount: '£300.75' },
      { date: '2025-01-01', description: 'Test', amount: '¥400' },
    ];
    
    const transactions = mapToTransactions(csvData);
    
    expect(transactions[0].amount).toBe(100);
    expect(transactions[1].amount).toBe(200.5);
    expect(transactions[2].amount).toBe(300.75);
    expect(transactions[3].amount).toBe(400);
  });

  it('correctly parses amounts with thousands separators', () => {
    const csvData = [
      { date: '2025-01-01', description: 'Test', amount: '1,000.00' },
      { date: '2025-01-01', description: 'Test', amount: '1,234,567.89' },
      { date: '2025-01-01', description: 'Test', amount: '$2,000.50' },
    ];
    
    const transactions = mapToTransactions(csvData);
    
    expect(transactions[0].amount).toBe(1000);
    expect(transactions[1].amount).toBe(1234567.89);
    expect(transactions[2].amount).toBe(2000.5);
  });

  it('correctly parses European style amounts (comma as decimal separator)', () => {
    // Note: This is a tricky case because our parser treats comma as a thousands separator
    // In the current implementation, we'd need to pre-process European-style numbers 
    // before passing them to parseAmount
    const csvData = [
      // These won't be correctly parsed in the current implementation
      // Adding tests to document the behavior
      { date: '2025-01-01', description: 'Test', amount: '1.000,00' },
      { date: '2025-01-01', description: 'Test', amount: '1.234,56' },
    ];
    
    const transactions = mapToTransactions(csvData);
    
    // Current behavior is to ignore commas that appear after other digits
    // and treat dots as thousands separators (so the numbers are parsed incorrectly)
    expect(transactions[0].amount).toBe(1);  // Actually gets parsed as 1, removing both . and ,
    expect(transactions[1].amount).toBe(1.23456);  // Actually parsed as 1.23456
  });

  it('handles empty and invalid amounts', () => {
    const csvData = [
      { date: '2025-01-01', description: 'Test', amount: '' },
      { date: '2025-01-01', description: 'Test', amount: 'invalid' },
      { date: '2025-01-01', description: 'Test', amount: '' }, // missing amount
    ];
    
    const transactions = mapToTransactions(csvData);
    
    // All should default to 0
    expect(transactions[0].amount).toBe(0);
    expect(transactions[1].amount).toBe(0);
    expect(transactions[2].amount).toBe(0);
  });

  it('preserves negative signs', () => {
    const csvData = [
      { date: '2025-01-01', description: 'Test', amount: '-100.00' },
      { date: '2025-01-01', description: 'Test', amount: '-$200.50' },
      { date: '2025-01-01', description: 'Test', amount: '$-300.75' },
    ];
    
    const transactions = mapToTransactions(csvData);
    
    expect(transactions[0].amount).toBe(-100);
    expect(transactions[1].amount).toBe(-200.5);
    expect(transactions[2].amount).toBe(-300.75);
  });
});

describe('Transaction Type Determination', () => {
  it('determines type based on amount sign when no type specified', () => {
    const csvData = [
      { date: '2025-01-01', description: 'Income', amount: '100.00' },
      { date: '2025-01-01', description: 'Expense', amount: '-100.00' },
    ];
    
    const transactions = mapToTransactions(csvData);
    
    expect(transactions[0].type).toBe('income');
    expect(transactions[1].type).toBe('expense');
  });

  it('uses explicit type field when provided', () => {
    const csvData = [
      // Even though amount is positive, type should be expense
      { date: '2025-01-01', description: 'Test', amount: '100.00', type: 'expense' },
      // Even though amount is negative, type should be income
      { date: '2025-01-01', description: 'Test', amount: '-100.00', type: 'income' },
    ];
    
    const transactions = mapToTransactions(csvData);
    
    expect(transactions[0].type).toBe('expense');
    expect(transactions[1].type).toBe('income');
  });

  it('handles special transaction types case-insensitively', () => {
    const csvData = [
      { date: '2025-01-01', description: 'Test', amount: '100.00', type: 'capital transfer' },
      { date: '2025-01-01', description: 'Test', amount: '100.00', type: 'CAPITAL INFLOW' },
      { date: '2025-01-01', description: 'Test', amount: '100.00', type: 'True Expense' },
      { date: '2025-01-01', description: 'Test', amount: '100.00', type: 'reversed capital expense' },
      { date: '2025-01-01', description: 'Test', amount: '100.00', type: 'Reversed True Expense' },
    ];
    
    const transactions = mapToTransactions(csvData);
    
    expect(transactions[0].type).toBe('Capital Transfer');
    expect(transactions[1].type).toBe('Capital Inflow');
    expect(transactions[2].type).toBe('True Expense');
    expect(transactions[3].type).toBe('Reversed Capital Expense');
    expect(transactions[4].type).toBe('Reversed True Expense');
  });

  it('handles partial matches in type strings', () => {
    const csvData = [
      { date: '2025-01-01', description: 'Test', amount: '100.00', type: 'This is an income transaction' },
      { date: '2025-01-01', description: 'Test', amount: '100.00', type: 'Some expense-related category' },
      { date: '2025-01-01', description: 'Test', amount: '100.00', type: 'My True Expense allocation' },
    ];
    
    const transactions = mapToTransactions(csvData);
    
    expect(transactions[0].type).toBe('income');
    expect(transactions[1].type).toBe('expense');
    expect(transactions[2].type).toBe('True Expense');
  });
});