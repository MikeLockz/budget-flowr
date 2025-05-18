// Replace mock API functions with Dexie.js database operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, Transaction as TransactionType, Category } from '@/lib/db';
import { transactionRepository } from '@/lib/repositories';
import { useMemo } from 'react';
import { useVisualizationSettings } from '@/lib/store/visualization-settings';

const fetchTransactions = async (archived = false): Promise<TransactionType[]> => {
  console.log(`HOOKS: Fetching ${archived ? 'archived' : 'active'} transactions`);
  const transactions = archived 
    ? await transactionRepository.getArchivedTransactions()
    : await transactionRepository.getActiveTransactions();
  console.log(`HOOKS: Fetched ${transactions.length} ${archived ? 'archived' : 'active'} transactions`);
  return transactions;
};

const fetchCategories = async (): Promise<Category[]> => {
  return db.categories.toArray();
};

const addTransaction = async (transaction: Omit<TransactionType, 'id'>): Promise<TransactionType> => {
  const id = await db.transactions.add(transaction as TransactionType);
  const newTransaction = await db.transactions.get(id);
  if (!newTransaction) throw new Error('Failed to add transaction');
  return newTransaction;
};

const updateTransaction = async (transaction: TransactionType): Promise<TransactionType> => {
  await db.transactions.put(transaction);
  const updatedTransaction = await db.transactions.get(transaction.id);
  if (!updatedTransaction) throw new Error('Failed to update transaction');
  return updatedTransaction;
};

const deleteTransaction = async (id: string): Promise<string> => {
  await db.transactions.delete(id);
  return id;
};

export const useTransactions = (archived = false) => {
  return useQuery<TransactionType[]>({
    queryKey: ['transactions', { archived }],
    queryFn: () => fetchTransactions(archived),
    // Force refetch on mount for the dashboard
    refetchOnMount: true,
  });
};

export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    // Force refetch on mount for the dashboard
    refetchOnMount: true,
  });
};

export const useTransactionData = (archived = false) => {
  console.log(`HOOKS: useTransactionData called with archived=${archived}`);
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions(archived);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  
  console.log('HOOKS: useTransactionData - received transactions and categories', {
    transactionsCount: transactions.length,
    categoriesCount: categories.length,
    isLoadingTransactions: transactionsLoading,
    isLoadingCategories: categoriesLoading
  });

  const transactionsWithCategoryName = useMemo(() => {
    console.log('HOOKS: Computing transactionsWithCategoryName');
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const result = transactions.map(t => ({
      ...t,
      categoryName: categoryMap.get(t.categoryId) || 'Uncategorized',
    }));
    console.log('HOOKS: Computed transactionsWithCategoryName', { count: result.length });
    return result;
  }, [transactions, categories]);

  const { typeClassifications } = useVisualizationSettings();
  
  const categoryChartData = useMemo(() => {
    console.log('HOOKS: Computing categoryChartData');
    const expenseMap = new Map<string, number>();
    categories.forEach(c => {
      expenseMap.set(c.name, 0);
    });
    expenseMap.set('Uncategorized', 0);

    // Log the transaction types to see what's available
    const types = new Set<string>();
    transactionsWithCategoryName.forEach(t => {
      if (t.type) types.add(t.type);
    });
    console.log('HOOKS: Transaction types found:', Array.from(types));
    console.log('HOOKS: Type classifications:', typeClassifications);

    // Track which transactions are being counted as expenses
    let expenseCount = 0;
    transactionsWithCategoryName.forEach(t => {
      // Use transaction type classifications from visualization settings
      const classification = typeClassifications[t.type] || 'uncategorized';
      if (classification === 'expense') {
        expenseCount++;
        const categoryName = expenseMap.has(t.categoryName) ? t.categoryName : 'Uncategorized';
        expenseMap.set(categoryName, (expenseMap.get(categoryName) || 0) + t.amount);
      }
    });
    console.log(`HOOKS: Found ${expenseCount} transactions classified as expenses`);

    const categoriesList = Array.from(expenseMap.keys());
    const categoryExpenses = Array.from(expenseMap.values());
    
    console.log('HOOKS: Category expenses calculated', {
      categoriesCount: categoriesList.length,
      totalExpenses: categoryExpenses.reduce((sum, val) => sum + val, 0),
      categories: categoriesList,
      expenses: categoryExpenses
    });

    const barChartData = [
      { name: 'Expenses', data: categoryExpenses },
    ];

    const pieChartData = categoriesList.map((name, index) => ({
      name,
      value: categoryExpenses[index],
    }));

    return {
      categories: categoriesList,
      barChartData,
      pieChartData,
    };
  }, [transactionsWithCategoryName, categories, typeClassifications]);

  return {
    transactions: transactionsWithCategoryName,
    categories,
    categoryChartData,
    isLoading: transactionsLoading || categoriesLoading,
  };
};

export const useAddTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<TransactionType, Error, Omit<TransactionType, 'id'>>({
    mutationFn: addTransaction,
    onSuccess: (newTransaction) => {
      queryClient.setQueryData<TransactionType[]>(['transactions'], (oldData = []) => [
        ...oldData,
        newTransaction,
      ]);
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<TransactionType, Error, TransactionType>({
    mutationFn: updateTransaction,
    onSuccess: (updatedTransaction) => {
      queryClient.setQueryData<TransactionType[]>(['transactions'], (oldData = []) =>
        oldData.map((transaction) =>
          transaction.id === updatedTransaction.id ? updatedTransaction : transaction
        )
      );
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<string, Error, string>({
    mutationFn: deleteTransaction,
    onSuccess: (deletedId) => {
      queryClient.setQueryData<TransactionType[]>(['transactions', { archived: false }], (oldData = []) =>
        oldData.filter((transaction) => transaction.id !== deletedId)
      );
      queryClient.setQueryData<TransactionType[]>(['transactions', { archived: true }], (oldData = []) =>
        oldData.filter((transaction) => transaction.id !== deletedId)
      );
    },
  });
};

export const useArchiveTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => transactionRepository.archiveTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useRestoreTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => transactionRepository.restoreTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useBulkArchiveTransactions = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string[]>({
    mutationFn: (ids: string[]) => transactionRepository.bulkArchive(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useBulkRestoreTransactions = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string[]>({
    mutationFn: (ids: string[]) => transactionRepository.bulkRestore(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};
