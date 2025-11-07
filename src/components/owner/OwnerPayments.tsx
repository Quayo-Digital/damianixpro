
import { useOwnerPayments } from '@/hooks/useOwnerPayments';
import { PaymentsHeader } from './payments/PaymentsHeader';
import { StatsGrid } from './payments/StatsGrid';
import { PaymentTabs } from './payments/PaymentTabs';

export const OwnerPayments = () => {
  const { 
    payments, 
    loading, 
    activeTab, 
    setActiveTab, 
    dateRange, 
    setDateRange, 
    loadPayments,
    getTotalAmount,
    getTotalPlatformFees,
    getTotalAgentCommissions
  } = useOwnerPayments();
  
  return (
    <div className="space-y-6">
      <PaymentsHeader 
        dateRange={dateRange}
        setDateRange={setDateRange}
        loadPayments={loadPayments}
        loading={loading}
      />

      <StatsGrid 
        totalReceived={getTotalAmount()}
        platformFees={getTotalPlatformFees()}
        agentCommissions={getTotalAgentCommissions()}
      />

      <PaymentTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        payments={payments}
        loading={loading}
      />
    </div>
  );
};
