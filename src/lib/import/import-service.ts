import { ParsedCSVData } from './csv-parser';
import { transactionRepository, categoryRepository } from '@/lib/repositories';
import { FieldMapping, PreviewData } from './field-mapping-types';
import { applyMapping, generatePreview } from './field-mapping-service';

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
  return generatePreview(csvData.sampleData, mapping);
}

/**
 * Import transactions with specified mapping.
 */
export async function importCSVWithMapping(
  file: File,
  mapping: FieldMapping
): Promise<string[]> {
  try {
    const parsedData = await parseCSVForMapping(file);
    const transactions = applyMapping(parsedData.allData, mapping);

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

    // Now insert the transactions
    const insertedIds: string[] = [];
    for (const transaction of transactions) {
      const id = await transactionRepository.add(transaction);
      insertedIds.push(id);
    }

    return insertedIds;
  } catch (error) {
    console.error('Error importing CSV file:', error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility.
 */
export async function importCSVFile(file: File): Promise<string[]> {
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
