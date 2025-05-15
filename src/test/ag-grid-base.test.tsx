import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgGridBase, ExampleDataGrid } from '../components/data-grid/ag-grid-base';

// Mock the AgGridReact component
vi.mock('ag-grid-react', () => ({
  AgGridReact: () => <div data-testid="ag-grid-mock" />
}));

// Mock the ModuleRegistry
vi.mock('ag-grid-community', () => ({
  ModuleRegistry: {
    registerModules: vi.fn()
  },
  ClientSideRowModelModule: {},
  ClientSideRowModelApiModule: {},
  ValidationModule: {},
  PaginationModule: {},
  RowSelectionModule: {},
  TextFilterModule: {},
  NumberFilterModule: {},
  DateFilterModule: {},
  CustomFilterModule: {},
  ColumnAutoSizeModule: {},
  TextEditorModule: {}
}));

// Sample data for testing
const mockRowData = [
  { id: 1, name: 'Test 1' },
  { id: 2, name: 'Test 2' },
];

const mockColumnDefs = [
  { field: 'id', headerName: 'ID' },
  { field: 'name', headerName: 'Name' },
];

describe('AgGridBase component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });
  
  it('renders with required props', () => {
    const { container } = render(
      <AgGridBase
        rowData={mockRowData}
        columnDefs={mockColumnDefs}
      />
    );
    
    // Check if the component renders
    expect(container).toBeTruthy();
  });
  
  it('applies theme class', () => {
    const { container } = render(
      <AgGridBase
        rowData={mockRowData}
        columnDefs={mockColumnDefs}
      />
    );
    
    // Check if the ag-theme-alpine class is applied
    expect(container.firstChild).toHaveClass('ag-theme-alpine');
  });
  
  it('applies custom className and style', () => {
    const { container } = render(
      <AgGridBase
        rowData={mockRowData}
        columnDefs={mockColumnDefs}
        className="custom-class"
        style={{ height: '600px' }}
      />
    );
    
    // Check if custom class is applied
    expect(container.firstChild).toHaveClass('custom-class');
    
    // Check if custom style is applied
    const gridDiv = container.firstChild as HTMLElement;
    expect(gridDiv.style.height).toBe('600px');
  });
});

describe('ExampleDataGrid component', () => {
  it('renders without errors', () => {
    const { container } = render(<ExampleDataGrid />);
    
    // Check if the component renders
    expect(container).toBeTruthy();
  });
});
