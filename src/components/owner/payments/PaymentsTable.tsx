
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText } from 'lucide-react';
import { OwnerPayment } from './types';

interface PaymentsTableProps {
  payments: OwnerPayment[];
  loading: boolean;
  emptyMessage: string;
  statusVariant: 'success' | 'warning';
}

export const PaymentsTable = ({ payments, loading, emptyMessage, statusVariant }: PaymentsTableProps) => {
  const getBadgeClass = (variant: string) => {
    if (variant === 'success') {
      return "bg-green-50 text-green-700 border-green-200";
    }
    if (variant === 'warning') {
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
    return "";
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Property</TableHead>
          <TableHead>Tenant</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Your Share</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8">
              Loading payments...
            </TableCell>
          </TableRow>
        ) : payments.length > 0 ? (
          payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
              <TableCell>{payment.property_name}</TableCell>
              <TableCell>{payment.tenant_name}</TableCell>
              <TableCell className="text-right">₦{payment.total_amount.toLocaleString()}</TableCell>
              <TableCell className="text-right font-medium">₦{payment.owner_amount.toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getBadgeClass(statusVariant)}>
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <FileText className="h-4 w-4" />
                  <span className="sr-only">View details</span>
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
