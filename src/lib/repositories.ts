import Dexie from 'dexie';
import { db, Transaction, Category, Account, Asset, SinkingFund, ImportSession } from './db';

export class BaseRepository<T, K> {
  protected table: Dexie.Table<T, K>;

  constructor(table: Dexie.Table<T, K>) {
    this.table = table;
  }

  async getAll(): Promise<T[]> {
    return this.table.toArray();
  }

  async getById(id: K): Promise<T | undefined> {
    return this.table.get(id);
  }

  async add(item: T): Promise<K> {
    return this.table.add(item);
  }

  async update(item: T): Promise<void> {
    // @ts-expect-error TS workaround for Dexie put method
    return this.table.put(item);
  }

  async remove(id: K): Promise<void> {
    return this.table.delete(id);
  }
}

export class TransactionRepository extends BaseRepository<Transaction, string> {
  constructor() {
    super(db.transactions);
  }

  // Add any transaction-specific methods here
}

export class CategoryRepository extends BaseRepository<Category, string> {
  constructor() {
    super(db.categories);
  }
}

export class AccountRepository extends BaseRepository<Account, string> {
  constructor() {
    super(db.accounts);
  }
}

export class AssetRepository extends BaseRepository<Asset, string> {
  constructor() {
    super(db.assets);
  }
}

export class SinkingFundRepository extends BaseRepository<SinkingFund, string> {
  constructor() {
    super(db.sinkingFunds);
  }
}

export class ImportRepository extends BaseRepository<ImportSession, string> {
  constructor() {
    super(db.imports);
  }
}

// Export instances for use
export const transactionRepository = new TransactionRepository();
export const categoryRepository = new CategoryRepository();
export const accountRepository = new AccountRepository();
export const assetRepository = new AssetRepository();
export const sinkingFundRepository = new SinkingFundRepository();
export const importRepository = new ImportRepository();
