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
import { ChartContainer } from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface PropertyPerformance {
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface PropertiesDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyData: PropertyPerformance[];
}

export function PropertiesDetailsDialog({
  open,
  onOpenChange,
  propertyData,
}: PropertiesDetailsDialogProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
  const totalRevenue = propertyData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = propertyData.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = propertyData.reduce((sum, item) => sum + item.profit, 0);

  // Find best and worst performing properties
  const sortedByProfit = [...propertyData].sort((a, b) => b.profit - a.profit);
  const bestProperty = sortedByProfit[0];
  const worstProperty = sortedByProfit[sortedByProfit.length - 1];

  // Generate data for the pie chart
  const profitDistribution = propertyData.map((item) => ({
    name: item.name,
    value: item.profit,
  }));

  // Chart colors
  const CHART_COLORS = {
    revenue: '#9b87f5',
    expenses: '#FF8042',
    profit: '#4CAF50',
  };

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

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
          <DialogTitle>Property Performance Analysis</DialogTitle>
          <DialogDescription>
            Detailed comparison of your property portfolio performance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {/* Summary Section */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Total Properties</h3>
              <p className="text-2xl font-bold">{propertyData.length}</p>
            </Card>
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Best Performer</h3>
              {bestProperty && (
                <div>
                  <p className="text-2xl font-bold">{bestProperty.name}</p>
                  <p className="text-sm text-green-600">
                    {formatAmount(bestProperty.profit)} profit
                  </p>
                </div>
              )}
            </Card>
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Worst Performer</h3>
              {worstProperty && (
                <div>
                  <p className="text-2xl font-bold">{worstProperty.name}</p>
                  <p
                    className={`text-sm ${worstProperty.profit < 0 ? 'text-red-600' : 'text-amber-600'}`}
                  >
                    {formatAmount(worstProperty.profit)} profit
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Profit Distribution Pie Chart */}
          <div className="rounded-md border border-border bg-card p-4 text-card-foreground">
            <h2 className="mb-4 text-lg font-semibold">Profit Distribution by Property</h2>
            <div className="h-[350px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={profitDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={140}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {profitDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatAmount(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>

          {/* Property Comparison Bar Chart */}
          <div className="rounded-md border border-border bg-card p-4 text-card-foreground">
            <h2 className="mb-4 text-lg font-semibold">Property Financial Comparison</h2>
            <div className="h-[400px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={propertyData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tickFormatter={(value) => `₦${value / 1000000}M`} />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip formatter={(value) => formatAmount(Number(value))} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS.revenue} />
                    <Bar dataKey="expenses" name="Expenses" fill={CHART_COLORS.expenses} />
                    <Bar dataKey="profit" name="Profit" fill={CHART_COLORS.profit} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>

          {/* Detailed Properties Table */}
          <div className="rounded-md border border-border bg-card p-4 text-card-foreground">
            <h2 className="mb-4 text-lg font-semibold">Property Performance Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Property</th>
                    <th className="px-4 py-2 text-right">Revenue</th>
                    <th className="px-4 py-2 text-right">Expenses</th>
                    <th className="px-4 py-2 text-right">Profit</th>
                    <th className="px-4 py-2 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyData.map((property) => {
                    const margin =
                      property.revenue > 0
                        ? ((property.profit / property.revenue) * 100).toFixed(1)
                        : '0.0';
                    return (
                      <tr key={property.name} className="border-b">
                        <td className="px-4 py-2">{property.name}</td>
                        <td className="px-4 py-2 text-right">{formatAmount(property.revenue)}</td>
                        <td className="px-4 py-2 text-right">{formatAmount(property.expenses)}</td>
                        <td className="px-4 py-2 text-right">
                          <span
                            className={property.profit >= 0 ? 'text-green-600' : 'text-red-600'}
                          >
                            {formatAmount(property.profit)}
                          </span>
                        </td>
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
                    <td className="px-4 py-2 text-right">
                      {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%
                    </td>
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
