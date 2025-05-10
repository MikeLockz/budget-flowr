import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { db } from '../lib/db';
import { isDuplicateTransaction } from '../lib/import/transaction-deduplication';

// Mock the database and repositories
vi.mock('../lib/db', () => ({
  db: {
    transactions: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          count: vi.fn()
        })
      })
    }
  }
}));

// We don't need to mock transactionRepository for these tests

describe('Transaction Deduplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isDuplicateTransaction', () => {
    it('should return true when a duplicate exists', async () => {
      // Mock the count to return 1 (duplicate exists)
      const mockCount = vi.fn().mockResolvedValue(1);
      const mockEquals = vi.fn().mockReturnValue({ count: mockCount });
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
      expect(result).toBe(true);
    });

    it('should return false when no duplicate exists', async () => {
      // Mock the count to return 0 (no duplicate)
      const mockCount = vi.fn().mockResolvedValue(0);
      const mockEquals = vi.fn().mockReturnValue({ count: mockCount });
      const mockWhere = vi.fn().mockReturnValue({ equals: mockEquals });
      (db.transactions.where as Mock) = mockWhere;

      const transaction = {
        date: '2025-01-01',
        amount: 100,
        description: 'Test Transaction'
      };

      const result = await isDuplicateTransaction(transaction);

      expect(result).toBe(false);
    });
  });
});
