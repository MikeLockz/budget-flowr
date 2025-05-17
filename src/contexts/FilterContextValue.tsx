import { createContext } from 'react';
import { FilterModel } from 'ag-grid-community';

interface FilterContextType {
  filterModel: FilterModel | null;
  setFilterModel: (model: FilterModel | null) => void;
  visibleTransactionIds: string[];
  setVisibleTransactionIds: (ids: string[]) => void;
  resetFilters: () => void;
}

export const FilterContext = createContext<FilterContextType | undefined>(undefined);