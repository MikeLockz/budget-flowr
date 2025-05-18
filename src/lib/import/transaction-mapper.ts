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
  console.log('TRANSACTION-MAPPER: Parsing amount', { amountStr });
  
  if (!amountStr) {
    console.log('TRANSACTION-MAPPER: Empty amount string, returning 0');
    return 0;
  }
  
  const cleaned = amountStr.replace(/[^0-9.-]+/g, '');
  console.log('TRANSACTION-MAPPER: Cleaned amount string', { originalStr: amountStr, cleanedStr: cleaned });
  
  const amount = parseFloat(cleaned);
  
  if (isNaN(amount)) {
    console.warn('TRANSACTION-MAPPER: Failed to parse amount, returning 0', { amountStr, cleaned });
    return 0;
  }
  
  console.log('TRANSACTION-MAPPER: Parsed amount', { amountStr, cleaned, amount });
  return amount;
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
  console.log('TRANSACTION-MAPPER: Mapping CSV data to transactions', { rowCount: csvData.length });
  
  const transactions = csvData.map(row => {
    const transaction = {
      id: generateUUID(),
      date: formatDate(row.date || row.Date || ''),
      description: row.description || row.Description || 'Imported Transaction',
      categoryId: 'uncategorized', // Default category
      amount: parseAmount(row.amount || row.Amount || '0'),
      type: determineType(row.amount || row.Amount || '0', row.type || row.Type),
      status: 'completed' as 'completed' | 'pending' | 'upcoming',
      accountId: 'default', // Default account
    };
    
    // Log a sample of transactions (first 5)
    if (csvData.indexOf(row) < 5) {
      console.log('TRANSACTION-MAPPER: Created transaction', { 
        index: csvData.indexOf(row),
        rawRow: row,
        mappedTransaction: transaction 
      });
    }
    
    return transaction;
  });
  
  // Log some statistics
  const types = new Map<string, number>();
  let zeroAmountCount = 0;
  
  transactions.forEach(t => {
    types.set(t.type, (types.get(t.type) || 0) + 1);
    if (t.amount === 0) zeroAmountCount++;
  });
  
  console.log('TRANSACTION-MAPPER: Mapping complete', { 
    transactionCount: transactions.length,
    typeBreakdown: Object.fromEntries(types.entries()),
    zeroAmountCount
  });
  
  return transactions;
}
