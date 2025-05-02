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
): Transaction[] {
  return csvData.map(row => {
    const dateValue = mapping.mappings.date ? row[mapping.mappings.date] : '';
    const descValue = mapping.mappings.description ? row[mapping.mappings.description] : 'Imported Transaction';
    const amountValue = mapping.mappings.amount ? row[mapping.mappings.amount] : '0';
    const typeValue = mapping.mappings.type ? row[mapping.mappings.type] : undefined;
    const categoryValue = mapping.mappings.categoryId ? row[mapping.mappings.categoryId] : 'uncategorized';
    const statusValue = mapping.mappings.status ? row[mapping.mappings.status] : 'completed';
    const accountValue = mapping.mappings.accountId ? row[mapping.mappings.accountId] : 'default';

    let amount = parseAmount(amountValue);
    if (mapping.options.invertAmount) {
      amount = -amount;
    }

    let type: 'income' | 'expense';
    if (typeValue) {
      type = determineTypeFromString(typeValue);
    } else if (mapping.options.negativeAmountIsExpense) {
      type = amount < 0 ? 'expense' : 'income';
    } else {
      type = amount >= 0 ? 'income' : 'expense';
    }

    const formattedDate = formatDate(dateValue);

    return {
      id: generateUUID(),
      date: formattedDate,
      description: descValue,
      categoryId: categoryValue,
      amount: Math.abs(amount),
      type,
      status: statusValue as 'completed' | 'pending' | 'upcoming',
      accountId: accountValue
    };
  });
}

function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned) || 0;
}

function determineTypeFromString(typeStr: string): 'income' | 'expense' {
  const lower = typeStr.toLowerCase();
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

  if (!db.tables.some(t => t.name === 'fieldMappings')) {
    await db.version(db.verno + 1).stores({
      fieldMappings: 'id, name, sourceIdentifier'
    }).upgrade(() => {});
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
  return {
    rawData: previewRows,
    mappedTransactions: applyMapping(previewRows, mapping)
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
