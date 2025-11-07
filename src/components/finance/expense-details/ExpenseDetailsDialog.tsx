
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
import { Download } from 'lucide-react';
import { ExpenseSummarySection } from './ExpenseSummarySection';
import { ExpenseDistributionChart } from './ExpenseDistributionChart';
import { ExpenseTrendChart } from './ExpenseTrendChart';
import { ExpenseDetailsTable } from './ExpenseDetailsTable';
import { exportToCsv } from '@/services/documents/exportUtils';

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

  const formatAmountForCsv = (amount: number): string => {
    return amount.toString();
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
          <ExpenseSummarySection 
            totalExpenses={totalExpenses} 
            expenseData={expenseData} 
            formatAmount={formatAmount} 
          />
          
          {/* Expense Distribution Chart */}
          <ExpenseDistributionChart 
            expenseData={expenseData} 
            formatAmount={formatAmount}
            onDownload={handleDownloadExpenseDetails}
          />
          
          {/* Monthly Expense Trend */}
          <ExpenseTrendChart 
            monthlyExpenses={monthlyExpenses} 
            formatAmount={formatAmount}
            onDownload={handleDownloadMonthlyExpenses}
          />
          
          {/* Detailed Expense Table */}
          <ExpenseDetailsTable 
            expenseData={expenseData} 
            totalExpenses={totalExpenses}
            formatAmount={formatAmount}
          />
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
