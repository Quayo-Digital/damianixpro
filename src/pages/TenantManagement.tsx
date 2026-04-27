import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, FileWarning, Clock, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AddTenantForm } from '@/components/tenants/AddTenantForm';
import { TenantListView } from '@/components/tenants/TenantListView';
import { useAuthSession } from '@/contexts/auth';
import { LeaseActionList } from '@/components/leases/LeaseActionList';
import { ApplicationReviewDialog } from '@/components/applications/ApplicationReviewDialog';
import { RentalApplication, LeaseAgreement } from '@/services/applications/types';
import { toast } from 'sonner';
import { CreateLeaseDialog } from '@/components/leases/CreateLeaseDialog';
import { fetchLeases, fetchApplications } from '@/services/leases/leaseApi';
import { StatCard } from '@/components/dashboard/StatCard';
import { differenceInDays, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { TenantScreeningList } from '@/components/tenants/TenantScreeningList';
import { supabase } from '@/integrations/supabase/client';
import { getLeaseAgreementsTablePresence } from '@/services/leases/enrichLeaseAgreements';
import { LeasesTab } from '@/components/tenants/management/LeasesTab';
import { ApplicationsTab } from '@/components/tenants/management/ApplicationsTab';
import { LeaseOnboardingCoordinationSheet } from '@/components/leases/LeaseOnboardingCoordinationSheet';

const TenantManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tenants');

  const [selectedApplication, setSelectedApplication] = useState<RentalApplication | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [createLeaseDialogOpen, setCreateLeaseDialogOpen] = useState(false);
  const [onboardingLease, setOnboardingLease] = useState<LeaseAgreement | null>(null);
  const [onboardingSheetOpen, setOnboardingSheetOpen] = useState(false);

  const { isOwner, isAgent } = useAuthSession();
  const queryClient = useQueryClient();

  const {
    data: leases = [],
    isLoading: isLoadingLeases,
    isFetched: leasesFetched,
  } = useQuery({
    queryKey: ['leases'],
    queryFn: fetchLeases,
  });

  const {
    data: applications = [],
    isLoading: loadingApplications,
    error: applicationsError,
  } = useQuery({
    queryKey: ['applications'],
    queryFn: fetchApplications,
  });

  useEffect(() => {
    if (applicationsError) {
      toast.error(applicationsError.message);
    }
  }, [applicationsError]);

  useEffect(() => {
    const channel = supabase.channel('tenant-management-changes');

    // Skip Realtime binding for a table that isn't in the DB (avoids noisy client errors)
    if (getLeaseAgreementsTablePresence() !== 'missing') {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lease_agreements' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['leases'] });
        }
      );
    }

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leases' }, () => {
        queryClient.invalidateQueries({ queryKey: ['leases'] });
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rental_applications' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['applications'] });
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, () => {
        queryClient.invalidateQueries({ queryKey: ['tenantList'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'property_tenants' }, () => {
        queryClient.invalidateQueries({ queryKey: ['tenantList'] });
        queryClient.invalidateQueries({ queryKey: ['leases'] });
      })
      .subscribe();

    // Defer teardown: React 18 Strict Mode unmounts almost immediately; removing the channel
    // while the Realtime WebSocket is still handshaking triggers a noisy browser warning.
    const teardownMs = import.meta.env.DEV ? 450 : 0;
    return () => {
      const ch = channel;
      window.setTimeout(() => {
        void supabase.removeChannel(ch);
      }, teardownMs);
    };
    // Re-bind after first lease fetch updates `getLeaseAgreementsTablePresence()` (skip dead table)
  }, [queryClient, leasesFetched]);

  const approvedApplications = useMemo(
    () => applications.filter((app) => app.status === 'approved'),
    [applications]
  );

  const handleReviewApplication = (application: RentalApplication) => {
    setSelectedApplication(application);
    setIsReviewOpen(true);
  };

  const handleLeaseCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['leases'] });
    queryClient.invalidateQueries({ queryKey: ['applications'] });
    setCreateLeaseDialogOpen(false);
  };

  const handleApplicationStatusChange = () => {
    queryClient.invalidateQueries({ queryKey: ['applications'] });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const statCardData = useMemo(
    () => ({
      activeLeases: leases.filter((l) => l.status === 'active').length,
      expiringSoon: leases.filter((lease) => {
        if (!lease.end_date) return false;
        const daysRemaining = differenceInDays(parseISO(lease.end_date), new Date());
        return daysRemaining >= 0 && daysRemaining <= 30;
      }).length,
      pendingApplications: applications.filter((a) => a.status === 'pending').length,
      approvedApplications: approvedApplications.length,
    }),
    [leases, applications]
  );

  const showLeaseStats = ['leases', 'lease-actions', 'applications'].includes(activeTab);
  const showLeaseActions = isOwner() || isAgent();

  return (
    <PageLayout>
      <PageContent
        title="Tenant & Lease Management"
        description="Manage your property tenants, leases, and applications."
      >
        {showLeaseStats && (
          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Active Leases"
              value={statCardData.activeLeases.toString()}
              icon={<Users className="text-primary" />}
            />
            <StatCard
              title="Leases Expiring Soon"
              value={statCardData.expiringSoon.toString()}
              icon={<FileWarning className="text-amber-500" />}
              description="In next 30 days"
            />
            <StatCard
              title="Pending Applications"
              value={statCardData.pendingApplications.toString()}
              icon={<Clock className="text-blue-500" />}
            />
            <StatCard
              title="Approved Applications"
              value={statCardData.approvedApplications.toString()}
              icon={<CheckCircle className="text-green-500" />}
              description="Ready for lease"
            />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="tenants">Active Tenants</TabsTrigger>
              <TabsTrigger value="former">Former Tenants</TabsTrigger>
              <TabsTrigger value="screening">Screening</TabsTrigger>
              <TabsTrigger value="leases">Leases</TabsTrigger>
              {showLeaseActions && <TabsTrigger value="lease-actions">Lease Actions</TabsTrigger>}
              {showLeaseActions && <TabsTrigger value="applications">Applications</TabsTrigger>}
            </TabsList>
            <div className="flex gap-2">
              {['tenants', 'former'].includes(activeTab) && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tenant
                </Button>
              )}
              {showLeaseStats && showLeaseActions && (
                <Button onClick={() => setCreateLeaseDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Lease
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="tenants" className="space-y-4">
            <TenantListView />
          </TabsContent>

          <TabsContent value="former" className="space-y-4">
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              <p>Former tenant records will be displayed here.</p>
            </div>
          </TabsContent>

          <TabsContent value="screening" className="space-y-4">
            <TenantScreeningList />
          </TabsContent>

          <TabsContent value="leases" className="space-y-4">
            <LeasesTab
              leases={leases}
              isLoading={isLoadingLeases}
              onOpenOnboarding={(lease) => {
                setOnboardingLease(lease);
                setOnboardingSheetOpen(true);
              }}
            />
          </TabsContent>

          {showLeaseActions && (
            <TabsContent value="lease-actions">
              <LeaseActionList
                onActionUpdated={() => queryClient.invalidateQueries({ queryKey: ['leases'] })}
              />
            </TabsContent>
          )}

          {showLeaseActions && (
            <TabsContent value="applications" className="space-y-4">
              <ApplicationsTab
                applications={applications}
                isLoading={loadingApplications}
                onReviewApplication={handleReviewApplication}
              />
            </TabsContent>
          )}
        </Tabs>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Tenant</DialogTitle>
              <DialogDescription>
                Enter the details of the new tenant and their lease information.
              </DialogDescription>
            </DialogHeader>
            <AddTenantForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>

        <ApplicationReviewDialog
          application={selectedApplication}
          open={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          onStatusChange={handleApplicationStatusChange}
        />

        <CreateLeaseDialog
          open={createLeaseDialogOpen}
          onOpenChange={setCreateLeaseDialogOpen}
          approvedApplications={approvedApplications}
          onLeaseCreated={handleLeaseCreated}
        />

        <LeaseOnboardingCoordinationSheet
          lease={onboardingLease}
          open={onboardingSheetOpen}
          onOpenChange={(o) => {
            setOnboardingSheetOpen(o);
            if (!o) setOnboardingLease(null);
          }}
        />
      </PageContent>
    </PageLayout>
  );
};

export default TenantManagement;
