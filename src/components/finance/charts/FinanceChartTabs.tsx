import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenueChart } from './RevenueChart';
import { ExpenseChart } from './ExpenseChart';
import { CashFlowChart } from './CashFlowChart';
import { PropertyChart } from './PropertyChart';
import { FinancialIntegrations } from '@/components/finance/FinancialIntegrations';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChartTabsProps {
  revenueData: any[];
  expenseData: any[];
  cashFlowData: any[];
  propertyPerformanceData: any[];
  expenseColors: string[];
  chartColors: {
    revenue: string;
    expenses: string;
    profit: string;
    inflow: string;
    outflow: string;
  };
  formatAmount: (amount: number) => string;
  onOpenRevenueDetails: () => void;
  onOpenExpenseDetails: () => void;
  onOpenCashFlowDetails: () => void;
  onOpenPropertiesDetails: () => void;
  isLoading: boolean;
  error: any;
}

export function FinanceChartTabs({
  revenueData,
  expenseData,
  cashFlowData,
  propertyPerformanceData,
  expenseColors,
  chartColors,
  formatAmount,
  onOpenRevenueDetails,
  onOpenExpenseDetails,
  onOpenCashFlowDetails,
  onOpenPropertiesDetails,
  isLoading,
  error
}: ChartTabsProps) {
  const isMobile = useIsMobile();
  
  return (
    <Tabs defaultValue="revenue" className="w-full mt-6">
      {isMobile ? (
        <div className="relative mb-4">
          <ScrollArea className="pb-2 w-full">
            <div className="flex pb-3 px-1">
              <TabsList className="inline-flex w-max px-4 border rounded-lg">
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>
            </div>
          </ScrollArea>
        </div>
      ) : (
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-5">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
      )}
      
      <TabsContent value="revenue">
        <RevenueChart
          revenueData={revenueData}
          formatAmount={formatAmount}
          chartColors={{
            revenue: chartColors.revenue,
            expenses: chartColors.expenses,
            profit: chartColors.profit
          }}
          onViewDetails={onOpenRevenueDetails}
          isLoading={isLoading}
          error={error}
        />
      </TabsContent>
      
      <TabsContent value="expenses">
        <ExpenseChart
          expenseData={expenseData}
          expenseColors={expenseColors}
          formatAmount={formatAmount}
          onViewDetails={onOpenExpenseDetails}
          isLoading={isLoading}
          error={error}
        />
      </TabsContent>
      
      <TabsContent value="cashflow">
        <CashFlowChart
          cashFlowData={cashFlowData}
          chartColors={{
            inflow: chartColors.inflow,
            outflow: chartColors.outflow
          }}
          formatAmount={formatAmount}
          onViewDetails={onOpenCashFlowDetails}
          isLoading={isLoading}
          error={error}
        />
      </TabsContent>
      
      <TabsContent value="properties">
        <PropertyChart
          propertyData={propertyPerformanceData}
          chartColors={{
            revenue: chartColors.revenue,
            expenses: chartColors.expenses,
          }}
          formatAmount={formatAmount}
          onViewDetails={onOpenPropertiesDetails}
          isLoading={isLoading}
          error={error}
        />
      </TabsContent>
      
      <TabsContent value="integrations">
        <FinancialIntegrations />
      </TabsContent>
    </Tabs>
  );
}
