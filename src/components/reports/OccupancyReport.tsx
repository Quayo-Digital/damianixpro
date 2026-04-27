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
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { OccupancyReportData } from './types';

interface OccupancyReportProps {
  data: OccupancyReportData;
  dateRange: { from: Date; to: Date };
}

const StatDisplay = ({ title, value }: { title: string; value: string }) => (
  <div className="premium-stat-tile">
    <p className="text-sm font-medium text-muted-foreground">{title}</p>
    <p className="premium-title text-xl">{value}</p>
  </div>
);

export const OccupancyReport = ({ data, dateRange }: OccupancyReportProps) => {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const formatCurrency = (amount: number | null) =>
    amount == null
      ? 'N/A'
      : new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const escapeCsv = (value: string | number | null) => {
    const text = value == null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const handleExportCsv = () => {
    const headers = [
      'Property',
      'Location',
      'Tenant',
      'Lease Start',
      'Lease End',
      'Monthly Rent',
      'Status',
    ];

    const rows = data.entries.map((entry) => [
      entry.propertyName,
      entry.location || '',
      entry.tenantName || '',
      entry.leaseStartDate || '',
      entry.leaseEndDate || '',
      entry.monthlyRent ?? '',
      entry.status,
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
    link.download = `occupancy-report-${from}-to-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="premium-data-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="premium-title">Occupancy Report</CardTitle>
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatDisplay title="Total Properties" value={String(data.totalProperties)} />
          <StatDisplay title="Occupied" value={String(data.occupiedProperties)} />
          <StatDisplay title="Vacant" value={String(data.vacantProperties)} />
          <StatDisplay title="Occupancy Rate" value={`${data.occupancyRate.toFixed(1)}%`} />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Lease Period</TableHead>
              <TableHead className="text-right">Monthly Rent</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No occupancy data available for the selected period.
                </TableCell>
              </TableRow>
            ) : (
              data.entries.map((entry, index) => (
                <TableRow key={`${entry.propertyName}-${index}`}>
                  <TableCell className="font-medium">{entry.propertyName}</TableCell>
                  <TableCell>{entry.location || 'N/A'}</TableCell>
                  <TableCell>{entry.tenantName || 'Unoccupied'}</TableCell>
                  <TableCell>
                    {entry.leaseStartDate
                      ? `${entry.leaseStartDate} - ${entry.leaseEndDate || 'Open'}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(entry.monthlyRent)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={entry.status === 'Occupied' ? 'success' : 'secondary'}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
