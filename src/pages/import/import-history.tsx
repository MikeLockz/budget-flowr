import { useEffect, useState, useMemo } from 'react';
import { ImportSession } from '@/lib/db';
import { importRepo } from '@/lib/repositories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function ImportHistory() {
  const [imports, setImports] = useState<ImportSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    } catch {
      return dateString;
    }
  };

  // Calculate global import stats
  const stats = useMemo(() => {
    if (imports.length === 0) return null;
    
    return imports.reduce((acc, imp) => {
      return {
        totalImports: acc.totalImports + 1,
        totalRows: acc.totalRows + imp.totalCount,
        totalImported: acc.totalImported + imp.importedCount,
        totalDuplicates: acc.totalDuplicates + imp.duplicateCount,
        totalUpdated: acc.totalUpdated + (imp.updatedCount || 0),
        totalSkipped: acc.totalSkipped + (imp.skippedCount || 0),
      };
    }, {
      totalImports: 0,
      totalRows: 0,
      totalImported: 0,
      totalDuplicates: 0,
      totalUpdated: 0,
      totalSkipped: 0,
    });
  }, [imports]);

  // Filter imports based on search term
  const filteredImports = useMemo(() => {
    if (!searchTerm.trim()) return imports;
    
    const searchLower = searchTerm.toLowerCase();
    return imports.filter(imp => 
      imp.fileName.toLowerCase().includes(searchLower) ||
      formatImportDate(imp.date).toLowerCase().includes(searchLower)
    );
  }, [imports, searchTerm]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Import History</h2>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-pulse text-lg">Loading import history...</div>
        </div>
      ) : imports.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-lg">No import history found.</p>
              <p className="text-muted-foreground mt-2">
                Import transactions using the Import Data tab to see history here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Import Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold">{stats?.totalImports}</span>
                  <span className="text-sm text-muted-foreground">Total file imports</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold">{stats?.totalImported}</span>
                  <span className="text-sm text-muted-foreground">
                    of {stats?.totalRows} rows ({((stats?.totalImported || 0) / (stats?.totalRows || 1) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-amber-600">{stats?.totalDuplicates} duplicates</span> · 
                  <span className="ml-2">{stats?.totalUpdated} updated</span> ·
                  <span className="ml-2 text-red-600">{stats?.totalSkipped} skipped</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center mb-4">
            <Input
              placeholder="Search by filename or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="ml-4 text-sm text-muted-foreground">
              {filteredImports.length} of {imports.length} imports shown
            </div>
          </div>

          {/* Imports Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 text-sm font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">File Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Total Rows</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Imported</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Duplicates</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Updated</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Skipped</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredImports.map((importSession) => (
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default ImportHistory;