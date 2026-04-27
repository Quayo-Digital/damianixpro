import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Tenant financial overview. Charts and aggregates will populate when payment/expense
 * data is wired from the backend.
 */
export const FinancialOverview = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Financial Overview</CardTitle>
        <CardDescription>Track your rental payments and expenses</CardDescription>
      </CardHeader>
      <CardContent className="py-12 text-center text-muted-foreground">
        No financial data yet. Payment and expense history will appear here when available.
      </CardContent>
    </Card>
  );
};
