import React, { useState } from 'react';
import { importCSVFile } from '@/lib/import/import-service';

export const CSVUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setStatus('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus('Please select a CSV file to upload.');
      return;
    }

    setStatus('Importing...');
    try {
      const insertedIds = await importCSVFile(file);
      setStatus(`Successfully imported ${insertedIds.length} transactions.`);
      setFile(null);
    } catch {
      setStatus('Failed to import CSV file. Please check the file and try again.');
    }
  };

  return (
    <div className="p-4 border rounded-md max-w-md">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="mb-2"
      data-testid="file-input" />
      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      data-testid="upload-button">
        Import CSV
      </button>
      {status && <p className="mt-2 text-sm text-gray-700" data-testid="status-message">{status}</p>}
    </div>
  );
};
