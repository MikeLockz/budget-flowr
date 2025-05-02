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
 * @returns 'income' | 'expense'
 */
function determineType(amountStr: string, typeStr?: string): 'income' | 'expense' {
  if (typeStr) {
    const lower = typeStr.toLowerCase();
    if (lower.includes('income') || lower.includes('credit')) return 'income';
    if (lower.includes('expense') || lower.includes('debit')) return 'expense';
  }
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
