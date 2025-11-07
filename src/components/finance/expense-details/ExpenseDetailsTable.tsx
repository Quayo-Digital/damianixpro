
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
  formatAmount 
}: ExpenseDetailsTableProps) {
  return (
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
  );
}
