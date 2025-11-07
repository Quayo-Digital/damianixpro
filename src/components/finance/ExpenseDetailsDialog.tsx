import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Download } from 'lucide-react';
import { exportToCsv, formatAmountForCsv } from '@/services/documents/exportUtils';

interface ExpenseItem {
  name: string;
  value: number;
}

interface MonthlyExpense {
  month: string;
  expenses: number;
}

interface ExpenseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseData: ExpenseItem[];
  monthlyExpenses: MonthlyExpense[];
}

const EXPENSE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function ExpenseDetailsDialog({ 
  open, 
  onOpenChange,
  expenseData,
  monthlyExpenses
}: ExpenseDetailsDialogProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalExpenses = expenseData.reduce((sum, expense) => sum + expense.value, 0);

  // Define chart color configurations for all charts
  const chartConfig = {
    expenses: { color: '#FF8042' },
    pie: { color: '#0088FE' }
  };

  const handleDownloadExpenseDetails = () => {
    exportToCsv({
      filename: 'Detailed_Expense_Breakdown',
      headers: ['Category', 'Amount', 'Percentage (%)'],
      data: expenseData,
      mapper: (item) => [
        item.name,
        formatAmountForCsv(item.value),
        ((item.value / totalExpenses) * 100).toFixed(1)
      ]
    });
  };

  const handleDownloadMonthlyExpenses = () => {
    exportToCsv({
      filename: 'Monthly_Expenses',
      headers: ['Month', 'Expenses'],
      data: monthlyExpenses,
      mapper: (item) => [
        item.month,
        formatAmountForCsv(item.expenses)
      ]
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 z-10 bg-background pb-4 pt-6">
          <DialogTitle>Expense Breakdown Details</DialogTitle>
          <DialogDescription>
            Detailed analysis of your property expenses
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pb-4">
          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Expenses</h3>
              <p className="text-2xl font-bold">{formatAmount(totalExpenses)}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Largest Expense</h3>
              {expenseData.length > 0 && (
                <div>
                  <p className="text-2xl font-bold">
                    {formatAmount(Math.max(...expenseData.map(expense => expense.value)))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {expenseData.reduce((max, expense) => 
                      expense.value > max.value ? expense : max, expenseData[0]).name}
                  </p>
                </div>
              )}
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Categories</h3>
              <p className="text-2xl font-bold">{expenseData.length}</p>
            </Card>
          </div>
          
          {/* Expense Breakdown Chart */}
          <div className="bg-white rounded-md p-4 border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Expense Distribution</h2>
              <Button variant="outline" size="sm" onClick={handleDownloadExpenseDetails}>
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
          
          {/* Monthly Expense Trend */}
          <div className="bg-white rounded-md p-4 border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Monthly Expense Trend</h2>
              <Button variant="outline" size="sm" onClick={handleDownloadMonthlyExpenses}>
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
          
          {/* Detailed Expense Table */}
          <div className="bg-white rounded-md p-4 border">
            <h2 className="text-lg font-semibold mb-4">Detailed Expenses</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Category</th>
                    <th className="text-right py-2 px-4">Amount</th>
                    <th className="text-right py-2 px-4">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseData.map((expense, index) => (
                    <tr key={expense.name} className="border-b">
                      <td className="py-2 px-4 flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                        />
                        {expense.name}
                      </td>
                      <td className="text-right py-2 px-4">{formatAmount(expense.value)}</td>
                      <td className="text-right py-2 px-4">
                        {((expense.value / totalExpenses) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium">
                    <td className="py-2 px-4">Total</td>
                    <td className="text-right py-2 px-4">{formatAmount(totalExpenses)}</td>
                    <td className="text-right py-2 px-4">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sticky bottom-0 bg-background pt-4 pb-6 border-t mt-4">
          <Button variant="outline" onClick={handleDownloadExpenseDetails} className="mr-auto">
            <Download className="mr-2 h-4 w-4" />
            Download All Data
          </Button>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
