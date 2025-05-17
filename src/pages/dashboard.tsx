import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LineChart, BarChart, PieChart } from '../components/charts/echarts-base';
import { CalendarHeatmap } from '../components/charts/CalendarHeatmap';
import { TransactionsGrid } from '@/components/data-grid/transactions-grid';
import { useTransactionData } from '@/hooks/use-transactions';
import { formatCurrency } from '@/lib/utils';
import { useFilterContext } from '@/contexts/useFilterContext';
import { useVisualizationSettings } from '@/lib/store/visualization-settings';
import { 
  calculateTotalIncome, 
  calculateTotalExpenses, 
  calculateBalance, 
  prepareMonthlyChartData, 
  prepareCategoryChartData 
} from '@/lib/dashboard-utils';

export const Dashboard = () => {
  const { transactions, categoryChartData, isLoading } = useTransactionData(false); // Explicitly get non-archived transactions
  const { visibleTransactionIds, resetFilters } = useFilterContext();
  const { typeClassifications } = useVisualizationSettings();

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
  const totalIncome = calculateTotalIncome(displayTransactions, typeClassifications);
  const totalExpenses = calculateTotalExpenses(displayTransactions, typeClassifications);
  const balance = calculateBalance(totalIncome, totalExpenses);

  // Prepare chart data based on filtered transactions
  const { months, lineChartData } = prepareMonthlyChartData(displayTransactions, typeClassifications);

  // Prepare category chart data based on filtered transactions
  // Map transactions to include categoryName and amount for chart data preparation
  const transactionsWithCategoryNameAndAmount = displayTransactions.map((t: { categoryName?: string; amount?: number; type?: string }) => ({
    ...t,
    categoryName: t.categoryName || 'Uncategorized',
    amount: t.amount || 0,
    type: t.type,
  }));

  const filteredCategoryChartData = prepareCategoryChartData(
    transactionsWithCategoryNameAndAmount, 
    categoryChartData.categories,
    typeClassifications
  );

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
          </CardHeader>
          <CardContent className="h-80">
            <LineChart data={lineChartData} xAxisData={months} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
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
