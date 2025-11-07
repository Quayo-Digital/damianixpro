
import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, FileText, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { AddTenantDialog } from '@/components/tenants/AddTenantDialog';
import { TenantScreening } from '@/components/tenants/TenantScreening';
import { ApplicationReview } from '@/components/tenants/ApplicationReview';
import { TenantStats } from '@/components/tenants/TenantStats';
import { TenantTable } from '@/components/tenants/TenantTable';
import { ApplicationsTable } from '@/components/tenants/ApplicationsTable';
import { ScreeningsTable } from '@/components/tenants/ScreeningsTable';
import { Tenant, TenantApplication, TenantScreening as TenantScreeningType } from '@/hooks/useTenants';

const Tenants = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tenants' | 'applications' | 'screenings'>('tenants');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<TenantApplication | null>(null);
  const [selectedScreening, setSelectedScreening] = useState<TenantScreeningType | null>(null);
  
  const { isOwner, isAdmin } = useAuth();

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsAddDialogOpen(true);
  };

  const handleViewTenant = (tenant: Tenant) => {
    // TODO: Implement tenant detail view
    console.log('View tenant:', tenant);
  };

  const handleContactTenant = (tenant: Tenant) => {
    // TODO: Implement tenant communication
    console.log('Contact tenant:', tenant);
  };

  const handleViewApplication = (application: TenantApplication) => {
    setSelectedApplication(application);
    // TODO: Implement application detail view
    console.log('View application:', application);
  };

  const handleApproveApplication = (application: TenantApplication) => {
    console.log('Application approved:', application);
  };

  const handleRejectApplication = (application: TenantApplication) => {
    console.log('Application rejected:', application);
  };

  const handleViewScreening = (screening: TenantScreeningType) => {
    setSelectedScreening(screening);
    // TODO: Implement screening detail view
    console.log('View screening:', screening);
  };

  return (
    <PageLayout>
      <PageContent 
        title="Tenants" 
        description="Manage tenant applications and screening"
      >
        {/* Statistics Overview */}
        <TenantStats />
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <TabsList className="grid w-full grid-cols-3 md:w-auto">
              <TabsTrigger value="tenants" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Tenants</span>
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Applications</span>
              </TabsTrigger>
              <TabsTrigger value="screenings" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Screenings</span>
              </TabsTrigger>
            </TabsList>
            
            {(isOwner() || isAdmin()) && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Button>
            )}
          </div>

          <TabsContent value="tenants" className="space-y-4">
            <TenantTable 
              onEditTenant={handleEditTenant}
              onViewTenant={handleViewTenant}
              onContactTenant={handleContactTenant}
            />
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <ApplicationsTable 
              onViewApplication={handleViewApplication}
              onApproveApplication={handleApproveApplication}
              onRejectApplication={handleRejectApplication}
            />
          </TabsContent>

          <TabsContent value="screenings" className="space-y-4">
            <ScreeningsTable 
              onViewScreening={handleViewScreening}
            />
          </TabsContent>
        </Tabs>
        
        <AddTenantDialog 
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          tenant={selectedTenant}
        />
        
        {selectedApplication && (
          <ApplicationReview 
            applicationId={selectedApplication.id}
            onClose={() => setSelectedApplication(null)}
          />
        )}
        
        {selectedScreening && (
          <TenantScreening 
            tenantId={selectedScreening.tenant_id}
            onClose={() => setSelectedScreening(null)}
          />
        )}
      </PageContent>
    </PageLayout>
  );
};

export default Tenants;
