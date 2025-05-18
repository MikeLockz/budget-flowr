import { ParsedCSVData } from './csv-parser';
import { transactionRepository, categoryRepository, importRepo } from '@/lib/repositories';
import { FieldMapping, PreviewData } from './field-mapping-types';
import { applyMapping, generatePreview } from './field-mapping-service';
import { generateUUID, ImportSession } from '@/lib/db';
import { isDuplicateTransaction, updateDuplicateTransaction } from './transaction-deduplication';

/**
 * Parse CSV and return headers and sample data for mapping UI.
 */
export async function parseCSVForMapping(file: File): Promise<{ headers: string[]; sampleData: ParsedCSVData[]; allData: ParsedCSVData[] }> {
  // Parse CSV twice: once for headers and sample, once for all data
  return new Promise((resolve, reject) => {
    const sampleRows: ParsedCSVData[] = [];
    let headers: string[] = [];

    // First parse for headers and sample
    const firstParse = new Promise<void>((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        import('papaparse').then(Papa => {
          Papa.parse<ParsedCSVData>(text, {
            header: true,
            preview: 10,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors.length > 0) {
                rej(results.errors);
              } else {
                headers = results.meta.fields || [];
                sampleRows.push(...results.data);
                res();
              }
            },
            error: rej
          });
        });
      };
      reader.onerror = () => rej(reader.error);
      reader.readAsText(file);
    });

    // Second parse for all data
    const secondParse = new Promise<ParsedCSVData[]>((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        import('papaparse').then(Papa => {
          Papa.parse<ParsedCSVData>(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors.length > 0) {
                rej(results.errors);
              } else {
                res(results.data);
              }
            },
            error: rej
          });
        });
      };
      reader.onerror = () => rej(reader.error);
      reader.readAsText(file);
    });

    firstParse.then(() => {
      secondParse.then(allData => {
        resolve({ headers, sampleData: sampleRows, allData });
      }).catch(reject);
    }).catch(reject);
  });
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
    ...preview,
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
    const parsedData = await parseCSVForMapping(file);
    console.log('IMPORT-SERVICE: Parsed CSV data', { 
      rowCount: parsedData.allData.length,
      firstRowSample: parsedData.allData[0] 
    });
    
    const { transactions, skippedRows } = applyMapping(parsedData.allData, mapping);
    console.log('IMPORT-SERVICE: Applied mapping', { 
      transactionsCount: transactions.length,
      skippedCount: skippedRows.length,
      sampleTransaction: transactions[0]
    });
    
    // Create import session
    const importId = generateUUID();
    const importSession: ImportSession = {
      id: importId,
      date: new Date().toISOString().split('T')[0],
      fileName: file.name,
      totalCount: parsedData.allData.length,
      importedCount: 0,
      duplicateCount: 0,
      updatedCount: 0,
      skippedCount: skippedRows.length
    };

    // Extract unique category IDs from transactions
    const categoryIds = new Set<string>();
    transactions.forEach(t => {
      if (t.categoryId && t.categoryId !== 'uncategorized') {
        categoryIds.add(t.categoryId);
      }
    });

    // Fetch existing categories
    const existingCategories = await categoryRepository.getAll();
    const existingCategoryIds = new Set(existingCategories.map(c => c.id));

    // Create new categories for IDs that don't exist yet
    const categoriesToCreate = Array.from(categoryIds)
      .filter(id => !existingCategoryIds.has(id))
      .map(id => ({
        id,
        name: id // Use the ID as the name
      }));

    // Add new categories to the database
    for (const category of categoriesToCreate) {
      await categoryRepository.add(category);
    }

    // Ensure uncategorized category exists
    if (!existingCategoryIds.has('uncategorized')) {
      await categoryRepository.add({
        id: 'uncategorized',
        name: 'Uncategorized'
      });
    }

    // Now insert the transactions, updating duplicates with new field values
    const insertedIds: string[] = [];
    let duplicateCount = 0;
    let updatedCount = 0;

    for (const transaction of transactions) {
      // Check if this transaction is a duplicate
      const { isDuplicate, existingTransaction } = await isDuplicateTransaction(transaction);

      if (isDuplicate && existingTransaction) {
        duplicateCount++;
        // Update non-index fields if they have different values
        await updateDuplicateTransaction(existingTransaction, transaction);
        updatedCount++;
      } else {
        const id = await transactionRepository.add(transaction);
        insertedIds.push(id);
      }
    }
    
    // Update import session with results
    importSession.importedCount = insertedIds.length;
    importSession.duplicateCount = duplicateCount;
    importSession.updatedCount = updatedCount;

    // Save the import session
    await importRepo.add(importSession);
    
    console.log('IMPORT-SERVICE: Import completed successfully', { 
      insertedCount: insertedIds.length,
      duplicateCount,
      updatedCount,
      skippedCount: skippedRows.length,
      insertedIds: insertedIds.slice(0, 3) // Log first few IDs as sample
    });

    return { insertedIds, duplicateCount, updatedCount, skippedCount: skippedRows.length };
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

    return importCSVWithMapping(file, defaultMapping);
  } catch (error) {
    console.error('Error importing CSV file:', error);
    throw error;
  }
}

// Export transaction deduplication utilities
export { findDuplicateTransactions, removeDuplicateTransactions, mergeDuplicateTransactions } from './transaction-deduplication';