import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Transaction } from '../lib/db';

// Mock transaction-deduplication module first
vi.mock('../lib/import/transaction-deduplication', () => ({
  isDuplicateTransaction: vi.fn().mockResolvedValue({ 
    isDuplicate: false, 
    existingTransaction: null 
  }),
  updateDuplicateTransaction: vi.fn().mockResolvedValue(undefined)
}));

// Mock the repositories module
vi.mock('../lib/repositories', () => ({
  transactionRepository: {
    add: vi.fn().mockResolvedValue('mock-transaction-id'),
    bulkAdd: vi.fn().mockResolvedValue(['id1', 'id2'])
  },
  categoryRepository: {
    getAll: vi.fn().mockResolvedValue([]),
    findByName: vi.fn().mockResolvedValue(null),
    add: vi.fn().mockResolvedValue('mock-category-id')
  },
  importRepository: {
    add: vi.fn().mockResolvedValue('mock-import-id')
  },
  importRepo: {
    add: vi.fn().mockResolvedValue('mock-import-id')
  }
}));

// Mock the UUID generation
vi.mock('../lib/db', async (importOriginal) => {
  const originalModule = await importOriginal() as Record<string, unknown>;
  return {
    ...originalModule,
    generateUUID: vi.fn().mockReturnValue('mock-uuid')
  };
});

// Import after mocking
import { processTransactions } from '../lib/import/transaction-import-service';
import { transactionRepository, categoryRepository, importRepo } from '../lib/repositories';
import { isDuplicateTransaction } from '../lib/import/transaction-deduplication';

describe('transaction-import-service', () => {
  // Test data
  const mockTransactions: Transaction[] = [
    { 
      id: 'trans-1',
      date: '2023-01-15', 
      amount: 100, 
      description: 'Test Transaction 1',
      categoryId: 'Groceries',
      type: 'expense',
      status: 'completed',
      accountId: 'default'
    },
    { 
      id: 'trans-2',
      date: '2023-01-20', 
      amount: 250, 
      description: 'Test Transaction 2',
      categoryId: 'Dining',
      type: 'expense',
      status: 'completed',
      accountId: 'default'
    }
  ];

  const fileName = 'test-import.csv';
  const totalRowCount = 5;
  const skippedCount = 3;

  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Fix the mock implementation of getAll
    (categoryRepository.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'existing', name: 'Existing Category' }]);
    
    // Fix the deduplication mock
    (isDuplicateTransaction as ReturnType<typeof vi.fn>).mockResolvedValue({ 
      isDuplicate: false, 
      existingTransaction: null 
    });
  });

  describe('processTransactions', () => {
    it('should process transactions and return a valid import result', async () => {
      // Set up importRepo mock to return a specific ID
      (importRepo.add as ReturnType<typeof vi.fn>).mockResolvedValue('import-123');
      
      // Set up transactionRepository mock for success
      (transactionRepository.add as ReturnType<typeof vi.fn>).mockImplementation((transaction: { id: string }) => {
        return Promise.resolve(transaction.id);
      });
      
      const result = await processTransactions(
        mockTransactions,
        fileName,
        totalRowCount,
        skippedCount
      );
      
      // Verify import session creation
      expect(importRepo.add).toHaveBeenCalled();
      
      // Verify basic return structure
      expect(result).toHaveProperty('insertedIds');
      expect(result).toHaveProperty('duplicateCount');
      expect(result).toHaveProperty('updatedCount');
      expect(result).toHaveProperty('skippedCount');
    });
  });
});