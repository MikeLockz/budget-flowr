import { Transaction, db } from '@/lib/db';
import { transactionRepository } from '@/lib/repositories';

/**
 * Check if a transaction is a duplicate based on date, amount, and description.
 * @param transaction The transaction to check
 * @returns True if a duplicate exists, false otherwise
 */
export async function isDuplicateTransaction(transaction: {
  date: string;
  amount: number;
  description: string;
}): Promise<boolean> {
  // Use the compound index to efficiently check for duplicates
  const duplicates = await db.transactions
    .where('[date+amount+description]')
    .equals([transaction.date, transaction.amount, transaction.description])
    .count();
  
  return duplicates > 0;
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
