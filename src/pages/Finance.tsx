import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { FinancialHeader } from '@/components/finance/dashboard/FinancialHeader';
import { FinancialSummary } from '@/components/finance/dashboard/FinancialSummary';
import { FinanceChartTabs } from '@/components/finance/charts/FinanceChartTabs';
import { ExpenseDetailsDialog } from '@/components/finance/expense-details/ExpenseDetailsDialog';
import { CashFlowDetailsDialog } from '@/components/finance/CashFlowDetailsDialog';
import { RevenueDetailsDialog } from '@/components/finance/RevenueDetailsDialog';
import { PropertiesDetailsDialog } from '@/components/finance/PropertiesDetailsDialog';
import { useFinanceData } from '@/hooks/useFinanceData';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Finance = () => {
  const [timeframe, setTimeframe] = useState('6months');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [expenseDetailsOpen, setExpenseDetailsOpen] = useState(false);
  const [cashFlowDetailsOpen, setCashFlowDetailsOpen] = useState(false);
  const [revenueDetailsOpen, setRevenueDetailsOpen] = useState(false);
  const [propertiesDetailsOpen, setPropertiesDetailsOpen] = useState(false);
  
  const { 
    revenueData, 
    expenseData, 
    cashFlowData, 
    propertyPerformanceData, 
    monthlyExpenses, 
    totalRevenue, 
    totalExpenses, 
    totalProfit, 
    profitMargin,
    isLoading,
    error,
    EXPENSE_COLORS, 
    CHART_COLORS, 
    formatAmount 
  } = useFinanceData({ timeframe, propertyFilter });

  return (
    <PageLayout>
      <PageContent 
        title="Finance" 
        description="Manage your property financials"
      >
        <FinancialHeader
          propertyFilter={propertyFilter}
          setPropertyFilter={setPropertyFilter}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          disabled={isLoading}
        />

        <FinancialSummary
          totalRevenue={totalRevenue}
          totalExpenses={totalExpenses}
          totalProfit={totalProfit}
          profitMargin={profitMargin}
          formatAmount={formatAmount}
          isLoading={isLoading}
        />

        {error ? (
          <Alert variant="destructive" className="my-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>
              We couldn't load the financial data. Please try changing the filters or refresh the page.
            </AlertDescription>
          </Alert>
        ) : (
          <FinanceChartTabs
            revenueData={revenueData}
            expenseData={expenseData}
            cashFlowData={cashFlowData}
            propertyPerformanceData={propertyPerformanceData}
            expenseColors={EXPENSE_COLORS}
            chartColors={CHART_COLORS}
            formatAmount={formatAmount}
            onOpenRevenueDetails={() => setRevenueDetailsOpen(true)}
            onOpenExpenseDetails={() => setExpenseDetailsOpen(true)}
            onOpenCashFlowDetails={() => setCashFlowDetailsOpen(true)}
            onOpenPropertiesDetails={() => setPropertiesDetailsOpen(true)}
            isLoading={isLoading}
            error={error}
          />
        )}
        
        {/* Dialog components */}
        <ExpenseDetailsDialog
          open={expenseDetailsOpen}
          onOpenChange={setExpenseDetailsOpen}
          expenseData={expenseData}
          monthlyExpenses={monthlyExpenses}
        />
        
        <CashFlowDetailsDialog
          open={cashFlowDetailsOpen}
          onOpenChange={setCashFlowDetailsOpen}
          cashFlowData={cashFlowData}
        />
        
        <RevenueDetailsDialog
          open={revenueDetailsOpen}
          onOpenChange={setRevenueDetailsOpen}
          revenueData={revenueData}
        />
        
        <PropertiesDetailsDialog
          open={propertiesDetailsOpen}
          onOpenChange={setPropertiesDetailsOpen}
          propertyData={propertyPerformanceData}
        />
      </PageContent>
    </PageLayout>
  );
};

export default Finance;
