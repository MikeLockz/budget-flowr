import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// Not using generateId currently, but may be needed for future expansions
// import { generateId } from '../id-utils';

export type TransactionTypeClassification = 'income' | 'expense' | 'uncategorized';

export interface VisualizationSettings {
  // Transaction type classifications for charting
  typeClassifications: {
    [key: string]: TransactionTypeClassification;
  };
  // Default transaction types that are income
  defaultIncomeTypes: string[];
  // Default transaction types that are expenses
  defaultExpenseTypes: string[];
  // Add a transaction type to the classifications
  addTypeClassification: (type: string, classification: TransactionTypeClassification) => void;
  // Remove a transaction type from the classifications
  removeTypeClassification: (type: string) => void;
  // Reset to default classifications
  resetToDefaults: () => void;
}

// Default income and expense types based on the existing schema
const DEFAULT_INCOME_TYPES = ['income', 'Capital Inflow'];
const DEFAULT_EXPENSE_TYPES = ['expense', 'True Expense', 'Capital Expense', 'Capital Transfer'];

// Build the default classification map
const buildDefaultClassifications = () => {
  const classifications: { [key: string]: TransactionTypeClassification } = {};
  
  DEFAULT_INCOME_TYPES.forEach(type => {
    classifications[type] = 'income';
  });
  
  DEFAULT_EXPENSE_TYPES.forEach(type => {
    classifications[type] = 'expense';
  });
  
  return classifications;
};

export const useVisualizationSettings = create<VisualizationSettings>()(
  persist(
    (set) => ({
      typeClassifications: buildDefaultClassifications(),
      defaultIncomeTypes: DEFAULT_INCOME_TYPES,
      defaultExpenseTypes: DEFAULT_EXPENSE_TYPES,
      
      addTypeClassification: (type, classification) => 
        set((state) => {
          const newClassifications = { ...state.typeClassifications };
          newClassifications[type] = classification;
          return { typeClassifications: newClassifications };
        }),
      
      removeTypeClassification: (type) => 
        set((state) => {
          const newClassifications = { ...state.typeClassifications };
          delete newClassifications[type];
          return { typeClassifications: newClassifications };
        }),
      
      resetToDefaults: () => 
        set(() => ({
          typeClassifications: buildDefaultClassifications()
        })),
    }),
    {
      name: 'budget-flowr-visualization-settings',
    }
  )
);