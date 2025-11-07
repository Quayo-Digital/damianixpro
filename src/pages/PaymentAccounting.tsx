
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { PaymentAccounting } from '@/components/admin/PaymentAccounting';
import { usePaymentAccounting } from '@/hooks/usePaymentAccounting';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Download } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const PaymentAccountingPage = () => {
  const {
    activeTab, setActiveTab,
    dateRange, setDateRange,
    loading,
    filterProperty, setFilterProperty,
    properties,
    accounting,
    payments,
    ownerPayouts,
    processingPayout,
    selectedPayments,
    loadData,
    handleProcessPayout,
    handleGenerateInvoice,
    handleSelectPayment
  } = usePaymentAccounting();

  const handleDownloadReport = () => {
    toast.success('Report download started');
  };

  const pageActions = (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <Select value={filterProperty} onValueChange={setFilterProperty}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Filter property" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Properties</SelectItem>
          {properties.map(property => (
            <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <DateRangePicker
        value={dateRange}
        onValueChange={setDateRange}
        align="end"
        className="w-full sm:w-auto"
      />
      
      <Button 
        variant="outline" 
        size="icon"
        onClick={() => loadData()}
        disabled={loading}
      >
        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleDownloadReport}
      >
        <Download className="mr-2 h-4 w-4" />
        Report
      </Button>
    </div>
  );

  return (
    <PageLayout>
      <PageContent
        title="Payment Accounting"
        description="Manage payment processing and accounting"
        actions={pageActions}
      >
        <PaymentAccounting 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          loading={loading}
          accounting={accounting}
          payments={payments}
          ownerPayouts={ownerPayouts}
          processingPayout={processingPayout}
          selectedPayments={selectedPayments}
          handleProcessPayout={handleProcessPayout}
          handleGenerateInvoice={handleGenerateInvoice}
          handleSelectPayment={handleSelectPayment}
        />
      </PageContent>
    </PageLayout>
  );
};

export default PaymentAccountingPage;
