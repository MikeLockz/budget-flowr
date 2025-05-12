import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { db } from '../lib/db';
import { isDuplicateTransaction, updateDuplicateTransaction } from '../lib/import/transaction-deduplication';

// Mock the database and repositories
vi.mock('../lib/db', () => ({
  db: {
    transactions: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn(),
          count: vi.fn()
        })
      })
    }
  }
}));

// Mock the transactionRepository for update tests
vi.mock('../lib/repositories', () => ({
  transactionRepository: {
    update: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('Transaction Deduplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isDuplicateTransaction', () => {
    it('should return isDuplicate: true when a duplicate exists', async () => {
      // Mock the first to return an existing transaction
      const existingTransaction = {
        id: 'existing-id',
        date: '2025-01-01',
        amount: 100,
        description: 'Test Transaction',
        categoryId: 'category-1',
        type: 'expense',
        status: 'completed'
      };
      const mockFirst = vi.fn().mockResolvedValue(existingTransaction);
      const mockEquals = vi.fn().mockReturnValue({ first: mockFirst });
      const mockWhere = vi.fn().mockReturnValue({ equals: mockEquals });
      (db.transactions.where as Mock) = mockWhere;

      const transaction = {
        date: '2025-01-01',
        amount: 100,
        description: 'Test Transaction'
      };

      const result = await isDuplicateTransaction(transaction);

      expect(mockWhere).toHaveBeenCalledWith('[date+amount+description]');
      expect(mockEquals).toHaveBeenCalledWith(['2025-01-01', 100, 'Test Transaction']);
      expect(result.isDuplicate).toBe(true);
      expect(result.existingTransaction).toEqual(existingTransaction);
    });

    it('should return isDuplicate: false when no duplicate exists', async () => {
      // Mock the first to return undefined (no duplicate)
      const mockFirst = vi.fn().mockResolvedValue(undefined);
      const mockEquals = vi.fn().mockReturnValue({ first: mockFirst });
      const mockWhere = vi.fn().mockReturnValue({ equals: mockEquals });
      (db.transactions.where as Mock) = mockWhere;

      const transaction = {
        date: '2025-01-01',
        amount: 100,
        description: 'Test Transaction'
      };

      const result = await isDuplicateTransaction(transaction);

      expect(result.isDuplicate).toBe(false);
      expect(result.existingTransaction).toBeUndefined();
    });
  });

  describe('updateDuplicateTransaction', () => {
    it('should update non-compound-index fields in an existing transaction', async () => {
      // Import the repositories to access the mocked function
      const { transactionRepository } = await import('../lib/repositories');

      const existingTransaction = {
        id: 'existing-id',
        date: '2025-01-01',
        amount: 100,
        description: 'Test Transaction',
        categoryId: 'uncategorized',
        type: 'expense' as const,
        status: 'completed' as const,
        accountId: 'default'
      };

      const newTransaction = {
        date: '2025-01-01',
        amount: 100,
        description: 'Test Transaction',
        categoryId: 'new-category', // Different categoryId
        type: 'income' as const, // Different type
        status: 'completed' as const,
        accountId: 'checking-account' // Different accountId
      };

      const result = await updateDuplicateTransaction(existingTransaction, newTransaction);

      // Verify that transaction was updated with new values except for compound index fields
      expect(transactionRepository.update).toHaveBeenCalledWith({
        id: 'existing-id',
        date: '2025-01-01', // Unchanged (compound index)
        amount: 100, // Unchanged (compound index)
        description: 'Test Transaction', // Unchanged (compound index)
        categoryId: 'new-category', // Updated
        type: 'income', // Updated
        status: 'completed', // Unchanged
        accountId: 'checking-account' // Updated
      });

      // Result should be the updated transaction
      expect(result).toEqual({
        id: 'existing-id',
        date: '2025-01-01',
        amount: 100,
        description: 'Test Transaction',
        categoryId: 'new-category',
        type: 'income',
        status: 'completed',
        accountId: 'checking-account'
      });
    });

    it('should only update fields that have changed', async () => {
      // Import the repositories to access the mocked function
      const { transactionRepository } = await import('../lib/repositories');

      const existingTransaction = {
        id: 'existing-id',
        date: '2025-01-01',
        amount: 100,
        description: 'Test Transaction',
        categoryId: 'category-1',
        type: 'expense' as const,
        status: 'completed' as const,
        accountId: 'default'
      };

      const newTransaction = {
        date: '2025-01-01',
        amount: 100,
        description: 'Test Transaction',
        categoryId: 'category-1', // Same categoryId
        type: 'expense' as const, // Same type
        status: 'pending' as const, // Different status
        accountId: 'default' // Same accountId
      };

      await updateDuplicateTransaction(existingTransaction, newTransaction);

      // Verify that only status was updated
      expect(transactionRepository.update).toHaveBeenCalledWith({
        id: 'existing-id',
        date: '2025-01-01',
        amount: 100,
        description: 'Test Transaction',
        categoryId: 'category-1', // Unchanged
        type: 'expense', // Unchanged
        status: 'pending', // Updated
        accountId: 'default' // Unchanged
      });
    });
  });
});
