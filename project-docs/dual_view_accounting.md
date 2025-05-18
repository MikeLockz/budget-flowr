# Dual-View Accounting Implementation

## Overview
This document outlines the requirements and technical approach for implementing dual-view accounting in Budget Flowr, enabling users to view their finances from both cash-based and amortized perspectives.

## Background
Dual-view accounting provides two different perspectives on financial transactions:
- **Cash-based view**: Shows transactions when money physically changes hands (e.g., a $1,200 laptop purchase appears as a $1,200 expense in the month of purchase)
- **Amortized view**: Spreads the cost of capital purchases over their useful life (e.g., the same $1,200 laptop might appear as $33.33/month over 36 months)

This feature aligns with Budget Flowr's goal of providing deeper financial insights through multiple accounting perspectives.

## Technical Requirements

### 1. Database Schema Changes

#### 1.1 Transaction Updates
Extend the Transaction schema to include:
```typescript
interface Transaction {
  // Existing fields
  id: string;
  date: string;
  description: string;
  categoryId: string;
  amount: number;
  type: string; // 'income', 'expense', 'Capital Expense', etc.
  // ...
  
  // New field
  amortizeLength?: number; // Number of years to amortize a capital expense
}
```

#### 1.2 New AmortizationEntry Table
Create a new table for storing amortized entries:
```typescript
interface AmortizationEntry {
  id: string;
  originalTransactionId: string; // References the capital expense transaction
  date: string;                  // Date for this portion of the expense
  amount: number;                // Amortized amount for this period
  description?: string;          // Optional description
  categoryId: string;            // Same as original transaction
}
```

#### 1.3 Database Migration
Add the necessary Dexie migration to update the schema:
```typescript
// In db-migrations.ts
export function migrateToVersion5(db: Dexie): void {
  db.version(5).stores({
    transactions: 'id, date, categoryId, type, status, accountId, [date+amount+description], archived, amortizeLength',
    amortizationEntries: 'id, originalTransactionId, date, categoryId'
  });
}
```

### 2. Amortization Service

Create a service to handle amortization calculations:
```typescript
// src/lib/amortization-service.ts
export class AmortizationService {
  // Calculate and save amortization entries for a capital expense
  async createAmortizationEntries(transaction: Transaction): Promise<void> {
    if (transaction.type !== 'Capital Expense' || !transaction.amortizeLength) {
      return;
    }
    
    // Delete any existing entries for this transaction
    await this.deleteExistingEntries(transaction.id);
    
    // Calculate monthly amount
    const monthlyAmount = transaction.amount / (transaction.amortizeLength * 12);
    
    // Generate entries
    const entries: AmortizationEntry[] = [];
    const startDate = new Date(transaction.date);
    
    for (let i = 0; i < transaction.amortizeLength * 12; i++) {
      const entryDate = new Date(startDate);
      entryDate.setMonth(startDate.getMonth() + i);
      
      entries.push({
        id: generateId(),
        originalTransactionId: transaction.id,
        date: entryDate.toISOString(),
        amount: monthlyAmount,
        description: `${transaction.description} (Amortized ${i+1}/${transaction.amortizeLength * 12})`,
        categoryId: transaction.categoryId
      });
    }
    
    // Save entries to database
    await db.amortizationEntries.bulkAdd(entries);
  }
  
  // Delete existing amortization entries for a transaction
  async deleteExistingEntries(transactionId: string): Promise<void> {
    await db.amortizationEntries
      .where('originalTransactionId')
      .equals(transactionId)
      .delete();
  }
  
  // Update amortization entries when a transaction changes
  async updateAmortizationEntries(transaction: Transaction): Promise<void> {
    // Simply recreate all entries
    await this.createAmortizationEntries(transaction);
  }
}
```

### 3. Repository Layer Updates

Extend the transaction repository to handle amortization:
```typescript
// src/lib/repositories.ts
export class TransactionRepository extends BaseRepository<Transaction> {
  private amortizationService: AmortizationService;
  
  constructor() {
    super('transactions');
    this.amortizationService = new AmortizationService();
  }
  
  // Override save to handle amortization
  async save(transaction: Transaction): Promise<string> {
    const id = await super.save(transaction);
    
    // If this is a capital expense with amortizeLength, create amortization entries
    if (transaction.type === 'Capital Expense' && transaction.amortizeLength) {
      await this.amortizationService.createAmortizationEntries({...transaction, id});
    }
    
    return id;
  }
  
  // Override update to handle amortization changes
  async update(id: string, data: Partial<Transaction>): Promise<void> {
    await super.update(id, data);
    
    // Get the updated transaction
    const transaction = await this.getById(id);
    
    // If amortizeLength was modified or this is a capital expense, update entries
    if (transaction.type === 'Capital Expense' && transaction.amortizeLength) {
      await this.amortizationService.updateAmortizationEntries(transaction);
    }
  }
  
  // Add method to get amortized view data
  async getAmortizedViewData(
    startDate?: string, 
    endDate?: string
  ): Promise<(Transaction | AmortizationEntry)[]> {
    // Get regular transactions
    const transactions = await this.getAll(startDate, endDate);
    
    // Get amortization entries in the same date range
    const amortizationEntries = await db.amortizationEntries
      .where('date')
      .between(
        startDate || '0000-01-01', 
        endDate || '9999-12-31'
      )
      .toArray();
    
    // Get IDs of capital expenses that have amortization entries
    const capitalExpenseIds = new Set(
      amortizationEntries.map(entry => entry.originalTransactionId)
    );
    
    // Filter out capital expenses that have amortization entries
    const nonCapitalExpenses = transactions.filter(
      t => t.type !== 'Capital Expense' || !capitalExpenseIds.has(t.id)
    );
    
    // Combine non-capital expenses with amortization entries
    return [...nonCapitalExpenses, ...amortizationEntries];
  }
  
  // Get both views for comparison
  async getDualViewData(
    startDate?: string, 
    endDate?: string
  ): Promise<{
    cashView: Transaction[],
    amortizedView: (Transaction | AmortizationEntry)[]
  }> {
    const cashView = await this.getAll(startDate, endDate);
    const amortizedView = await this.getAmortizedViewData(startDate, endDate);
    
    return { cashView, amortizedView };
  }
}
```

### 4. Hook Updates

Modify the `useTransactionData` hook to support different views:
```typescript
// src/hooks/use-transactions.ts
export type ViewMode = 'cash' | 'amortized' | 'dual';

export function useTransactionData(
  includeArchived: boolean = false,
  viewMode: ViewMode = 'cash'
) {
  const repo = new TransactionRepository();
  
  // Add new query for amortized view
  const amortizedQuery = useQuery(
    ['transactions', 'amortized', includeArchived],
    async () => {
      return await repo.getAmortizedViewData();
    },
    {
      enabled: viewMode === 'amortized' || viewMode === 'dual'
    }
  );
  
  // Keep existing cash view query
  const cashQuery = useQuery(
    ['transactions', 'cash', includeArchived],
    async () => {
      return await repo.getAll(undefined, undefined, includeArchived);
    },
    {
      enabled: viewMode === 'cash' || viewMode === 'dual'
    }
  );
  
  // Process data based on view mode
  const processData = () => {
    if (viewMode === 'cash') {
      return {
        transactions: cashQuery.data || [],
        isLoading: cashQuery.isLoading,
        isError: cashQuery.isError,
        categoryChartData: prepareCategoryChartData(cashQuery.data || [])
      };
    }
    
    if (viewMode === 'amortized') {
      return {
        transactions: amortizedQuery.data || [],
        isLoading: amortizedQuery.isLoading,
        isError: amortizedQuery.isError,
        categoryChartData: prepareCategoryChartData(amortizedQuery.data || [])
      };
    }
    
    // Dual view
    return {
      cashViewTransactions: cashQuery.data || [],
      amortizedViewTransactions: amortizedQuery.data || [],
      isLoading: cashQuery.isLoading || amortizedQuery.isLoading,
      isError: cashQuery.isError || amortizedQuery.isError,
      cashViewCategoryChartData: prepareCategoryChartData(cashQuery.data || []),
      amortizedViewCategoryChartData: prepareCategoryChartData(amortizedQuery.data || [])
    };
  };
  
  return processData();
}
```

### 5. Visualization State

Create a store for visualization settings:
```typescript
// src/lib/store/dual-view-settings.ts
import { create } from 'zustand';

interface DualViewState {
  viewMode: 'cash' | 'amortized' | 'dual';
  setViewMode: (mode: 'cash' | 'amortized' | 'dual') => void;
}

export const useDualViewSettings = create<DualViewState>((set) => ({
  viewMode: 'cash',
  setViewMode: (mode) => set({ viewMode: mode }),
}));
```

### 6. UI Components

#### 6.1 View Toggle Component
```typescript
// src/components/ui/view-toggle.tsx
import { Button } from '../components/ui/button';
import { useDualViewSettings } from '../lib/store/dual-view-settings';

export function ViewToggle() {
  const { viewMode, setViewMode } = useDualViewSettings();
  
  return (
    <div className="flex space-x-2">
      <Button 
        variant={viewMode === 'cash' ? 'default' : 'outline'} 
        onClick={() => setViewMode('cash')}
      >
        Cash View
      </Button>
      <Button 
        variant={viewMode === 'amortized' ? 'default' : 'outline'} 
        onClick={() => setViewMode('amortized')}
      >
        Amortized View
      </Button>
      <Button 
        variant={viewMode === 'dual' ? 'default' : 'outline'} 
        onClick={() => setViewMode('dual')}
      >
        Dual View
      </Button>
    </div>
  );
}
```

#### 6.2 Dual-View Comparison Chart
```typescript
// src/components/charts/dual-view-comparison.tsx
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart } from './echarts-base';

interface DualViewComparisonProps {
  cashData: { months: string[], data: number[] };
  amortizedData: { months: string[], data: number[] };
}

export function DualViewComparison({ cashData, amortizedData }: DualViewComparisonProps) {
  // Transform data for side-by-side bar chart
  const chartData = [
    {
      name: 'Cash-Based',
      type: 'bar',
      data: cashData.data
    },
    {
      name: 'Amortized',
      type: 'bar',
      data: amortizedData.data
    }
  ];
  
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Cash vs. Amortized Expenses</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <BarChart 
          data={chartData} 
          xAxisData={cashData.months} 
          horizontal={false} 
          stacked={false}
          showLegend={true}
        />
      </CardContent>
    </Card>
  );
}
```

### 7. Dashboard Updates

Update the Dashboard component:
```typescript
// src/pages/dashboard.tsx
import { ViewToggle } from '../components/ui/view-toggle';
import { DualViewComparison } from '../components/charts/dual-view-comparison';
import { useDualViewSettings } from '../lib/store/dual-view-settings';

export const Dashboard = () => {
  const { viewMode } = useDualViewSettings();
  const { 
    transactions, 
    cashViewTransactions,
    amortizedViewTransactions,
    // ...other data
  } = useTransactionData(false, viewMode);
  
  // Use appropriate data based on viewMode
  const displayTransactions = viewMode === 'cash' 
    ? transactions 
    : viewMode === 'amortized'
      ? transactions // already contains amortized data
      : cashViewTransactions; // default to cash view for grids
  
  // Prepare chart data for both views when in dual mode
  const prepareDualViewData = () => {
    if (viewMode !== 'dual') return null;
    
    const cashMonthlyData = prepareMonthlyChartData(cashViewTransactions, typeClassifications);
    const amortizedMonthlyData = prepareMonthlyChartData(amortizedViewTransactions, typeClassifications);
    
    return {
      cashData: {
        months: cashMonthlyData.months,
        data: cashMonthlyData.lineChartData[1].data // Expenses series
      },
      amortizedData: {
        months: amortizedMonthlyData.months,
        data: amortizedMonthlyData.lineChartData[1].data // Expenses series
      }
    };
  };
  
  const dualViewData = prepareDualViewData();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex flex-wrap space-x-2">
          {/* Add view toggle above existing filter buttons */}
          <ViewToggle />
          {/* Existing filter buttons */}
        </div>
      </div>
      
      {/* Summary Cards - show different totals based on viewMode */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Adapt existing cards to show proper totals */}
      </div>
      
      {/* Charts - conditionally render based on viewMode */}
      <div className="grid gap-4 md:grid-cols-2">
        {viewMode === 'dual' && dualViewData && (
          <DualViewComparison 
            cashData={dualViewData.cashData}
            amortizedData={dualViewData.amortizedData}
          />
        )}
        
        {/* Existing charts */}
      </div>
      
      {/* Transaction grid - displays appropriate transactions */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === 'cash' ? 'Cash Transactions' : 
             viewMode === 'amortized' ? 'Amortized Transactions' : 
             'Transactions (Cash View)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsGrid 
            transactions={displayTransactions}
            // ... other props
          />
        </CardContent>
      </Card>
    </div>
  );
};
```

### 8. Import Process Update

Extend the import process to handle amortization length:
```typescript
// src/lib/import/field-mapping-types.ts
export interface FieldMapping {
  // Existing fields
  date: string;
  description: string;
  amount: string;
  // ...
  
  // New optional field
  amortizeLength?: string;
}
```

In the transaction mapper, handle the new field:
```typescript
// src/lib/import/transaction-mapper.ts
export function mapCSVRowToTransaction(
  row: Record<string, string>,
  mapping: FieldMapping,
  // ...other params
): Transaction {
  // Existing mapping logic
  
  // Add amortizeLength handling for capital expenses
  let amortizeLength: number | undefined = undefined;
  if (
    transaction.type === 'Capital Expense' && 
    mapping.amortizeLength && 
    row[mapping.amortizeLength]
  ) {
    const value = parseFloat(row[mapping.amortizeLength]);
    amortizeLength = isNaN(value) ? undefined : value;
  }
  
  return {
    ...transaction,
    amortizeLength
  };
}
```

## Implementation Plan

### Phase 1: Database & Core Services
1. Update database schema with migration
2. Implement AmortizationService
3. Update TransactionRepository

### Phase 2: Hook & State
1. Update useTransactionData hook
2. Create dual-view settings store
3. Implement view toggle component

### Phase 3: Visualization & UI
1. Create dual-view comparison chart
2. Update dashboard component
3. Add amortizeLength to import process

### Phase 4: Testing & Refinement
1. Create test data with capital expenses and amortization
2. Test all views and comparisons
3. Refine UI based on feedback

## Conclusion
This implementation provides Budget Flowr users with the ability to view their finances from both cash-based and amortized perspectives, meeting a key goal of the project. The dual-view accounting feature gives users deeper insights into their true financial position by showing both when money is spent and how capital expenses impact their finances over time.