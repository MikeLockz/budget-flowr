import React from 'react';
import { AgGridBase } from './ag-grid-base';
import { useFilterContext } from '@/contexts/FilterContext';

interface TransactionsGridProps {
  transactions: Array<{
    id: string;
    description: string;
    categoryName: string;
    categoryId: string;
    amount: number;
    date: string;
    type: string;
    status: string;
  }>;
}

export const TransactionsGrid: React.FC<TransactionsGridProps> = ({ transactions }) => {
  const { setVisibleTransactionIds } = useFilterContext();

  const columnDefs = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'categoryId', headerName: 'Category ID', filter: 'agTextColumnFilter', hide: true },
    { field: 'description', headerName: 'Description', filter: 'agTextColumnFilter' },
    {
      field: 'categoryName',
      headerName: 'Category',
      filter: 'agTextColumnFilter',
    },
    {
      field: 'amount',
      headerName: 'Amount',
      filter: 'number',
      valueFormatter: (params: { value?: number }) => {
        return params.value ? `$${params.value.toFixed(2)}` : '';
      },
    },
    {
      field: 'date',
      headerName: 'Date',
      filter: 'date',
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
      cellRenderer: (params: { value?: string }) => {
        // Keep existing styling for income and expense
        if (params.value === 'income') {
          return <span className="text-green-600 font-semibold">Income</span>;
        } else if (params.value === 'expense') {
          return <span className="text-red-600 font-semibold">Expense</span>;
        }
        // Use default styling for new transaction types
        return <span>{params.value}</span>;
      },
    },
    { field: 'status', headerName: 'Status' },
  ];

  // Cast transactions to unknown[] to satisfy AgGridBase typing
  const rowData = transactions as unknown as Record<string, unknown>[];


  return (
    <AgGridBase
      rowData={rowData}
      columnDefs={columnDefs}
      pagination={true}
      paginationPageSize={100}
      rowSelection={{ mode: 'multiRow' }}
      domLayout="autoHeight"
      onGridReady={(params) => {
        params.api.sizeColumnsToFit();
      }}
      onFilterChanged={(event: { api: { forEachNodeAfterFilter: (callback: (node: { data: { id: string } }) => void) => void } }) => {
        console.log('FILTER EVENT: onFilterChanged triggered', event);
        const filteredIds: string[] = [];
        event.api.forEachNodeAfterFilter((node: { data: { id: string } }) => {
          console.log('FILTER EVENT: Processing node with id:', node.data.id);
          filteredIds.push(node.data.id);
        });
        console.log('FILTER EVENT: Filtered transaction IDs collected:', filteredIds, 'Count:', filteredIds.length);
        setVisibleTransactionIds(filteredIds);
      }}
    />
  );
}
