import Dexie from 'dexie';
import { BudgetFlowrDB, db } from './db';

/**
 * Initialize the database and handle version upgrades
 * @returns Promise resolving to the database instance
 */
export async function initializeDatabase(): Promise<BudgetFlowrDB> {
  try {
    // Ensure the database is open
    if (!db.isOpen()) {
      await db.open();
    }
    console.log(`Database opened successfully. Current version: ${db.verno}`);
    
    // Log counts of entities for diagnostics
    const transactionCount = await db.transactions.count();
    const categoryCount = await db.categories.count();
    console.log('DB-UTILS: Entity counts on initialization', {
      transactions: transactionCount,
      categories: categoryCount
    });
    
    // Log transaction types available in the database
    const transactions = await db.transactions.toArray();
    const types = new Set<string>();
    transactions.forEach(t => {
      if (t.type) types.add(t.type);
    });
    console.log('DB-UTILS: Transaction types in database:', Array.from(types));
    
    return db;
  } catch (error) {
    console.error('Failed to open database:', error);
    throw error;
  }
}

/**
 * Get the current database version
 * @returns Promise resolving to the database version number
 */
export async function getDatabaseVersion(): Promise<number> {
  try {
    // Ensure the database is open
    if (!db.isOpen()) {
      await db.open();
    }
    return db.verno;
  } catch (error) {
    console.error('Failed to get database version:', error);
    throw error;
  }
}

/**
 * Check if the database exists
 * @returns Promise resolving to boolean indicating if the database exists
 */
export async function databaseExists(): Promise<boolean> {
  try {
    const dbList = await Dexie.getDatabaseNames();
    return dbList.includes('BudgetFlowrDB');
  } catch (error) {
    console.error('Failed to check if database exists:', error);
    return false;
  }
}

/**
 * Delete the database (useful for testing or resetting)
 * @returns Promise resolving when the database is deleted
 */
export async function deleteDatabase(): Promise<void> {
  try {
    if (db.isOpen()) {
      await db.close();
    }
    await Dexie.delete('BudgetFlowrDB');
    console.log('Database deleted successfully');
  } catch (error) {
    console.error('Failed to delete database:', error);
    throw error;
  }
}

/**
 * Validate the database structure
 * @returns Promise resolving to boolean indicating if the database structure is valid
 */
export async function validateDatabaseStructure(): Promise<boolean> {
  try {
    // Ensure the database is open
    if (!db.isOpen()) {
      await db.open();
    }
    
    // Check if all expected tables exist
    const expectedTables = ['transactions', 'categories', 'accounts', 'assets', 'sinkingFunds'];
    const actualTables = db.tables.map(table => table.name);
    
    const missingTables = expectedTables.filter(table => !actualTables.includes(table));
    if (missingTables.length > 0) {
      console.error('Missing tables:', missingTables);
      return false;
    }
    
    // For version 2+, check if transactions table has accountId index
    if (db.verno >= 2) {
      const transactionTableSchema = db.tables.find(table => table.name === 'transactions')?.schema;
      if (!transactionTableSchema?.indexes.some(index => index.name === 'accountId')) {
        console.error('Missing accountId index in transactions table');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to validate database structure:', error);
    return false;
  }
}
