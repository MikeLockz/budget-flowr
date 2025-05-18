import { Transaction, ImportSession } from '@/lib/db';
import { transactionRepository, categoryRepository, importRepo } from '@/lib/repositories';
import { generateUUID } from '@/lib/db';
import { isDuplicateTransaction, updateDuplicateTransaction } from './transaction-deduplication';

/**
 * Core business logic for importing transactions.
 * Separated from file I/O to make testing easier.
 */

interface ImportResult {
  insertedIds: string[];
  duplicateCount: number;
  updatedCount: number;
  skippedCount: number;
}

/**
 * Process transactions by checking for duplicates and adding new ones.
 * Also creates any new categories found in the transactions.
 */
export async function processTransactions(
  transactions: Transaction[],
  fileName: string,
  totalRowCount: number,
  skippedCount: number
): Promise<ImportResult> {
  try {
    console.log('TRANSACTION-IMPORT-SERVICE: Processing transactions', { 
      transactionCount: transactions.length,
      fileName
    });
    
    // Create import session
    const importId = generateUUID();
    const importSession: ImportSession = {
      id: importId,
      date: new Date().toISOString().split('T')[0],
      fileName,
      totalCount: totalRowCount,
      importedCount: 0,
      duplicateCount: 0,
      updatedCount: 0,
      skippedCount
    };

    // Extract unique category IDs from transactions
    await processCategories(transactions);

    // Process transactions, checking for duplicates
    const { insertedIds, duplicateCount, updatedCount } = 
      await importTransactions(transactions);
    
    // Update import session with results
    importSession.importedCount = insertedIds.length;
    importSession.duplicateCount = duplicateCount;
    importSession.updatedCount = updatedCount;

    // Save the import session
    await importRepo.add(importSession);
    
    console.log('TRANSACTION-IMPORT-SERVICE: Import completed successfully', { 
      insertedCount: insertedIds.length,
      duplicateCount,
      updatedCount,
      skippedCount,
      insertedIds: insertedIds.slice(0, 3) // Log first few IDs as sample
    });

    return { 
      insertedIds, 
      duplicateCount, 
      updatedCount, 
      skippedCount 
    };
  } catch (error) {
    console.error('Error processing transactions:', error);
    throw error;
  }
}

/**
 * Process any new categories found in transactions
 */
async function processCategories(transactions: Transaction[]): Promise<void> {
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
}

/**
 * Import transactions, handling duplicates
 */
async function importTransactions(
  transactions: Transaction[]
): Promise<{ 
  insertedIds: string[]; 
  duplicateCount: number; 
  updatedCount: number; 
}> {
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

  return { insertedIds, duplicateCount, updatedCount };
}