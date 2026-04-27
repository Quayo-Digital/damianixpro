import React from 'react';

interface ExpenseItem {
  name: string;
  value: number;
}

interface ExpenseDetailsTableProps {
  expenseData: ExpenseItem[];
  totalExpenses: number;
  formatAmount: (amount: number) => string;
}

const EXPENSE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function ExpenseDetailsTable({
  expenseData,
  totalExpenses,
  formatAmount,
}: ExpenseDetailsTableProps) {
  return (
    <div className="rounded-md border border-border bg-card p-4 text-card-foreground">
      <h2 className="mb-4 text-lg font-semibold">Detailed Expenses</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-right">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {expenseData.map((expense, index) => (
              <tr key={expense.name} className="border-b">
                <td className="flex items-center px-4 py-2">
                  <div
                    className="mr-2 h-3 w-3 rounded-full"
                    style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                  />
                  {expense.name}
                </td>
                <td className="px-4 py-2 text-right">{formatAmount(expense.value)}</td>
                <td className="px-4 py-2 text-right">
                  {((expense.value / totalExpenses) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-medium">
              <td className="px-4 py-2">Total</td>
              <td className="px-4 py-2 text-right">{formatAmount(totalExpenses)}</td>
              <td className="px-4 py-2 text-right">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
