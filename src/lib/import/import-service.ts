import { parseCSV, ParsedCSVData } from './csv-parser';
import { mapToTransactions } from './transaction-mapper';
import { transactionRepository } from '@/lib/repositories';
import { Transaction } from '@/lib/db';

/**
 * Orchestrates the import process from a CSV file.
 * Parses the file, maps data to transactions, and stores them.
 * @param file - The CSV file to import
 * @returns Promise resolving to array of inserted transaction IDs
 */
export async function importCSVFile(file: File): Promise<string[]> {
  try {
    const parsedData: ParsedCSVData[] = await parseCSV(file);
    const transactions: Transaction[] = mapToTransactions(parsedData);

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
