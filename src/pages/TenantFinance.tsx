import { useState } from 'react';
import { PageContent } from '@/components/layout/PageContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TenantPayments } from '@/components/communication/TenantPayments';
import { FinancialOverview } from '@/components/communication/financial/FinancialOverview';

const TenantFinance = () => {
  const [activeTab, setActiveTab] = useState('payments');

  return (
    <PageContent
      title="Financial Management"
      description="Track your payments and financial information"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="overview">Financial Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <TenantPayments />
        </TabsContent>

        <TabsContent value="overview">
          <FinancialOverview />
        </TabsContent>
      </Tabs>
    </PageContent>
  );
};

export default TenantFinance;
