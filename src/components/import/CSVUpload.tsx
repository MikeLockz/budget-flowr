import React, { useState } from 'react';
import {
  parseCSVForMapping,
  previewMappedTransactions,
  importCSVWithMapping
} from '@/lib/import/import-service';
import { queryClient } from '@/lib/query-client';
import { FieldMapping } from '@/lib/import/field-mapping-types';
import { Transaction } from '@/lib/db';
import { FieldMappingUI } from './FieldMappingUI';
import { TransactionPreview } from './TransactionPreview';

export const CSVUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload');
  const [csvData, setCsvData] = useState<{ headers: string[]; sampleData: Record<string, string>[]; allData: Record<string, string>[] } | null>(null);
  const [mapping, setMapping] = useState<FieldMapping | null>(null);
  const [previewData, setPreviewData] = useState<{
    rawData: Record<string, string>[];
    mappedTransactions: Transaction[];
  } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setStatus('');
      setStep('upload');
    }
  };

  const handleParseCsv = async () => {
    if (!file) {
      setStatus('Please select a CSV file to upload.');
      return;
    }

    setStatus('Parsing CSV...');
    try {
      const result = await parseCSVForMapping(file);
      setCsvData(result);

      // Auto-detect initial mapping
      const initialMapping = result.headers ? {
        mappings: {
          date: result.headers.find((h: string) => h.toLowerCase().includes('date')) || null,
          description: result.headers.find((h: string) => h.toLowerCase().includes('desc') || h.toLowerCase().includes('memo')) || null,
          amount: result.headers.find((h: string) => h.toLowerCase().includes('amount')) || null,
          type: result.headers.find((h: string) => h.toLowerCase().includes('type')) || null,
          categoryId: null,
          status: null,
          accountId: null
        },
        options: {
          dateFormat: 'MM/DD/YYYY',
          negativeAmountIsExpense: true,
          invertAmount: false
        }
      } : null;
      setMapping(initialMapping);

      // Generate preview with initial mapping
      if (result && initialMapping) {
        const preview = previewMappedTransactions(result, initialMapping);
        setPreviewData(preview);
      }

      setStep('mapping');
      setStatus('');
    } catch {
      setStatus('Failed to parse CSV file. Please check the file format and try again.');
    }
  };

  const handleMappingChange = (newMapping: FieldMapping) => {
    // Set the mapping state
    setMapping(newMapping);

    // Update preview when mapping changes
    if (csvData) {
      const preview = previewMappedTransactions(csvData, newMapping);
      setPreviewData(preview);
    }
  };

  const handleImport = async () => {
    if (!file || !mapping) {
      return;
    }

    setStep('importing');
    setStatus('Importing...');

    try {
      const result = await importCSVWithMapping(file, mapping);
      setStatus(`Successfully imported ${result.insertedIds.length} transactions. Skipped ${result.duplicateCount} duplicates and ${result.skippedCount} rows with missing critical data.`);
      setFile(null);
      setMapping(null);
      setPreviewData(null);
      setStep('upload');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } catch {
      setStatus('Failed to import CSV file. Please check the file and try again.');
      setStep('mapping');
    }
  };

  return (
    <div className="p-4 border rounded-md max-w-4xl">
      {step === 'upload' && (
        <>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="mb-2"
            data-testid="file-input"
          />
          <button
            onClick={handleParseCsv}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            data-testid="parse-button"
          >
            Parse CSV
          </button>
          {status && <p className="mt-2 text-sm text-gray-700" data-testid="status-message">{status}</p>}
        </>
      )}

      {step === 'mapping' && mapping && csvData && (
        <>
          <FieldMappingUI
            headers={csvData.headers}
            onMappingChange={handleMappingChange}
            initialMapping={mapping}
          />
          {status && <p className="mt-2 text-sm text-gray-700" data-testid="status-message">{status}</p>}
          <button
            onClick={() => setStep('preview')}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            data-testid="preview-button"
          >
            Preview Transactions
          </button>
          <button
            onClick={() => setStep('upload')}
            className="mt-4 ml-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            data-testid="back-button"
          >
            Back
          </button>
        </>
      )}

      {step === 'preview' && previewData && (
        <>
          <TransactionPreview previewData={previewData} />
          <button
            onClick={handleImport}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            data-testid="import-button"
          >
            Import Transactions
          </button>
          <button
            onClick={() => setStep('mapping')}
            className="mt-4 ml-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            data-testid="back-button"
          >
            Back
          </button>
        </>
      )}

      {step === 'importing' && (
        <p className="mt-2 text-sm text-gray-700" data-testid="status-message">Importing...</p>
      )}
    </div>
  );
};
