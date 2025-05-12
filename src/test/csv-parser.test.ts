import { describe, it, expect, vi, Mock } from 'vitest';
import { parseCSV } from '../lib/import/csv-parser';
import Papa from 'papaparse';

// Mock papaparse
vi.mock('papaparse', () => {
  const actual = vi.importActual('papaparse');
  return {
    __esModule: true,
    default: {
      ...actual,
      parse: vi.fn(),
    },
  };
});

describe('CSV Parser', () => {
  it('should parse CSV data correctly', async () => {
    // Mock implementation
(Papa.parse as unknown as ReturnType<typeof vi.fn>).mockImplementation((_file, options: { complete: (results: { data: Array<Record<string, string>>; errors: Array<{ message: string; row: number }> }) => void }) => {
  options.complete({
        data: [
          { date: '2025-01-01', description: 'Test', amount: '100.00' },
          { date: '2025-01-02', description: 'Test 2', amount: '200.00' },
        ],
        errors: []
      });
    });

    const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
    const result = await parseCSV(mockFile);
    
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2025-01-01');
    expect(result[1].amount).toBe('200.00');
  });

  it('should reject with errors if parsing fails', async () => {
    // Mock implementation for error case
(Papa.parse as unknown as ReturnType<typeof vi.fn>).mockImplementation((_file, options: { complete: (results: { data: Array<Record<string, string>>; errors: Array<{ message: string; row: number }> }) => void }) => {
  options.complete({
        data: [],
        errors: [{ message: 'Parse error', row: 1 }]
      });
    });

    const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
    
    await expect(parseCSV(mockFile)).rejects.toEqual([
      { message: 'Parse error', row: 1 }
    ]);
  });
});
