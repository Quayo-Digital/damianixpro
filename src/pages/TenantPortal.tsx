
import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Updated to use PageLayout with sidebar instead of PageContent
import { TenantMessages } from '@/components/communication/TenantMessages';
import { TenantAnnouncements } from '@/components/communication/TenantAnnouncements';
import { TenantPayments } from '@/components/communication/TenantPayments';
import { TenantMaintenanceRequests } from '@/components/communication/TenantMaintenanceRequests';
import { TenantDashboard } from '@/components/communication/TenantDashboard';
import { TenantInspections } from '@/components/communication/TenantInspections';
import { FinancialOverview } from '@/components/communication/financial/FinancialOverview';
import { TemplatesManager } from '@/components/communication/TemplatesManager';
import { TenantDocumentsContent } from '@/components/documents/TenantDocumentsContent';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const TenantPortal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Handle URL fragment changes
  useEffect(() => {
    // Check for URL fragment/hash
    const hash = location.hash.replace('#', '');
    if (hash && ['dashboard', 'messages', 'announcements', 'payments', 'maintenance', 'inspections', 'financial', 'templates', 'documents'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate({ hash: value });
  };
  
  // Handle payment button click from any tab
  const handleOpenPaymentDialog = () => {
    setActiveTab('payments');
    navigate({ hash: 'payments' });
    setIsPaymentDialogOpen(true);
  };

  // Handle horizontal scroll for tabs
  const handleScroll = (direction: 'left' | 'right') => {
    const tabList = document.querySelector('[role="tablist"]');
    if (tabList) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      tabList.scrollLeft += scrollAmount;
      setScrollPosition(tabList.scrollLeft + scrollAmount);
    }
  };
  
  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant Portal</h1>
          <p className="text-muted-foreground">Access your tenant information, make payments, and request maintenance</p>
        </div>
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={handleTabChange} className="w-full">
        {isMobile ? (
          <div className="relative mb-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={() => handleScroll('left')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="pb-2">
              <div className="flex overflow-x-auto pb-3 px-1">
                <TabsList className="inline-flex w-max px-4 border rounded-lg">
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                  <TabsTrigger value="announcements">Announcements</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                  <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                  <TabsTrigger value="inspections">Inspections</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
              </div>
            </ScrollArea>
            
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={() => handleScroll('right')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <TabsList className="mb-8 grid grid-cols-9">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="inspections">Inspections</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
        )}
        
        <TabsContent value="dashboard">
          <TenantDashboard onMakePayment={handleOpenPaymentDialog} />
        </TabsContent>
        
        <TabsContent value="messages">
          <TenantMessages />
        </TabsContent>
        
        <TabsContent value="announcements">
          <TenantAnnouncements />
        </TabsContent>
        
        <TabsContent value="payments">
          <TenantPayments isDialogOpen={isPaymentDialogOpen} setIsDialogOpen={setIsPaymentDialogOpen} />
        </TabsContent>
        
        <TabsContent value="maintenance">
          <TenantMaintenanceRequests />
        </TabsContent>
        
        <TabsContent value="inspections">
          <TenantInspections />
        </TabsContent>
        
        <TabsContent value="financial">
          <FinancialOverview />
        </TabsContent>
        
        <TabsContent value="templates">
          <TemplatesManager />
        </TabsContent>
        
        <TabsContent value="documents">
          <TenantDocumentsContent />
        </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default TenantPortal;
