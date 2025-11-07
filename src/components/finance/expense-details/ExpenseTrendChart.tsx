
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ResponsiveContainer 
} from 'recharts';
import { Download } from 'lucide-react';

interface MonthlyExpense {
  month: string;
  expenses: number;
}

interface ExpenseTrendChartProps {
  monthlyExpenses: MonthlyExpense[];
  formatAmount: (amount: number) => string;
  onDownload: () => void;
}

export function ExpenseTrendChart({ 
  monthlyExpenses, 
  formatAmount,
  onDownload 
}: ExpenseTrendChartProps) {
  // Define chart color configurations
  const chartConfig = {
    expenses: { color: '#FF8042' }
  };

  return (
    <div className="bg-white rounded-md p-4 border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Monthly Expense Trend</h2>
        <Button variant="outline" size="sm" onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>
      <div className="h-[300px]">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={monthlyExpenses} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `₦${value/1000}K`} />
              <Tooltip formatter={(value) => formatAmount(Number(value))} />
              <Bar dataKey="expenses" name="Expenses" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
