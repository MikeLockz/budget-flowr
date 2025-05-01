import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define transaction type
export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'completed' | 'pending' | 'upcoming';
}

// Mock API functions
const fetchTransactions = async (): Promise<Transaction[]> => {
  // In a real app, this would be an API call
  // For demo purposes, we'll return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          date: '2025-04-15',
          description: 'Groceries',
          category: 'Food',
          amount: 125.5,
          type: 'expense',
          status: 'completed',
        },
        {
          id: '2',
          date: '2025-04-01',
          description: 'Salary',
          category: 'Income',
          amount: 3500,
          type: 'income',
          status: 'completed',
        },
        {
          id: '3',
          date: '2025-04-10',
          description: 'Electricity Bill',
          category: 'Utilities',
          amount: 85.2,
          type: 'expense',
          status: 'pending',
        },
        {
          id: '4',
          date: '2025-04-05',
          description: 'Internet',
          category: 'Utilities',
          amount: 65,
          type: 'expense',
          status: 'completed',
        },
        {
          id: '5',
          date: '2025-04-30',
          description: 'Rent',
          category: 'Housing',
          amount: 1200,
          type: 'expense',
          status: 'upcoming',
        },
      ]);
    }, 500); // Simulate network delay
  });
};

const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const newTransaction = {
        ...transaction,
        id: Math.random().toString(36).substring(2, 9),
      };
      resolve(newTransaction);
    }, 500);
  });
};

const updateTransaction = async (transaction: Transaction): Promise<Transaction> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(transaction);
    }, 500);
  });
};

const deleteTransaction = async (id: string): Promise<string> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(id);
    }, 500);
  });
};

// Query hooks
export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });
};

export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addTransaction,
    onSuccess: (newTransaction) => {
      // Update the transactions query data
      queryClient.setQueryData<Transaction[]>(['transactions'], (oldData = []) => [
        ...oldData,
        newTransaction,
      ]);
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateTransaction,
    onSuccess: (updatedTransaction) => {
      // Update the transactions query data
      queryClient.setQueryData<Transaction[]>(['transactions'], (oldData = []) =>
        oldData.map((transaction) =>
          transaction.id === updatedTransaction.id ? updatedTransaction : transaction
        )
      );
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: (deletedId) => {
      // Update the transactions query data
      queryClient.setQueryData<Transaction[]>(['transactions'], (oldData = []) =>
        oldData.filter((transaction) => transaction.id !== deletedId)
      );
    },
  });
};
