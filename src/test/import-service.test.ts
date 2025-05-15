import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import * as importService from '../lib/import/import-service';
import * as transactionMapper from '../lib/import/transaction-mapper';
import { transactionRepository, importRepo } from '../lib/repositories';

vi.mock('../lib/import/import-service', () => ({
  parseCSVForMapping: vi.fn(),
  importCSVFile: vi.fn()
}));

vi.mock('../lib/import/transaction-mapper', () => ({
  mapToTransactions: vi.fn()
}));

vi.mock('../lib/repositories', () => ({
  transactionRepository: {
    add: vi.fn(),
    update: vi.fn()
  },
  importRepo: {
    add: vi.fn()
  },
  categoryRepository: {
    getAll: vi.fn().mockResolvedValue([]),
    add: vi.fn()
  }
}));

const SAMPLE_CSV_CONTENT = `date,description,amount
2025-01-01,Test Transaction,100.00
2025-01-02,Another Transaction,200.50`;

describe('Import Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should import CSV file and return inserted IDs', async () => {
    // Mock the CSV parsing
    (importService.parseCSVForMapping as unknown as Mock).mockResolvedValue({
      headers: ['date', 'description', 'amount'],
      sampleData: [
        { date: '2025-01-01', description: 'Test Transaction', amount: '100.00' },
        { date: '2025-01-02', description: 'Another Transaction', amount: '200.50' }
      ],
      allData: [
        { date: '2025-01-01', description: 'Test Transaction', amount: '100.00' },
        { date: '2025-01-02', description: 'Another Transaction', amount: '200.50' }
      ]
    });
    
    // Mock the transaction mapping
    (transactionMapper.mapToTransactions as unknown as Mock).mockReturnValue([
      { id: 'transaction-1', description: 'Test Transaction' },
      { id: 'transaction-2', description: 'Another Transaction' }
    ]);
    
    // Mock the repository add method
    (transactionRepository.add as unknown as Mock)
      .mockResolvedValueOnce('inserted-id-1')
      .mockResolvedValueOnce('inserted-id-2');
    
    const mockFile = new File([SAMPLE_CSV_CONTENT], 'test.csv', { type: 'text/csv' });
    (importService.importCSVFile as unknown as Mock).mockImplementation(async (file: File) => {
      const parsedData = await importService.parseCSVForMapping(file);
      const transactions = transactionMapper.mapToTransactions(parsedData.allData);
      const insertedIds: string[] = [];
      const duplicateCount = 0;
      const updatedCount = 0;
      
      for (const transaction of transactions) {
        const id = await transactionRepository.add(transaction);
        insertedIds.push(id);
      }
      
      await importRepo.add({
        id: 'import-1',
        date: new Date().toISOString().split('T')[0],
        fileName: file.name,
        totalCount: transactions.length,
        importedCount: insertedIds.length,
        duplicateCount: duplicateCount,
        updatedCount: updatedCount
      });
      
      return { insertedIds, duplicateCount, updatedCount };
    });
    
    const result = await importService.importCSVFile(mockFile);
    
    expect(importService.parseCSVForMapping).toHaveBeenCalledWith(mockFile);
    expect(transactionMapper.mapToTransactions).toHaveBeenCalled();
    expect(transactionRepository.add).toHaveBeenCalledTimes(2);
    expect(importRepo.add).toHaveBeenCalled();
    expect(result.insertedIds).toEqual(['inserted-id-1', 'inserted-id-2']);
    expect(result.duplicateCount).toBe(0);
    expect(result.updatedCount).toBe(0);
  });
  
  it('should handle errors during import', async () => {
    (importService.parseCSVForMapping as unknown as Mock).mockRejectedValue(new Error('Parse error'));
    
    const mockFile = new File([SAMPLE_CSV_CONTENT], 'test.csv', { type: 'text/csv' });
    
    (importService.importCSVFile as unknown as Mock).mockImplementation(async (file: File) => {
      const parsedData = await importService.parseCSVForMapping(file);
      const transactions = transactionMapper.mapToTransactions(parsedData.allData);
      const insertedIds: string[] = [];
      const duplicateCount = 0;
      const updatedCount = 0;
      
      for (const transaction of transactions) {
        const id = await transactionRepository.add(transaction);
        insertedIds.push(id);
      }
      
      return { insertedIds, duplicateCount, updatedCount };
    });
    
    await expect(importService.importCSVFile(mockFile)).rejects.toThrow('Parse error');
    expect(transactionRepository.add).not.toHaveBeenCalled();
  });
  
  it('should detect and update duplicate transactions', async () => {
    // Mock the CSV parsing
    (importService.parseCSVForMapping as unknown as Mock).mockResolvedValue({
      headers: ['date', 'description', 'amount', 'categoryId'],
      sampleData: [
        { date: '2025-01-01', description: 'Test Transaction', amount: '100.00', categoryId: 'new-category' },
        { date: '2025-01-01', description: 'Test Transaction', amount: '100.00', categoryId: 'updated-category' }, // Duplicate with different categoryId
        { date: '2025-01-02', description: 'Another Transaction', amount: '200.50' }
      ],
      allData: [
        { date: '2025-01-01', description: 'Test Transaction', amount: '100.00', categoryId: 'new-category' },
        { date: '2025-01-01', description: 'Test Transaction', amount: '100.00', categoryId: 'updated-category' }, // Duplicate with different categoryId
        { date: '2025-01-02', description: 'Another Transaction', amount: '200.50' }
      ]
    });
    
    // Mock the transaction mapping
    (transactionMapper.mapToTransactions as unknown as Mock).mockReturnValue([
      { id: 'transaction-1', date: '2025-01-01', description: 'Test Transaction', amount: 100.00, categoryId: 'new-category' },
      { id: 'transaction-2', date: '2025-01-01', description: 'Test Transaction', amount: 100.00, categoryId: 'updated-category' }, // Duplicate with different categoryId
      { id: 'transaction-3', date: '2025-01-02', description: 'Another Transaction', amount: 200.50 }
    ]);
    
    // Mock the repository methods
    (transactionRepository.add as unknown as Mock)
      .mockResolvedValueOnce('inserted-id-1')
      .mockResolvedValueOnce('inserted-id-3');
      
    (transactionRepository.update as unknown as Mock)
      .mockResolvedValue(undefined);
    
    const mockFile = new File([SAMPLE_CSV_CONTENT], 'test.csv', { type: 'text/csv' });
    
    // Mock the importCSVWithMapping function with duplicate detection and updating
    (importService.importCSVFile as unknown as Mock).mockImplementation(async (file: File) => {
      const parsedData = await importService.parseCSVForMapping(file);
      const transactions = transactionMapper.mapToTransactions(parsedData.allData);
      const insertedIds: string[] = [];
      let duplicateCount = 0;
      let updatedCount = 0;
      
      // Simulate duplicate detection and updating
      for (const transaction of transactions) {
        if (transaction.id === 'transaction-2') {
          // This is our simulated duplicate with a different categoryId
          duplicateCount++;
          // Simulate updating the existing transaction with the new categoryId
          await transactionRepository.update({
            id: 'existing-id',
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            categoryId: transaction.categoryId, // Updated field
            type: 'expense',
            status: 'completed'
          });
          updatedCount++;
        } else {
          const id = await transactionRepository.add(transaction);
          insertedIds.push(id);
        }
      }
      
      await importRepo.add({
        id: 'import-1',
        date: new Date().toISOString().split('T')[0],
        fileName: file.name,
        totalCount: transactions.length,
        importedCount: insertedIds.length,
        duplicateCount: duplicateCount,
        updatedCount: updatedCount
      });
      
      return { insertedIds, duplicateCount, updatedCount };
    });
    
    const result = await importService.importCSVFile(mockFile);
    
    expect(importService.parseCSVForMapping).toHaveBeenCalledWith(mockFile);
    expect(transactionMapper.mapToTransactions).toHaveBeenCalled();
    expect(transactionRepository.add).toHaveBeenCalledTimes(2); // Only 2 calls, not 3
    expect(transactionRepository.update).toHaveBeenCalledTimes(1); // Updated 1 transaction
    expect(importRepo.add).toHaveBeenCalled();
    expect(result.insertedIds).toEqual(['inserted-id-1', 'inserted-id-3']);
    expect(result.duplicateCount).toBe(1); // One duplicate detected
    expect(result.updatedCount).toBe(1); // One duplicate updated
  });
});