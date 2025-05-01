// Replace mock API functions with Dexie.js database operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, Transaction as TransactionType } from '@/lib/db';

const fetchTransactions = async (): Promise<TransactionType[]> => {
  return db.transactions.toArray();
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
