import React from 'react';
import { PreviewData } from '@/lib/import/field-mapping-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { importCSVWithMapping } from '@/lib/import/import-service';
import { queryClient } from '@/lib/query-client';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface TransactionPreviewProps {
  previewData: PreviewData;
  onImportComplete?: (result: any) => void;
}

export const TransactionPreview: React.FC<TransactionPreviewProps> = ({ 
  previewData,
  onImportComplete 
}) => {
  const { rawData, mappedTransactions, skippedRows, mapping, file } = previewData;
  const [importing, setImporting] = React.useState(false);

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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="mapped" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mapped">Mapped Transactions ({mappedTransactions?.length || 0})</TabsTrigger>
          <TabsTrigger value="original">Original CSV Data</TabsTrigger>
          {skippedRows && skippedRows.length > 0 && (
            <TabsTrigger value="skipped" className="text-amber-600">
              Skipped Rows ({skippedRows.length})
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="mapped" className="space-y-4 pt-4">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 font-medium">
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Account</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedTransactions && mappedTransactions.map((transaction, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 w-28">{transaction.date}</td>
                      <td className="px-4 py-3 max-w-[300px] truncate">{transaction.description}</td>
                      <td className={`px-4 py-3 text-right ${
                        transaction.type.includes('Expense') 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-4 py-3">{transaction.type}</td>
                      <td className="px-4 py-3">{transaction.categoryId || 'Uncategorized'}</td>
                      <td className="px-4 py-3">{transaction.status}</td>
                      <td className="px-4 py-3">{transaction.accountId || 'Default'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {onImportComplete && (
            <div className="flex justify-end">
              <Button 
                onClick={handleImport} 
                disabled={importing}
              >
                {importing ? 'Importing...' : 'Import Transactions'}
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="original" className="space-y-4 pt-4">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 font-medium">
                    {rawData && rawData.length > 0 ? Object.keys(rawData[0]).map(header => (
                      <th key={header} className="px-4 py-3 text-left">
                        {header}
                      </th>
                    )) : null}
                  </tr>
                </thead>
                <tbody>
                  {rawData && rawData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="px-4 py-3">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        
        {skippedRows && skippedRows.length > 0 && (
          <TabsContent value="skipped" className="space-y-4 pt-4">
            <Card className="border-amber-300">
              <CardHeader className="bg-amber-50 text-amber-800">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <CardTitle className="text-amber-800">Skipped Rows</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
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
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};