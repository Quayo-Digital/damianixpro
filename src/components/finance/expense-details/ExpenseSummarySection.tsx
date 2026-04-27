import React from 'react';
import { Card } from '@/components/ui/card';

interface ExpenseItem {
  name: string;
  value: number;
}

interface ExpenseSummarySectionProps {
  totalExpenses: number;
  expenseData: ExpenseItem[];
  formatAmount: (amount: number) => string;
}

export function ExpenseSummarySection({
  totalExpenses,
  expenseData,
  formatAmount,
}: ExpenseSummarySectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="p-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Total Expenses</h3>
        <p className="text-2xl font-bold">{formatAmount(totalExpenses)}</p>
      </Card>
      <Card className="p-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Largest Expense</h3>
        {expenseData.length > 0 && (
          <div>
            <p className="text-2xl font-bold">
              {formatAmount(Math.max(...expenseData.map((expense) => expense.value)))}
            </p>
            <p className="text-sm text-muted-foreground">
              {
                expenseData.reduce(
                  (max, expense) => (expense.value > max.value ? expense : max),
                  expenseData[0]
                ).name
              }
            </p>
          </div>
        )}
      </Card>
      <Card className="p-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Categories</h3>
        <p className="text-2xl font-bold">{expenseData.length}</p>
      </Card>
    </div>
  );
}
