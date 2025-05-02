import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LineChart, BarChart, PieChart } from '../components/charts/echarts-base';
import { TransactionsGrid } from '@/components/data-grid/transactions-grid';
import { useTransactions } from '@/hooks/use-transactions';
import { formatCurrency } from '@/lib/utils';
import { Transaction } from '@/lib/db';
import { CSVUpload } from '@/components/import/CSVUpload';

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
import { Category } from '@/lib/db';
import { categoryRepository } from '@/lib/repositories';

export const prepareMonthlyChartData = (transactions: Transaction[] = []) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (transactions.length === 0) {
    // Return sample data for testing/demo when no transactions provided
    return {
      months,
      lineChartData: [
        { name: 'Income', data: [2800, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { name: 'Expenses', data: [0, 2100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      ]
    };
  }

  const incomeData = new Array(12).fill(0);
  const expenseData = new Array(12).fill(0);

  transactions.forEach(t => {
    const date = new Date(t.date);
    const month = date.getMonth();
    if (t.type === 'income') {
      incomeData[month] += t.amount;
    } else if (t.type === 'expense') {
      expenseData[month] += t.amount;
    }
  });

  return {
    months,
    lineChartData: [
      { name: 'Income', data: incomeData },
      { name: 'Expenses', data: expenseData },
    ]
  };
};

export const prepareCategoryChartData = async (transactions: Transaction[] = []) => {
  // Fetch categories from repository
  const categories: Category[] = await categoryRepository.getAll();
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  // Initialize expense map with all categories set to 0
  const expenseMap = new Map<string, number>();
  categories.forEach(c => {
    expenseMap.set(c.name, 0);
  });

  // Aggregate expenses by category
  transactions.forEach(t => {
    if (t.type === 'expense') {
      const categoryName = categoryMap.get(t.categoryId) || 'Uncategorized';
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

export const Dashboard: React.FC = () => {
  const { data: transactions = [], isLoading } = useTransactions();

  // Calculate summary data
  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const balance = calculateBalance(totalIncome, totalExpenses);

  // Prepare chart data
  const [categoryChartData, setCategoryChartData] = React.useState<{
    categories: string[];
    barChartData: { name: string; data: number[] }[];
    pieChartData: { name: string; value: number }[];
  }>({
    categories: [],
    barChartData: [],
    pieChartData: [],
  });

  React.useEffect(() => {
    async function fetchCategoryData() {
      const data = await prepareCategoryChartData(transactions);
      setCategoryChartData(data);
    }
    fetchCategoryData();
  }, [transactions]);

  const { months, lineChartData } = prepareMonthlyChartData(transactions);
  const { categories, barChartData, pieChartData } = categoryChartData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex space-x-2">
          <Button>Add Transaction</Button>
          <CSVUpload />
        </div>
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
            <TransactionsGrid transactions={transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
