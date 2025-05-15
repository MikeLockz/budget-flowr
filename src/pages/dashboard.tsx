import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LineChart, BarChart, PieChart } from '../components/charts/echarts-base';
import { CalendarHeatmap } from '../components/charts/CalendarHeatmap';
import { TransactionsGrid } from '@/components/data-grid/transactions-grid';
import { useTransactionData } from '@/hooks/use-transactions';
import { formatCurrency } from '@/lib/utils';
import { useFilterContext } from '@/contexts/FilterContext';

export const calculateTotalIncome = (transactions: Array<{ type: string; amount: number }> = []) => {
  return transactions.filter(t => t.type === 'Capital Inflow').reduce((sum, t) => sum + t.amount, 0);
};

export const calculateTotalExpenses = (transactions: Array<{ type: string; amount: number }> = []) => {
  return transactions
    .filter(t => t.type === 'True Expense' || t.type === 'Capital Expense')
    .reduce((sum, t) => sum + t.amount, 0);
};

export const calculateBalance = (income: number, expenses: number) => {
  return income - expenses;
};

export const prepareMonthlyChartData = (transactions: Array<{ date: string; type: string; amount: number }> = []) => {
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

    if (t.type === 'Capital Inflow') {
      incomeByMonth.set(monthKey, (incomeByMonth.get(monthKey) || 0) + t.amount);
    } else if (t.type === 'True Expense' || t.type === 'Capital Expense') {
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

export const prepareCategoryChartData = (transactions: Array<{ categoryName?: string; amount: number }> = [], categories: string[] = []) => {
  const expenseMap = new Map<string, number>();
  categories.forEach(c => {
    expenseMap.set(c, 0);
  });
  expenseMap.set('Uncategorized', 0);

  transactions.forEach(t => {
    if (t.amount && t.categoryName) {
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

export const Dashboard = () => {
  const { transactions, categoryChartData, isLoading } = useTransactionData(false); // Explicitly get non-archived transactions
  const { visibleTransactionIds, resetFilters } = useFilterContext();

  // Ensure transactions is always an array
  const transactionsArray = transactions || [];

  // Use filtered transactions if available, otherwise use all transactions
  const displayTransactions = visibleTransactionIds.length > 0
    ? transactionsArray.filter(t => visibleTransactionIds.includes(t.id))
    : transactionsArray;

  console.log('DASHBOARD: visibleTransactionIds:', visibleTransactionIds);
  console.log('DASHBOARD: visibleTransactionIds (full):', JSON.stringify(visibleTransactionIds));
  console.log('DASHBOARD: Total transactions:', transactionsArray.length);
  console.log('DASHBOARD: Filtered transactions:', displayTransactions.length);

  // Calculate totals based on filtered transactions
  const totalIncome = calculateTotalIncome(displayTransactions);
  const totalExpenses = calculateTotalExpenses(displayTransactions);
  const balance = calculateBalance(totalIncome, totalExpenses);

  // Prepare chart data based on filtered transactions
  const { months, lineChartData } = prepareMonthlyChartData(displayTransactions);

  // Prepare category chart data based on filtered transactions
  // Map transactions to include categoryName and amount for chart data preparation
  const transactionsWithCategoryNameAndAmount = displayTransactions.map((t: { categoryName?: string; amount?: number }) => ({
    ...t,
    categoryName: t.categoryName || 'Uncategorized',
    amount: t.amount || 0,
  }));

  const filteredCategoryChartData = prepareCategoryChartData(transactionsWithCategoryNameAndAmount, categoryChartData.categories);

  // Prepare calendar heatmap data
  const prepareCalendarHeatmapData = (
    transactions: Array<{ date: string; amount: number }> = []
  ) => {
    const data: [string, number][] = [];
    const transactionCountByDate = new Map<string, number>();

    // Group transactions by date
    transactions.forEach(t => {
      const dateStr = t.date.substring(0, 10); // YYYY-MM-DD format
      const count = transactionCountByDate.get(dateStr) || 0;
      transactionCountByDate.set(dateStr, count + 1);
    });

    // Convert to [date, count] pairs
    transactionCountByDate.forEach((count, date) => {
      data.push([date, count]);
    });

    return data;
  };

  const calendarData = prepareCalendarHeatmapData(displayTransactions);

  // Extract unique years from filtered transactions
  const getTransactionYears = (transactions: Array<{ date: string }> = []) => {
    const years = new Set<number>();
    transactions.forEach(t => {
      const year = new Date(t.date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort();
  };

  const transactionYears = getTransactionYears(displayTransactions);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex space-x-2">
          <Button onClick={resetFilters}>Reset Filters</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="total-income" className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">+20% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="total-expenses" className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="balance" className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
            <BarChart data={filteredCategoryChartData.barChartData} xAxisData={filteredCategoryChartData.categories} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
            <CardDescription>Current month breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <PieChart data={filteredCategoryChartData.pieChartData} />
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Transaction Activity</CardTitle>
            <CardDescription>Daily transaction frequency for selected years</CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarHeatmap data={calendarData} years={transactionYears.length > 0 ? transactionYears : [2024]} />
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
            <TransactionsGrid transactions={displayTransactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
