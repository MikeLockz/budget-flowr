import Dexie, { Table } from 'dexie';
import { FieldMapping } from './import/field-mapping-types';

// Define interfaces for core entities

export interface Transaction {
  id: string;
  date: string;
  description: string;
  categoryId: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'completed' | 'pending' | 'upcoming';
  accountId?: string; // New field for version 2
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
  fieldMappings!: Table<FieldMapping, string>; // Use FieldMapping type instead of any

  constructor() {
    super('BudgetFlowrDB');
    
    // Version 1: Initial schema
    this.version(1).stores({
      transactions: 'id, date, categoryId, type, status',
      categories: 'id, name, parentId',
      accounts: 'id, name, type',
      assets: 'id, name, purchaseDate, categoryId',
      sinkingFunds: 'id, name, targetDate, associatedAssetId',
    });
    
    // Version 2: Add accountId to transactions
    this.version(2).stores({
      transactions: 'id, date, categoryId, type, status, accountId', // Added accountId index
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
    
    // Version 3: Add fieldMappings table
    this.version(3).stores({
      fieldMappings: 'id, name, sourceIdentifier'
    });
  }
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0,
          v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const db = new BudgetFlowrDB();
