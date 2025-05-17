import React, { useState, ReactNode } from 'react';
import { FilterModel } from 'ag-grid-community';
import { FilterContext } from './FilterContextValue';

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
