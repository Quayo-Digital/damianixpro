
import { useQuery } from '@tanstack/react-query';
import { fetchFinanceDashboardData } from '@/services/payments/payment-reports';

interface UseFinanceDataProps {
  timeframe: string;
  propertyFilter: string;
}

export const useFinanceData = ({ timeframe, propertyFilter }: UseFinanceDataProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['financeDashboardData', timeframe, propertyFilter],
    queryFn: () => fetchFinanceDashboardData({ timeframe, propertyFilter }),
  });

  const EXPENSE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const CHART_COLORS = {
    revenue: '#9b87f5',
    expenses: '#FF8042',
    profit: '#4CAF50',
    inflow: '#0088FE',
    outflow: '#FF8042'
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return {
    revenueData: data?.revenueData || [],
    expenseData: data?.expenseData || [],
    cashFlowData: data?.cashFlowData || [],
    propertyPerformanceData: data?.propertyPerformanceData || [],
    monthlyExpenses: data?.monthlyExpenses || [],
    totalRevenue: data?.totalRevenue || 0,
    totalExpenses: data?.totalExpenses || 0,
    totalProfit: data?.totalProfit || 0,
    profitMargin: data?.profitMargin || '0',
    isLoading,
    error,
    EXPENSE_COLORS,
    CHART_COLORS,
    formatAmount
  };
};
