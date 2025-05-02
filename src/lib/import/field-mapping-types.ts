// Represents a mapping configuration between CSV columns and transaction fields
export interface FieldMapping {
  id?: string;                  // For saved configurations
  name?: string;                // User-friendly name for the configuration
  sourceIdentifier?: string;    // E.g., "Chase Bank", "Amex", etc.
  mappings: {
    date: string | null;        // CSV column name for transaction date
    description: string | null; // CSV column name for description
    amount: string | null;      // CSV column name for amount
    type: string | null;        // CSV column name for type (optional)
    categoryId: string | null;  // CSV column name for category (optional)
    status: string | null;      // CSV column name for status (optional)
    accountId: string | null;   // CSV column name for account (optional)
  };
  // Additional processing options
  options: {
    dateFormat: string;         // E.g., "MM/DD/YYYY", "YYYY-MM-DD"
    negativeAmountIsExpense: boolean;
    invertAmount: boolean;      // Some banks show expenses as positive
  };
}

// Sample data for preview
export interface PreviewData {
  rawData: Record<string, string>[];  // Original CSV data (first few rows)
  mappedTransactions: Transaction[];  // Transactions after mapping
}

// Import Transaction type from db
import { Transaction } from '@/lib/db';
