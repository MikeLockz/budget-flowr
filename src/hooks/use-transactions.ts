// Replace mock API functions with Dexie.js database operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, Transaction as TransactionType, Category } from '@/lib/db';
import { useMemo } from 'react';

const fetchTransactions = async (): Promise<TransactionType[]> => {
  return db.transactions.toArray();
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

export const useTransactions = () => {
  return useQuery<TransactionType[]>({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });
};

export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
};

export const useTransactionData = () => {
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const transactionsWithCategoryName = useMemo(() => {
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    return transactions.map(t => ({
      ...t,
      categoryName: categoryMap.get(t.categoryId) || 'Uncategorized',
    }));
  }, [transactions, categories]);

  const prepareCategoryChartData = () => {
    const expenseMap = new Map<string, number>();
    categories.forEach(c => {
      expenseMap.set(c.name, 0);
    });
    expenseMap.set('Uncategorized', 0);

    transactionsWithCategoryName.forEach(t => {
      // Consider both 'expense' and expense-like types for category chart data
      if (t.type === 'expense' || 
          t.type === 'True Expense' || 
          t.type === 'Capital Transfer') {
        const categoryName = expenseMap.has(t.categoryName) ? t.categoryName : 'Uncategorized';
        expenseMap.set(categoryName, (expenseMap.get(categoryName) || 0) + t.amount);
      }
    });

    const categoriesList = Array.from(expenseMap.keys());
    const categoryExpenses = Array.from(expenseMap.values());

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
  };

  const categoryChartData = useMemo(() => prepareCategoryChartData(), [transactionsWithCategoryName, categories]);

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
      queryClient.setQueryData<TransactionType[]>(['transactions'], (oldData = []) =>
        oldData.filter((transaction) => transaction.id !== deletedId)
      );
    },
  });
};
