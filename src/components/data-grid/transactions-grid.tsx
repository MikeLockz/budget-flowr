import React from 'react';
import { AgGridBase } from './ag-grid-base';

interface TransactionsGridProps {
  transactions: Array<{
    id: string;
    description: string;
    categoryName: string;
    amount: number;
    date: string;
    type: string;
    status: string;
  }>;
}

export const TransactionsGrid: React.FC<TransactionsGridProps> = ({ transactions }) => {
  const columnDefs = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'description', headerName: 'Description', filter: 'text' },
    {
      field: 'categoryName',
      headerName: 'Category',
      filter: 'text',
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
      filter: 'text',
      cellRenderer: (params: { value?: string }) => {
        return params.value === 'income' ? (
          <span className="text-green-600 font-semibold">Income</span>
        ) : (
          <span className="text-red-600 font-semibold">Expense</span>
        );
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
    />
  );
};
