import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, GridApi, ClientSideRowModelModule, ValidationModule, ModuleRegistry, PaginationModule, RowSelectionModule, TextFilterModule, NumberFilterModule, DateFilterModule, CustomFilterModule, ColumnAutoSizeModule } from 'ag-grid-community';

// Import AG Grid styles
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ValidationModule,
  PaginationModule,
  RowSelectionModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CustomFilterModule,
  ColumnAutoSizeModule,
]);



interface AgGridBaseProps<TData = Record<string, unknown>> {
  rowData: TData[];
  columnDefs: ColDef<TData>[];
  defaultColDef?: ColDef;
  className?: string;
  style?: React.CSSProperties;
  pagination?: boolean;
  paginationPageSize?: number;
  rowSelection?: { mode: 'singleRow' | 'multiRow' } | undefined;
  onGridReady?: (params: GridReadyEvent) => void;
  onSelectionChanged?: (event: unknown) => void;
  domLayout?: 'normal' | 'autoHeight' | 'print';
}

/**
 * Base AG Grid component with enterprise features
 */
export const AgGridBase: React.FC<AgGridBaseProps> = ({
  rowData,
  columnDefs,
  defaultColDef = {
    flex: 1,
    minWidth: 100,
    sortable: true,
    filter: true,
    resizable: true,
  },
  className,
  style,
  pagination = false,
  paginationPageSize = 10,
  rowSelection,
  onGridReady,
  onSelectionChanged,
  domLayout,
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const handleGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    
    // Call the provided onGridReady callback if it exists
    if (onGridReady) {
      onGridReady(params);
    }
    
    // Auto-size columns after data is loaded
    params.api.sizeColumnsToFit();
  }, [onGridReady]);

  // Handle window resize to adjust grid size
  useEffect(() => {
    const handleResize = () => {
      if (gridApi) {
        gridApi.sizeColumnsToFit();
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [gridApi]);

  return (
    <div 
      className={`ag-theme-alpine ${className || ''}`} 
      style={{ width: '100%', height: '500px', ...style }}
    >
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pagination={pagination}
      paginationPageSize={paginationPageSize}
      paginationPageSizeSelector={[100, 500, 1000]}
      rowSelection={rowSelection}
      onGridReady={handleGridReady}
    onSelectionChanged={onSelectionChanged}
    domLayout={domLayout}
    modules={[
      ClientSideRowModelModule,
      ValidationModule,
      PaginationModule,
      RowSelectionModule,
      TextFilterModule,
      NumberFilterModule,
      DateFilterModule,
      CustomFilterModule,
      ColumnAutoSizeModule,
    ]}
  />
    </div>
  );
};

/**
 * Example usage of the AgGridBase component with sample data
 */
export const ExampleDataGrid: React.FC = () => {
  // Sample column definitions
  const columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', filter: 'text' },
    { field: 'category', headerName: 'Category', filter: 'text' },
    { 
      field: 'amount', 
      headerName: 'Amount', 
      filter: 'number',
      valueFormatter: (params) => {
        return params.value ? `$${params.value.toFixed(2)}` : '';
      }
    },
    { 
      field: 'date', 
      headerName: 'Date', 
      filter: 'date',
      valueFormatter: (params) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        return date.toLocaleDateString();
      }
    },
    { field: 'status', headerName: 'Status' },
  ];

  // Sample row data
  const rowData = [
    { id: 1, name: 'Groceries', category: 'Food', amount: 125.50, date: '2025-04-15', status: 'Completed' },
    { id: 2, name: 'Rent', category: 'Housing', amount: 1200.00, date: '2025-04-01', status: 'Completed' },
    { id: 3, name: 'Electricity', category: 'Utilities', amount: 85.20, date: '2025-04-10', status: 'Pending' },
    { id: 4, name: 'Internet', category: 'Utilities', amount: 65.00, date: '2025-04-05', status: 'Completed' },
    { id: 5, name: 'Gym Membership', category: 'Health', amount: 50.00, date: '2025-04-15', status: 'Upcoming' },
    { id: 6, name: 'Dining Out', category: 'Food', amount: 78.30, date: '2025-04-18', status: 'Completed' },
    { id: 7, name: 'Gas', category: 'Transportation', amount: 45.80, date: '2025-04-12', status: 'Completed' },
    { id: 8, name: 'Phone Bill', category: 'Utilities', amount: 55.00, date: '2025-04-20', status: 'Upcoming' },
    { id: 9, name: 'Movie Tickets', category: 'Entertainment', amount: 32.50, date: '2025-04-22', status: 'Upcoming' },
    { id: 10, name: 'Savings', category: 'Financial', amount: 500.00, date: '2025-04-30', status: 'Upcoming' },
  ];

  // Custom default column definitions
  const defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    sortable: true,
    filter: true,
    resizable: true,
  };

  return (
    <AgGridBase
      rowData={rowData}
      columnDefs={columnDefs}
      defaultColDef={defaultColDef}
      pagination={true}
      paginationPageSize={5}
      rowSelection={{ mode: 'multiRow' }}
    />
  );
};
