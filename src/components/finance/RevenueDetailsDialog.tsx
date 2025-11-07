
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
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
  ResponsiveContainer
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
  revenueData
}: RevenueDetailsDialogProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate totals
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = revenueData.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = revenueData.reduce((sum, item) => sum + item.profit, 0);
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : '0.0';

  // Chart colors
  const CHART_COLORS = {
    revenue: '#9b87f5',
    expenses: '#FF8042',
    profit: '#4CAF50'
  };

  // Chart configuration
  const chartConfig = {
    revenue: { color: CHART_COLORS.revenue },
    expenses: { color: CHART_COLORS.expenses },
    profit: { color: CHART_COLORS.profit }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 z-10 bg-background pb-4 pt-6">
          <DialogTitle>Revenue Analysis Details</DialogTitle>
          <DialogDescription>
            Comprehensive breakdown of your property revenue
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pb-4">
          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Revenue</h3>
              <p className="text-2xl font-bold">{formatAmount(totalRevenue)}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Expenses</h3>
              <p className="text-2xl font-bold">{formatAmount(totalExpenses)}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Net Profit</h3>
              <p className="text-2xl font-bold">{formatAmount(totalProfit)}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Profit Margin</h3>
              <p className="text-2xl font-bold">{profitMargin}%</p>
            </Card>
          </div>
          
          {/* Revenue Bar Chart */}
          <div className="bg-white rounded-md p-4 border">
            <h2 className="text-lg font-semibold mb-4">Monthly Revenue Analysis</h2>
            <div className="h-[350px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={revenueData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₦${value/1000000}M`} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border rounded-md shadow-md">
                              <p className="font-medium">{payload[0]?.payload.month}</p>
                              <div className="space-y-1 mt-2">
                                {payload.map((entry, index) => (
                                  <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
                                    <div className="flex items-center">
                                      <div 
                                        className="w-3 h-3 rounded-full mr-2" 
                                        style={{ backgroundColor: entry.color }} 
                                      />
                                      <span>{entry.name}</span>
                                    </div>
                                    <span className="font-medium">{formatAmount(Number(entry.value))}</span>
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
                    <Bar dataKey="amount" name="Revenue" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill={CHART_COLORS.expenses} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Profit" fill={CHART_COLORS.profit} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
          
          {/* Revenue Trend Line Chart */}
          <div className="bg-white rounded-md p-4 border">
            <h2 className="text-lg font-semibold mb-4">Revenue Trend Analysis</h2>
            <div className="h-[350px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₦${value/1000000}M`} />
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
          <div className="bg-white rounded-md p-4 border">
            <h2 className="text-lg font-semibold mb-4">Detailed Revenue Analysis</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Month</th>
                    <th className="text-right py-2 px-4">Revenue</th>
                    <th className="text-right py-2 px-4">Expenses</th>
                    <th className="text-right py-2 px-4">Profit</th>
                    <th className="text-right py-2 px-4">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.map((item) => {
                    const margin = item.amount > 0 ? ((item.profit / item.amount) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={item.month} className="border-b">
                        <td className="py-2 px-4">{item.month}</td>
                        <td className="text-right py-2 px-4">{formatAmount(item.amount)}</td>
                        <td className="text-right py-2 px-4">{formatAmount(item.expenses)}</td>
                        <td className="text-right py-2 px-4">{formatAmount(item.profit)}</td>
                        <td className="text-right py-2 px-4">{margin}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium">
                    <td className="py-2 px-4">Total</td>
                    <td className="text-right py-2 px-4">{formatAmount(totalRevenue)}</td>
                    <td className="text-right py-2 px-4">{formatAmount(totalExpenses)}</td>
                    <td className="text-right py-2 px-4">{formatAmount(totalProfit)}</td>
                    <td className="text-right py-2 px-4">{profitMargin}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-background pt-4 pb-6 border-t mt-4 flex justify-end">
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
