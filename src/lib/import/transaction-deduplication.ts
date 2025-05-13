import { Transaction, db } from '@/lib/db';
import { transactionRepository } from '@/lib/repositories';

/**
 * Check if a transaction is a duplicate based on date, amount, and description.
 * @param transaction The transaction to check
 * @returns Object with isDuplicate flag and the existing transaction if found
 */
export async function isDuplicateTransaction(transaction: {
  date: string;
  amount: number;
  description: string;
}): Promise<{ isDuplicate: boolean; existingTransaction?: Transaction }> {
  // Use the compound index to efficiently check for duplicates
  const existingTransaction = await db.transactions
    .where('[date+amount+description]')
    .equals([transaction.date, transaction.amount, transaction.description])
    .first();

  return {
    isDuplicate: !!existingTransaction,
    existingTransaction
  };
}

/**
 * Find all duplicate transactions in the database.
 * @returns Array of duplicate transaction pairs
 */
export async function findDuplicateTransactions(): Promise<Array<{
  original: Transaction;
  duplicate: Transaction;
}>> {
  // Get all transactions
  const transactions = await transactionRepository.getAll();
  
  // Create a map to track duplicates
  const uniqueTransactions = new Map<string, Transaction>();
  const duplicates: Array<{
    original: Transaction;
    duplicate: Transaction;
  }> = [];
  
  // Find duplicates
  for (const transaction of transactions) {
    const key = `${transaction.date}|${transaction.amount}|${transaction.description}`;
    
    if (uniqueTransactions.has(key)) {
      duplicates.push({
        original: uniqueTransactions.get(key)!,
        duplicate: transaction
      });
    } else {
      uniqueTransactions.set(key, transaction);
    }
  }
  
  return duplicates;
}

/**
 * Remove duplicate transactions from the database.
 * @returns The number of duplicates removed
 */
export async function removeDuplicateTransactions(): Promise<number> {
  const duplicates = await findDuplicateTransactions();
  
  // Remove the duplicate transactions (keeping the original)
  for (const { duplicate } of duplicates) {
    await transactionRepository.remove(duplicate.id);
  }
  
  return duplicates.length;
}

/**
 * Merge duplicate transactions.
 * This can be used to combine transactions that are duplicates but have different
 * information (e.g., one has a category and the other doesn't).
 * @returns The number of duplicates merged
 */
export async function mergeDuplicateTransactions(): Promise<number> {
  const duplicates = await findDuplicateTransactions();

  // Merge the duplicate transactions
  for (const { original, duplicate } of duplicates) {
    // Create a merged transaction with the best information from both
    const merged: Transaction = {
      ...original,
      // Use the category from the duplicate if the original doesn't have one
      categoryId: original.categoryId === 'uncategorized' && duplicate.categoryId !== 'uncategorized'
        ? duplicate.categoryId
        : original.categoryId,
      // Use the account from the duplicate if the original doesn't have one
      accountId: original.accountId === 'default' && duplicate.accountId !== 'default'
        ? duplicate.accountId
        : original.accountId
    };

    // Update the original transaction
    await transactionRepository.update(merged);

    // Remove the duplicate
    await transactionRepository.remove(duplicate.id);
  }

  return duplicates.length;
}

/**
 * Update an existing transaction with data from a new duplicate transaction.
 * Only updates non-compound-index fields when they differ.
 * @param existingTransaction The existing transaction in the database
 * @param newTransaction The new transaction with potentially updated field values
 * @returns The updated transaction
 */
export async function updateDuplicateTransaction(
  existingTransaction: Transaction,
  newTransaction: Partial<Transaction>
): Promise<Transaction> {
  // Fields that are part of the compound index and should NOT be updated
  const compoundIndexFields = ['date', 'amount', 'description'];

  // Create updated transaction object starting with existing transaction
  const updatedTransaction: Transaction = { ...existingTransaction };

  // Update each non-compound-index field if it exists in newTransaction and is different
  for (const [key, value] of Object.entries(newTransaction)) {
    // Skip updating compound index fields
    if (compoundIndexFields.includes(key)) continue;

    // Skip if the field doesn't exist in newTransaction
    if (value === undefined) continue;

    // Update field if value is different
    if (existingTransaction[key as keyof Transaction] !== value) {
      // Update the field with type safety
      updatedTransaction[key as keyof Transaction] = value as Transaction[keyof Transaction];
    }
  }

  // Save the updated transaction
  await transactionRepository.update(updatedTransaction);

  return updatedTransaction;
}
