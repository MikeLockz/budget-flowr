import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, BarChart2, History } from 'lucide-react';

interface ImportSuccessProps {
  importResult: {
    insertedIds: string[];
    duplicateCount: number;
    updatedCount: number;
    skippedCount: number;
  };
  onDashboardClick: () => void;
  onViewHistoryClick: () => void;
}

export function ImportSuccess({ 
  importResult, 
  onDashboardClick, 
  onViewHistoryClick 
}: ImportSuccessProps) {
  const totalProcessed = importResult.insertedIds.length + 
                        importResult.duplicateCount + 
                        importResult.skippedCount;

  return (
    <Card className="border-green-300">
      <CardContent className="pt-6">
        <div className="text-center space-y-6">
          <div className="mx-auto rounded-full bg-green-100 p-3 w-16 h-16 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Import Successful!</h3>
            <p className="text-muted-foreground">
              Your transactions have been imported successfully.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto">
            <div className="bg-background border rounded-md p-4 text-center">
              <p className="text-lg font-bold text-green-600">{importResult.insertedIds.length}</p>
              <p className="text-xs text-muted-foreground">Imported</p>
            </div>
            
            <div className="bg-background border rounded-md p-4 text-center">
              <p className="text-lg font-bold text-amber-600">{importResult.duplicateCount}</p>
              <p className="text-xs text-muted-foreground">Duplicates</p>
            </div>
            
            <div className="bg-background border rounded-md p-4 text-center">
              <p className="text-lg font-bold">{importResult.updatedCount}</p>
              <p className="text-xs text-muted-foreground">Updated</p>
            </div>
            
            <div className="bg-background border rounded-md p-4 text-center">
              <p className="text-lg font-bold text-red-600">{importResult.skippedCount}</p>
              <p className="text-xs text-muted-foreground">Skipped</p>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 pt-2">
            <Button onClick={onDashboardClick}>
              <BarChart2 className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            
            <Button variant="outline" onClick={onViewHistoryClick}>
              <History className="mr-2 h-4 w-4" />
              View Import History
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}