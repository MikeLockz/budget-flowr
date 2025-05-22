import { ParsedCSVData } from './csv-parser';
import { FieldMapping, PreviewData } from './field-mapping-types';
import { applyMapping, generatePreview } from './field-mapping-service';
import { parseCSVFile } from './csv-file-parser';
import { processTransactions } from './transaction-import-service';

/**
 * Parse CSV and return headers and sample data for mapping UI.
 * This is a wrapper around parseCSVFile from csv-file-parser.
 */
export async function parseCSVForMapping(file: File): Promise<{ 
  headers: string[]; 
  sampleData: ParsedCSVData[]; 
  allData: ParsedCSVData[] 
}> {
  return parseCSVFile(file);
}

/**
 * Generate preview based on mapping.
 */
export function previewMappedTransactions(
  csvData: { headers: string[]; sampleData: ParsedCSVData[]; allData: ParsedCSVData[] },
  mapping: FieldMapping
): PreviewData {
  const preview = generatePreview(csvData.sampleData, mapping);
  
  // Add the mapping and a reference to the file if available
  return {
    rawData: preview.rawData,
    mappedTransactions: preview.mappedTransactions,
    skippedRows: preview.skippedRows,
    mapping,
    file: csvData.allData !== undefined ? {} as File : undefined, // Since we don't have the file object here
  };
}

/**
 * Import transactions with specified mapping.
 * Returns inserted IDs, count of duplicates found, count of duplicates updated, and count of skipped rows.
 * When a duplicate is found, non-index fields are updated if they have different values.
 */
export async function importCSVWithMapping(
  file: File,
  mapping: FieldMapping
): Promise<{ insertedIds: string[]; duplicateCount: number; updatedCount: number; skippedCount: number }> {
  try {
    console.log('IMPORT-SERVICE: Starting import with mapping', { fileName: file.name });
    
    // Parse the CSV file
    const parsedData = await parseCSVForMapping(file);
    console.log('IMPORT-SERVICE: Parsed CSV data', { 
      rowCount: parsedData.allData.length,
      firstRowSample: parsedData.allData[0] 
    });
    
    // Apply mapping to convert CSV data to transactions
    const { transactions, skippedRows } = applyMapping(parsedData.allData, mapping);
    console.log('IMPORT-SERVICE: Applied mapping', { 
      transactionsCount: transactions.length,
      skippedCount: skippedRows.length,
      sampleTransaction: transactions[0]
    });
    
    // Process transactions (handling duplicates, creating categories, etc.)
    return await processTransactions(
      transactions, 
      file.name, 
      parsedData.allData.length, 
      skippedRows.length
    );
  } catch (error) {
    console.error('Error importing CSV file:', error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility.
 */
export async function importCSVFile(file: File): Promise<{ insertedIds: string[]; duplicateCount: number; updatedCount: number }> {
  try {
    const parsedData = await parseCSVForMapping(file);

    // Use default mapping
    const defaultMapping: FieldMapping = {
      mappings: {
        date: parsedData.headers.find((h: string) => h.toLowerCase() === 'date') || null,
        description: parsedData.headers.find((h: string) => h.toLowerCase() === 'description') || null,
        amount: parsedData.headers.find((h: string) => h.toLowerCase() === 'amount') || null,
        type: parsedData.headers.find((h: string) => h.toLowerCase() === 'type') || null,
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

    const result = await importCSVWithMapping(file, defaultMapping);
    return { 
      insertedIds: result.insertedIds, 
      duplicateCount: result.duplicateCount, 
      updatedCount: result.updatedCount 
    };
  } catch (error) {
    console.error('Error importing CSV file:', error);
    throw error;
  }
}

// Export transaction deduplication utilities
export { findDuplicateTransactions, removeDuplicateTransactions, mergeDuplicateTransactions } from './transaction-deduplication';