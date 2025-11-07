import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WalletCards, RepeatIcon } from "lucide-react";
import { Payment, PAYMENT_CATEGORIES } from "@/utils/PaymentTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface PaymentOverviewProps {
  onMakePayment: () => void;
  payments?: Payment[];
  isLoading?: boolean;
}

export const PaymentOverview = ({ onMakePayment, payments = [], isLoading = false }: PaymentOverviewProps) => {
  // Calculate totals
  const totalPaid = payments
    .filter(p => p.status === 'successful')
    .reduce((sum, payment) => sum + payment.amount, 0);
    
  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate category distributions for successful payments
  const successfulPayments = payments.filter(p => p.status === 'successful');
  const categoryTotals: Record<string, number> = {};
  
  successfulPayments.forEach(payment => {
    const category = payment.category || 'other';
    categoryTotals[category] = (categoryTotals[category] || 0) + payment.amount;
  });

  const categoryData = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ 
      category, 
      amount, 
      percentage: totalPaid > 0 ? (amount / totalPaid) * 100 : 0,
      label: PAYMENT_CATEGORIES.find(c => c.value === category)?.label || category
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3); // Show top 3 categories

  // New: Filter for active recurring plans
  const activeRecurringPlans = payments.filter(
    p => p.is_recurring && p.status === 'active'
  );

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Overview</CardTitle>
        <CardDescription>View your payment status and make payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mb-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-2">Total Paid</p>
            {isLoading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <p className="text-2xl font-bold">{formatAmount(totalPaid)}</p>
            )}
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-2">Pending Payments</p>
            {isLoading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <p className="text-2xl font-bold">{formatAmount(totalPending)}</p>
            )}
          </div>
        </div>
        
        {!isLoading && activeRecurringPlans.length > 0 && (
          <div className="my-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Active Recurring Payments</h4>
            <div className="space-y-3">
              {activeRecurringPlans.map(plan => (
                <div key={plan.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{plan.category} - {plan.recurring_type}</p>
                    <p className="text-sm text-muted-foreground">
                      Next payment: {formatAmount(plan.amount)} on {plan.next_payment_date ? new Date(plan.next_payment_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <RepeatIcon className="h-5 w-5 text-primary" />
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && categoryData.length > 0 && (
          <div className="mb-6 space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Payment Distribution</h4>
            {categoryData.map(cat => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{cat.label}</span>
                  <span>{formatAmount(cat.amount)} ({cat.percentage.toFixed(0)}%)</span>
                </div>
                <Progress value={cat.percentage} className="h-2" />
              </div>
            ))}
          </div>
        )}
        
        <Button className="w-full" onClick={onMakePayment}>
          <WalletCards className="mr-2 h-4 w-4" />
          Make Payment
        </Button>
      </CardContent>
    </Card>
  );
};
