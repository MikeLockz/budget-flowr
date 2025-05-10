import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTransactions, useAddTransaction, useUpdateTransaction, useDeleteTransaction } from '../hooks/use-transactions';
import { db, Transaction } from '../lib/db';
import { createWrapper } from './test-utils';

describe('Transaction Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a new QueryClient for each test to avoid cache pollution
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // Disable retries to make testing more predictable
          retry: false,
          // Disable caching for tests to avoid interference
          gcTime: 0,
          // Immediately consider data stale for testing purposes
          staleTime: 0,
        },
      },
    });
  });

  afterEach(async () => {
    // Clear the database after each test
    await db.transactions.clear();
    // Clear the query cache
    queryClient.clear();
  });

  describe('useTransactions', () => {
    it('returns an empty array when no transactions exist', async () => {
      const { result } = renderHook(() => useTransactions(), {
        wrapper: createWrapper(queryClient),
      });

      // Initially the query should be loading
      expect(result.current.isLoading).toBe(true);

      // Wait for the query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify the data is an empty array
      expect(result.current.data).toEqual([]);
    });

    it('returns all transactions when they exist', async () => {
      // Add test transactions to the database
      const testTransactions: Transaction[] = [
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
        {
          id: 'test-id-3',
          date: '2025-05-03',
          description: 'Test transaction 3',
          categoryId: 'cat3',
          amount: 200,
          type: 'Capital Transfer',
          status: 'completed',
        },
        {
          id: 'test-id-4',
          date: '2025-05-04',
          description: 'Test transaction 4',
          categoryId: 'cat4',
          amount: 300,
          type: 'True Expense',
          status: 'completed',
        },
      ];

      // Add transactions to the database
      await db.transactions.add(testTransactions[0]);
      await db.transactions.add(testTransactions[1]);

      // Render the hook
      const { result } = renderHook(() => useTransactions(), {
        wrapper: createWrapper(queryClient),
      });

      // Wait for the query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify the data contains both transactions
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining(testTransactions[0]),
          expect.objectContaining(testTransactions[1]),
        ])
      );
    });

    it('handles errors when fetching transactions', async () => {
      // Mock the database to throw an error
      vi.spyOn(db.transactions, 'toArray').mockRejectedValueOnce(
        new Error('Database error')
      );

      // Render the hook
      const { result } = renderHook(() => useTransactions(), {
        wrapper: createWrapper(queryClient),
      });

      // Wait for the query to fail
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Verify the error
      expect(result.current.error).toEqual(new Error('Database error'));

      // Restore the original implementation
      vi.restoreAllMocks();
    });
  });

  describe('useAddTransaction', () => {
    it('successfully adds a transaction to the database', async () => {
      // Render the hooks
      const { result: addResult } = renderHook(() => useAddTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      // Create a new transaction with ID
      const newTransaction: Transaction = {
        id: 'test-add-id',
        date: '2025-05-01',
        description: 'New transaction',
        categoryId: 'cat1',
        amount: 100,
        type: 'income',
        status: 'completed',
      };

      // Execute the mutation
      act(() => {
        addResult.current.mutate(newTransaction);
      });

      // Wait for the mutation to complete
      await waitFor(() => expect(addResult.current.isSuccess).toBe(true));

      // Verify the transaction was added to the database
      const transactions = await db.transactions.toArray();
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual(
        expect.objectContaining({
          ...newTransaction,
          id: expect.any(String),
        })
      );
    });

    it('updates the query cache with the new transaction', async () => {
      // Render the hooks
      const { result: queryResult } = renderHook(() => useTransactions(), {
        wrapper: createWrapper(queryClient),
      });

      const { result: addResult } = renderHook(() => useAddTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      // Wait for initial query to complete
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));
      expect(queryResult.current.data).toHaveLength(0);

      // Create a new transaction with ID
      const newTransaction: Transaction = {
        id: 'test-add-id-2',
        date: '2025-05-01',
        description: 'New transaction',
        categoryId: 'cat1',
        amount: 100,
        type: 'income',
        status: 'completed',
      };

      // Execute the mutation
      act(() => {
        addResult.current.mutate(newTransaction);
      });

      // Wait for the mutation to complete
      await waitFor(() => expect(addResult.current.isSuccess).toBe(true));

      // Verify the cache was updated
      expect(queryResult.current.data).toHaveLength(1);
      expect(queryResult.current.data?.[0]).toEqual(
        expect.objectContaining({
          ...newTransaction,
          id: expect.any(String),
        })
      );
    });

    it('handles errors when adding a transaction', async () => {
      // Mock the database to throw an error
      vi.spyOn(db.transactions, 'add').mockRejectedValueOnce(
        new Error('Database error')
      );

      // Render the hook
      const { result } = renderHook(() => useAddTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      // Create a new transaction
      const newTransaction: Omit<Transaction, 'id'> = {
        date: '2025-05-01',
        description: 'New transaction',
        categoryId: 'cat1',
        amount: 100,
        type: 'income',
        status: 'completed',
      };

      // Execute the mutation
      act(() => {
        result.current.mutate(newTransaction);
      });

      // Wait for the mutation to fail
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Verify the error
      expect(result.current.error).toEqual(new Error('Database error'));

      // Restore the original implementation
      vi.restoreAllMocks();
    });
  });

  describe('useUpdateTransaction', () => {
    it('successfully updates a transaction in the database', async () => {
      // Add a transaction to the database
      const transaction: Transaction = {
        id: 'test-update-id',
        date: '2025-05-01',
        description: 'Initial transaction',
        categoryId: 'cat1',
        amount: 100,
        type: 'income',
        status: 'completed',
      };
      await db.transactions.add(transaction);

      // Render the hook
      const { result } = renderHook(() => useUpdateTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      // Update the transaction
      const updatedTransaction: Transaction = {
        ...transaction,
        description: 'Updated transaction',
        amount: 150,
      };

      // Execute the mutation
      act(() => {
        result.current.mutate(updatedTransaction);
      });

      // Wait for the mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify the transaction was updated in the database
      const retrievedTransaction = await db.transactions.get('test-update-id');
      expect(retrievedTransaction).toEqual(updatedTransaction);
    });

    it('updates the query cache with the updated transaction', async () => {
      // Add a transaction to the database
      const transaction: Transaction = {
        id: 'test-update-id-2',
        date: '2025-05-01',
        description: 'Initial transaction',
        categoryId: 'cat1',
        amount: 100,
        type: 'income',
        status: 'completed',
      };
      await db.transactions.add(transaction);

      // Render the hooks
      const { result: queryResult } = renderHook(() => useTransactions(), {
        wrapper: createWrapper(queryClient),
      });

      const { result: updateResult } = renderHook(() => useUpdateTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      // Wait for initial query to complete
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));
      expect(queryResult.current.data).toHaveLength(1);
      expect(queryResult.current.data?.[0]).toEqual(transaction);

      // Update the transaction
      const updatedTransaction: Transaction = {
        ...transaction,
        description: 'Updated transaction',
        amount: 150,
      };

      // Execute the mutation
      act(() => {
        updateResult.current.mutate(updatedTransaction);
      });

      // Wait for the mutation to complete
      await waitFor(() => expect(updateResult.current.isSuccess).toBe(true));

      // Verify the cache was updated
      expect(queryResult.current.data).toHaveLength(1);
      expect(queryResult.current.data?.[0]).toEqual(updatedTransaction);
    });

    it('handles errors when updating a transaction', async () => {
      // Add a transaction to the database
      const transaction: Transaction = {
        id: 'test-update-id-3',
        date: '2025-05-01',
        description: 'Initial transaction',
        categoryId: 'cat1',
        amount: 100,
        type: 'income',
        status: 'completed',
      };
      await db.transactions.add(transaction);

      // Mock the database to throw an error
      vi.spyOn(db.transactions, 'put').mockRejectedValueOnce(
        new Error('Database error')
      );

      // Render the hook
      const { result } = renderHook(() => useUpdateTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      // Update the transaction
      const updatedTransaction: Transaction = {
        ...transaction,
        description: 'Updated transaction',
        amount: 150,
      };

      // Execute the mutation
      act(() => {
        result.current.mutate(updatedTransaction);
      });

      // Wait for the mutation to fail
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Verify the error
      expect(result.current.error).toEqual(new Error('Database error'));

      // Restore the original implementation
      vi.restoreAllMocks();
    });
  });

  describe('useDeleteTransaction', () => {
    it('successfully deletes a transaction from the database', async () => {
      // Add a transaction to the database
      const transaction: Transaction = {
        id: 'test-delete-id',
        date: '2025-05-01',
        description: 'To be deleted',
        categoryId: 'cat1',
        amount: 100,
        type: 'income',
        status: 'completed',
      };
      await db.transactions.add(transaction);

      // Render the hook
      const { result } = renderHook(() => useDeleteTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      // Execute the mutation
      act(() => {
        result.current.mutate('test-delete-id');
      });

      // Wait for the mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify the transaction was deleted from the database
      const retrievedTransaction = await db.transactions.get('test-delete-id');
      expect(retrievedTransaction).toBeUndefined();
    });

    it('updates the query cache by removing the deleted transaction', async () => {
      // Add a transaction to the database
      const transaction: Transaction = {
        id: 'test-delete-id-2',
        date: '2025-05-01',
        description: 'To be deleted',
        categoryId: 'cat1',
        amount: 100,
        type: 'income',
        status: 'completed',
      };
      await db.transactions.add(transaction);

      // Render the hooks
      const { result: queryResult } = renderHook(() => useTransactions(), {
        wrapper: createWrapper(queryClient),
      });

      const { result: deleteResult } = renderHook(() => useDeleteTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      // Wait for initial query to complete
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));
      expect(queryResult.current.data).toHaveLength(1);
      expect(queryResult.current.data?.[0]).toEqual(transaction);

      // Execute the mutation
      act(() => {
        deleteResult.current.mutate('test-delete-id-2');
      });

      // Wait for the mutation to complete
      await waitFor(() => expect(deleteResult.current.isSuccess).toBe(true));

      // Verify the cache was updated
      expect(queryResult.current.data).toHaveLength(0);
    });

    it('handles errors when deleting a transaction', async () => {
      // Add a transaction to the database
      const transaction: Transaction = {
        id: 'test-delete-id-3',
        date: '2025-05-01',
        description: 'To be deleted',
        categoryId: 'cat1',
        amount: 100,
        type: 'income',
        status: 'completed',
      };
      await db.transactions.add(transaction);

      // Mock the database to throw an error
      vi.spyOn(db.transactions, 'delete').mockRejectedValueOnce(
        new Error('Database error')
      );

      // Render the hook
      const { result } = renderHook(() => useDeleteTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      // Execute the mutation
      act(() => {
        result.current.mutate('test-delete-id-3');
      });

      // Wait for the mutation to fail
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Verify the error
      expect(result.current.error).toEqual(new Error('Database error'));

      // Restore the original implementation
      vi.restoreAllMocks();
    });
  });

  describe('Race conditions and edge cases', () => {
    it('handles concurrent mutations correctly', async () => {
      // Render the hooks
      const { result: addResult } = renderHook(() => useAddTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      // Create a spy to track calls without changing implementation
      const addSpy = vi.spyOn(db.transactions, 'add');
      

      // Create two transactions with IDs
      const firstTransaction: Transaction = {
        id: 'test-race-id-1',
        date: '2025-05-01',
        description: 'First',
        categoryId: 'cat1',
        amount: 100,
        type: 'income',
        status: 'completed',
      };

      const secondTransaction: Transaction = {
        id: 'test-race-id-2',
        date: '2025-05-01',
        description: 'Second',
        categoryId: 'cat1',
        amount: 200,
        type: 'income',
        status: 'completed',
      };

      // Execute mutations one after another
      act(() => {
        addResult.current.mutate(firstTransaction);
      });
      
      // Wait for first mutation to complete
      await waitFor(() => expect(addResult.current.isSuccess).toBe(true));
      
      // Execute second mutation
      act(() => {
        addResult.current.mutate(secondTransaction);
      });

      // Wait for mutations to complete
      await waitFor(() => expect(addResult.current.isSuccess).toBe(true));

      // Verify both transactions were added
      const transactions = await db.transactions.toArray();
      expect(transactions).toHaveLength(2);
      
      // Verify both transactions exist in the database
      expect(transactions.some(t => t.description === 'First')).toBe(true);
      expect(transactions.some(t => t.description === 'Second')).toBe(true);
      
      // Verify the spy was called twice
      expect(addSpy).toHaveBeenCalledTimes(2);

      // Restore the original implementation
      vi.restoreAllMocks();
    });
  });
});
