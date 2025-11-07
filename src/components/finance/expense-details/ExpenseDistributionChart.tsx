
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts';
import { Download } from 'lucide-react';

interface ExpenseItem {
  name: string;
  value: number;
}

interface ExpenseDistributionChartProps {
  expenseData: ExpenseItem[];
  formatAmount: (amount: number) => string;
  onDownload: () => void;
}

const EXPENSE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function ExpenseDistributionChart({ 
  expenseData, 
  formatAmount,
  onDownload
}: ExpenseDistributionChartProps) {
  // Define chart color configurations
  const chartConfig = {
    pie: { color: '#0088FE' }
  };

  return (
    <div className="bg-white rounded-md p-4 border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Expense Distribution</h2>
        <Button variant="outline" size="sm" onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>
      <div className="h-[300px]">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatAmount(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
