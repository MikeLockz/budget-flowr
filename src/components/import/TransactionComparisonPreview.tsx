import React from 'react';
import { PreviewData } from '@/lib/import/field-mapping-types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { importCSVWithMapping } from '@/lib/import/import-service';
import { queryClient } from '@/lib/query-client';
import { formatCurrency } from '@/lib/utils';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface TransactionComparisonPreviewProps {
  previewData: PreviewData;
  onImportComplete?: (result: { insertedIds: string[]; duplicateCount: number; updatedCount: number; skippedCount: number; }) => void;
  onBack?: () => void;
}

export const TransactionComparisonPreview: React.FC<TransactionComparisonPreviewProps> = ({ 
  previewData,
  onImportComplete,
  onBack
}) => {
  const { rawData, mappedTransactions, skippedRows, mapping, file } = previewData;
  const [importing, setImporting] = React.useState(false);
  const [expandedRows, setExpandedRows] = React.useState<Record<number, boolean>>({});

  // Create a mapping between rawData and mappedTransactions
  // This assumes the index positions align, which should be the case based on the import flow
  const dataMap = React.useMemo(() => {
    const map = new Map();
    mappedTransactions.forEach((transaction, index) => {
      // Only map valid rows that weren't skipped
      if (index < rawData.length) {
        map.set(transaction, rawData[index]);
      }
    });
    return map;
  }, [mappedTransactions, rawData]);

  const handleImport = async () => {
    if (!mapping || !file) return;

    setImporting(true);
    try {
      const result = await importCSVWithMapping(file, mapping);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (onImportComplete) {
        onImportComplete(result);
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  const toggleRowExpansion = (index: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Get the source field names from the mapping
  const getSourceFields = () => {
    if (!mapping) return {};
    
    const sourceFields: Record<string, string> = {};
    Object.entries(mapping.mappings).forEach(([key, value]) => {
      if (value) {
        sourceFields[key] = value;
      }
    });
    return sourceFields;
  };

  const sourceFields = getSourceFields();

  return (
    <div className="space-y-6">
      {/* Comparison View Description */}
      <div className="mb-4 text-sm text-muted-foreground">
        <p>This view shows the original data alongside the mapped transactions. Click the arrow on each row to see all original fields.</p>
      </div>

      {/* Main Transaction Comparison Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 font-medium">
                <th className="px-2 py-3 text-center w-10">{/* Expand/Collapse */}</th>
                {/* For mobile, we collapse the original data columns */}
                <th colSpan={2} className="px-4 py-3 text-center bg-muted/30 border-r">
                  <span className="hidden sm:inline">Original Data</span>
                  <span className="inline sm:hidden">Original</span>
                </th>
                <th colSpan={5} className="px-4 py-3 text-center">
                  <span className="hidden sm:inline">Mapped Transaction</span>
                  <span className="inline sm:hidden">Mapped</span>
                </th>
              </tr>
              <tr className="border-b bg-muted/50 font-medium">
                <th className="px-2 py-3 text-center w-10">{/* Expand/Collapse */}</th>
                {/* Original Data Columns - show key mapped fields from source */}
                <th className="px-4 py-3 text-left bg-muted/30 hidden sm:table-cell">{sourceFields.date || 'Date'}</th>
                <th className="px-4 py-3 text-left bg-muted/30 border-r">{sourceFields.amount || 'Amount'}</th>
                
                {/* Mapped Columns */}
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Category</th>
              </tr>
            </thead>
            <tbody>
              {mappedTransactions && mappedTransactions.map((transaction, index) => {
                const originalData = dataMap.get(transaction);
                const isExpanded = expandedRows[index] || false;
                
                return (
                  <React.Fragment key={index}>
                    <tr className={`border-b hover:bg-muted/50 ${index % 2 === 0 ? 'bg-muted/10' : ''}`}>
                      {/* Expand/Collapse Button */}
                      <td className="px-1 py-3 text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleRowExpansion(index)}
                          className="h-6 w-6"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </td>
                      
                      {/* Original Data Columns - Show just date and amount for compact view */}
                      <td className="px-4 py-3 bg-muted/10 hidden sm:table-cell">
                        {originalData && sourceFields.date ? originalData[sourceFields.date] : ''}
                      </td>
                      <td className="px-4 py-3 bg-muted/10 border-r">
                        {originalData && sourceFields.amount ? originalData[sourceFields.amount] : ''}
                      </td>
                      
                      {/* Mapped Columns */}
                      <td className="px-4 py-3 w-28">{transaction.date}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate hidden md:table-cell">{transaction.description}</td>
                      <td className={`px-4 py-3 text-right ${
                        transaction.type.includes('Expense') 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">{transaction.type}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{transaction.categoryId || 'Uncategorized'}</td>
                    </tr>
                    
                    {/* Expanded Row - Show all original data fields and mobile-hidden mapped fields */}
                    {isExpanded && (
                      <tr className="bg-gray-50 border-b">
                        <td colSpan={8} className="px-4 py-3 sm:px-8">
                          {/* Mobile Only: Show mapped fields that are hidden in the mobile view */}
                          <div className="block sm:hidden mb-4">
                            <h4 className="font-semibold text-sm mb-2">Mapped Transaction Details:</h4>
                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex justify-between">
                                <span className="font-medium mr-2">Description:</span>
                                <span className="text-gray-700">{transaction.description}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium mr-2">Type:</span>
                                <span className="text-gray-700">{transaction.type}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium mr-2">Category:</span>
                                <span className="text-gray-700">{transaction.categoryId || 'Uncategorized'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium mr-2">Status:</span>
                                <span className="text-gray-700">{transaction.status}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium mr-2">Account:</span>
                                <span className="text-gray-700">{transaction.accountId || 'Default'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Original Data Fields - Shown on all devices */}
                          {originalData && (
                            <>
                              <h4 className="font-semibold text-sm mb-2">Original CSV Data:</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                                {Object.entries(originalData).map(([key, value]) => (
                                  <div key={key} className="flex justify-between sm:justify-start">
                                    <span className="font-medium mr-2">{key}:</span>
                                    <span className="text-gray-700">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Skipped Rows Section */}
      {skippedRows && skippedRows.length > 0 && (
        <Card className="border-amber-300 mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">Skipped Rows ({skippedRows.length})</h3>
            </div>
            
            <p className="mb-4 text-muted-foreground text-sm">
              The following rows will be skipped during import because they are missing critical fields (date, amount, or description):
            </p>
            
            <div className="rounded-md border border-amber-200">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-amber-50/50 font-medium">
                      {skippedRows.length > 0 ? Object.keys(skippedRows[0]).map(header => (
                        <th key={header} className="px-4 py-3 text-left text-amber-800">
                          {header}
                        </th>
                      )) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {skippedRows.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-amber-50/30">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="px-4 py-3 text-amber-900">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation and Import Buttons */}
      {onImportComplete && (
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={onBack}
          >
            Back
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={importing}
          >
            {importing ? 'Importing...' : 'Import Transactions'}
          </Button>
        </div>
      )}
    </div>
  );
};