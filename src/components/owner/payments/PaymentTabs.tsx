import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { PaymentsTable } from './PaymentsTable';
import { OwnerPayment } from './types';

interface PaymentTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  payments: OwnerPayment[];
  loading: boolean;
}

export const PaymentTabs = ({ activeTab, setActiveTab, payments, loading }: PaymentTabsProps) => {
  const handleDownloadStatement = () => {
    toast.success('Payment statement download started');
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="received">Received Payments</TabsTrigger>
        <TabsTrigger value="pending">Pending Payments</TabsTrigger>
      </TabsList>

      <TabsContent value="received" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Payment History</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadStatement}
            disabled={payments.length === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Download Statement
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <PaymentsTable
              payments={payments}
              loading={loading}
              emptyMessage="No payments found for the selected period"
              statusVariant="success"
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pending" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pending Payments</h3>
        </div>
        <Card>
          <CardContent className="p-0">
            <PaymentsTable
              payments={payments}
              loading={loading}
              emptyMessage="No pending payments"
              statusVariant="warning"
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
