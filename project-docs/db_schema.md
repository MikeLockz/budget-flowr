# Personal Finance Management System: Data Schema Design & Implementation Recommendations

## 1. Core Entities

### 1.1 User
```
User {
  userId: UUID (PK)
  username: String
  email: String
  passwordHash: String
  createdAt: DateTime
  lastLogin: DateTime
  preferences: JSON // Display settings, notification preferences, etc.
  regionalSettings: {
    currency: String
    dateFormat: String
    language: String
  }
}
```

### 1.2 Account
```
Account {
  accountId: UUID (PK)
  userId: UUID (FK -> User.userId)
  name: String
  type: Enum [Checking, Savings, Credit, Investment, Loan, Cash]
  balance: Decimal
  openDate: Date
  lastUpdated: DateTime
  isActive: Boolean
  institutionName: String
  accountNumber: String (encrypted)
  notes: String
}
```

### 1.3 Category
```
Category {
  categoryId: UUID (PK)
  userId: UUID (FK -> User.userId)
  name: String
  type: Enum [Income, Expense, Transfer]
  parentCategoryId: UUID (FK -> Category.categoryId, nullable)
  isSystem: Boolean // Indicates if it's a system default or user-created
  isHidden: Boolean
  iconIdentifier: String
  color: String
  defaultRules: JSON // Auto-categorization rules
}
```

### 1.4 Transaction
```
Transaction {
  transactionId: UUID (PK)
  userId: UUID (FK -> User.userId)
  accountId: UUID (FK -> Account.accountId)
  amount: Decimal
  date: DateTime
  description: String
  payee: String
  status: Enum [Pending, Cleared, Reconciled]
  importId: String // External identifier for duplicate detection
  isReconciled: Boolean
  notes: String
  tags: String[]
  receiptImage: BinaryData (optional)
  isCapitalPurchase: Boolean // Flag for capital purchases
  linkedTransactionId: UUID (FK -> Transaction.transactionId, nullable) // For transfers or credit card payments
  createdAt: DateTime
  updatedAt: DateTime
  isDeleted: Boolean
}
```

### 1.5 TransactionCategory
```
TransactionCategory {
  transactionCategoryId: UUID (PK)
  transactionId: UUID (FK -> Transaction.transactionId)
  categoryId: UUID (FK -> Category.categoryId)
  amount: Decimal // For split transactions
  percentage: Decimal (optional) // For percentage-based splits
  notes: String
}
```

## 2. Capital Asset Management

### 2.1 CapitalAsset
```
CapitalAsset {
  assetId: UUID (PK)
  userId: UUID (FK -> User.userId)
  name: String
  description: String
  purchaseTransactionId: UUID (FK -> Transaction.transactionId, nullable)
  purchaseDate: Date
  purchaseAmount: Decimal
  assetCategoryId: UUID (FK -> AssetCategory.categoryId)
  currentValue: Decimal
  status: Enum [Active, Sold, Donated, Discarded]
  dispositionDate: Date (nullable)
  dispositionAmount: Decimal (nullable)
  notes: String
  images: BinaryData[] (optional)
  documents: BinaryData[] (optional)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 2.2 AssetCategory
```
AssetCategory {
  categoryId: UUID (PK)
  userId: UUID (FK -> User.userId)
  name: String
  defaultUsefulLife: Integer // In months
  defaultDepreciationMethod: Enum [StraightLine, DoubleDeclining, etc.]
  defaultSalvageValuePct: Decimal
  isSystem: Boolean
}
```

### 2.3 AssetDepreciation
```
AssetDepreciation {
  depreciationId: UUID (PK)
  assetId: UUID (FK -> CapitalAsset.assetId)
  depreciationMethod: Enum [StraightLine, DoubleDeclining, etc.]
  usefulLife: Integer // In months
  salvageValue: Decimal
  startDate: Date
  endDate: Date
  isActive: Boolean
}
```

### 2.4 AssetDepreciationSchedule
```
AssetDepreciationSchedule {
  scheduleId: UUID (PK)
  depreciationId: UUID (FK -> AssetDepreciation.depreciationId)
  periodStart: Date
  periodEnd: Date
  depreciationAmount: Decimal
  accumulatedDepreciation: Decimal
  remainingValue: Decimal
}
```

### 2.5 AssetMaintenance
```
AssetMaintenance {
  maintenanceId: UUID (PK)
  assetId: UUID (FK -> CapitalAsset.assetId)
  date: Date
  description: String
  cost: Decimal
  transactionId: UUID (FK -> Transaction.transactionId, nullable)
  type: Enum [ScheduledMaintenance, Repair, Improvement]
  notes: String
  receiptImage: BinaryData (optional)
  createdAt: DateTime
}
```

## 3. Virtual Sinking Fund Management

### 3.1 SinkingFund
```
SinkingFund {
  fundId: UUID (PK)
  userId: UUID (FK -> User.userId)
  name: String
  purpose: String
  targetAmount: Decimal
  startDate: Date
  targetDate: Date
  currentBalance: Decimal
  linkedAssetId: UUID (FK -> CapitalAsset.assetId, nullable)
  visualTheme: String
  priority: Integer
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 3.2 SinkingFundContribution
```
SinkingFundContribution {
  contributionId: UUID (PK)
  fundId: UUID (FK -> SinkingFund.fundId)
  amount: Decimal
  date: Date
  description: String
  transactionId: UUID (FK -> Transaction.transactionId, nullable)
  type: Enum [Contribution, Withdrawal, Reallocation]
  isAutomated: Boolean
  notes: String
  createdAt: DateTime
}
```

### 3.3 SinkingFundSchedule
```
SinkingFundSchedule {
  scheduleId: UUID (PK)
  fundId: UUID (FK -> SinkingFund.fundId)
  contributionAmount: Decimal
  frequency: Enum [Weekly, Biweekly, Monthly, Quarterly, Annually]
  nextDueDate: Date
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

## 4. Reporting and Analysis

### 4.1 Budget
```
Budget {
  budgetId: UUID (PK)
  userId: UUID (FK -> User.userId)
  name: String
  startDate: Date
  endDate: Date (nullable) // For recurring budgets
  type: Enum [Monthly, Annual, Custom]
  isActive: Boolean
  notes: String
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 4.2 BudgetCategory
```
BudgetCategory {
  budgetCategoryId: UUID (PK)
  budgetId: UUID (FK -> Budget.budgetId)
  categoryId: UUID (FK -> Category.categoryId)
  amount: Decimal
  rolloverAmount: Boolean // Whether to roll over unused amounts
  notes: String
}
```

### 4.3 ReportConfiguration
```
ReportConfiguration {
  configId: UUID (PK)
  userId: UUID (FK -> User.userId)
  name: String
  type: Enum [CashBased, Amortized, Comparative]
  dateRange: {
    startDate: Date
    endDate: Date
    isRelative: Boolean // For "last 3 months" type configurations
    relativePeriod: String (nullable) // "3 months", "1 year", etc.
  }
  filters: JSON
  groupBy: String[]
  displayOptions: JSON
  isFavorite: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 4.4 AmortizedExpenseCache
```
AmortizedExpenseCache {
  cacheId: UUID (PK)
  userId: UUID (FK -> User.userId)
  periodStart: Date
  periodEnd: Date
  categoryId: UUID (FK -> Category.categoryId, nullable)
  assetId: UUID (FK -> CapitalAsset.assetId, nullable)
  amount: Decimal
  calculatedAt: DateTime
}
```

## 5. Decision Support

### 5.1 FinancialGoal
```
FinancialGoal {
  goalId: UUID (PK)
  userId: UUID (FK -> User.userId)
  name: String
  type: Enum [Saving, DebtReduction, AssetAcquisition, etc.]
  targetAmount: Decimal
  currentAmount: Decimal
  startDate: Date
  targetDate: Date
  priority: Integer
  status: Enum [Active, Achieved, Abandoned]
  linkedFundId: UUID (FK -> SinkingFund.fundId, nullable)
  notes: String
  visualTheme: String
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 5.2 ScenarioModel
```
ScenarioModel {
  scenarioId: UUID (PK)
  userId: UUID (FK -> User.userId)
  name: String
  description: String
  baselineDate: Date
  variables: JSON
  assumptions: JSON
  outcomes: JSON
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

## 6. System Management

### 6.1 ImportSession
```
ImportSession {
  sessionId: UUID (PK)
  userId: UUID (FK -> User.userId)
  source: String
  startTime: DateTime
  endTime: DateTime (nullable)
  status: Enum [InProgress, Completed, Failed]
  recordsTotal: Integer
  recordsProcessed: Integer
  recordsSkipped: Integer
  errors: JSON
  metadata: JSON
}
```

### 6.2 AutomationRule
```
AutomationRule {
  ruleId: UUID (PK)
  userId: UUID (FK -> User.userId)
  name: String
  type: Enum [Categorization, CapitalPurchase, Notification, Tagging]
  conditions: JSON
  actions: JSON
  priority: Integer
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
  lastTriggered: DateTime (nullable)
  timesTriggered: Integer
}
```

### 6.3 Backup
```
Backup {
  backupId: UUID (PK)
  userId: UUID (FK -> User.userId)
  filename: String
  size: Integer
  createdAt: DateTime
  contentHash: String
  metadata: JSON
  isAutomatic: Boolean
}
```

## 7. Entity Relationships

### 7.1 Key Relationships
- User -> Accounts (1:N)
- User -> Categories (1:N)
- User -> Transactions (1:N)
- Account -> Transactions (1:N)
- Transaction -> TransactionCategories (1:N)
- Category -> TransactionCategories (1:N)
- Transaction -> CapitalAsset (1:1) for purchase transactions
- CapitalAsset -> AssetDepreciation (1:1)
- AssetDepreciation -> AssetDepreciationSchedule (1:N)
- CapitalAsset -> AssetMaintenance (1:N)
- User -> SinkingFunds (1:N)
- SinkingFund -> SinkingFundContributions (1:N)
- SinkingFund -> SinkingFundSchedule (1:1)
- CapitalAsset -> SinkingFund (1:1) for replacement funds
- User -> Budgets (1:N)
- Budget -> BudgetCategories (1:N)
- Category -> BudgetCategories (1:N)
- User -> ReportConfigurations (1:N)
- User -> FinancialGoals (1:N)
- SinkingFund -> FinancialGoal (1:1) for saving goals
- User -> ScenarioModels (1:N)
- User -> ImportSessions (1:N)
- User -> AutomationRules (1:N)
- User -> Backups (1:N)

## 8. Indexing Considerations

For optimal performance, the following indexes should be created:

### 8.1 Transaction Indexes
- (userId, date) for date-range queries
- (accountId, date) for account statement views
- (isCapitalPurchase) for quick identification of capital purchases
- (importId) for duplicate detection during imports
- (linkedTransactionId) for related transaction lookups

### 8.2 CapitalAsset Indexes
- (userId, status) for active asset queries
- (purchaseDate) for chronological asset listing
- (assetCategoryId) for category-based queries

### 8.3 SinkingFund Indexes
- (userId, isActive) for active fund queries
- (targetDate) for timeline sorting
- (linkedAssetId) for asset-related fund lookups

### 8.4 Category Indexes
- (userId, type) for income/expense category filtering
- (parentCategoryId) for hierarchical category queries

## 9. Data Integrity Constraints

- On User deletion: Cascade to all related entities
- On Account deletion: Set isDeleted flag on transactions, don't physically delete
- On Transaction deletion: Set isDeleted flag, don't physically delete
- On Category deletion: Prevent if has transactions, or offer merge option
- On CapitalAsset deletion: Set to inactive, don't physically delete

## 10. Storage Considerations

### 10.1 Binary Data Storage
- Receipt images should be stored outside the main database with references
- Asset documents and images should be stored outside the main database with references
- Consider compression for all binary data

### 10.2 Archiving Strategy
- Transactions older than X years (configurable) could be archived to improve performance
- Archived data should still be accessible but may require special loading

## 11. Security Notes

- All sensitive data (account numbers, etc.) must be encrypted at rest
- Passwords must be stored as secure hashes, not encrypted
- All data is stored locally on the user's device
- Backup files should be encrypted with user-provided or system-generated keys

## 12. Browser-Based Implementation Recommendations

Based on your requirements for a browser-based application without a backend that can handle up to 10,000 records, here are the recommended technologies that align with your existing stack:

### 12.1 Client-Side Database: IndexedDB with Dexie.js

[Dexie.js](https://dexie.org/) is recommended as the primary database solution for your application because:
- It's a lightweight wrapper around IndexedDB that simplifies its complex API
- It offers excellent performance for handling thousands of records
- It provides a clean, Promise-based API that works well with React and TypeScript
- It supports complex querying, indexing, and transactions needed for financial data
- It integrates well with your existing React stack

### 12.2 Implementation Approach

```typescript
// Example Dexie.js setup for your application
import Dexie from 'dexie';

export class FinanceDatabase extends Dexie {
  // Define tables
  transactions: Dexie.Table<TransactionType, string>;
  categories: Dexie.Table<CategoryType, string>;
  accounts: Dexie.Table<AccountType, string>;
  capitalAssets: Dexie.Table<CapitalAssetType, string>;
  sinkingFunds: Dexie.Table<SinkingFundType, string>;
  // Add other tables as needed
  
  constructor() {
    super('FinanceDatabase');
    
    // Define schema
    this.version(1).stores({
      transactions: 'transactionId, accountId, date, isCapitalPurchase, *tags',
      categories: 'categoryId, parentCategoryId, type',
      accounts: 'accountId, type',
      capitalAssets: 'assetId, purchaseDate, status, assetCategoryId',
      sinkingFunds: 'fundId, targetDate, priority, linkedAssetId',
      // Add other tables with their indices
    });
  }
}

export const db = new FinanceDatabase();
```

### 12.3 React Integration with Dexie React Hooks

For real-time data reactivity in your React components:

```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './database';

function TransactionList() {
  const transactions = useLiveQuery(
    () => db.transactions.where('date').above(new Date('2023-01-01')).toArray()
  );
  
  return (
    // Render transactions with your UI components
  );
}
```

### 12.4 State Management Integration

With your AG Grid and visualization components, you can:
- Use Zustand for UI state management
- Connect Dexie.js data with AG Grid for transaction display and filtering
- Feed data from Dexie.js to Apache ECharts for visualizations

### 12.5 Backup and Export Strategy

For data persistence and portability:
- Implement JSON export/import functionality
- Add CSV export for compatibility with spreadsheet applications
- Create a backup system using the browser's download capabilities

### 12.6 Performance Considerations

For optimal performance with 10,000 records:
- Use compound indices for frequently queried fields
- Implement pagination for large result sets
- Utilize bulk operations for batch modifications
- Consider using web workers for heavy data processing

## 13. Future Backend Integration Capabilities

The application can be designed with future backend integration in mind. Here are approaches for extending the system:

### 13.1 Sync Architecture Options

#### Option 1: Use Dexie.Syncable

Dexie provides a synchronization extension called Dexie.Syncable that enables two-way synchronization with remote databases:

```typescript
// When ready to add backend synchronization:
import 'dexie-observable';
import 'dexie-syncable';

// Register a sync protocol implementation
Dexie.Syncable.registerSyncProtocol("myProtocol", {
  sync: function (context, url, options, baseRevision, syncedRevision, changes, partial, applyRemoteChanges, onSuccess, onError) {
    // Implement sync protocol with your backend
  }
});

// Connect to your backend
db.syncable.connect("myProtocol", "https://your-backend-url/api");
```

#### Option 2: Build a Custom Synchronization Layer

For more flexibility, you can implement a custom synchronization strategy:

```typescript
// Track local changes using Dexie hooks
db.transaction('rw', db.transactions, async () => {
  // Set up hooks for tracking changes
  db.transactions.hook('creating', function(primKey, obj) {
    obj.pendingSync = true;
    obj.lastModified = new Date();
  });
  
  db.transactions.hook('updating', function(mods, primKey, obj) {
    return { 
      ...mods, 
      pendingSync: true, 
      lastModified: new Date() 
    };
  });
});

// Synchronization function to run when online
async function syncWithBackend() {
  // Get all records pending sync
  const pendingChanges = await db.transactions
    .where('pendingSync').equals(true)
    .toArray();
    
  // Send to backend
  const response = await fetch('https://your-backend/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pendingChanges)
  });
  
  // Process response and mark as synced
  if (response.ok) {
    await db.transaction('rw', db.transactions, async () => {
      for (const change of pendingChanges) {
        await db.transactions.update(change.transactionId, {
          pendingSync: false,
          lastSynced: new Date()
        });
      }
    });
  }
}
```

### 13.2 Backend Preparation Considerations

For a smooth transition to a backend database in the future:

1. **Use UUIDs for Primary Keys**: Ensure all records use globally unique identifiers (UUIDs) instead of auto-incremented values to avoid synchronization conflicts

2. **Add Sync Metadata**: Include fields for tracking synchronization state in your schema:
   ```typescript
   {
     lastModified: Date,  // When the record was last changed
     pendingSync: Boolean, // Whether changes need to be sent to server
     lastSynced: Date,     // When the record was last synchronized
     syncVersion: Number   // For conflict resolution
   }
   ```

3. **Conflict Resolution Strategy**: Design your data model with conflict resolution in mind:
   - Consider using a "last write wins" approach for simple cases
   - For more complex needs, store multiple versions of conflicting records
   - Implement merging strategies for specific entity types

4. **API Design**: Plan your backend API to support efficient synchronization:
   - Bulk operations for sending multiple changes
   - Delta updates to minimize data transfer
   - Versioning information for conflict detection

By implementing these strategies, your application will be well-prepared for a future migration to include backend synchronization while maintaining the current offline-first approach.