import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Download, TrendingDown } from 'lucide-react';
import { exportToCsv, formatAmountForCsv } from '@/services/documents/exportUtils';
import { ChartStatusIndicator } from './ChartStatusIndicator';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface ExpenseItem {
  name: string;
  value: number;
}

interface ExpenseChartProps {
  expenseData: ExpenseItem[];
  expenseColors: string[];
  formatAmount: (amount: number) => string;
  onViewDetails: () => void;
  isLoading: boolean;
  error: any;
}

export function ExpenseChart({
  expenseData,
  expenseColors,
  formatAmount,
  onViewDetails,
  isLoading,
  error,
}: ExpenseChartProps) {
  const legendStyle = { fontSize: '12px', fontWeight: 600 };

  const handleDownloadExpenses = () => {
    exportToCsv({
      filename: 'Expense_Breakdown',
      headers: ['Category', 'Amount', 'Percentage (%)'],
      data: expenseData,
      mapper: (item) => [
        item.name,
        formatAmountForCsv(item.value),
        ((item.value / expenseData.reduce((sum, e) => sum + e.value, 0)) * 100).toFixed(1),
      ],
    });
  };

  const hasData = !isLoading && !error && expenseData && expenseData.length > 0;
  const totalExpenses = expenseData.reduce((sum, e) => sum + e.value, 0);

  return (
    <Card className="premium-data-card">
      <CardHeader>
        <CardTitle className="premium-title">Expense Breakdown</CardTitle>
        <CardDescription>Where your money is going</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-[400px] flex-col items-center justify-center md:flex-row">
          <ChartStatusIndicator
            isLoading={isLoading}
            error={error}
            data={expenseData}
            chartHeight="400px"
          >
            <div className="h-full w-full md:w-1/2">
              <ChartContainer
                config={Object.fromEntries(
                  expenseData.map((item, index) => [
                    item.name,
                    { label: item.name, color: expenseColors[index % expenseColors.length] },
                  ])
                )}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {expenseData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={expenseColors[index % expenseColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload, label }) =>
                        active && payload?.length ? (
                          <ChartTooltipContent
                            payload={payload}
                            label={label}
                            className="border-primary/15"
                            formatter={(value) => formatAmount(Number(value))}
                          />
                        ) : null
                      }
                    />
                    <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="w-full p-6 md:w-1/2">
              <h3 className="premium-title mb-4 text-lg">Expense Summary</h3>
              <ul className="space-y-4">
                {expenseData.map((expense, index) => (
                  <li key={expense.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="mr-3 h-4 w-4 rounded-full"
                        style={{ backgroundColor: expenseColors[index % expenseColors.length] }}
                      />
                      <span>{expense.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-medium">{formatAmount(expense.value)}</span>
                      <span className="text-xs text-muted-foreground">
                        {((expense.value / totalExpenses) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl border border-border bg-card/90 p-4 dark:bg-card">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-amber-500" />
                  <h4 className="font-medium">Cost-Saving Opportunity</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maintenance costs are 10% higher than industry average. Consider preventative
                  maintenance programs to reduce long-term costs.
                </p>
              </div>
            </div>
          </ChartStatusIndicator>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="rounded-full border-primary/30 bg-background dark:bg-muted/30"
          onClick={handleDownloadExpenses}
          disabled={!hasData}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
        <Button className="rounded-full" onClick={onViewDetails} disabled={!hasData}>
          View Expense Details
        </Button>
      </CardFooter>
    </Card>
  );
}
