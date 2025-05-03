import React, { useEffect, useState } from 'react';
import { AgGridBase } from './ag-grid-base';
import type { Transaction, Category } from '@/lib/db';
import { categoryRepository } from '@/lib/repositories';

interface TransactionsGridProps {
  transactions: Transaction[];
}

export const TransactionsGrid: React.FC<TransactionsGridProps> = ({ transactions }) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      const cats = await categoryRepository.getAll();
      setCategories(cats);
    }
    fetchCategories();
  }, []);

  const categoryIdToName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  const columnDefs = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'description', headerName: 'Description', filter: 'text' },
    {
      field: 'categoryId',
      headerName: 'Category',
      filter: 'text',
      valueGetter: (params: import('ag-grid-community').ValueGetterParams) => categoryIdToName(params.data?.categoryId ?? ''),
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
      autoHeight={true}
    />
  );
};
