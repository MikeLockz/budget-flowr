import React from 'react';
import { AgGridBase } from './ag-grid-base';
import { useFilterContext } from '@/contexts/useFilterContext';
import { useVisualizationSettings } from '@/lib/store/visualization-settings';
import { Badge } from '@/components/ui/badge';
import { getTextColorForBackground } from '@/lib/category-colors';
import { useCategoryColors } from '@/lib/store/category-colors';

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
  categoryColors?: string[];
  categories?: string[];
}

export const TransactionsGrid: React.FC<TransactionsGridProps> = ({ 
  transactions, 
  categoryColors = [], 
  categories = []
}) => {
  const { setVisibleTransactionIds } = useFilterContext();
  const { typeClassifications } = useVisualizationSettings();

  // Get colors from the store or use provided colors as fallback
  const { colorMap: storedColorMap } = useCategoryColors();
  
  // Create a map of category names to colors
  const categoryColorMap = new Map<string, string>();
  categories.forEach((category, index) => {
    // First check if we have a stored color for this category
    if (storedColorMap[category]) {
      categoryColorMap.set(category, storedColorMap[category]);
    } 
    // Then fall back to provided colors if available
    else if (index < categoryColors.length) {
      categoryColorMap.set(category, categoryColors[index]);
    }
  });

  const columnDefs = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'categoryId', headerName: 'Category ID', filter: 'agTextColumnFilter', hide: true },
    { field: 'description', headerName: 'Description', filter: 'agTextColumnFilter' },
    {
      field: 'categoryName',
      headerName: 'Category',
      filter: 'agTextColumnFilter',
      cellRenderer: (params: { value?: string }) => {
        if (!params.value) return <span>-</span>;
        
        const color = categoryColorMap.get(params.value);
        
        if (color) {
          return (
            <Badge 
              style={{ 
                backgroundColor: color,
                color: getTextColorForBackground(color),
                borderColor: 'transparent'
              }}
            >
              {params.value}
            </Badge>
          );
        }
        
        // Default badge for categories without a specific color
        return <Badge variant="secondary">{params.value}</Badge>;
      }
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
        if (!params.value) return <span>Unknown</span>;
        
        const classification = typeClassifications[params.value];
        if (classification === 'income') {
          return <span className="text-green-600 font-semibold">{params.value}</span>;
        } else if (classification === 'expense') {
          return <span className="text-red-600 font-semibold">{params.value}</span>;
        }
        // Use default styling for uncategorized transaction types
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
