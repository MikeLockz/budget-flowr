import React, { createContext, useState, useContext, ReactNode } from 'react';
import { FilterModel } from 'ag-grid-community';

interface FilterContextType {
  filterModel: FilterModel | null;
  setFilterModel: (model: FilterModel | null) => void;
  visibleTransactionIds: string[];
  setVisibleTransactionIds: (ids: string[]) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filterModel, setFilterModel] = useState<FilterModel | null>(null);
  const [visibleTransactionIds, setVisibleTransactionIdsState] = useState<string[]>([]);

  const setVisibleTransactionIds = (ids: string[]) => {
    console.log('FILTER CONTEXT: Setting visible transaction IDs:', ids);
    setVisibleTransactionIdsState(ids);
  };

  console.log('FILTER CONTEXT: Initialized with visibleTransactionIds:', visibleTransactionIds);

  const resetFilters = () => {
    setFilterModel(null);
    setVisibleTransactionIdsState([]);
  };

  return (
    <FilterContext.Provider value={{ 
      filterModel, 
      setFilterModel, 
      visibleTransactionIds, 
      setVisibleTransactionIds,
      resetFilters 
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};
