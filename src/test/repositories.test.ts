import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  BaseRepository, 
  TransactionRepository, 
  CategoryRepository,
  AccountRepository,
  AssetRepository,
  SinkingFundRepository,
  transactionRepository,
  categoryRepository,
  accountRepository,
  assetRepository,
  sinkingFundRepository
} from '../lib/repositories';
import { db, Transaction, Category, Account, Asset, SinkingFund } from '../lib/db';

describe('BaseRepository', () => {
  // Create a test repository instance using the Transaction table
  let testRepo: BaseRepository<Transaction, string>;

  beforeEach(() => {
    testRepo = new BaseRepository<Transaction, string>(db.transactions);
  });

  afterEach(async () => {
    // Clear the database after each test
    await db.transactions.clear();
  });

  it('should get all items from the table', async () => {
    // Add test items to the database
    const testItems: Transaction[] = [
      {
        id: 'test-id-1',
        date: '2025-05-01',
        description: 'Test transaction 1',
        categoryId: 'cat1',
        amount: 100,
        type: 'income',
        status: 'completed',
      },
      {
        id: 'test-id-2',
        date: '2025-05-02',
        description: 'Test transaction 2',
        categoryId: 'cat2',
        amount: 50,
        type: 'expense',
        status: 'pending',
      },
    ];

    await db.transactions.add(testItems[0]);
    await db.transactions.add(testItems[1]);

    // Call getAll and verify the result
    const result = await testRepo.getAll();
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining(testItems[0]),
        expect.objectContaining(testItems[1]),
      ])
    );
  });

  it('should get an item by id', async () => {
    // Add a test item to the database
    const testItem: Transaction = {
      id: 'test-id-3',
      date: '2025-05-01',
      description: 'Test transaction 3',
      categoryId: 'cat1',
      amount: 100,
      type: 'income',
      status: 'completed',
    };

    await db.transactions.add(testItem);

    // Call getById and verify the result
    const result = await testRepo.getById('test-id-3');
    expect(result).toEqual(expect.objectContaining(testItem));
  });

  it('should return undefined when getting a non-existent item', async () => {
    // Call getById with a non-existent id
    const result = await testRepo.getById('non-existent-id');
    expect(result).toBeUndefined();
  });

  it('should add an item to the table', async () => {
    // Create a test item
    const testItem: Transaction = {
      id: 'test-id-4',
      date: '2025-05-01',
      description: 'Test transaction 4',
      categoryId: 'cat1',
      amount: 100,
      type: 'income',
      status: 'completed',
    };

    // Call add and verify the result
    const id = await testRepo.add(testItem);
    expect(id).toBe('test-id-4');

    // Verify the item was added to the database
    const result = await db.transactions.get('test-id-4');
    expect(result).toEqual(expect.objectContaining(testItem));
  });

  it('should update an item in the table', async () => {
    // Add a test item to the database
    const testItem: Transaction = {
      id: 'test-id-5',
      date: '2025-05-01',
      description: 'Test transaction 5',
      categoryId: 'cat1',
      amount: 100,
      type: 'income',
      status: 'completed',
    };

    await db.transactions.add(testItem);

    // Update the item
    const updatedItem: Transaction = {
      ...testItem,
      description: 'Updated transaction 5',
      amount: 200,
    };

    // Call update and verify the result
    await testRepo.update(updatedItem);

    // Verify the item was updated in the database
    const result = await db.transactions.get('test-id-5');
    expect(result).toEqual(expect.objectContaining(updatedItem));
  });

  it('should remove an item from the table', async () => {
    // Add a test item to the database
    const testItem: Transaction = {
      id: 'test-id-6',
      date: '2025-05-01',
      description: 'Test transaction 6',
      categoryId: 'cat1',
      amount: 100,
      type: 'income',
      status: 'completed',
    };

    await db.transactions.add(testItem);

    // Call remove and verify the result
    await testRepo.remove('test-id-6');

    // Verify the item was removed from the database
    const result = await db.transactions.get('test-id-6');
    expect(result).toBeUndefined();
  });

  it('should handle errors when performing operations', async () => {
    // Mock the database to throw an error
    vi.spyOn(db.transactions, 'toArray').mockRejectedValueOnce(
      new Error('Database error')
    );

    // Call getAll and verify it throws an error
    await expect(testRepo.getAll()).rejects.toThrow('Database error');

    // Restore the original implementation
    vi.restoreAllMocks();
  });
});

describe('TransactionRepository', () => {
  let repo: TransactionRepository;

  beforeEach(() => {
    repo = new TransactionRepository();
  });

  afterEach(async () => {
    await db.transactions.clear();
  });

  it('should be initialized with the transactions table', async () => {
    // Add a test transaction
    const testTransaction: Transaction = {
      id: 'tx-test-1',
      date: '2025-05-01',
      description: 'Test transaction',
      categoryId: 'cat1',
      amount: 100,
      type: 'income',
      status: 'completed',
    };

    await repo.add(testTransaction);

    // Verify the transaction was added to the transactions table
    const result = await db.transactions.get('tx-test-1');
    expect(result).toEqual(expect.objectContaining(testTransaction));
  });

  it('should use the exported instance correctly', async () => {
    // Add a test transaction using the exported instance
    const testTransaction: Transaction = {
      id: 'tx-test-2',
      date: '2025-05-01',
      description: 'Test transaction',
      categoryId: 'cat1',
      amount: 100,
      type: 'income',
      status: 'completed',
    };

    await transactionRepository.add(testTransaction);

    // Verify the transaction was added to the transactions table
    const result = await db.transactions.get('tx-test-2');
    expect(result).toEqual(expect.objectContaining(testTransaction));
  });
});

describe('CategoryRepository', () => {
  let repo: CategoryRepository;

  beforeEach(() => {
    repo = new CategoryRepository();
  });

  afterEach(async () => {
    await db.categories.clear();
  });

  it('should be initialized with the categories table', async () => {
    // Add a test category
    const testCategory: Category = {
      id: 'cat-test-1',
      name: 'Test Category',
      color: '#FF0000',
    };

    await repo.add(testCategory);

    // Verify the category was added to the categories table
    const result = await db.categories.get('cat-test-1');
    expect(result).toEqual(expect.objectContaining(testCategory));
  });

  it('should use the exported instance correctly', async () => {
    // Add a test category using the exported instance
    const testCategory: Category = {
      id: 'cat-test-2',
      name: 'Test Category',
      color: '#00FF00',
    };

    await categoryRepository.add(testCategory);

    // Verify the category was added to the categories table
    const result = await db.categories.get('cat-test-2');
    expect(result).toEqual(expect.objectContaining(testCategory));
  });
});

describe('AccountRepository', () => {
  let repo: AccountRepository;

  beforeEach(() => {
    repo = new AccountRepository();
  });

  afterEach(async () => {
    await db.accounts.clear();
  });

  it('should be initialized with the accounts table', async () => {
    // Add a test account
    const testAccount: Account = {
      id: 'acc-test-1',
      name: 'Test Account',
      type: 'checking',
      balance: 1000,
    };

    await repo.add(testAccount);

    // Verify the account was added to the accounts table
    const result = await db.accounts.get('acc-test-1');
    expect(result).toEqual(expect.objectContaining(testAccount));
  });

  it('should use the exported instance correctly', async () => {
    // Add a test account using the exported instance
    const testAccount: Account = {
      id: 'acc-test-2',
      name: 'Test Account',
      type: 'savings',
      balance: 2000,
    };

    await accountRepository.add(testAccount);

    // Verify the account was added to the accounts table
    const result = await db.accounts.get('acc-test-2');
    expect(result).toEqual(expect.objectContaining(testAccount));
  });
});

describe('AssetRepository', () => {
  let repo: AssetRepository;

  beforeEach(() => {
    repo = new AssetRepository();
  });

  afterEach(async () => {
    await db.assets.clear();
  });

  it('should be initialized with the assets table', async () => {
    // Add a test asset
    const testAsset: Asset = {
      id: 'asset-test-1',
      name: 'Test Asset',
      purchaseDate: '2025-01-01',
      purchaseAmount: 10000,
      categoryId: 'cat1',
      depreciationMethod: 'straight-line',
      usefulLifeYears: 5,
      salvageValue: 1000,
    };

    await repo.add(testAsset);

    // Verify the asset was added to the assets table
    const result = await db.assets.get('asset-test-1');
    expect(result).toEqual(expect.objectContaining(testAsset));
  });

  it('should use the exported instance correctly', async () => {
    // Add a test asset using the exported instance
    const testAsset: Asset = {
      id: 'asset-test-2',
      name: 'Test Asset',
      purchaseDate: '2025-01-01',
      purchaseAmount: 20000,
      categoryId: 'cat1',
      depreciationMethod: 'straight-line',
      usefulLifeYears: 10,
      salvageValue: 2000,
    };

    await assetRepository.add(testAsset);

    // Verify the asset was added to the assets table
    const result = await db.assets.get('asset-test-2');
    expect(result).toEqual(expect.objectContaining(testAsset));
  });
});

describe('SinkingFundRepository', () => {
  let repo: SinkingFundRepository;

  beforeEach(() => {
    repo = new SinkingFundRepository();
  });

  afterEach(async () => {
    await db.sinkingFunds.clear();
  });

  it('should be initialized with the sinkingFunds table', async () => {
    // Add a test sinking fund
    const testSinkingFund: SinkingFund = {
      id: 'sf-test-1',
      name: 'Test Sinking Fund',
      targetAmount: 5000,
      currentAmount: 1000,
      targetDate: '2026-01-01',
    };

    await repo.add(testSinkingFund);

    // Verify the sinking fund was added to the sinkingFunds table
    const result = await db.sinkingFunds.get('sf-test-1');
    expect(result).toEqual(expect.objectContaining(testSinkingFund));
  });

  it('should use the exported instance correctly', async () => {
    // Add a test sinking fund using the exported instance
    const testSinkingFund: SinkingFund = {
      id: 'sf-test-2',
      name: 'Test Sinking Fund',
      targetAmount: 10000,
      currentAmount: 2000,
      targetDate: '2026-01-01',
      associatedAssetId: 'asset-1',
    };

    await sinkingFundRepository.add(testSinkingFund);

    // Verify the sinking fund was added to the sinkingFunds table
    const result = await db.sinkingFunds.get('sf-test-2');
    expect(result).toEqual(expect.objectContaining(testSinkingFund));
  });
});
