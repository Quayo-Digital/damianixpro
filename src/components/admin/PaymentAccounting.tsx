
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownUp, BarChart3, WalletCards } from 'lucide-react';
import { OverviewTab } from './accounting/OverviewTab';
import { PaymentsTab } from './accounting/PaymentsTab';
import { PayoutsTab } from './accounting/PayoutsTab';
import { AccountingSummary, Payment, OwnerPayout } from '@/utils/AccountingTypes';
import React from "react";

interface PaymentAccountingProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loading: boolean;
  accounting: AccountingSummary;
  payments: Payment[];
  ownerPayouts: OwnerPayout[];
  processingPayout: boolean;
  selectedPayments: string[];
  handleProcessPayout: (ownerId: string, amount: number, paymentIds: string[]) => void;
  handleGenerateInvoice: (paymentId: string) => void;
  handleSelectPayment: (paymentId: string) => void;
}

export const PaymentAccounting = ({
  activeTab, setActiveTab,
  loading,
  accounting,
  payments,
  ownerPayouts,
  processingPayout,
  selectedPayments,
  handleProcessPayout,
  handleGenerateInvoice,
  handleSelectPayment
}: PaymentAccountingProps) => {
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="payments" className="flex items-center gap-2">
          <WalletCards className="h-4 w-4" />
          Payments
        </TabsTrigger>
        <TabsTrigger value="payouts" className="flex items-center gap-2">
          <ArrowDownUp className="h-4 w-4" />
          Payouts
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="mt-6">
        <OverviewTab accounting={accounting} />
      </TabsContent>
      
      <TabsContent value="payments" className="mt-6">
        <PaymentsTab 
          loading={loading}
          payments={payments}
          selectedPayments={selectedPayments}
          processingPayout={processingPayout}
          onSelectPayment={handleSelectPayment}
          onProcessPayout={handleProcessPayout}
          onGenerateInvoice={handleGenerateInvoice}
        />
      </TabsContent>
      
      <TabsContent value="payouts" className="mt-6">
        <PayoutsTab loading={loading} ownerPayouts={ownerPayouts} />
      </TabsContent>
    </Tabs>
  );
};
