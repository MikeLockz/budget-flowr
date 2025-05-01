import '@testing-library/react';
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

/**
 * Mock window.matchMedia for tests to avoid errors
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

import { vi } from 'vitest';

// Mock echarts for tests to prevent canvas context errors
vi.mock('echarts', () => {
  const mockChart = {
    setOption: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    resize: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn(),
  };
  return {
    init: vi.fn(() => mockChart),
    getInstanceByDom: vi.fn(() => mockChart),
  };
});

import React from 'react';

// Mock AG Grid for tests
vi.mock('ag-grid-react', () => {
  return {
    AgGridReact: vi.fn(({ onGridReady, rowData, columnDefs }) => {
      // Call onGridReady with mock params if provided
      if (onGridReady) {
        const mockApi = {
          sizeColumnsToFit: vi.fn(),
        };
        onGridReady({ api: mockApi });
      }
      
      // Return a simple div that shows we're rendering the grid
      return React.createElement('div', { 'data-testid': 'ag-grid-react' }, [
        React.createElement('div', { 'data-testid': 'row-data-length', key: 'row-data' }, rowData?.length || 0),
        React.createElement('div', { 'data-testid': 'column-defs-length', key: 'column-defs' }, columnDefs?.length || 0)
      ]);
    })
  };
});

vi.mock('ag-grid-community', async () => {
  return {
    ModuleRegistry: {
      registerModules: vi.fn(),
    },
    ClientSideRowModelModule: 'ClientSideRowModelModule',
    ValidationModule: 'ValidationModule',
    PaginationModule: 'PaginationModule',
    RowSelectionModule: 'RowSelectionModule',
    TextFilterModule: 'TextFilterModule',
    NumberFilterModule: 'NumberFilterModule',
    DateFilterModule: 'DateFilterModule',
    CustomFilterModule: 'CustomFilterModule',
    ColumnAutoSizeModule: 'ColumnAutoSizeModule',
  };
});

// Mock AG Grid styles
vi.mock('ag-grid-community/styles/ag-theme-alpine.css', () => ({}));
