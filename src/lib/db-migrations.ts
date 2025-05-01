import { Transaction, Category, Account, Asset, SinkingFund } from './db';

/**
 * Migration functions for specific version upgrades
 */
export const migrations = {
  /**
   * Version 1 to 2 migration for Transaction entities
   * Adds accountId field with default value
   */
  v1tov2Transaction: (transaction: Transaction): Transaction => {
    if (!transaction.accountId) {
      return {
        ...transaction,
        accountId: 'default'
      };
    }
    return transaction;
  },

  /**
   * Placeholder for future version 2 to 3 migration
   * This would be implemented when version 3 schema is defined
   */
  // v2tov3Transaction: (transaction: Transaction): Transaction => {
  //   // Example future migration
  //   return transaction;
  // },

  /**
   * Placeholder for future Category migrations
   */
  // v1tov2Category: (category: Category): Category => {
  //   return category;
  // },

  /**
   * Placeholder for future Account migrations
   */
  // v1tov2Account: (account: Account): Account => {
  //   return account;
  // },

  /**
   * Placeholder for future Asset migrations
   */
  // v1tov2Asset: (asset: Asset): Asset => {
  //   return asset;
  // },

  /**
   * Placeholder for future SinkingFund migrations
   */
  // v1tov2SinkingFund: (sinkingFund: SinkingFund): SinkingFund => {
  //   return sinkingFund;
  // },
};

/**
 * Validate data integrity after migration
 * @param entityType The type of entity to validate
 * @param entity The entity to validate
 * @returns Boolean indicating if the entity is valid
 */
export type EntityType = Transaction | Category | Account | Asset | SinkingFund;

// Type guards to check entity types
function isTransaction(entity: EntityType): entity is Transaction {
  return 'type' in entity && 'status' in entity;
}

function isCategory(entity: EntityType): entity is Category {
  return 'name' in entity && !('balance' in entity) && !('purchaseDate' in entity) && !('targetAmount' in entity);
}

function isAccount(entity: EntityType): entity is Account {
  return 'balance' in entity && 'type' in entity && !('purchaseDate' in entity);
}

function isAsset(entity: EntityType): entity is Asset {
  return 'purchaseDate' in entity && 'depreciationMethod' in entity;
}

function isSinkingFund(entity: EntityType): entity is SinkingFund {
  return 'targetAmount' in entity && 'currentAmount' in entity && 'targetDate' in entity;
}

export function validateEntity(entityType: string, entity: EntityType): boolean {
  switch (entityType) {
    case 'transaction':
      return isTransaction(entity) ? validateTransaction(entity) : false;
    case 'category':
      return isCategory(entity) ? validateCategory(entity) : false;
    case 'account':
      return isAccount(entity) ? validateAccount(entity) : false;
    case 'asset':
      return isAsset(entity) ? validateAsset(entity) : false;
    case 'sinkingFund':
      return isSinkingFund(entity) ? validateSinkingFund(entity) : false;
    default:
      return false;
  }
}

/**
 * Validate a Transaction entity
 * @param transaction The transaction to validate
 * @returns Boolean indicating if the transaction is valid
 */
function validateTransaction(transaction: Transaction): boolean {
  // Basic validation
  if (!transaction.id || !transaction.date || !transaction.description || 
      !transaction.categoryId || transaction.amount === undefined || 
      !transaction.type || !transaction.status) {
    return false;
  }
  
  // For version 2+, validate accountId
  if (transaction.accountId === undefined) {
    return false;
  }
  
  return true;
}

/**
 * Validate a Category entity
 * @param category The category to validate
 * @returns Boolean indicating if the category is valid
 */
function validateCategory(category: Category): boolean {
  // Basic validation
  if (!category.id || !category.name) {
    return false;
  }
  
  return true;
}

/**
 * Validate an Account entity
 * @param account The account to validate
 * @returns Boolean indicating if the account is valid
 */
function validateAccount(account: Account): boolean {
  // Basic validation
  if (!account.id || !account.name || !account.type || account.balance === undefined) {
    return false;
  }
  
  return true;
}

/**
 * Validate an Asset entity
 * @param asset The asset to validate
 * @returns Boolean indicating if the asset is valid
 */
function validateAsset(asset: Asset): boolean {
  // Basic validation
  if (!asset.id || !asset.name || !asset.purchaseDate || 
      asset.purchaseAmount === undefined || !asset.categoryId || 
      !asset.depreciationMethod || asset.usefulLifeYears === undefined || 
      asset.salvageValue === undefined) {
    return false;
  }
  
  return true;
}

/**
 * Validate a SinkingFund entity
 * @param sinkingFund The sinking fund to validate
 * @returns Boolean indicating if the sinking fund is valid
 */
function validateSinkingFund(sinkingFund: SinkingFund): boolean {
  // Basic validation
  if (!sinkingFund.id || !sinkingFund.name || 
      sinkingFund.targetAmount === undefined || 
      sinkingFund.currentAmount === undefined || 
      !sinkingFund.targetDate) {
    return false;
  }
  
  return true;
}
