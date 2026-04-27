import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download } from 'lucide-react';
import { MaintenanceCostsReportData } from './types';

interface MaintenanceCostsReportProps {
  data: MaintenanceCostsReportData;
  dateRange: { from: Date; to: Date };
}

const StatDisplay = ({ title, value }: { title: string; value: string }) => (
  <div className="premium-stat-tile">
    <p className="text-sm font-medium text-muted-foreground">{title}</p>
    <p className="premium-title text-xl">{value}</p>
  </div>
);

export const MaintenanceCostsReport = ({ data, dateRange }: MaintenanceCostsReportProps) => {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const escapeCsv = (value: string | number | null) => {
    const text = value == null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const handleExportCsv = () => {
    const headers = ['Date', 'Property', 'Category', 'Description', 'Amount'];
    const rows = data.entries.map((entry) => [
      entry.date,
      entry.propertyName,
      entry.category,
      entry.description || '',
      entry.amount,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const from = dateRange.from.toISOString().split('T')[0];
    const to = dateRange.to.toISOString().split('T')[0];
    link.href = url;
    link.download = `maintenance-costs-report-${from}-to-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="premium-data-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="premium-title">Maintenance Costs Report</CardTitle>
            <CardDescription>
              For the period from {formatDate(dateRange.from)} to {formatDate(dateRange.to)}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-primary/30 bg-background dark:bg-muted/30"
            onClick={handleExportCsv}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatDisplay title="Total Maintenance Cost" value={formatCurrency(data.totalCost)} />
          <StatDisplay title="Transactions" value={String(data.transactionCount)} />
          <StatDisplay title="Average Cost" value={formatCurrency(data.averageCost)} />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Cost By Category</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byCategory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No category summary available.
                  </TableCell>
                </TableRow>
              ) : (
                data.byCategory.map((item) => (
                  <TableRow key={item.category}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Maintenance Transactions</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No maintenance transactions found for this period.
                  </TableCell>
                </TableRow>
              ) : (
                data.entries.map((entry, index) => (
                  <TableRow key={`${entry.date}-${entry.propertyName}-${index}`}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.propertyName}</TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell>{entry.description || 'N/A'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.amount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
