import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface AccountingSummary {
  totalRevenue: number;
  platformFees: number;
  agentCommissions: number;
  ownerPayouts: number;
  taxes: number;
  pendingPayouts: number;
}

interface FinancialSummaryReportProps {
  summary: AccountingSummary;
  dateRange: { from: Date; to: Date };
}

const StatDisplay = ({ title, value }: { title: string; value: string }) => (
  <div className="premium-stat-tile">
    <p className="text-sm font-medium text-muted-foreground">{title}</p>
    <p className="premium-title text-xl">{value}</p>
  </div>
);

export const FinancialSummaryReport = ({ summary, dateRange }: FinancialSummaryReportProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Card className="premium-data-card">
      <CardHeader>
        <CardTitle className="premium-title">Financial Summary Report</CardTitle>
        <CardDescription>
          For the period from {formatDate(dateRange.from)} to {formatDate(dateRange.to)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatDisplay title="Total Revenue" value={formatCurrency(summary.totalRevenue)} />
          <StatDisplay title="Platform Fees" value={formatCurrency(summary.platformFees)} />
          <StatDisplay title="Agent Commissions" value={formatCurrency(summary.agentCommissions)} />
          <StatDisplay title="Taxes" value={formatCurrency(summary.taxes)} />
          <StatDisplay title="Payouts to Owners" value={formatCurrency(summary.ownerPayouts)} />
          <StatDisplay title="Pending Payouts" value={formatCurrency(summary.pendingPayouts)} />
        </div>
      </CardContent>
    </Card>
  );
};
