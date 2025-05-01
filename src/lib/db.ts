import Dexie, { Table } from 'dexie';

// Define interfaces for core entities

export interface Transaction {
  id: string;
  date: string;
  description: string;
  categoryId: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'completed' | 'pending' | 'upcoming';
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  balance: number;
}

export interface Asset {
  id: string;
  name: string;
  purchaseDate: string;
  purchaseAmount: number;
  categoryId: string;
  depreciationMethod: string;
  usefulLifeYears: number;
  salvageValue: number;
}

export interface SinkingFund {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  associatedAssetId?: string;
}

// Define the database

export class BudgetFlowrDB extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  accounts!: Table<Account, string>;
  assets!: Table<Asset, string>;
  sinkingFunds!: Table<SinkingFund, string>;

  constructor() {
    super('BudgetFlowrDB');
    this.version(1).stores({
      transactions: 'id, date, categoryId, type, status',
      categories: 'id, name, parentId',
      accounts: 'id, name, type',
      assets: 'id, name, purchaseDate, categoryId',
      sinkingFunds: 'id, name, targetDate, associatedAssetId',
    });

    this.version(2).stores({
      transactions: '++id, date, categoryId, type, status',
      categories: '++id, name, parentId',
      accounts: '++id, name, type',
      assets: '++id, name, purchaseDate, categoryId',
      sinkingFunds: '++id, name, targetDate, associatedAssetId',
    }).upgrade(async () => {
      // Example migration logic: no changes needed if IDs are compatible
      // Add migration code here if needed in the future
    });
  }
}

export const db = new BudgetFlowrDB();
