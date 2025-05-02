import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { CSVUpload } from '../components/import/CSVUpload';
import * as importService from '../lib/import/import-service';

// Mock the import service
vi.mock('../lib/import/import-service', () => ({
  importCSVFile: vi.fn()
}));

describe('CSVUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the file input and upload button', () => {
    render(<CSVUpload />);
    
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
    expect(screen.getByTestId('upload-button')).toBeInTheDocument();
    expect(screen.queryByTestId('status-message')).not.toBeInTheDocument();
  });
  
  it('shows error message when trying to upload without selecting a file', () => {
    render(<CSVUpload />);
    
    fireEvent.click(screen.getByTestId('upload-button'));
    
    expect(screen.getByTestId('status-message')).toHaveTextContent('Please select a CSV file');
    expect(importService.importCSVFile).not.toHaveBeenCalled();
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
    (importService.importCSVFile as unknown as Mock).mockResolvedValue(['id1', 'id2', 'id3']);
    
    render(<CSVUpload />);
    
    const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByTestId('file-input');
    
    Object.defineProperty(input, 'files', {
      value: [file]
    });
    
    fireEvent.change(input);
    fireEvent.click(screen.getByTestId('upload-button'));
    
    // Should show importing status first
    expect(screen.getByTestId('status-message')).toHaveTextContent('Importing...');
    
    await waitFor(() => {
      expect(screen.getByTestId('status-message')).toHaveTextContent('Successfully imported 3 transactions');
    });
    
    expect(importService.importCSVFile).toHaveBeenCalledWith(file);
  });
  
  it('shows error message when import fails', async () => {
    (importService.importCSVFile as unknown as Mock).mockRejectedValue(new Error('Import failed'));
    
    render(<CSVUpload />);
    
    const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByTestId('file-input');
    
    Object.defineProperty(input, 'files', {
      value: [file]
    });
    
    fireEvent.change(input);
    fireEvent.click(screen.getByTestId('upload-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('status-message')).toHaveTextContent('Failed to import CSV file');
    });
  });
});
