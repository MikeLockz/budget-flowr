import { useEffect, useState } from 'react';
import { ImportSession } from '@/lib/db';
import { importRepo } from '@/lib/repositories';
import { formatDate } from '@/lib/utils';

function ImportHistory() {
  const [imports, setImports] = useState<ImportSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImports = async () => {
      try {
        const importSessions = await importRepo.getImportHistory();
        // The import records are already sorted by date descending (in the repository method)
        setImports(importSessions);
      } catch (error) {
        console.error('Failed to load import history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImports();
  }, []);

  // Format date function
  const formatImportDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Import History</h3>
      
      {loading ? (
        <div className="text-center py-8">Loading import history...</div>
      ) : imports.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/30">
          <p>No import history found.</p>
          <p className="text-muted-foreground text-sm mt-2">
            Import transactions using the Import Data tab to see history here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm">Date</th>
                <th className="text-left py-3 px-4 text-sm">File Name</th>
                <th className="text-left py-3 px-4 text-sm">Total Rows</th>
                <th className="text-left py-3 px-4 text-sm">Imported</th>
                <th className="text-left py-3 px-4 text-sm">Duplicates</th>
                <th className="text-left py-3 px-4 text-sm">Updated</th>
                <th className="text-left py-3 px-4 text-sm">Skipped</th>
              </tr>
            </thead>
            <tbody>
              {imports.map((importSession) => (
                <tr key={importSession.id} className="border-b hover:bg-secondary/10">
                  <td className="py-3 px-4 text-sm">{formatImportDate(importSession.date)}</td>
                  <td className="py-3 px-4 text-sm">{importSession.fileName}</td>
                  <td className="py-3 px-4 text-sm">{importSession.totalCount}</td>
                  <td className="py-3 px-4 text-sm text-green-600 font-medium">{importSession.importedCount}</td>
                  <td className="py-3 px-4 text-sm text-amber-600">{importSession.duplicateCount}</td>
                  <td className="py-3 px-4 text-sm">{importSession.updatedCount || 0}</td>
                  <td className="py-3 px-4 text-sm text-red-600">{importSession.skippedCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ImportHistory;