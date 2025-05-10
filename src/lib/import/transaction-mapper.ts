import { ParsedCSVData } from './csv-parser';
import { Transaction, generateUUID } from '@/lib/db';

/**
 * Converts a date string from CSV to ISO format (YYYY-MM-DD).
 * Supports common formats like MM/DD/YYYY.
 * @param dateStr - The date string from CSV
 * @returns ISO formatted date string
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    // Fallback: return original string if invalid date
    return dateStr;
  }
  return date.toISOString().split('T')[0];
}

/**
 * Parses amount string to number.
 * Removes currency symbols and commas.
 * @param amountStr - The amount string from CSV
 * @returns number
 */
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned);
}

/**
 * Determines transaction type based on amount or type field.
 * @param amountStr - The amount string from CSV
 * @param typeStr - Optional type string from CSV
 * @returns Transaction type
 */
function determineType(amountStr: string, typeStr?: string): 'income' | 'expense' | 'Capital Transfer' | 'Capital Inflow' | 'True Expense' | 'Reversed Capital Expense' | 'Reversed True Expense' {
  if (typeStr) {
    const lower = typeStr.toLowerCase().trim();
    
    // Check for matches with new transaction types (case insensitive, more flexible)
    // Check reversed types first (more specific)
    if (lower.includes('reversed') && lower.includes('capital') && lower.includes('expense')) return 'Reversed Capital Expense';
    if (lower.includes('reversed') && lower.includes('true') && lower.includes('expense')) return 'Reversed True Expense';
    // Then check non-reversed types (more general)
    if (lower.includes('capital') && lower.includes('transfer')) return 'Capital Transfer';
    if (lower.includes('capital') && lower.includes('inflow')) return 'Capital Inflow';
    if (lower.includes('true') && lower.includes('expense')) return 'True Expense';
    
    // Fall back to original logic for income/expense
    if (lower.includes('income') || lower.includes('credit')) return 'income';
    if (lower.includes('expense') || lower.includes('debit')) return 'expense';
  }
  
  // Default behavior based on amount
  const amount = parseAmount(amountStr);
  return amount >= 0 ? 'income' : 'expense';
}

/**
 * Maps parsed CSV data to Transaction objects.
 * @param csvData - Array of parsed CSV rows
 * @returns Array of Transaction objects
 */
export function mapToTransactions(csvData: ParsedCSVData[]): Transaction[] {
  return csvData.map(row => ({
    id: generateUUID(),
    date: formatDate(row.date || row.Date || ''),
    description: row.description || row.Description || 'Imported Transaction',
    categoryId: 'uncategorized', // Default category
    amount: parseAmount(row.amount || row.Amount || '0'),
    type: determineType(row.amount || row.Amount || '0', row.type || row.Type),
    status: 'completed',
    accountId: 'default', // Default account
  }));
}
