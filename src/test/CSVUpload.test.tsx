import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { CSVUpload } from '../components/import/CSVUpload';
import * as importService from '../lib/import/import-service';
import { act } from 'react';

// Mock the import service functions used by CSVUpload
vi.mock('../lib/import/import-service', () => ({
  parseCSVForMapping: vi.fn(),
  previewMappedTransactions: vi.fn(),
  importCSVWithMapping: vi.fn(),
  importCSVFile: vi.fn()
}));

// Mock the lucide-react components
vi.mock('lucide-react', () => ({
  Upload: () => <div data-testid="upload-icon">Upload Icon</div>,
  FileUp: () => <div data-testid="file-up-icon">File Up Icon</div>,
}));

describe('CSVUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the file input', () => {
    render(<CSVUpload 
      onFileSelected={() => {}} 
      onParseCsv={() => {}} 
    />);
    
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
    expect(screen.queryByTestId('status-message')).not.toBeInTheDocument();
    expect(screen.queryByTestId('parse-button')).not.toBeInTheDocument(); // Parse button should not appear until a file is selected
  });
  
  it('does not show parse button when no file is selected', () => {
    render(<CSVUpload 
      onFileSelected={() => {}} 
      onParseCsv={() => {}} 
    />);
    
    // When no file is selected, the parse button shouldn't be visible
    expect(screen.queryByTestId('parse-button')).not.toBeInTheDocument();
    
    // The importCSVWithMapping should not have been called
    expect(importService.importCSVWithMapping).not.toHaveBeenCalled();
  });
  
  it('handles file selection', async () => {
    render(<CSVUpload 
      onFileSelected={() => {}} 
      onParseCsv={() => {}} 
    />);
    
    const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByTestId('file-input');
    
    Object.defineProperty(input, 'files', {
      value: [file]
    });
    
    fireEvent.change(input);
    
    // After file selection, the parse button should appear
    await waitFor(() => {
      expect(screen.getByTestId('parse-button')).toBeInTheDocument();
    });
    
    // No status message should be shown after file selection
    expect(screen.queryByTestId('status-message')).not.toBeInTheDocument();
  });
  
  it('calls onParseCsv when parse button is clicked', async () => {
    (importService.parseCSVForMapping as unknown as Mock).mockResolvedValue({
      headers: ['date', 'description', 'amount', 'type'],
      sampleData: [{}],
      allData: [{}]
    });
    
    const onParseCsvMock = vi.fn();
    
    render(<CSVUpload 
      onFileSelected={() => {}} 
      onParseCsv={onParseCsvMock} 
    />);
    
    const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByTestId('file-input');
    
    // Set the file
    Object.defineProperty(input, 'files', {
      value: [file]
    });
    
    // Trigger file selection
    await act(async () => {
      fireEvent.change(input);
    });
    
    // The parse button should now be visible
    const parseButton = screen.getByTestId('parse-button');
    expect(parseButton).toBeInTheDocument();
    
    // Click the parse button
    await act(async () => {
      fireEvent.click(parseButton);
    });
    
    // Wait for the parsing to complete and verify onParseCsv was called
    await waitFor(() => {
      expect(onParseCsvMock).toHaveBeenCalledWith(expect.objectContaining({
        headers: ['date', 'description', 'amount', 'type'],
        sampleData: expect.any(Array),
        allData: expect.any(Array)
      }));
    });
    
    // Verify that parseCSVForMapping was called with the file
    expect(importService.parseCSVForMapping).toHaveBeenCalledWith(file);
  });
  
  it('handles parsing errors', async () => {
    (importService.parseCSVForMapping as unknown as Mock).mockRejectedValue(new Error('Parse failed'));
    
    const onParseCsvMock = vi.fn();
    
    render(<CSVUpload 
      onFileSelected={() => {}} 
      onParseCsv={onParseCsvMock} 
    />);
    
    const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByTestId('file-input');
    
    // Set the file
    Object.defineProperty(input, 'files', {
      value: [file]
    });
    
    // Trigger file selection
    await act(async () => {
      fireEvent.change(input);
    });
    
    // The parse button should now be visible
    const parseButton = screen.getByTestId('parse-button');
    expect(parseButton).toBeInTheDocument();
    
    // Click the parse button
    await act(async () => {
      fireEvent.click(parseButton);
    });
    
    // Verify that parseCSVForMapping was called with the file
    expect(importService.parseCSVForMapping).toHaveBeenCalledWith(file);
    
    // Verify that onParseCsvMock was not called because parsing failed
    await waitFor(() => {
      expect(onParseCsvMock).not.toHaveBeenCalled();
    });
  });
});