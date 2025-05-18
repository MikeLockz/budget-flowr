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
  const { visibleTransactionIds, setVisibleTransactionIds, resetFilters } = useFilterContext();
  const { typeClassifications, defaultIncomeTypes, defaultExpenseTypes } = useVisualizationSettings();
  
  // Debug logs
  console.log('DASHBOARD: Transactions loaded:', transactions?.length || 0);
  console.log('DASHBOARD: Categories loaded:', categoryChartData?.categories?.length || 0);
  console.log('DASHBOARD: Transaction type classifications:', typeClassifications);
  console.log('DASHBOARD: Default income types:', defaultIncomeTypes);
  console.log('DASHBOARD: Default expense types:', defaultExpenseTypes);
  
  // Get a breakdown of transaction types in the loaded data
  const transactionTypeBreakdown = transactions?.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  console.log('DASHBOARD: Transaction types in data:', transactionTypeBreakdown);

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

  // Check if we have data to display
  const hasTransactions = displayTransactions.length > 0;
  console.log('DASHBOARD: Has transactions to display:', hasTransactions);

  // Prepare chart data based on filtered transactions
  const { months, lineChartData } = prepareMonthlyChartData(
    hasTransactions ? displayTransactions : [], 
    typeClassifications
  );

  // Prepare category chart data based on filtered transactions
  // Map transactions to include categoryName and amount for chart data preparation
  const transactionsWithCategoryNameAndAmount = displayTransactions.map((t: { categoryName?: string; amount?: number; type?: string }) => ({
    ...t,
    categoryName: t.categoryName || 'Uncategorized',
    amount: t.amount || 0,
    type: t.type,
  }));

  // Use empty or actual data based on availability
  const filteredCategoryChartData = hasTransactions 
    ? prepareCategoryChartData(
        transactionsWithCategoryNameAndAmount, 
        categoryChartData.categories,
        typeClassifications
      )
    : {
        categories: ['Food', 'Housing', 'Transportation'],
        barChartData: [{ name: 'Expenses', data: [1200, 800, 400] }],
        pieChartData: [
          { name: 'Food', value: 1200 },
          { name: 'Housing', value: 800 },
          { name: 'Transportation', value: 400 }
        ],
        categoryColors: ['#5470c6', '#91cc75', '#fac858']
      };

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

  // Prepare calendar data with fall-back for empty state
  const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
  const calendarData: [string, number][] = hasTransactions 
    ? prepareCalendarHeatmapData(displayTransactions)
    : [
       [today, 3], 
       [new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0], 2], 
       [new Date(Date.now() - 86400000 * 14).toISOString().split('T')[0], 1]
    ];

  // Extract unique years from filtered transactions
  const getTransactionYears = (transactions: Array<{ date: string }> = []) => {
    const years = new Set<number>();
    transactions.forEach(t => {
      const year = new Date(t.date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort();
  };

  // Use current year if no transactions
  const currentYear = new Date().getFullYear();
  const transactionYears = hasTransactions 
    ? getTransactionYears(displayTransactions)
    : [currentYear];

  // Quick filter functions
  const applyDateFilter = (startDate: Date) => {
    const filteredIds = transactionsArray
      .filter(t => new Date(t.date) >= startDate)
      .map(t => t.id);
    setVisibleTransactionIds(filteredIds);
  };

  const filterLast30Days = () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    applyDateFilter(startDate);
  };

  const filterPreviousMonth = () => {
    const today = new Date();
    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const filteredIds = transactionsArray
      .filter(t => {
        const date = new Date(t.date);
        return date >= previousMonth && date <= endOfPreviousMonth;
      })
      .map(t => t.id);
    
    setVisibleTransactionIds(filteredIds);
  };

  const filterPrevious2Months = () => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const filteredIds = transactionsArray
      .filter(t => {
        const date = new Date(t.date);
        return date >= startDate && date <= endDate;
      })
      .map(t => t.id);
    
    setVisibleTransactionIds(filteredIds);
  };

  const filterPrevious6Months = () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    applyDateFilter(startDate);
  };

  // Filter transactions by category, preserving any existing filters
  const filterByCategory = (category: string) => {
    // Filter transactions by the selected category
    const categoryTransactionIds = transactionsArray
      .filter(t => t.categoryName === category)
      .map(t => t.id);
    
    // Combine with existing filters if any
    if (visibleTransactionIds.length > 0) {
      // Intersection of current visible IDs and category IDs
      const combinedIds = visibleTransactionIds.filter(id => 
        categoryTransactionIds.includes(id)
      );
      setVisibleTransactionIds(combinedIds);
    } else {
      // No current filter, just use category filter
      setVisibleTransactionIds(categoryTransactionIds);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex flex-wrap space-x-2">
          <Button onClick={filterLast30Days} variant="outline" size="sm">Last 30 Days</Button>
          <Button onClick={filterPreviousMonth} variant="outline" size="sm">Previous Month</Button>
          <Button onClick={filterPrevious2Months} variant="outline" size="sm">Previous 2 Months</Button>
          <Button onClick={filterPrevious6Months} variant="outline" size="sm">Previous 6 Months</Button>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="total-expenses" className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
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
            <CardDescription>Click on a category to filter</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <BarChart 
              data={filteredCategoryChartData.barChartData} 
              xAxisData={filteredCategoryChartData.categories} 
              horizontal={true}
              onCategoryClick={filterByCategory}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
            <CardDescription>Click on a segment to filter</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <PieChart 
              data={filteredCategoryChartData.pieChartData}
              onCategoryClick={filterByCategory}
            />
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Transaction Activity</CardTitle>
            <CardDescription>Daily transaction frequency for selected years</CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarHeatmap 
              data={calendarData} 
              years={transactionYears} 
            />
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
            <TransactionsGrid 
              transactions={displayTransactions}
              categoryColors={filteredCategoryChartData.categoryColors}
              categories={filteredCategoryChartData.categories}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
