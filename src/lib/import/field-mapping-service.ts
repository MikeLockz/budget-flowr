import { db, generateUUID } from '@/lib/db';
import { FieldMapping, PreviewData } from './field-mapping-types';
import { ParsedCSVData } from './csv-parser';
import { Transaction } from '@/lib/db';

/**
 * Apply the field mapping to CSV data to generate transactions.
 */
export function applyMapping(
  csvData: ParsedCSVData[],
  mapping: FieldMapping
): { transactions: Transaction[], skippedRows: ParsedCSVData[] } {
  console.log('FIELD-MAPPING: Applying mapping to CSV data', { 
    rowCount: csvData.length,
    mapping
  });
  
  const transactions: Transaction[] = [];
  const skippedRows: ParsedCSVData[] = [];
  const amountStats = {
    total: 0,
    min: Infinity,
    max: -Infinity,
    zero: 0,
    nonNumeric: 0
  };

  csvData.forEach((row, index) => {
    const dateValue = mapping.mappings.date ? row[mapping.mappings.date] : '';
    const amountValue = mapping.mappings.amount ? row[mapping.mappings.amount] : '';
    const accountValue = mapping.mappings.accountId ? row[mapping.mappings.accountId] : '';

    if (index < 5) {
      console.log(`FIELD-MAPPING: Processing row ${index}`, { 
        row, 
        extractedFields: { dateValue, amountValue, accountValue } 
      });
    }

    // Skip rows with missing critical fields
    if (!dateValue || !amountValue || !accountValue) {
      if (index < 5) {
        console.log(`FIELD-MAPPING: Skipping row ${index} due to missing critical fields`);
      }
      skippedRows.push(row);
      return;
    }

    const descValue = mapping.mappings.description ? row[mapping.mappings.description] : 'Imported Transaction';
    const typeValue = mapping.mappings.type ? row[mapping.mappings.type] : undefined;
    const categoryValue = mapping.mappings.categoryId ? row[mapping.mappings.categoryId] : 'uncategorized';
    const statusValue = mapping.mappings.status ? row[mapping.mappings.status] : 'completed';

    let amount = parseAmount(amountValue);
    // Track amount statistics
    if (isNaN(amount)) {
      amountStats.nonNumeric++;
    } else {
      amountStats.total += amount;
      amountStats.min = Math.min(amountStats.min, amount);
      amountStats.max = Math.max(amountStats.max, amount);
      if (amount === 0) amountStats.zero++;
    }
    
    if (mapping.options.invertAmount) {
      amount = -amount;
      if (index < 5) {
        console.log(`FIELD-MAPPING: Inverted amount for row ${index}`, { 
          originalAmount: amount, 
          invertedAmount: -amount 
        });
      }
    }

    let type: 'income' | 'expense' | 'Capital Transfer' | 'Capital Inflow' | 'True Expense' | 'Reversed Capital Expense' | 'Reversed True Expense';
    if (typeValue) {
      type = determineTypeFromString(typeValue);
      if (index < 5) {
        console.log(`FIELD-MAPPING: Determined type from string for row ${index}`, { 
          typeValue, 
          determinedType: type 
        });
      }
    } else if (mapping.options.negativeAmountIsExpense) {
      type = amount < 0 ? 'expense' : 'income';
      if (index < 5) {
        console.log(`FIELD-MAPPING: Determined type from amount sign for row ${index}`, { 
          amount, 
          determinedType: type 
        });
      }
    } else {
      type = amount >= 0 ? 'income' : 'expense';
      if (index < 5) {
        console.log(`FIELD-MAPPING: Determined type from amount sign for row ${index}`, { 
          amount, 
          determinedType: type 
        });
      }
    }

    const formattedDate = formatDate(dateValue);
    
    // Create the transaction with Math.abs(amount)
    const finalAmount = Math.abs(amount);
    if (index < 5) {
      console.log(`FIELD-MAPPING: Final amount for row ${index}`, { 
        originalAmount: amount, 
        finalAmount 
      });
    }

    const transaction = {
      id: generateUUID(),
      date: formattedDate,
      description: descValue,
      categoryId: categoryValue,
      amount: finalAmount,
      type,
      status: statusValue as 'completed' | 'pending' | 'upcoming',
      accountId: accountValue
    };
    
    if (index < 5) {
      console.log(`FIELD-MAPPING: Created transaction for row ${index}`, { transaction });
    }
    
    transactions.push(transaction);
  });

  // Calculate statistics about the transactions
  const typeStats = new Map<string, number>();
  let nonZeroAmountCount = 0;
  
  transactions.forEach(t => {
    typeStats.set(t.type, (typeStats.get(t.type) || 0) + 1);
    if (t.amount > 0) nonZeroAmountCount++;
  });
  
  console.log('FIELD-MAPPING: Mapping complete', { 
    totalTransactions: transactions.length,
    skippedRows: skippedRows.length,
    amountStats,
    typeBreakdown: Object.fromEntries(typeStats.entries()),
    nonZeroAmountCount
  });

  return { transactions, skippedRows };
}

function parseAmount(amountStr: string): number {
  if (!amountStr) {
    console.log('FIELD-MAPPING: Empty amount string, returning 0');
    return 0;
  }
  
  console.log('FIELD-MAPPING: Parsing amount', { amountStr });
  const cleaned = amountStr.replace(/[^0-9.-]+/g, '');
  console.log('FIELD-MAPPING: Cleaned amount', { original: amountStr, cleaned });
  
  const amount = parseFloat(cleaned) || 0;
  console.log('FIELD-MAPPING: Parsed amount', { original: amountStr, cleaned, amount });
  
  return amount;
}

function determineTypeFromString(typeStr: string): 'income' | 'expense' | 'Capital Transfer' | 'Capital Inflow' | 'True Expense' | 'Reversed Capital Expense' | 'Reversed True Expense' {
  const lower = typeStr.toLowerCase().trim();
  
  // Check for exact matches with transaction types first
  if (lower === 'capital transfer') return 'Capital Transfer';
  if (lower === 'capital inflow') return 'Capital Inflow';
  if (lower === 'true expense') return 'True Expense';
  if (lower === 'reversed capital expense') return 'Reversed Capital Expense';
  if (lower === 'reversed true expense') return 'Reversed True Expense';
  
  // Check for partial matches if no exact match
  if (lower.includes('capital') && lower.includes('transfer')) return 'Capital Transfer';
  if (lower.includes('capital') && lower.includes('inflow')) return 'Capital Inflow';
  if (lower.includes('true') && lower.includes('expense')) return 'True Expense';
  if (lower.includes('reversed') && lower.includes('capital') && lower.includes('expense')) return 'Reversed Capital Expense';
  if (lower.includes('reversed') && lower.includes('true') && lower.includes('expense')) return 'Reversed True Expense';
  
  // Fall back to income/expense
  if (lower.includes('income') || lower.includes('credit') || lower.includes('deposit')) {
    return 'income';
  }
  return 'expense';
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

/**
 * Save a mapping configuration to IndexedDB.
 */
export async function saveMapping(mapping: FieldMapping): Promise<string> {
  if (!mapping.id) {
    mapping.id = generateUUID();
  }

  // Removed dynamic table creation; assume fieldMappings table exists in DB schema
  await db.table('fieldMappings').put(mapping);
  return mapping.id;
}

/**
 * Update an existing mapping configuration in IndexedDB.
 */
export async function updateMapping(mapping: FieldMapping): Promise<string> {
  if (!mapping.id) {
    throw new Error('Cannot update a mapping without an ID');
  }

  await db.table('fieldMappings').put(mapping);
  return mapping.id;
}

/**
 * Get all saved mapping configurations.
 */
export async function getSavedMappings(): Promise<FieldMapping[]> {
  if (!db.tables.some(t => t.name === 'fieldMappings')) {
    return [];
  }
  return db.table('fieldMappings').toArray();
}

/**
 * Generate preview data for the first few rows.
 */
export function generatePreview(
  csvData: ParsedCSVData[],
  mapping: FieldMapping
): PreviewData {
  const previewRows = csvData.slice(0, 5);
  const { transactions, skippedRows } = applyMapping(previewRows, mapping);
  return {
    rawData: previewRows,
    mappedTransactions: transactions,
    skippedRows
  };
}

/**
 * Auto-detect mapping based on CSV headers.
 */
export function detectMapping(headers: string[]): FieldMapping {
  const mapping: FieldMapping = {
    mappings: {
      date: null,
      description: null,
      amount: null,
      type: null,
      categoryId: null,
      status: null,
      accountId: null
    },
    options: {
      dateFormat: 'MM/DD/YYYY',
      negativeAmountIsExpense: true,
      invertAmount: false
    }
  };

  for (const header of headers) {
    const lower = header.toLowerCase();

    if (lower.includes('date')) {
      mapping.mappings.date = header;
    } else if (lower.includes('desc') || lower.includes('memo') || lower.includes('narration')) {
      mapping.mappings.description = header;
    } else if (lower.includes('amount')) {
      mapping.mappings.amount = header;
    } else if (lower.includes('debit') || lower.includes('credit')) {
      if (!mapping.mappings.amount) {
        mapping.mappings.amount = header;
      }
      mapping.mappings.type = header;
    } else if (lower.includes('type') || lower.includes('transaction type')) {
      mapping.mappings.type = header;
    } else if (lower.includes('category')) {
      mapping.mappings.categoryId = header;
    } else if (lower.includes('status')) {
      mapping.mappings.status = header;
    } else if (lower.includes('account')) {
      mapping.mappings.accountId = header;
    }
  }

  return mapping;
}
