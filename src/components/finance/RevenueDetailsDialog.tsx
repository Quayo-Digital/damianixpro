import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenueItem {
  month: string;
  amount: number;
  expenses: number;
  profit: number;
}

interface RevenueDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenueData: RevenueItem[];
}

export function RevenueDetailsDialog({
  open,
  onOpenChange,
  revenueData,
}: RevenueDetailsDialogProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = revenueData.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = revenueData.reduce((sum, item) => sum + item.profit, 0);
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // Chart colors
  const CHART_COLORS = {
    revenue: '#9b87f5',
    expenses: '#FF8042',
    profit: '#4CAF50',
  };

  // Chart configuration
  const chartConfig = {
    revenue: { color: CHART_COLORS.revenue },
    expenses: { color: CHART_COLORS.expenses },
    profit: { color: CHART_COLORS.profit },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader className="sticky top-0 z-10 bg-background pb-4 pt-6">
          <DialogTitle>Revenue Analysis Details</DialogTitle>
          <DialogDescription>Comprehensive breakdown of your property revenue</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {/* Summary Section */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Total Revenue</h3>
              <p className="text-2xl font-bold">{formatAmount(totalRevenue)}</p>
            </Card>
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Total Expenses</h3>
              <p className="text-2xl font-bold">{formatAmount(totalExpenses)}</p>
            </Card>
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Net Profit</h3>
              <p className="text-2xl font-bold">{formatAmount(totalProfit)}</p>
            </Card>
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Profit Margin</h3>
              <p className="text-2xl font-bold">{profitMargin}%</p>
            </Card>
          </div>

          {/* Revenue Bar Chart */}
          <div className="rounded-md border border-border bg-card p-4 text-card-foreground">
            <h2 className="mb-4 text-lg font-semibold">Monthly Revenue Analysis</h2>
            <div className="h-[350px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₦${value / 1000000}M`} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-md border border-border bg-card p-3 text-card-foreground shadow-md">
                              <p className="font-medium">{payload[0]?.payload.month}</p>
                              <div className="mt-2 space-y-1">
                                {payload.map((entry, index) => (
                                  <div
                                    key={`tooltip-${index}`}
                                    className="flex items-center justify-between gap-4"
                                  >
                                    <div className="flex items-center">
                                      <div
                                        className="mr-2 h-3 w-3 rounded-full"
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span>{entry.name}</span>
                                    </div>
                                    <span className="font-medium">
                                      {formatAmount(Number(entry.value))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="amount"
                      name="Revenue"
                      fill={CHART_COLORS.revenue}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Expenses"
                      fill={CHART_COLORS.expenses}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="profit"
                      name="Profit"
                      fill={CHART_COLORS.profit}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>

          {/* Revenue Trend Line Chart */}
          <div className="rounded-md border border-border bg-card p-4 text-card-foreground">
            <h2 className="mb-4 text-lg font-semibold">Revenue Trend Analysis</h2>
            <div className="h-[350px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₦${value / 1000000}M`} />
                    <Tooltip formatter={(value) => formatAmount(Number(value))} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      name="Revenue"
                      stroke={CHART_COLORS.revenue}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke={CHART_COLORS.expenses}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      name="Profit"
                      stroke={CHART_COLORS.profit}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>

          {/* Detailed Revenue Table */}
          <div className="rounded-md border border-border bg-card p-4 text-card-foreground">
            <h2 className="mb-4 text-lg font-semibold">Detailed Revenue Analysis</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Month</th>
                    <th className="px-4 py-2 text-right">Revenue</th>
                    <th className="px-4 py-2 text-right">Expenses</th>
                    <th className="px-4 py-2 text-right">Profit</th>
                    <th className="px-4 py-2 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.map((item) => {
                    const margin =
                      item.amount > 0 ? ((item.profit / item.amount) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={item.month} className="border-b">
                        <td className="px-4 py-2">{item.month}</td>
                        <td className="px-4 py-2 text-right">{formatAmount(item.amount)}</td>
                        <td className="px-4 py-2 text-right">{formatAmount(item.expenses)}</td>
                        <td className="px-4 py-2 text-right">{formatAmount(item.profit)}</td>
                        <td className="px-4 py-2 text-right">{margin}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium">
                    <td className="px-4 py-2">Total</td>
                    <td className="px-4 py-2 text-right">{formatAmount(totalRevenue)}</td>
                    <td className="px-4 py-2 text-right">{formatAmount(totalExpenses)}</td>
                    <td className="px-4 py-2 text-right">{formatAmount(totalProfit)}</td>
                    <td className="px-4 py-2 text-right">{profitMargin}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 mt-4 flex justify-end border-t bg-background pb-6 pt-4">
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
