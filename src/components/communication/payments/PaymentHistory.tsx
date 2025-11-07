
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, X, RepeatIcon } from "lucide-react";
import { Payment, PAYMENT_CATEGORIES } from "@/utils/PaymentTypes";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentHistoryProps {
  payments: Payment[];
  isLoading?: boolean;
}

export const PaymentHistory = ({ payments = [], isLoading = false }: PaymentHistoryProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'successful':
        return <Check className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <X className="h-4 w-4" />;
      case 'active':
        return <RepeatIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'successful':
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case 'pending':
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case 'failed':
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case 'active':
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      default:
        return "";
    }
  };

  const getCategoryLabel = (categoryValue?: string) => {
    if (!categoryValue) return 'Other';
    const category = PAYMENT_CATEGORIES.find(c => c.value === categoryValue);
    return category ? category.label : categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>View all your payment transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : payments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono text-xs">{payment.reference}</TableCell>
                  <TableCell>{getCategoryLabel(payment.category)}</TableCell>
                  <TableCell>₦{payment.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={`flex w-24 items-center justify-center gap-1 ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            <p>No payment history found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
