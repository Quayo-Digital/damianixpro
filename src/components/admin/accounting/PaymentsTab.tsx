import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { Payment, OwnerPaymentGroup } from '@/utils/AccountingTypes';
import { useIsMobile } from '@/hooks/use-mobile';
import { PaymentCard } from './PaymentCard';

interface PaymentsTabProps {
  loading: boolean;
  payments: Payment[];
  selectedPayments: string[];
  processingPayout: boolean;
  onSelectPayment: (id: string) => void;
  onProcessPayout: (ownerId: string, amount: number, paymentIds: string[]) => void;
  onGenerateInvoice: (id: string) => void;
}

export const PaymentsTab = ({
  loading,
  payments,
  selectedPayments,
  processingPayout,
  onSelectPayment,
  onProcessPayout,
  onGenerateInvoice,
}: PaymentsTabProps) => {
  const isMobile = useIsMobile();

  const getOwnerForPayment = (payment: Payment) => ({
    id: payment.property_tenants?.properties?.owner_id || '',
    name: payment.property_tenants?.properties?.name || 'Unknown Property',
  });

  const getOwnerGroups = (): Record<string, OwnerPaymentGroup> => {
    const filteredPayments = payments.filter((p) => p.breakdown?.paid_to_owner !== true);
    const ownerGroups: Record<string, OwnerPaymentGroup> = {};

    filteredPayments
      .filter((p) => selectedPayments.includes(p.id))
      .forEach((payment) => {
        const owner = getOwnerForPayment(payment);
        if (!owner.id) return;
        if (!ownerGroups[owner.id]) {
          ownerGroups[owner.id] = { owner, payments: [], total: 0 };
        }
        ownerGroups[owner.id].payments.push(payment);
        ownerGroups[owner.id].total += payment.breakdown?.owner_amount || 0;
      });
    return ownerGroups;
  };

  const filteredPayments = payments.filter((p) => p.breakdown?.paid_to_owner !== true);
  const totalSelectedAmount = filteredPayments
    .filter((p) => selectedPayments.includes(p.id))
    .reduce((sum, p) => sum + (p.breakdown?.owner_amount || 0), 0);
  const ownerGroups = getOwnerGroups();

  const renderDesktopView = () => (
    <Card className="rounded-2xl border-border bg-card/95 backdrop-blur-md dark:bg-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <span className="sr-only">Select</span>
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Platform Fee</TableHead>
              <TableHead className="text-right">Agent Fee</TableHead>
              <TableHead className="text-right">Owner Amount</TableHead>
              <TableHead className="text-right">Payout Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="py-8 text-center">
                  Loading payments...
                </TableCell>
              </TableRow>
            ) : filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(payment.id)}
                      onChange={() => onSelectPayment(payment.id)}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell>{payment.reference}</TableCell>
                  <TableCell>{payment.property_tenants?.properties?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    {payment.property_tenants?.tenants
                      ? `${payment.property_tenants.tenants.first_name} ${payment.property_tenants.tenants.last_name}`
                      : 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right">₦{payment.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    ₦{(payment.breakdown?.platform_fee || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ₦{(payment.breakdown?.agent_commission || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₦{(payment.breakdown?.owner_amount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={
                        payment.breakdown?.paid_to_owner
                          ? 'rounded-full bg-green-50 text-green-700'
                          : 'rounded-full bg-yellow-50 text-yellow-700'
                      }
                    >
                      {payment.breakdown?.paid_to_owner ? 'Paid' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 rounded-full p-0 hover:bg-primary/10"
                      onClick={() => onGenerateInvoice(payment.id)}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">Generate invoice</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="py-8 text-center">
                  No pending payments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderMobileView = () => (
    <div className="space-y-4">
      {loading ? (
        <p>Loading payments...</p>
      ) : filteredPayments.length > 0 ? (
        filteredPayments.map((payment) => (
          <PaymentCard
            key={payment.id}
            payment={payment}
            isSelected={selectedPayments.includes(payment.id)}
            onSelectPayment={onSelectPayment}
            onGenerateInvoice={onGenerateInvoice}
          />
        ))
      ) : (
        <p className="py-8 text-center text-muted-foreground">No pending payments found</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {selectedPayments.length > 0 && (
        <Card className="premium-toolbar">
          <CardContent className="p-4">
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-medium">Selected Payments</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedPayments.length} payments selected
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                <span className="text-sm font-medium">
                  Total: ₦{totalSelectedAmount.toLocaleString()}
                </span>
                {Object.values(ownerGroups).map((group) => (
                  <Button
                    key={group.owner.id}
                    variant="default"
                    size="sm"
                    className="rounded-full"
                    disabled={processingPayout}
                    onClick={() =>
                      onProcessPayout(
                        group.owner.id,
                        group.total,
                        group.payments.map((p) => p.id)
                      )
                    }
                  >
                    Process ₦{group.total.toLocaleString()} for {group.owner.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {isMobile ? renderMobileView() : renderDesktopView()}
    </div>
  );
};
