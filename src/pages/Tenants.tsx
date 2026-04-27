import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, FileText, Shield } from 'lucide-react';
import { useAuthSession } from '@/contexts/auth';
import { AddTenantDialog } from '@/components/tenants/AddTenantDialog';
import { TenantDetailSheet } from '@/components/tenants/TenantDetailSheet';
import { ApplicationDetailSheet } from '@/components/tenants/ApplicationDetailSheet';
import { ScreeningDetailSheet } from '@/components/tenants/ScreeningDetailSheet';
import { TenantStats } from '@/components/tenants/TenantStats';
import { TenantTable } from '@/components/tenants/TenantTable';
import { ApplicationsTable } from '@/components/tenants/ApplicationsTable';
import { ScreeningsTable } from '@/components/tenants/ScreeningsTable';
import {
  Tenant,
  TenantApplication,
  TenantScreening as TenantScreeningType,
} from '@/hooks/useTenants';

const Tenants = () => {
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tenants' | 'applications' | 'screenings'>('tenants');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<TenantApplication | null>(null);
  const [selectedScreening, setSelectedScreening] = useState<TenantScreeningType | null>(null);
  const [tenantDetailOpen, setTenantDetailOpen] = useState(false);
  const [applicationDetailOpen, setApplicationDetailOpen] = useState(false);
  const [screeningDetailOpen, setScreeningDetailOpen] = useState(false);

  const { isOwner, isAdmin } = useAuthSession();

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsAddDialogOpen(true);
  };

  const handleViewTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setTenantDetailOpen(true);
  };

  const handleContactTenant = (tenant: Tenant) => {
    navigate(`/messages?userId=${tenant.user_id}`);
  };

  const handleViewApplication = (application: TenantApplication) => {
    setSelectedApplication(application);
    setApplicationDetailOpen(true);
  };

  const handleApproveApplication = (application: TenantApplication) => {
    setSelectedApplication(application);
  };

  const handleRejectApplication = (application: TenantApplication) => {
    setSelectedApplication(application);
  };

  const handleViewScreening = (screening: TenantScreeningType) => {
    setSelectedScreening(screening);
    setScreeningDetailOpen(true);
  };

  return (
    <PageLayout>
      <PageContent title="Tenants" description="Manage tenant applications and screening">
        {/* Statistics Overview */}
        <TenantStats />

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          className="space-y-6"
        >
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
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
            <ScreeningsTable onViewScreening={handleViewScreening} />
          </TabsContent>
        </Tabs>

        <AddTenantDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          tenant={selectedTenant}
        />

        <TenantDetailSheet
          tenant={selectedTenant}
          open={tenantDetailOpen}
          onOpenChange={(open) => {
            setTenantDetailOpen(open);
            if (!open) setSelectedTenant(null);
          }}
        />

        <ApplicationDetailSheet
          application={selectedApplication}
          open={applicationDetailOpen}
          onOpenChange={(open) => {
            setApplicationDetailOpen(open);
            if (!open) setSelectedApplication(null);
          }}
        />

        <ScreeningDetailSheet
          screening={selectedScreening}
          open={screeningDetailOpen}
          onOpenChange={(open) => {
            setScreeningDetailOpen(open);
            if (!open) setSelectedScreening(null);
          }}
        />
      </PageContent>
    </PageLayout>
  );
};

export default Tenants;
