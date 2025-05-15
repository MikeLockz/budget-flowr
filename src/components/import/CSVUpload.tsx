import React, { useState } from 'react';
import {
  parseCSVForMapping
} from '@/lib/import/import-service';
import { Button } from '@/components/ui/button';
import { Upload, FileUp } from 'lucide-react';

interface CSVUploadProps {
  onFileSelected: (file: File) => void;
  onParseCsv: (data: any) => void;
  initialFile?: File | null;
}

export const CSVUpload: React.FC<CSVUploadProps> = ({
  onFileSelected,
  onParseCsv,
  initialFile = null
}) => {
  const [file, setFile] = useState<File | null>(initialFile);
  const [status, setStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      onFileSelected(selectedFile);
      setStatus('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        onFileSelected(droppedFile);
        setStatus('');
      } else {
        setStatus('Please drop a CSV file.');
      }
    }
  };

  const handleParseCsv = async () => {
    if (!file) {
      setStatus('Please select a CSV file to upload.');
      return;
    }

    setIsProcessing(true);
    setStatus('Parsing CSV...');
    
    try {
      const result = await parseCSVForMapping(file);
      
      // Auto-detect initial mapping will be handled by parent component
      onParseCsv(result);
      setStatus('');
    } catch (error) {
      setStatus('Failed to parse CSV file. Please check the file format and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {file ? file.name : 'Drag and drop your CSV file here'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supported format: CSV
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <label 
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:bg-primary/90"
            >
              Browse Files
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                data-testid="file-input"
              />
            </label>
            
            {file && (
              <Button 
                variant="outline"
                onClick={() => {
                  setFile(null);
                  onFileSelected(null as unknown as File);
                }}
                className="text-sm"
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {file && (
        <div className="flex justify-center">
          <Button
            onClick={handleParseCsv}
            disabled={isProcessing}
            className="mx-auto"
            data-testid="parse-button"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <FileUp className="w-4 h-4 mr-2" />
                Parse CSV
              </>
            )}
          </Button>
        </div>
      )}
      
      {status && (
        <p 
          className={`text-sm text-center ${status.includes('Failed') ? 'text-red-500' : 'text-muted-foreground'}`}
          data-testid="status-message"
        >
          {status}
        </p>
      )}
    </div>
  );
};