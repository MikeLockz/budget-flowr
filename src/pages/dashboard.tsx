import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LineChart, BarChart, PieChart } from '../components/charts/echarts-base';
import { ExampleDataGrid } from '@/components/data-grid/ag-grid-base';
import { useTransactions } from '@/hooks/use-transactions';
import { formatCurrency } from '@/lib/utils';
import { Transaction } from '@/lib/db';

// Utility functions for calculations
export const calculateTotalIncome = (transactions: Transaction[] = []): number => {
  return transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
};

export const calculateTotalExpenses = (transactions: Transaction[] = []): number => {
  return transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
};

export const calculateBalance = (income: number, expenses: number): number => {
  return income - expenses;
};

// Chart data preparation functions
export const prepareMonthlyChartData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const incomeData = [2800, 3200, 3100, 3500, 0, 0, 0, 0, 0, 0, 0, 0];
  const expenseData = [1900, 2100, 1800, 2000, 0, 0, 0, 0, 0, 0, 0, 0];
  
  return {
    months,
    lineChartData: [
      { name: 'Income', data: incomeData },
      { name: 'Expenses', data: expenseData },
    ]
  };
};

export const prepareCategoryChartData = () => {
  const categories = ['Housing', 'Food', 'Transportation', 'Utilities', 'Entertainment'];
  const categoryExpenses = [1200, 450, 200, 300, 150];
  
  return {
    categories,
    barChartData: [
      { name: 'Expenses', data: categoryExpenses },
    ],
    pieChartData: [
      { name: 'Housing', value: 1200 },
      { name: 'Food', value: 450 },
      { name: 'Transportation', value: 200 },
      { name: 'Utilities', value: 300 },
      { name: 'Entertainment', value: 150 },
    ]
  };
};

export const Dashboard: React.FC = () => {
  const { data: transactions, isLoading } = useTransactions();

  // Calculate summary data
  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const balance = calculateBalance(totalIncome, totalExpenses);

  // Prepare chart data
  const { months, lineChartData } = prepareMonthlyChartData();
  const { categories, barChartData, pieChartData } = prepareCategoryChartData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button>Add Transaction</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">+20% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(balance)}
            </div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Monthly comparison for the current year</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <LineChart data={lineChartData} xAxisData={months} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Current month breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <BarChart data={barChartData} xAxisData={categories} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
            <CardDescription>Current month breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <PieChart data={pieChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activities</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">Loading transactions...</div>
          ) : (
            <ExampleDataGrid />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
