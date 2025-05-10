import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Dexie from 'dexie';
import { BudgetFlowrDB, Transaction, Category, Account, Asset, SinkingFund, generateUUID } from '../lib/db';

describe('BudgetFlowrDB', () => {
  let testDB: BudgetFlowrDB;

  beforeEach(async () => {
    // Create a new instance of the database with a unique name for isolation
    testDB = new BudgetFlowrDB();
    // Open the database
    await testDB.open();
  });

  afterEach(async () => {
    // Clear all tables before closing the database
    await testDB.transactions.clear();
    await testDB.categories.clear();
    await testDB.accounts.clear();
    await testDB.assets.clear();
    await testDB.sinkingFunds.clear();
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

  it('should handle transaction query by index', async () => {
    const transactions: Transaction[] = [
      {
        id: 'tx4',
        date: '2025-05-01',
        description: 'First transaction',
        categoryId: 'cat1',
        amount: 100,
        type: 'income',
        status: 'completed',
      },
      {
        id: 'tx5',
        date: '2025-05-01',
        description: 'Second transaction',
        categoryId: 'cat2',
        amount: 50,
        type: 'expense',
        status: 'pending',
      },
      {
        id: 'tx6',
        date: '2025-05-02',
        description: 'Third transaction',
        categoryId: 'cat1',
        amount: 75,
        type: 'expense',
        status: 'completed',
      },
    ];

    await testDB.transactions.bulkAdd(transactions);

    // Query by date index
    const byDate = await testDB.transactions.where('date').equals('2025-05-01').toArray();
    expect(byDate).toHaveLength(2);
    expect(byDate.map(tx => tx.id)).toContain('tx4');
    expect(byDate.map(tx => tx.id)).toContain('tx5');

    // Query by categoryId index
    const byCategoryId = await testDB.transactions.where('categoryId').equals('cat1').toArray();
    expect(byCategoryId).toHaveLength(2);
    expect(byCategoryId.map(tx => tx.id)).toContain('tx4');
    expect(byCategoryId.map(tx => tx.id)).toContain('tx6');

    // Query by type index
    const byType = await testDB.transactions.where('type').equals('expense').toArray();
    expect(byType).toHaveLength(2);
    expect(byType.map(tx => tx.id)).toContain('tx5');
    expect(byType.map(tx => tx.id)).toContain('tx6');

    // Query by status index
    const byStatus = await testDB.transactions.where('status').equals('completed').toArray();
    expect(byStatus).toHaveLength(2);
    expect(byStatus.map(tx => tx.id)).toContain('tx4');
    expect(byStatus.map(tx => tx.id)).toContain('tx6');
  });

  it('should handle transaction errors gracefully', async () => {
    // Attempt to add a transaction with a duplicate ID
    const transaction: Transaction = {
      id: 'tx7',
      date: '2025-05-01',
      description: 'Test transaction',
      categoryId: 'cat1',
      amount: 100,
      type: 'income',
      status: 'completed',
    };

    await testDB.transactions.add(transaction);
    
    // Adding the same transaction again should throw
    await expect(testDB.transactions.add(transaction)).rejects.toThrow();
    
    // But updating should work
    const updatedTransaction = { ...transaction, amount: 200 };
    await expect(testDB.transactions.put(updatedTransaction)).resolves.not.toThrow();
  });
});

describe('Category Operations', () => {
  let testDB: BudgetFlowrDB;

  beforeEach(async () => {
    testDB = new BudgetFlowrDB();
    await testDB.open();
  });

  afterEach(async () => {
    // Clear tables before closing the database
    await testDB.categories.clear();
    await testDB.close();
  });

  it('should add and retrieve a category', async () => {
    const category: Category = {
      id: 'cat1',
      name: 'Test Category',
      color: '#FF0000',
    };
    await testDB.categories.add(category);
    const retrieved = await testDB.categories.get('cat1');
    expect(retrieved).toEqual(category);
  });

  it('should update a category', async () => {
    const category: Category = {
      id: 'cat2',
      name: 'Initial Category',
      color: '#00FF00',
    };
    await testDB.categories.add(category);
    const updatedCategory: Category = { ...category, name: 'Updated Category', color: '#0000FF' };
    await testDB.categories.put(updatedCategory);
    const retrieved = await testDB.categories.get('cat2');
    expect(retrieved).toEqual(updatedCategory);
  });

  it('should delete a category', async () => {
    const category: Category = {
      id: 'cat3',
      name: 'To be deleted',
      color: '#FF00FF',
    };
    await testDB.categories.add(category);
    await testDB.categories.delete('cat3');
    const retrieved = await testDB.categories.get('cat3');
    expect(retrieved).toBeUndefined();
  });

  it('should handle category query by index', async () => {
    const categories: Category[] = [
      {
        id: 'cat4',
        name: 'Category A',
        parentId: 'parent1',
      },
      {
        id: 'cat5',
        name: 'Category B',
        parentId: 'parent1',
      },
      {
        id: 'cat6',
        name: 'Category C',
        parentId: 'parent2',
      },
    ];

    await testDB.categories.bulkAdd(categories);

    // Query by name index
    const byName = await testDB.categories.where('name').equals('Category B').toArray();
    expect(byName).toHaveLength(1);
    expect(byName[0].id).toBe('cat5');

    // Query by parentId index
    const byParentId = await testDB.categories.where('parentId').equals('parent1').toArray();
    expect(byParentId).toHaveLength(2);
    expect(byParentId.map(cat => cat.id)).toContain('cat4');
    expect(byParentId.map(cat => cat.id)).toContain('cat5');
  });
});

describe('Account Operations', () => {
  let testDB: BudgetFlowrDB;

  beforeEach(async () => {
    testDB = new BudgetFlowrDB();
    await testDB.open();
  });

  afterEach(async () => {
    // Clear tables before closing the database
    await testDB.accounts.clear();
    await testDB.close();
  });

  it('should add and retrieve an account', async () => {
    const account: Account = {
      id: 'acc1',
      name: 'Test Account',
      type: 'checking',
      balance: 1000,
    };
    await testDB.accounts.add(account);
    const retrieved = await testDB.accounts.get('acc1');
    expect(retrieved).toEqual(account);
  });

  it('should update an account', async () => {
    const account: Account = {
      id: 'acc2',
      name: 'Initial Account',
      type: 'savings',
      balance: 2000,
    };
    await testDB.accounts.add(account);
    const updatedAccount: Account = { ...account, name: 'Updated Account', balance: 2500 };
    await testDB.accounts.put(updatedAccount);
    const retrieved = await testDB.accounts.get('acc2');
    expect(retrieved).toEqual(updatedAccount);
  });

  it('should delete an account', async () => {
    const account: Account = {
      id: 'acc3',
      name: 'To be deleted',
      type: 'credit',
      balance: 500,
    };
    await testDB.accounts.add(account);
    await testDB.accounts.delete('acc3');
    const retrieved = await testDB.accounts.get('acc3');
    expect(retrieved).toBeUndefined();
  });

  it('should handle account query by index', async () => {
    const accounts: Account[] = [
      {
        id: 'acc4',
        name: 'Checking Account',
        type: 'checking',
        balance: 1000,
      },
      {
        id: 'acc5',
        name: 'Savings Account',
        type: 'savings',
        balance: 5000,
      },
      {
        id: 'acc6',
        name: 'Credit Card',
        type: 'credit',
        balance: -500,
      },
    ];

    await testDB.accounts.bulkAdd(accounts);

    // Query by name index
    const byName = await testDB.accounts.where('name').equals('Savings Account').toArray();
    expect(byName).toHaveLength(1);
    expect(byName[0].id).toBe('acc5');

    // Query by type index
    const byType = await testDB.accounts.where('type').equals('checking').toArray();
    expect(byType).toHaveLength(1);
    expect(byType[0].id).toBe('acc4');
  });
});

describe('Asset Operations', () => {
  let testDB: BudgetFlowrDB;

  beforeEach(async () => {
    testDB = new BudgetFlowrDB();
    await testDB.open();
  });

  afterEach(async () => {
    // Clear tables before closing the database
    await testDB.assets.clear();
    await testDB.close();
  });

  it('should add and retrieve an asset', async () => {
    const asset: Asset = {
      id: 'asset1',
      name: 'Test Asset',
      purchaseDate: '2025-01-01',
      purchaseAmount: 10000,
      categoryId: 'cat1',
      depreciationMethod: 'straight-line',
      usefulLifeYears: 5,
      salvageValue: 1000,
    };
    await testDB.assets.add(asset);
    const retrieved = await testDB.assets.get('asset1');
    expect(retrieved).toEqual(asset);
  });

  it('should update an asset', async () => {
    const asset: Asset = {
      id: 'asset2',
      name: 'Initial Asset',
      purchaseDate: '2025-01-01',
      purchaseAmount: 20000,
      categoryId: 'cat1',
      depreciationMethod: 'straight-line',
      usefulLifeYears: 10,
      salvageValue: 2000,
    };
    await testDB.assets.add(asset);
    const updatedAsset: Asset = { 
      ...asset, 
      name: 'Updated Asset', 
      purchaseAmount: 25000,
      usefulLifeYears: 8 
    };
    await testDB.assets.put(updatedAsset);
    const retrieved = await testDB.assets.get('asset2');
    expect(retrieved).toEqual(updatedAsset);
  });

  it('should delete an asset', async () => {
    const asset: Asset = {
      id: 'asset3',
      name: 'To be deleted',
      purchaseDate: '2025-01-01',
      purchaseAmount: 5000,
      categoryId: 'cat1',
      depreciationMethod: 'straight-line',
      usefulLifeYears: 3,
      salvageValue: 500,
    };
    await testDB.assets.add(asset);
    await testDB.assets.delete('asset3');
    const retrieved = await testDB.assets.get('asset3');
    expect(retrieved).toBeUndefined();
  });

  it('should handle asset query by index', async () => {
    const assets: Asset[] = [
      {
        id: 'asset4',
        name: 'Car',
        purchaseDate: '2025-01-01',
        purchaseAmount: 30000,
        categoryId: 'cat1',
        depreciationMethod: 'straight-line',
        usefulLifeYears: 7,
        salvageValue: 5000,
      },
      {
        id: 'asset5',
        name: 'Computer',
        purchaseDate: '2025-02-15',
        purchaseAmount: 2000,
        categoryId: 'cat2',
        depreciationMethod: 'straight-line',
        usefulLifeYears: 3,
        salvageValue: 200,
      },
      {
        id: 'asset6',
        name: 'Furniture',
        purchaseDate: '2025-01-01',
        purchaseAmount: 5000,
        categoryId: 'cat3',
        depreciationMethod: 'straight-line',
        usefulLifeYears: 10,
        salvageValue: 500,
      },
    ];

    await testDB.assets.bulkAdd(assets);

    // Query by name index
    const byName = await testDB.assets.where('name').equals('Computer').toArray();
    expect(byName).toHaveLength(1);
    expect(byName[0].id).toBe('asset5');

    // Query by purchaseDate index
    const byPurchaseDate = await testDB.assets.where('purchaseDate').equals('2025-01-01').toArray();
    expect(byPurchaseDate).toHaveLength(2);
    expect(byPurchaseDate.map(asset => asset.id)).toContain('asset4');
    expect(byPurchaseDate.map(asset => asset.id)).toContain('asset6');

    // Query by categoryId index
    const byCategoryId = await testDB.assets.where('categoryId').equals('cat1').toArray();
    expect(byCategoryId).toHaveLength(1);
    expect(byCategoryId[0].id).toBe('asset4');
  });
});

describe('SinkingFund Operations', () => {
  let testDB: BudgetFlowrDB;

  beforeEach(async () => {
    testDB = new BudgetFlowrDB();
    await testDB.open();
  });

  afterEach(async () => {
    // Clear tables before closing the database
    await testDB.sinkingFunds.clear();
    await testDB.close();
  });

  it('should add and retrieve a sinking fund', async () => {
    const sinkingFund: SinkingFund = {
      id: 'sf1',
      name: 'Test Sinking Fund',
      targetAmount: 5000,
      currentAmount: 1000,
      targetDate: '2026-01-01',
    };
    await testDB.sinkingFunds.add(sinkingFund);
    const retrieved = await testDB.sinkingFunds.get('sf1');
    expect(retrieved).toEqual(sinkingFund);
  });

  it('should update a sinking fund', async () => {
    const sinkingFund: SinkingFund = {
      id: 'sf2',
      name: 'Initial Sinking Fund',
      targetAmount: 10000,
      currentAmount: 2000,
      targetDate: '2026-01-01',
    };
    await testDB.sinkingFunds.add(sinkingFund);
    const updatedSinkingFund: SinkingFund = { 
      ...sinkingFund, 
      name: 'Updated Sinking Fund', 
      currentAmount: 3000,
      targetDate: '2026-06-01' 
    };
    await testDB.sinkingFunds.put(updatedSinkingFund);
    const retrieved = await testDB.sinkingFunds.get('sf2');
    expect(retrieved).toEqual(updatedSinkingFund);
  });

  it('should delete a sinking fund', async () => {
    const sinkingFund: SinkingFund = {
      id: 'sf3',
      name: 'To be deleted',
      targetAmount: 2000,
      currentAmount: 500,
      targetDate: '2026-01-01',
    };
    await testDB.sinkingFunds.add(sinkingFund);
    await testDB.sinkingFunds.delete('sf3');
    const retrieved = await testDB.sinkingFunds.get('sf3');
    expect(retrieved).toBeUndefined();
  });

  it('should handle sinking fund query by index', async () => {
    const sinkingFunds: SinkingFund[] = [
      {
        id: 'sf4',
        name: 'Vacation Fund',
        targetAmount: 3000,
        currentAmount: 1000,
        targetDate: '2026-01-01',
      },
      {
        id: 'sf5',
        name: 'Car Repair Fund',
        targetAmount: 2000,
        currentAmount: 500,
        targetDate: '2026-01-01',
        associatedAssetId: 'asset1',
      },
      {
        id: 'sf6',
        name: 'Home Improvement Fund',
        targetAmount: 10000,
        currentAmount: 2000,
        targetDate: '2027-01-01',
        associatedAssetId: 'asset2',
      },
    ];

    await testDB.sinkingFunds.bulkAdd(sinkingFunds);

    // Query by name index
    const byName = await testDB.sinkingFunds.where('name').equals('Car Repair Fund').toArray();
    expect(byName).toHaveLength(1);
    expect(byName[0].id).toBe('sf5');

    // Query by targetDate index
    const byTargetDate = await testDB.sinkingFunds.where('targetDate').equals('2026-01-01').toArray();
    expect(byTargetDate).toHaveLength(2);
    expect(byTargetDate.map(sf => sf.id)).toContain('sf4');
    expect(byTargetDate.map(sf => sf.id)).toContain('sf5');

    // Query by associatedAssetId index
    const byAssetId = await testDB.sinkingFunds.where('associatedAssetId').equals('asset1').toArray();
    expect(byAssetId).toHaveLength(1);
    expect(byAssetId[0].id).toBe('sf5');
  });
});

describe('generateUUID', () => {
  it('should generate a valid UUID', () => {
    const uuid = generateUUID();
    
    // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // where x is any hexadecimal digit and y is one of 8, 9, A, or B
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });

  it('should generate unique UUIDs', () => {
    const uuids = new Set();
    for (let i = 0; i < 1000; i++) {
      uuids.add(generateUUID());
    }
    
    // All UUIDs should be unique
    expect(uuids.size).toBe(1000);
  });

  it('should use Math.random for randomness', () => {
    // Mock Math.random to return a fixed value
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockReturnValue(0.5);
    
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    
    // With a fixed random value, the UUIDs should be identical
    expect(uuid1).toBe(uuid2);
    
    // Restore the original implementation
    randomSpy.mockRestore();
  });
});

describe('Database Error Handling', () => {
  let testDB: BudgetFlowrDB;

  beforeEach(async () => {
    testDB = new BudgetFlowrDB();
    await testDB.open();
  });

  afterEach(async () => {
    await testDB.close();
  });

  it('should handle database open errors', async () => {
    // Create a spy on Dexie.prototype.open to simulate an error
    const openSpy = vi.spyOn(Dexie.prototype, 'open');
    openSpy.mockRejectedValueOnce(new Error('Failed to open database'));
    
    // Create a new instance and try to open it
    const errorDB = new BudgetFlowrDB();
    await expect(errorDB.open()).rejects.toThrow('Failed to open database');
    
    // Restore the original implementation
    openSpy.mockRestore();
  });

  it('should handle transaction errors', async () => {
    // Create a spy on the transactions table's add method to simulate an error
    const addSpy = vi.spyOn(testDB.transactions, 'add');
    addSpy.mockRejectedValueOnce(new Error('Failed to add record'));
    
    const transaction: Transaction = {
      id: 'tx-error',
      date: '2025-05-01',
      description: 'Error transaction',
      categoryId: 'cat1',
      amount: 100,
      type: 'income',
      status: 'completed',
    };
    
    await expect(testDB.transactions.add(transaction)).rejects.toThrow('Failed to add record');
    
    // Restore the original implementation
    addSpy.mockRestore();
  });
});
