import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { CSVUpload } from '../components/import/CSVUpload';
import * as importService from '../lib/import/import-service';

// Mock the import service functions used by CSVUpload
vi.mock('../lib/import/import-service', () => ({
  parseCSVForMapping: vi.fn(),
  previewMappedTransactions: vi.fn(),
  importCSVWithMapping: vi.fn(),
  importCSVFile: vi.fn()
}));

describe('CSVUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the file input and parse button', () => {
    render(<CSVUpload />);
    
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
    expect(screen.getByTestId('parse-button')).toBeInTheDocument();
    expect(screen.queryByTestId('status-message')).not.toBeInTheDocument();
  });
  
  it('shows error message when trying to parse without selecting a file', () => {
    render(<CSVUpload />);
    
    fireEvent.click(screen.getByTestId('parse-button'));
    
    expect(screen.getByTestId('status-message')).toHaveTextContent('Please select a CSV file');
    expect(importService.importCSVWithMapping).not.toHaveBeenCalled();
  });
  
  it('handles file selection', () => {
    render(<CSVUpload />);
    
    const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByTestId('file-input');
    
    Object.defineProperty(input, 'files', {
      value: [file]
    });
    
    fireEvent.change(input);
    
    // No status message should be shown after file selection
    expect(screen.queryByTestId('status-message')).not.toBeInTheDocument();
  });
  
  it('shows success message after successful import', async () => {
    (importService.importCSVWithMapping as unknown as Mock).mockResolvedValue({
      insertedIds: ['id1', 'id2', 'id3'],
      duplicateCount: 0,
      skippedCount: 0
    });
    (importService.parseCSVForMapping as unknown as Mock).mockResolvedValue({
      headers: ['date', 'description', 'amount', 'type'],
      sampleData: [{}],
      allData: [{}]
    });
    (importService.previewMappedTransactions as unknown as Mock).mockReturnValue([{}]);
    
    render(<CSVUpload />);
    
    const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByTestId('file-input');
    
    Object.defineProperty(input, 'files', {
      value: [file]
    });
    
    fireEvent.change(input);
    fireEvent.click(screen.getByTestId('parse-button'));
    
    // Wait for mapping step to appear
    await waitFor(() => {
      expect(screen.getByTestId('preview-button')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByTestId('preview-button'));
    fireEvent.click(screen.getByTestId('import-button'));
    
    // Should show importing status first
    expect(screen.getByTestId('status-message')).toHaveTextContent('Importing...');
    
    await waitFor(() => {
      expect(screen.getByTestId('status-message')).toHaveTextContent('Successfully imported 3 transactions. Skipped 0 duplicates');
    });
    
    expect(importService.importCSVWithMapping).toHaveBeenCalledWith(file, expect.any(Object));
  });
  
  it('shows error message when import fails', async () => {
    (importService.importCSVWithMapping as unknown as Mock).mockRejectedValue(new Error('Import failed'));
    (importService.parseCSVForMapping as unknown as Mock).mockResolvedValue({
      headers: ['date', 'description', 'amount', 'type'],
      sampleData: [{}],
      allData: [{}]
    });
    (importService.previewMappedTransactions as unknown as Mock).mockReturnValue([{}]);
    
    render(<CSVUpload />);
    
    const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByTestId('file-input');
    
    Object.defineProperty(input, 'files', {
      value: [file]
    });
    
    fireEvent.change(input);
    fireEvent.click(screen.getByTestId('parse-button'));
    
    // Wait for mapping step to appear
    await waitFor(() => {
      expect(screen.getByTestId('preview-button')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByTestId('preview-button'));
    fireEvent.click(screen.getByTestId('import-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('status-message')).toHaveTextContent('Failed to import CSV file');
    });
  });
});
