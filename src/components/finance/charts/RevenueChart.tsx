import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download } from 'lucide-react';
import { exportToCsv, formatAmountForCsv } from '@/services/documents/exportUtils';
import { ChartStatusIndicator } from './ChartStatusIndicator';

interface RevenueItem {
  month: string;
  amount: number;
  expenses: number;
  profit: number;
}

interface RevenueChartProps {
  revenueData: RevenueItem[];
  formatAmount: (amount: number) => string;
  chartColors: {
    revenue: string;
    expenses: string;
    profit: string;
  };
  onViewDetails: () => void;
  isLoading: boolean;
  error: any;
}

export function RevenueChart({
  revenueData,
  formatAmount,
  chartColors,
  onViewDetails,
  isLoading,
  error,
}: RevenueChartProps) {
  const axisTickStyle = { fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 };
  const legendStyle = { fontSize: '12px', fontWeight: 600 };

  const handleDownloadRevenue = () => {
    exportToCsv({
      filename: 'Revenue_Analysis',
      headers: ['Month', 'Revenue', 'Expenses', 'Profit', 'Profit Margin (%)'],
      data: revenueData,
      mapper: (item) => [
        item.month,
        formatAmountForCsv(item.amount),
        formatAmountForCsv(item.expenses),
        formatAmountForCsv(item.profit),
        ((item.profit / item.amount) * 100).toFixed(1),
      ],
    });
  };

  const hasData = !isLoading && !error && revenueData && revenueData.length > 0;

  return (
    <Card className="premium-data-card">
      <CardHeader>
        <CardTitle className="premium-title">Revenue Analysis</CardTitle>
        <CardDescription>Monthly revenue and expense comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ChartStatusIndicator isLoading={isLoading} error={error} data={revenueData}>
            <ChartContainer
              config={{
                revenue: { color: chartColors.revenue },
                expenses: { color: chartColors.expenses },
                profit: { color: chartColors.profit },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.45} />
                  <XAxis dataKey="month" tick={axisTickStyle} tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(value) => `₦${value / 1000000}M`}
                    tick={axisTickStyle}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <ChartTooltipContent
                            payload={payload}
                            label={label}
                            className="border-primary/15"
                            formatter={(value) => formatAmount(Number(value))}
                          />
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
                  <Bar
                    dataKey="amount"
                    name="Revenue"
                    fill={chartColors.revenue}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill={chartColors.expenses}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="profit"
                    name="Profit"
                    fill={chartColors.profit}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </ChartStatusIndicator>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="rounded-full border-primary/30 bg-background dark:bg-muted/30"
          onClick={handleDownloadRevenue}
          disabled={!hasData}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
        <Button className="rounded-full" onClick={onViewDetails} disabled={!hasData}>
          View Detailed Analysis
        </Button>
      </CardFooter>
    </Card>
  );
}
