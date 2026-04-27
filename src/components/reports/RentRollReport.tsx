import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RentRollEntry } from './types';

interface RentRollReportProps {
  data: RentRollEntry[];
  dateRange: { from: Date; to: Date };
}

export const RentRollReport = ({ data, dateRange }: RentRollReportProps) => {
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusVariant = (
    status: RentRollEntry['status']
  ): 'default' | 'destructive' | 'secondary' | 'outline' | 'success' => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Overdue':
        return 'destructive';
      case 'Due':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="premium-data-card">
      <CardHeader>
        <CardTitle className="premium-title">Rent Roll Report</CardTitle>
        <CardDescription>
          For the period from {formatDate(dateRange.from)} to {formatDate(dateRange.to)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Lease Dates</TableHead>
              <TableHead className="text-right">Monthly Rent</TableHead>
              <TableHead>Last Payment</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No rent roll data available for the selected period.
                </TableCell>
              </TableRow>
            ) : (
              data.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="font-medium">{entry.propertyName}</div>
                    <div className="text-sm text-muted-foreground">{entry.unit}</div>
                  </TableCell>
                  <TableCell>{entry.tenantName}</TableCell>
                  <TableCell>
                    {entry.leaseStartDate} - {entry.leaseEndDate}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(entry.monthlyRent)}</TableCell>
                  <TableCell>
                    {entry.lastPaymentDate ? (
                      <>
                        <div>{entry.lastPaymentDate}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(entry.lastPaymentAmount)}
                        </div>
                      </>
                    ) : (
                      'No payments yet'
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusVariant(entry.status)} className="rounded-full">
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
