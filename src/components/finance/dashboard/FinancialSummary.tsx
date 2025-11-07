
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface FinancialSummaryProps {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  profitMargin: string;
  formatAmount: (amount: number) => string;
  isLoading: boolean;
}

export function FinancialSummary({ 
  totalRevenue, 
  totalExpenses, 
  totalProfit, 
  profitMargin,
  formatAmount,
  isLoading
}: FinancialSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">{formatAmount(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from last period
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">{formatAmount(totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">+5%</span> from last period
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Net Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">{formatAmount(totalProfit)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+14%</span> from last period
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Profit Margin
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">{profitMargin}%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+1.2%</span> from last period
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
