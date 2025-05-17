export const calculateTotalIncome = (
  transactions: Array<{ type: string; amount: number }> = [], 
  typeClassifications: { [key: string]: string } = { 'Capital Inflow': 'income' }
) => {
  return transactions
    .filter(t => typeClassifications[t.type] === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
};

export const calculateTotalExpenses = (
  transactions: Array<{ type: string; amount: number }> = [],
  typeClassifications: { [key: string]: string } = { 'True Expense': 'expense', 'Capital Expense': 'expense' }
) => {
  return transactions
    .filter(t => typeClassifications[t.type] === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
};

export const calculateBalance = (income: number, expenses: number) => {
  return income - expenses;
};

export const prepareMonthlyChartData = (
  transactions: Array<{ date: string; type: string; amount: number }> = [],
  typeClassifications: { [key: string]: string } = { 'Capital Inflow': 'income', 'True Expense': 'expense', 'Capital Expense': 'expense' }
) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (transactions.length === 0) {
    // Return default data for empty transactions
    return {
      months: monthNames,
      lineChartData: [
        { name: 'Income', data: [2800, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { name: 'Expenses', data: [0, 2100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      ],
    };
  }

  // Find earliest and latest transaction dates
  let earliestDate: Date | null = null;
  let latestDate: Date | null = null;

  transactions.forEach(t => {
    const date = new Date(t.date);
    if (!earliestDate || date < earliestDate) {
      earliestDate = date;
    }
    if (!latestDate || date > latestDate) {
      latestDate = date;
    }
  });

  // If we couldn't determine valid dates, return default data
  if (!earliestDate || !latestDate) {
    return {
      months: monthNames,
      lineChartData: [
        { name: 'Income', data: new Array(12).fill(0) },
        { name: 'Expenses', data: new Array(12).fill(0) },
      ],
    };
  }

  // Generate consecutive months only between earliest and latest dates
  const consecutiveMonths: string[] = [];
  const incomeData: number[] = [];
  const expenseData: number[] = [];

  // Set to first day of the month for earliest date
  const startDate = new Date(earliestDate);
  startDate.setDate(1);

  // Set to first day of the month for latest date
  const endDate = new Date(latestDate);
  endDate.setDate(1);

  // Create a map to store transaction totals by month
  const incomeByMonth = new Map<string, number>();
  const expenseByMonth = new Map<string, number>();

  // Generate all months between start and end dates
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthKey = `${year}-${month}`;
    const monthLabel = `${monthNames[month]} ${year}`;

    consecutiveMonths.push(monthLabel);
    incomeByMonth.set(monthKey, 0);
    expenseByMonth.set(monthKey, 0);

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Populate data arrays
  transactions.forEach(t => {
    const date = new Date(t.date);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthKey = `${year}-${month}`;

    // Use transaction type classifications from visualization settings
    const classification = typeClassifications[t.type];
    if (classification === 'income') {
      incomeByMonth.set(monthKey, (incomeByMonth.get(monthKey) || 0) + t.amount);
    } else if (classification === 'expense') {
      expenseByMonth.set(monthKey, (expenseByMonth.get(monthKey) || 0) + t.amount);
    }
  });

  // Convert maps to arrays in the correct order
  currentDate.setTime(startDate.getTime());
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthKey = `${year}-${month}`;

    incomeData.push(incomeByMonth.get(monthKey) || 0);
    expenseData.push(expenseByMonth.get(monthKey) || 0);

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return {
    months: consecutiveMonths,
    lineChartData: [
      { name: 'Income', data: incomeData },
      { name: 'Expenses', data: expenseData },
    ],
  };
};

import { useCategoryColors, getCategoryColor } from '@/lib/store/category-colors';
import type { CallbackDataParams } from 'echarts/types/dist/shared';

export const prepareCategoryChartData = (
  transactions: Array<{ categoryName?: string; amount: number; type?: string }> = [], 
  categories: string[] = [],
  typeClassifications: { [key: string]: string } = { 'True Expense': 'expense', 'Capital Expense': 'expense' }
) => {
  const expenseMap = new Map<string, number>();
  categories.forEach(c => {
    expenseMap.set(c, 0);
  });
  expenseMap.set('Uncategorized', 0);

  transactions.forEach(t => {
    // Only include transactions classified as expenses
    if (typeof t.amount === 'number' && t.categoryName && t.type && typeClassifications[t.type] === 'expense') {
      const categoryName = expenseMap.has(t.categoryName) ? t.categoryName : 'Uncategorized';
      expenseMap.set(categoryName, (expenseMap.get(categoryName) || 0) + t.amount);
    }
  });

  // Create an array of [category, amount] pairs for sorting
  const categoryAmounts = Array.from(expenseMap.entries())
    .filter(([_, amount]) => amount > 0)  // Remove zero-value categories
    .sort((a, b) => b[1] - a[1]);  // Sort in descending order by amount

  // Extract sorted categories and values
  const categoriesList = categoryAmounts.map(([name]) => name);
  const categoryExpenses = categoryAmounts.map(([_, amount]) => amount);

  // Get the stored category colors
  const { colorMap } = useCategoryColors.getState();

  // Generate colors array for the chart
  const categoryColors = categoriesList.map((category, index) => 
    getCategoryColor(category, colorMap, index)
  );

  const barChartData = [
    { 
      name: 'Expenses', 
      data: categoryExpenses,
      itemStyle: {
        color: (params: CallbackDataParams) => categoryColors[params.dataIndex]
      }
    },
  ];

  // Create pie chart data from the sorted categories with consistent colors
  const pieChartData = categoriesList.map((name, index) => ({
    name,
    value: categoryExpenses[index],
    itemStyle: {
      color: categoryColors[index]
    }
  }));

  return {
    categories: categoriesList,
    barChartData,
    pieChartData,
    categoryColors, // Add colors to the return value for potential use elsewhere
  };
};