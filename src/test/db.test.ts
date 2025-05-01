import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import { BudgetFlowrDB, Transaction } from '../lib/db';

describe('BudgetFlowrDB', () => {
  let testDB: BudgetFlowrDB;

  beforeEach(async () => {
    // Create a new instance of the database with a unique name for isolation
    testDB = new BudgetFlowrDB();
    // Open the database
    await testDB.open();
  });

  afterEach(async () => {
    // Close the test database after each test
    await testDB.close();
  });

  it('should initialize the database with the correct stores', () => {
    const stores = testDB.tables.map((table) => table.name);
    expect(stores).toContain('transactions');
    expect(stores).toContain('categories');
    expect(stores).toContain('accounts');
    expect(stores).toContain('assets');
    expect(stores).toContain('sinkingFunds');
  });

  it('should add and retrieve a transaction', async () => {
    const transaction: Transaction = {
      id: 'tx1',
      date: '2025-05-01',
      description: 'Test transaction',
      categoryId: 'cat1',
      amount: 100,
      type: 'income',
      status: 'completed',
    };
    await testDB.transactions.add(transaction);
    const retrieved = await testDB.transactions.get('tx1');
    expect(retrieved).toEqual(transaction);
  });

  it('should update a transaction', async () => {
    const transaction: Transaction = {
      id: 'tx2',
      date: '2025-05-01',
      description: 'Initial transaction',
      categoryId: 'cat1',
      amount: 50,
      type: 'expense',
      status: 'pending',
    };
    await testDB.transactions.add(transaction);
    const updatedTransaction: Transaction = { ...transaction, amount: 75, status: 'completed' };
    await testDB.transactions.put(updatedTransaction);
    const retrieved = await testDB.transactions.get('tx2');
    expect(retrieved).toEqual(updatedTransaction);
  });

  it('should delete a transaction', async () => {
    const transaction: Transaction = {
      id: 'tx3',
      date: '2025-05-01',
      description: 'To be deleted',
      categoryId: 'cat1',
      amount: 20,
      type: 'expense',
      status: 'completed',
    };
    await testDB.transactions.add(transaction);
    await testDB.transactions.delete('tx3');
    const retrieved = await testDB.transactions.get('tx3');
    expect(retrieved).toBeUndefined();
  });
});
