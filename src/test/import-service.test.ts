import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { importCSVFile } from '../lib/import/import-service';
import * as csvParser from '../lib/import/csv-parser';
import * as transactionMapper from '../lib/import/transaction-mapper';
import { transactionRepository } from '../lib/repositories';

// Mock dependencies
vi.mock('../lib/import/csv-parser', () => ({
  parseCSV: vi.fn()
}));

vi.mock('../lib/import/transaction-mapper', () => ({
  mapToTransactions: vi.fn()
}));

vi.mock('../lib/repositories', () => ({
  transactionRepository: {
    add: vi.fn()
  }
}));

describe('Import Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should import CSV file and return inserted IDs', async () => {
    // Mock the CSV parsing
    (csvParser.parseCSV as unknown as Mock).mockResolvedValue([
      { date: '2025-01-01', description: 'Test', amount: '100.00' }
    ]);
    
    // Mock the transaction mapping
    (transactionMapper.mapToTransactions as unknown as Mock).mockReturnValue([
      { id: 'transaction-1', description: 'Test' },
      { id: 'transaction-2', description: 'Test 2' }
    ]);
    
    // Mock the repository add method
    (transactionRepository.add as unknown as Mock)
      .mockResolvedValueOnce('inserted-id-1')
      .mockResolvedValueOnce('inserted-id-2');
    
    const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
    const result = await importCSVFile(mockFile);
    
    expect(csvParser.parseCSV).toHaveBeenCalledWith(mockFile);
    expect(transactionMapper.mapToTransactions).toHaveBeenCalled();
    expect(transactionRepository.add).toHaveBeenCalledTimes(2);
    expect(result).toEqual(['inserted-id-1', 'inserted-id-2']);
  });
  
  it('should handle errors during import', async () => {
    (csvParser.parseCSV as unknown as Mock).mockRejectedValue(new Error('Parse error'));
    
    const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
    
    await expect(importCSVFile(mockFile)).rejects.toThrow('Parse error');
    expect(transactionRepository.add).not.toHaveBeenCalled();
  });
});
