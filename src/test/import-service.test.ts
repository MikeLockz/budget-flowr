import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FieldMapping } from '../lib/import/field-mapping-types';
import { Transaction } from '../lib/db';
import 'fake-indexeddb/auto';

// Mock dependencies before importing the subject under test
vi.mock('../lib/import/csv-file-parser', () => ({
  parseCSVFile: vi.fn()
}));

vi.mock('../lib/import/field-mapping-service', () => ({
  generatePreview: vi.fn(),
  applyMapping: vi.fn()
}));

vi.mock('../lib/import/transaction-import-service', () => ({
  processTransactions: vi.fn()
}));

// Import modules after mocking
import * as csvFileParser from '../lib/import/csv-file-parser';
import * as fieldMappingService from '../lib/import/field-mapping-service';
import * as transactionImportService from '../lib/import/transaction-import-service';
import { 
  parseCSVForMapping,
  previewMappedTransactions,
  importCSVWithMapping,
  importCSVFile,
  findDuplicateTransactions, 
  removeDuplicateTransactions, 
  mergeDuplicateTransactions 
} from '../lib/import/import-service';

describe('Import Service', () => {
  // Test data
  const mockFile = new File(['test,csv,content'], 'test.csv', { type: 'text/csv' });
  
  const mockHeaders = ['date', 'description', 'amount'];
  const mockSampleData = [
    { date: '2025-01-01', description: 'Test Transaction', amount: '100.00' },
    { date: '2025-01-02', description: 'Another Transaction', amount: '200.50' }
  ];
  const mockAllData = [
    { date: '2025-01-01', description: 'Test Transaction', amount: '100.00' },
    { date: '2025-01-02', description: 'Another Transaction', amount: '200.50' },
    { date: '2025-01-03', description: 'Third Transaction', amount: '300.75' }
  ];
  
  const mockCSVData = {
    headers: mockHeaders,
    sampleData: mockSampleData,
    allData: mockAllData
  };
  
  const mockMapping: FieldMapping = {
    mappings: {
      date: 'date',
      description: 'description',
      amount: 'amount',
      type: null,
      categoryId: null,
      status: null,
      accountId: null
    },
    options: {
      dateFormat: 'YYYY-MM-DD',
      negativeAmountIsExpense: true,
      invertAmount: false
    }
  };
  
  const mockTransactions: Transaction[] = [
    {
      id: 'transaction-1',
      date: '2025-01-01',
      description: 'Test Transaction',
      amount: 100.00,
      categoryId: 'uncategorized',
      type: 'income',
      status: 'completed',
      accountId: 'default'
    },
    {
      id: 'transaction-2',
      date: '2025-01-02',
      description: 'Another Transaction',
      amount: 200.50,
      categoryId: 'uncategorized',
      type: 'income',
      status: 'completed',
      accountId: 'default'
    }
  ];
  
  const mockImportResult = {
    insertedIds: ['id-1', 'id-2'],
    duplicateCount: 0,
    updatedCount: 0,
    skippedCount: 0
  };

  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup mock implementations
    (csvFileParser.parseCSVFile as ReturnType<typeof vi.fn>).mockResolvedValue(mockCSVData);
    (fieldMappingService.generatePreview as ReturnType<typeof vi.fn>).mockReturnValue({
      rawData: mockSampleData,
      mappedTransactions: mockTransactions,
      skippedRows: []
    });
    (fieldMappingService.applyMapping as ReturnType<typeof vi.fn>).mockReturnValue({
      transactions: mockTransactions,
      skippedRows: []
    });
    (transactionImportService.processTransactions as ReturnType<typeof vi.fn>).mockResolvedValue(mockImportResult);
  });

  describe('parseCSVForMapping', () => {
    it('should parse a CSV file and return headers and data samples', async () => {
      const result = await parseCSVForMapping(mockFile);
      
      expect(csvFileParser.parseCSVFile).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockCSVData);
    });
    
    it('should propagate errors from parseCSVFile', async () => {
      const error = new Error('Parsing error');
      (csvFileParser.parseCSVFile as ReturnType<typeof vi.fn>).mockRejectedValue(error);
      
      await expect(parseCSVForMapping(mockFile)).rejects.toThrow('Parsing error');
    });
  });

  describe('previewMappedTransactions', () => {
    it('should generate preview data from CSV data and mapping', () => {
      const result = previewMappedTransactions(mockCSVData, mockMapping);
      
      expect(fieldMappingService.generatePreview).toHaveBeenCalledWith(
        mockSampleData, 
        mockMapping
      );
      
      expect(result).toHaveProperty('mapping', mockMapping);
    });
  });

  describe('importCSVWithMapping', () => {
    it('should import CSV data with the specified mapping', async () => {
      const result = await importCSVWithMapping(mockFile, mockMapping);
      
      // Verify parseCSVForMapping was called
      expect(csvFileParser.parseCSVFile).toHaveBeenCalledWith(mockFile);
      
      // Verify mapping was applied
      expect(fieldMappingService.applyMapping).toHaveBeenCalledWith(
        mockAllData,
        mockMapping
      );
      
      // Verify transactions were processed
      expect(transactionImportService.processTransactions).toHaveBeenCalledWith(
        mockTransactions,
        mockFile.name,
        mockAllData.length,
        0 // skippedRows.length
      );
      
      // Verify result was returned
      expect(result).toEqual(mockImportResult);
    });
    
    it('should handle errors during import', async () => {
      const error = new Error('Import error');
      (fieldMappingService.applyMapping as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw error;
      });
      
      await expect(importCSVWithMapping(mockFile, mockMapping)).rejects.toThrow('Import error');
    });
  });

  describe('importCSVFile', () => {
    it('should import a CSV file with default mapping', async () => {
      const result = await importCSVFile(mockFile);
      
      // Verify parseCSVForMapping was called
      expect(csvFileParser.parseCSVFile).toHaveBeenCalledWith(mockFile);
      
      // Verify a default mapping was created and used
      expect(fieldMappingService.applyMapping).toHaveBeenCalled();
      
      // Verify result has expected structure
      expect(result).toHaveProperty('insertedIds');
      expect(result).toHaveProperty('duplicateCount');
      expect(result).toHaveProperty('updatedCount');
    });
    
    it('should handle errors during import', async () => {
      const error = new Error('Import error');
      (csvFileParser.parseCSVFile as ReturnType<typeof vi.fn>).mockRejectedValue(error);
      
      await expect(importCSVFile(mockFile)).rejects.toThrow('Import error');
    });
  });

  describe('Re-exported deduplication functions', () => {
    it('should expose transaction deduplication functions', () => {
      // Verify that the re-exported functions exist
      expect(findDuplicateTransactions).toBeDefined();
      expect(removeDuplicateTransactions).toBeDefined();
      expect(mergeDuplicateTransactions).toBeDefined();
    });
  });
});