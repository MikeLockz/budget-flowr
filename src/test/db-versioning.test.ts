import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Dexie from 'dexie';
import { BudgetFlowrDB, Transaction } from '../lib/db';
import { migrations, validateEntity } from '../lib/db-migrations';

describe('Database Versioning', () => {
  // Use a unique test database name to avoid conflicts with the main database
  const TEST_DB_NAME = 'BudgetFlowrDB_Test';
  
  // Create a test database class that extends the main database class
  class TestBudgetFlowrDB extends BudgetFlowrDB {
    constructor() {
      super();
      // We can't directly set the name property as it's read-only
      // Instead, we'll use a different approach in the tests
    }
  }
  
  let testDB: TestBudgetFlowrDB;

  beforeEach(async () => {
    // Create a new test database instance
    testDB = new TestBudgetFlowrDB();
    // Delete any existing test database before opening
    await Dexie.delete(TEST_DB_NAME);
    // Force the database name by monkey-patching the _dbName property
    // @ts-expect-error Accessing internal Dexie property for testing
    testDB._dbName = TEST_DB_NAME;
    await testDB.open();
  });

  afterEach(async () => {
    // Close and delete the test database after each test
    if (testDB && testDB.isOpen()) {
      await testDB.close();
    }
    await Dexie.delete(TEST_DB_NAME);
  });

  it('should initialize with the correct version', async () => {
    // The current version should be 4 based on our schema definition
    expect(testDB.verno).toBe(4);
  });

  it('should have the correct schema for version 2', async () => {
    // Check if the transactions table has the accountId index
    const transactionTableSchema = testDB.tables.find(table => table.name === 'transactions')?.schema;
    expect(transactionTableSchema?.indexes.some(index => index.name === 'accountId')).toBe(true);
  });

  it('should have the correct schema for version 3', async () => {
    // Check if the fieldMappings table exists
    const fieldMappingsTable = testDB.tables.find(table => table.name === 'fieldMappings');
    expect(fieldMappingsTable).toBeDefined();
    expect(fieldMappingsTable?.schema.primKey.name).toBe('id');
  });

  it('should migrate transaction data correctly when upgrading from v1 to v2', async () => {
    // Close the current database
    await testDB.close();
    
    // Delete the test database to ensure a clean state
    await Dexie.delete(TEST_DB_NAME);
    
    // Create a v1 database with the same schema as our initial version
    const v1DB = new Dexie(TEST_DB_NAME);
    v1DB.version(1).stores({
      transactions: 'id, date, categoryId, type, status',
      categories: 'id, name, parentId',
      accounts: 'id, name, type',
      assets: 'id, name, purchaseDate, categoryId',
      sinkingFunds: 'id, name, targetDate, associatedAssetId',
    });
    
    await v1DB.open();
    
    // Add test data in v1 format (without accountId)
    const v1Transaction = {
      id: 'test-tx',
      date: '2025-05-01',
      description: 'Test transaction',
      categoryId: 'cat1',
      amount: 100,
      type: 'income' as const,
      status: 'completed' as const
    };
    
    // Add the transaction to the transactions table
    await v1DB.table('transactions').add(v1Transaction);
    
    // Verify the transaction was added
    const addedTx = await v1DB.table('transactions').get('test-tx');
    expect(addedTx).toBeDefined();
    
    // Close the v1 database
    await v1DB.close();
    
    // Create a v2 database that extends our schema
    // This simulates upgrading from v1 to v2
    const v2DB = new Dexie(TEST_DB_NAME);
    
    // Define both versions to ensure proper upgrade path
    v2DB.version(1).stores({
      transactions: 'id, date, categoryId, type, status',
      categories: 'id, name, parentId',
      accounts: 'id, name, type',
      assets: 'id, name, purchaseDate, categoryId',
      sinkingFunds: 'id, name, targetDate, associatedAssetId',
    });
    
    v2DB.version(2).stores({
      transactions: 'id, date, categoryId, type, status, accountId',
      // Other tables remain unchanged
    }).upgrade(tx => {
      // Migration logic for existing data
      return tx.table('transactions').toCollection().modify(transaction => {
        // Set default accountId for existing transactions
        if (!transaction.accountId) {
          transaction.accountId = 'default';
        }
      });
    });
    
    // Open the v2 database, which should trigger the upgrade
    await v2DB.open();
    
    // Verify data was migrated correctly
    const migratedTx = await v2DB.table('transactions').get('test-tx');
    expect(migratedTx).toBeDefined();
    expect(migratedTx?.accountId).toBe('default');
    
    // Close the v2 database
    await v2DB.close();
  });

  it('should apply the v1tov2Transaction migration function correctly', () => {
    // Test the migration function directly
    const transaction: Transaction = {
      id: 'tx1',
      date: '2025-05-01',
      description: 'Test transaction',
      categoryId: 'cat1',
      amount: 100,
      type: 'income',
      status: 'completed'
    };
    
    const migratedTransaction = migrations.v1tov2Transaction(transaction);
    expect(migratedTransaction.accountId).toBe('default');
    
    // Test with an already migrated transaction
    const alreadyMigratedTransaction: Transaction = {
      ...transaction,
      accountId: 'existing-account'
    };
    
    const reMigratedTransaction = migrations.v1tov2Transaction(alreadyMigratedTransaction);
    expect(reMigratedTransaction.accountId).toBe('existing-account');
  });

  it('should validate transaction entities correctly', () => {
    // Valid transaction
    const validTransaction: Transaction = {
      id: 'tx1',
      date: '2025-05-01',
      description: 'Test transaction',
      categoryId: 'cat1',
      amount: 100,
      type: 'income',
      status: 'completed',
      accountId: 'acc1'
    };
    
    expect(validateEntity('transaction', validTransaction)).toBe(true);
    
    // Invalid transaction (missing accountId)
    const invalidTransaction: Transaction = {
      id: 'tx2',
      date: '2025-05-01',
      description: 'Test transaction',
      categoryId: 'cat1',
      amount: 100,
      type: 'income',
      status: 'completed'
    };
    
    // This should fail because accountId is required in version 2
    expect(validateEntity('transaction', invalidTransaction)).toBe(false);
  });

  it('should handle database errors gracefully', async () => {
    // Mock console.error to prevent actual error output during tests
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock Dexie.open to throw an error
    const openSpy = vi.spyOn(Dexie.prototype, 'open');
    openSpy.mockRejectedValueOnce(new Error('Test database error'));
    
    // Create a new database instance
    const errorDB = new TestBudgetFlowrDB();
    
    // Attempt to open the database, which should throw
    await expect(errorDB.open()).rejects.toThrow('Test database error');
    
    // Restore the original implementations
    openSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
