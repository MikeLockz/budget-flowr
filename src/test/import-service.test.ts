import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { importCSVFile } from '../lib/import/import-service';
import * as importService from '../lib/import/import-service';
import * as transactionMapper from '../lib/import/transaction-mapper';
import { transactionRepository } from '../lib/repositories';

vi.mock('../lib/import/import-service', () => ({
  parseCSVForMapping: vi.fn(),
  importCSVFile: vi.fn()
}));

vi.mock('../lib/import/transaction-mapper', () => ({
  mapToTransactions: vi.fn()
}));

vi.mock('../lib/repositories', () => ({
  transactionRepository: {
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
      for (const transaction of transactions) {
        const id = await transactionRepository.add(transaction);
        insertedIds.push(id);
      }
      return insertedIds;
    });
    
    const result = await importService.importCSVFile(mockFile);
    
    expect(importService.parseCSVForMapping).toHaveBeenCalledWith(mockFile);
    expect(transactionMapper.mapToTransactions).toHaveBeenCalled();
    expect(transactionRepository.add).toHaveBeenCalledTimes(2);
    expect(result).toEqual(['inserted-id-1', 'inserted-id-2']);
  });
  
  it('should handle errors during import', async () => {
    (importService.parseCSVForMapping as unknown as Mock).mockRejectedValue(new Error('Parse error'));
    
    const mockFile = new File([SAMPLE_CSV_CONTENT], 'test.csv', { type: 'text/csv' });
    
    (importService.importCSVFile as unknown as Mock).mockImplementation(async (file: File) => {
      const parsedData = await importService.parseCSVForMapping(file);
      const transactions = transactionMapper.mapToTransactions(parsedData.allData);
      const insertedIds: string[] = [];
      for (const transaction of transactions) {
        const id = await transactionRepository.add(transaction);
        insertedIds.push(id);
      }
      return insertedIds;
    });
    
    await expect(importService.importCSVFile(mockFile)).rejects.toThrow('Parse error');
    expect(transactionRepository.add).not.toHaveBeenCalled();
  });
});
