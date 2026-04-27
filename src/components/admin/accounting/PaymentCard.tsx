import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Payment } from '@/utils/AccountingTypes';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface PaymentCardProps {
  payment: Payment;
  isSelected: boolean;
  onSelectPayment: (id: string) => void;
  onGenerateInvoice: (id: string) => void;
}

export const PaymentCard = ({
  payment,
  isSelected,
  onSelectPayment,
  onGenerateInvoice,
}: PaymentCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">
        {payment.property_tenants?.properties?.name || 'Unknown'}
      </CardTitle>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelectPayment(payment.id)}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="text-sm text-muted-foreground">
        {payment.property_tenants?.tenants
          ? `${payment.property_tenants.tenants.first_name} ${payment.property_tenants.tenants.last_name}`
          : 'Unknown Tenant'}
      </div>
      <div className="flex items-center justify-between">
        <span className="font-medium">
          ₦{(payment.breakdown?.owner_amount || 0).toLocaleString()}
        </span>
        <Badge
          variant="outline"
          className={
            payment.breakdown?.paid_to_owner
              ? 'bg-green-50 text-green-700'
              : 'bg-yellow-50 text-yellow-700'
          }
        >
          {payment.breakdown?.paid_to_owner ? 'Paid' : 'Pending'}
        </Badge>
      </div>
      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
        <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onGenerateInvoice(payment.id)}
        >
          <FileText className="h-4 w-4" />
          <span className="sr-only">Generate invoice</span>
        </Button>
      </div>
    </CardContent>
  </Card>
);
