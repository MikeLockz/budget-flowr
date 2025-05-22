export const calculateTotalIncome = (
  transactions: Array<{ type: string; amount: number }> = [], 
  typeClassifications: { [key: string]: string } = { 'Capital Inflow': 'income' }
) => {
  console.log('DASHBOARD-UTILS: Calculating total income from transactions', { 
    transactionCount: transactions.length,
    availableTypes: [...new Set(transactions.map(t => t.type))]
  });
  
  const incomeTransactions = transactions.filter(t => typeClassifications[t.type] === 'income');
  
  // Log sample transactions to debug amount issues
  const sampleTransactions = incomeTransactions.slice(0, 5);
  console.log('DASHBOARD-UTILS: Sample income transactions:', sampleTransactions);
  
  console.log('DASHBOARD-UTILS: Income transactions filtered', { 
    incomeTransactionCount: incomeTransactions.length,
    types: [...new Set(incomeTransactions.map(t => t.type))],
    amountSamples: incomeTransactions.slice(0, 5).map(t => t.amount)
  });
  
  let total = 0;
  for (const t of incomeTransactions) {
    // Check if amount is numeric before adding
    const amount = Number(t.amount);
    if (!isNaN(amount)) {
      total += amount;
      if (amount !== 0) {
        console.log('DASHBOARD-UTILS: Adding non-zero amount', { amount, transaction: t });
      }
    } else {
      console.warn('DASHBOARD-UTILS: Non-numeric amount found', { amount: t.amount, transaction: t });
    }
  }
  
  console.log('DASHBOARD-UTILS: Total income calculated', { total });
  
  return total;
};

export const calculateTotalExpenses = (
  transactions: Array<{ type: string; amount: number }> = [],
  typeClassifications: { [key: string]: string } = { 'True Expense': 'expense', 'Capital Expense': 'expense' }
) => {
  console.log('DASHBOARD-UTILS: Calculating total expenses from transactions', { 
    transactionCount: transactions.length,
    typeClassifications
  });
  
  const expenseTransactions = transactions.filter(t => typeClassifications[t.type] === 'expense');
  
  // Log sample transactions to debug amount issues
  const sampleTransactions = expenseTransactions.slice(0, 5);
  console.log('DASHBOARD-UTILS: Sample expense transactions:', sampleTransactions);
  
  console.log('DASHBOARD-UTILS: Expense transactions filtered', { 
    expenseTransactionCount: expenseTransactions.length,
    types: [...new Set(expenseTransactions.map(t => t.type))],
    amountSamples: expenseTransactions.slice(0, 5).map(t => t.amount)
  });
  
  let total = 0;
  for (const t of expenseTransactions) {
    // Check if amount is numeric before adding
    const amount = Number(t.amount);
    if (!isNaN(amount)) {
      total += amount;
      if (amount !== 0) {
        console.log('DASHBOARD-UTILS: Adding non-zero expense amount', { amount, transaction: t });
      }
    } else {
      console.warn('DASHBOARD-UTILS: Non-numeric expense amount found', { amount: t.amount, transaction: t });
    }
  }
  
  console.log('DASHBOARD-UTILS: Total expenses calculated', { total });
  
  return total;
};

export const calculateBalance = (income: number, expenses: number) => {
  return income - expenses;
};

export const prepareMonthlyChartData = (
  transactions: Array<{ date: string; type: string; amount: number }> = [],
  typeClassifications: { [key: string]: string } = { 'Capital Inflow': 'income', 'True Expense': 'expense', 'Capital Expense': 'expense' }
) => {
  console.log('CHART-DATA: Preparing monthly chart data', {
    transactionCount: transactions.length,
    typeClassifications,
    availableTypes: [...new Set(transactions.map(t => t.type))]
  });
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
    console.log('Dashboard: No valid transaction dates found, using default data');
    return {
      months: monthNames,
      lineChartData: [
        { name: 'Income', data: [2800, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { name: 'Expenses', data: [0, 2100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
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
    console.log('CHART-DATA: Processing transaction', { 
      monthKey, 
      type: t.type, 
      amount: t.amount, 
      classification 
    });
    
    if (classification === 'income') {
      incomeByMonth.set(monthKey, (incomeByMonth.get(monthKey) || 0) + t.amount);
      console.log(`CHART-DATA: Added ${t.amount} to income for ${monthKey}`);
    } else if (classification === 'expense') {
      expenseByMonth.set(monthKey, (expenseByMonth.get(monthKey) || 0) + t.amount);
      console.log(`CHART-DATA: Added ${t.amount} to expense for ${monthKey}`);
    } else {
      console.log(`CHART-DATA: Transaction type "${t.type}" not classified as income or expense`);
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

  // Generate colors array for the chart using a simple color palette
  const colorPalette = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#4682b4',
    '#8b008b', '#b8860b', '#008080', '#800000', '#2e8b57',
    '#ff69b4', '#8b4513', '#483d8b', '#808000', '#4b0082'
  ];
  
  const categoryColors = categoriesList.map((_, index) => 
    colorPalette[index % colorPalette.length]
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