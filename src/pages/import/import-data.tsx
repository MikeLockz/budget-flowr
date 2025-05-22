import { useState } from 'react';
// These imports are not used
// import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImportStepper } from '@/components/import/ImportStepper';
import { CSVUpload } from '@/components/import/CSVUpload';
import { FieldMappingUI } from '@/components/import/FieldMappingUI';
import { TransactionComparisonPreview } from '@/components/import/TransactionComparisonPreview';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from '@tanstack/react-router';
import { FieldMapping, PreviewData } from '@/lib/import/field-mapping-types';
import { CheckCircle } from 'lucide-react';

function ImportData() {
  const steps = ['Select File', 'Map Fields', 'Preview', 'Confirm'];
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [csvData, setCsvData] = useState<{ headers: string[]; sampleData: Record<string, string>[]; allData: Record<string, string>[] } | null>(null);
  const [mapping, setMapping] = useState<FieldMapping | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<{
    insertedIds: string[];
    duplicateCount: number;
    updatedCount: number;
    skippedCount: number;
  } | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  // Handle file selection and initial CSV parsing
  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setStatus('');
  };

  // Handle CSV parsing
  const handleParseCsv = async (parsedData: { headers: string[]; sampleData: Record<string, string>[]; allData: Record<string, string>[] }) => {
    setCsvData(parsedData);
    setCurrentStep(1); // Move to field mapping step
  };

  // Handle mapping changes
  const handleMappingChange = (newMapping: FieldMapping) => {
    setMapping(newMapping);
  };

  // Handle preview generation
  const handlePreviewGenerated = (preview: PreviewData) => {
    setPreviewData(preview);
    setCurrentStep(2); // Move to preview step
  };

  // Handle import completion
  const handleImportComplete = (result: {
    insertedIds: string[];
    duplicateCount: number;
    updatedCount: number;
    skippedCount: number;
  }) => {
    setImportResult(result);
    setCurrentStep(3); // Move to confirmation step

    toast({
      title: "Import Successful",
      description: `Imported ${result.insertedIds.length} transactions. Skipped ${result.duplicateCount} duplicates and ${result.skippedCount} rows with missing data.`,
      duration: 5000,
    });
  };

  // Navigation controls - not currently used
  /*
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  */

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Navigation to dashboard
  const goToDashboard = () => {
    // Force a data refresh before navigating
    import('@/lib/query-client').then(({ queryClient }) => {
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Navigate with a small delay to ensure data refresh
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] })
      ]).then(() => {
        router.navigate({ to: '/' });
      });
    });
  };

  // Navigation to import history
  const goToImportHistory = () => {
    router.navigate({ to: '/import/history' });
  };

  return (
    <div className="space-y-6">
      <ImportStepper steps={steps} currentStep={currentStep} />

      {/* Step 1: File Upload */}
      {currentStep === 0 && (
        <CSVUpload
          onFileSelected={handleFileSelected}
          onParseCsv={handleParseCsv}
          initialFile={file}
        />
      )}

      {/* Step 2: Field Mapping */}
      {currentStep === 1 && csvData && (
        <>
          <FieldMappingUI
            headers={csvData.headers}
            onMappingChange={handleMappingChange}
            initialMapping={mapping}
            // onPreviewGenerated removed as it's not in the component props
          />
          {status && <p className="mt-2 text-sm text-gray-700" data-testid="status-message">{status}</p>}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={goToPreviousStep}>
              Back
            </Button>
            <Button 
              onClick={() => {
                if (mapping && csvData) {
                  // Generate the preview using proper data
                  import('@/lib/import/import-service').then(({ previewMappedTransactions }) => {
                    const preview = previewMappedTransactions(
                      {
                        headers: csvData.headers,
                        sampleData: csvData.sampleData,
                        allData: csvData.allData
                      },
                      mapping
                    );
                    // Add the file reference since it's needed for import
                    const previewWithFile = {
                      ...preview,
                      file: file as File // Ensure it's not null
                    };
                    handlePreviewGenerated(previewWithFile);
                  });
                }
              }}
            >
              Generate Preview
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Preview */}
      {currentStep === 2 && previewData && (
        <>
          <TransactionComparisonPreview
            previewData={previewData}
            onImportComplete={handleImportComplete}
            onBack={goToPreviousStep}
          />
          {/* Back button container removed as the Import button is in TransactionComparisonPreview */}
        </>
      )}

      {/* Step 4: Confirmation */}
      {currentStep === 3 && importResult && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="mb-4 text-green-600 flex justify-center">
              <CheckCircle className="h-16 w-16" />
            </div>
            <h3 className="text-2xl font-bold">Import Successful!</h3>
            <p className="text-gray-600 mt-2">
              Successfully imported {importResult.insertedIds.length} transactions.
            </p>
            <ul className="mt-4 text-left max-w-md mx-auto">
              <li>Imported: {importResult.insertedIds.length}</li>
              <li>Duplicates: {importResult.duplicateCount}</li>
              <li>Updated: {importResult.updatedCount}</li>
              <li>Skipped: {importResult.skippedCount}</li>
            </ul>
          </div>

          <div className="flex justify-center space-x-4">
            <Button onClick={goToDashboard}>
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={goToImportHistory}>
              View Import History
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportData;