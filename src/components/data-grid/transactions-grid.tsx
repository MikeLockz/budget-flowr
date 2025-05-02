import React from 'react';
import { AgGridBase } from './ag-grid-base';
import type { Transaction } from '@/lib/db';

interface TransactionsGridProps {
  transactions: Transaction[];
}

export const TransactionsGrid: React.FC<TransactionsGridProps> = ({ transactions }) => {
  const columnDefs = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'description', headerName: 'Description', filter: 'text' },
    { field: 'categoryId', headerName: 'Category', filter: 'text' },
    {
      field: 'amount',
      headerName: 'Amount',
      filter: 'number',
      valueFormatter: (params: { value: number }) => {
        return params.value ? `$${params.value.toFixed(2)}` : '';
      },
    },
    {
      field: 'date',
      headerName: 'Date',
      filter: 'date',
      valueFormatter: (params: { value: string }) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        return date.toLocaleDateString();
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
      paginationPageSize={10}
      rowSelection={{ mode: 'multiRow' }}
    />
  );
};
