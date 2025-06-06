import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  ColDef, 
  CellValueChangedEvent, 
  GridReadyEvent, 
  GridApi, 
  GetRowIdParams
} from 'ag-grid-community';
import { Transaction, Category } from '@/lib/db';
import { 
  useTransactionData, 
  useUpdateTransaction, 
  useArchiveTransaction, 
  useBulkArchiveTransactions,
  useRestoreTransaction,
  useBulkRestoreTransactions
} from '@/hooks/use-transactions';
import { useVisualizationSettings } from '@/lib/store/visualization-settings';
import { useCategories } from '@/hooks/use-transactions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { getTextColorForBackground } from '@/lib/category-colors';
import { useCategoryColors, getCategoryColor } from '@/lib/store/category-colors';

// Extend Transaction with categoryName for display
interface TransactionWithCategory extends Transaction {
  categoryName: string;
}

const TransactionsPage: React.FC = () => {
  const [showArchived, setShowArchived] = useState(false);
  const { transactions } = useTransactionData(showArchived);
  const { data: categories = [] } = useCategories();
  const updateTransaction = useUpdateTransaction();
  const archiveTransaction = useArchiveTransaction();
  const bulkArchive = useBulkArchiveTransactions();
  const restoreTransaction = useRestoreTransaction();
  const bulkRestore = useBulkRestoreTransactions();
  const { typeClassifications } = useVisualizationSettings();
  
  // Create category lookup for efficient access by ID
  const categoryLookup = useMemo(() => {
    const lookup: Record<string, Category> = {};
    categories.forEach(category => {
      lookup[category.id] = category;
    });
    return lookup;
  }, [categories]);
  
  // Create category name list and get color mapping from store
  const categoryNames = useMemo(() => categories.map(cat => cat.name), [categories]);
  const { colorMap: storedColorMap } = useCategoryColors();
  
  // Initialize colors for any categories that don't have saved colors
  useEffect(() => {
    if (categoryNames.length > 0) {
      const { generateColors } = useCategoryColors.getState();
      generateColors(categoryNames);
    }
  }, [categoryNames]);
  
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<Transaction[]>([]);
  const [redoStack, setRedoStack] = useState<Transaction[]>([]);

  // Get row node ID
  const getRowId = useCallback((params: GetRowIdParams) => {
    return params.data.id;
  }, []);

  // Handle cell value change
  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      const { data, oldValue, newValue } = event;
      
      if (oldValue === newValue) return;
      
      // Save old state for undo
      setUndoStack(prev => [...prev, { ...data, [event.column.getColId()]: oldValue }]);
      
      // Clear redo stack when a new edit is made
      setRedoStack([]);
      
      // Update transaction in database
      updateTransaction.mutate(data as Transaction);
    },
    [updateTransaction]
  );

  // Handle grid ready event
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  // Handle selection change event
  const onSelectionChanged = useCallback(() => {
    if (!gridApi) return;
    
    const selectedRows = gridApi.getSelectedRows() as TransactionWithCategory[];
    setSelectedTransactions(selectedRows.map(row => row.id));
  }, [gridApi]);

  // Column definitions with editable cells
  const columnDefs: ColDef[] = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 70, 
      editable: false, 
      filter: 'agTextColumnFilter', 
      checkboxSelection: true,
    },
    { 
      field: 'description', 
      headerName: 'Description', 
      filter: 'agTextColumnFilter',
      editable: true,
    },
    {
      field: 'categoryId',
      headerName: 'Category',
      filter: 'agTextColumnFilter',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: categories.map(cat => cat.id),
      },
      valueFormatter: (params) => {
        if (!params.value) return 'Uncategorized';
        const category = categoryLookup[params.value];
        return category ? category.name : 'Uncategorized';
      },
      cellRenderer: (params: { value?: string }) => {
        if (!params.value) return <Badge variant="secondary">Uncategorized</Badge>;
        
        const category = categoryLookup[params.value];
        const categoryName = category ? category.name : 'Uncategorized';
        const dynamicIndex = categories.findIndex(c => c.name === categoryName) + 1; // Use position-based index
        const color = storedColorMap[categoryName] || getCategoryColor(categoryName, storedColorMap, dynamicIndex);
        
        if (color) {
          return (
            <Badge 
              style={{ 
                backgroundColor: color,
                color: getTextColorForBackground(color),
                borderColor: 'transparent'
              }}
            >
              {categoryName}
            </Badge>
          );
        }
        
        // Default badge for categories without a specific color
        return <Badge variant="secondary">{categoryName}</Badge>;
      },
    },
    {
      field: 'amount',
      headerName: 'Amount',
      filter: 'agNumberColumnFilter',
      editable: true,
      valueFormatter: (params: { value?: number }) => {
        return params.value ? `$${params.value.toFixed(2)}` : '';
      },
    },
    {
      field: 'date',
      headerName: 'Date',
      filter: 'agDateColumnFilter',
      editable: true,
      valueFormatter: (params: { value?: string }) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        return date.toLocaleDateString();
      },
    },
    {
      field: 'type',
      headerName: 'Type',
      filter: 'agTextColumnFilter',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: Object.keys(typeClassifications),
      },
      
      cellRenderer: (params: { value?: string }) => {
        if (!params.value) return <span>Unknown</span>;
        
        const classification = typeClassifications[params.value];
        if (classification === 'income') {
          return <span className="text-green-600 font-semibold">{params.value}</span>;
        } else if (classification === 'expense') {
          return <span className="text-red-600 font-semibold">{params.value}</span>;
        }
        return <span>{params.value}</span>;
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      filter: 'agTextColumnFilter',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['completed', 'pending', 'upcoming'],
      },
    },
    {
      field: 'accountId',
      headerName: 'Account',
      filter: 'agTextColumnFilter',
      editable: true,
    },
    {
      headerName: 'Actions',
      field: 'id',
      editable: false,
      filter: false,
      width: 120,
      cellRenderer: (params: { value: string }) => {
        return showArchived ? (
          <Button 
            variant="outline" 
            className="py-1 px-2 h-8" 
            onClick={() => handleRestoreTransaction(params.value)}
          >
            Restore
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="py-1 px-2 h-8" 
            onClick={() => handleArchiveTransaction(params.value)}
          >
            Archive
          </Button>
        );
      },
    },
  ];

  // Undo last edit
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const lastState = undoStack[undoStack.length - 1];
    
    // Save current state to redo stack
    const currentNode = gridApi?.getRowNode(lastState.id);
    if (currentNode) {
      setRedoStack(prev => [...prev, currentNode.data as Transaction]);
    }
    
    // Restore previous state
    updateTransaction.mutate(lastState, {
      onSuccess: () => {
        setUndoStack(prev => prev.slice(0, -1));
      },
    });
  }, [undoStack, gridApi, updateTransaction]);

  // Redo last undone edit
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    
    // Save current state to undo stack
    const currentNode = gridApi?.getRowNode(nextState.id);
    if (currentNode) {
      setUndoStack(prev => [...prev, currentNode.data as Transaction]);
    }
    
    // Apply next state
    updateTransaction.mutate(nextState, {
      onSuccess: () => {
        setRedoStack(prev => prev.slice(0, -1));
      },
    });
  }, [redoStack, gridApi, updateTransaction]);

  // Archive a transaction
  const handleArchiveTransaction = useCallback((id: string) => {
    archiveTransaction.mutate(id);
  }, [archiveTransaction]);

  // Restore a transaction
  const handleRestoreTransaction = useCallback((id: string) => {
    restoreTransaction.mutate(id);
  }, [restoreTransaction]);

  // Bulk archive selected transactions
  const handleBulkArchive = useCallback(() => {
    if (selectedTransactions.length === 0) return;
    bulkArchive.mutate(selectedTransactions);
  }, [selectedTransactions, bulkArchive]);

  // Bulk restore selected transactions
  const handleBulkRestore = useCallback(() => {
    if (selectedTransactions.length === 0) return;
    bulkRestore.mutate(selectedTransactions);
  }, [selectedTransactions, bulkRestore]);

  // Cast transactions to unknown[] to satisfy AgGridBase typing
  const rowData = transactions as unknown as Record<string, unknown>[];

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Transactions</h1>
      
      <Tabs defaultValue="active" className="mb-6">
        <TabsList>
          <TabsTrigger 
            value="active" 
            onClick={() => setShowArchived(false)}
          >
            Active Transactions
          </TabsTrigger>
          <TabsTrigger 
            value="archived" 
            onClick={() => setShowArchived(true)}
          >
            Archived Transactions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          <Card className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                onClick={handleUndo} 
                disabled={undoStack.length === 0}
                variant="outline"
              >
                Undo
              </Button>
              <Button 
                onClick={handleRedo} 
                disabled={redoStack.length === 0}
                variant="outline"
              >
                Redo
              </Button>
              <Button 
                onClick={handleBulkArchive} 
                disabled={selectedTransactions.length === 0}
                variant="secondary"
              >
                Archive Selected ({selectedTransactions.length})
              </Button>
            </div>
            
            <div className="h-[700px] w-full">
              <AgGridReact
                ref={gridRef}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={{
                  flex: 1,
                  minWidth: 100,
                  sortable: true,
                  filter: true,
                  resizable: true,
                  editable: true,
                }}
                pagination={true}
                paginationPageSize={100}
                paginationPageSizeSelector={[100, 500, 1000]}
                rowSelection="multiple"
                onGridReady={onGridReady}
                onSelectionChanged={onSelectionChanged}
                onCellValueChanged={onCellValueChanged}
                getRowId={getRowId}
                domLayout="normal"
              />
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="archived" className="mt-4">
          <Card className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                onClick={handleBulkRestore} 
                disabled={selectedTransactions.length === 0}
                variant="secondary"
              >
                Restore Selected ({selectedTransactions.length})
              </Button>
            </div>
            
            <div className="h-[700px] w-full">
              <AgGridReact
                ref={gridRef}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={{
                  flex: 1,
                  minWidth: 100,
                  sortable: true,
                  filter: true,
                  resizable: true,
                  editable: true,
                }}
                pagination={true}
                paginationPageSize={100}
                paginationPageSizeSelector={[100, 500, 1000]}
                rowSelection="multiple"
                onGridReady={onGridReady}
                onSelectionChanged={onSelectionChanged}
                onCellValueChanged={onCellValueChanged}
                getRowId={getRowId}
                domLayout="normal"
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransactionsPage;