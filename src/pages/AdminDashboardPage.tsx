import { Suspense, lazy, useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { FallbackBlock } from '@/components/admin/dashboard/FallbackBlock';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/auth';
import { AdminOnboardingTour } from '@/components/admin/dashboard/AdminOnboardingTour';
import { DamianixProAssistantChat } from '@/components/assistant/DamianixProAssistantChat';
import { RoleDashboardInsights } from '@/components/dashboard/role-dashboard/RoleDashboardInsights';
import { useAdminRoleDashboardExtras } from '@/hooks/useAdminRoleDashboardExtras';
import { Building2, ClipboardList, Percent, Wallet } from 'lucide-react';

// Use React.lazy for subcomponents
const StatGrid = lazy(() =>
  import('@/components/admin/dashboard/StatGrid').then((m) => ({ default: m.StatGrid }))
);
const UserDistributionCard = lazy(() =>
  import('@/components/admin/dashboard/UserDistributionCard').then((m) => ({
    default: m.UserDistributionCard,
  }))
);
const PlatformRevenueCard = lazy(() =>
  import('@/components/admin/dashboard/PlatformRevenueCard').then((m) => ({
    default: m.PlatformRevenueCard,
  }))
);
const UserManagementCard = lazy(() =>
  import('@/components/admin/dashboard/UserManagementCard').then((m) => ({
    default: m.UserManagementCard,
  }))
);
const SupportTicketsCard = lazy(() =>
  import('@/components/admin/dashboard/SupportTicketsCard').then((m) => ({
    default: m.SupportTicketsCard,
  }))
);
const AdminMonitoringPanel = lazy(() =>
  import('@/components/admin/dashboard/AdminMonitoringPanel').then((m) => ({
    default: m.AdminMonitoringPanel,
  }))
);
const TestingHubCard = lazy(() =>
  import('@/components/admin/dashboard/TestingHubCard').then((m) => ({ default: m.default }))
);

const AdminDashboardPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthSession();
  const [runTour, setRunTour] = useState(false);

  const {
    isLoading,
    totalUsers,
    totalProperties,
    totalRevenue,
    supportTickets,
    userDistribution,
    platformRevenue,
    userTrend,
    propertiesTrend,
    revenueTrend,
    ticketsTrend,
    openTicketsByCategory,
    pendingApplicationsCount,
    pendingScreeningsCount,
  } = useAdminDashboardData();

  const {
    loading: pulseLoading,
    occupancyPct,
    outstandingRentNgn,
    activeTenancies,
    activities: pulseActivities,
  } = useAdminRoleDashboardExtras();

  const formatNgn = (n: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  useEffect(() => {
    const invalidateDashboard = () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboardData'] });
    };

    const usersChannel = supabase
      .channel('admin-dashboard-users-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        invalidateDashboard
      )
      .subscribe();

    const propertiesChannel = supabase
      .channel('admin-dashboard-properties-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
        invalidateDashboard
      )
      .subscribe();

    // Listening to rent_payments as a proxy for financial activity affecting revenue.
    const paymentsChannel = supabase
      .channel('admin-dashboard-payments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rent_payments' },
        invalidateDashboard
      )
      .subscribe();

    const ticketsChannel = supabase
      .channel('admin-dashboard-tickets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_requests' },
        invalidateDashboard
      )
      .subscribe();

    const applicationsChannel = supabase
      .channel('admin-dashboard-applications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rental_applications' },
        invalidateDashboard
      )
      .subscribe();

    const screeningsChannel = supabase
      .channel('admin-dashboard-screenings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tenant_screenings' },
        invalidateDashboard
      )
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(propertiesChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(applicationsChannel);
      supabase.removeChannel(screeningsChannel);
    };
  }, [queryClient]);

  useEffect(() => {
    if (user) {
      const checkOnboardingStatus = async () => {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding_tour_completed')
            .eq('id', user.id)
            .single();

          if (error) throw error;

          if (profile && !profile.onboarding_tour_completed) {
            // Delay to ensure components are mounted for the tour
            setTimeout(() => setRunTour(true), 1500);
          }
        } catch (error) {
          console.error('Error checking onboarding tour status:', error);
        }
      };
      checkOnboardingStatus();
    }
  }, [user]);

  const handleTourEnd = async () => {
    setRunTour(false);
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_tour_completed: true })
          .eq('id', user.id);
        if (error) throw error;
      } catch (error) {
        console.error('Error updating onboarding tour status:', error);
      }
    }
  };

  return (
    <PageLayout>
      {user && <AdminOnboardingTour run={runTour} onTourEnd={handleTourEnd} />}
      <PageContent title="Admin Dashboard" description="Platform management and analytics">
        <div className="space-y-5 sm:space-y-6">
          <RoleDashboardInsights
            sectionTitle="Operations pulse"
            stats={[
              {
                title: 'Occupancy (units)',
                value: pulseLoading ? '…' : occupancyPct != null ? `${occupancyPct}%` : '—',
                icon: <Percent className="h-4 w-4" />,
                description: 'Occupied units ÷ total units',
              },
              {
                title: 'Outstanding rent',
                value: pulseLoading ? '…' : formatNgn(outstandingRentNgn),
                icon: <Wallet className="h-4 w-4" />,
                description: 'Non-successful rent ledger balance',
              },
              {
                title: 'Review queue',
                value: String((pendingApplicationsCount || 0) + (pendingScreeningsCount || 0)),
                icon: <ClipboardList className="h-4 w-4" />,
                description: 'Pending applications + screenings',
              },
              {
                title: 'Active tenancies',
                value: pulseLoading ? '…' : String(activeTenancies),
                icon: <Building2 className="h-4 w-4" />,
                description: 'Active property–tenant links',
              },
            ]}
            quickActions={[
              { label: 'User management', to: '/admin/users' },
              { label: 'Roles & access', to: '/admin/roles' },
              { label: 'Service tickets', to: '/admin/maintenance-tickets' },
              { label: 'Support queue', to: '/admin/support' },
            ]}
            activities={pulseActivities}
            activityTitle="Recent platform activity"
            activityEmptyMessage="No recent payments or maintenance requests."
            quickActionsTitle="Quick actions"
          />
          <div id="tour-step-1">
            <Suspense fallback={<FallbackBlock text="Loading stats..." />}>
              <StatGrid
                isLoading={isLoading}
                totalUsers={totalUsers}
                totalProperties={totalProperties}
                totalRevenue={totalRevenue}
                supportTickets={supportTickets}
                userTrend={userTrend}
                propertiesTrend={propertiesTrend}
                revenueTrend={revenueTrend}
                ticketsTrend={ticketsTrend}
              />
            </Suspense>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div id="tour-step-2" className="lg:col-span-2">
              <Suspense fallback={<FallbackBlock text="Loading Distribution Chart..." />}>
                <UserDistributionCard data={userDistribution} />
              </Suspense>
            </div>
            <div id="tour-step-3" className="lg:col-span-2">
              <Suspense fallback={<FallbackBlock text="Loading Revenue Chart..." />}>
                <PlatformRevenueCard data={platformRevenue} />
              </Suspense>
            </div>
            <div id="tour-step-4" className="lg:col-span-2">
              <Suspense fallback={<FallbackBlock text="Loading User Management..." />}>
                <UserManagementCard
                  pendingApplicationsCount={pendingApplicationsCount}
                  pendingScreeningsCount={pendingScreeningsCount}
                />
              </Suspense>
            </div>
            <div id="tour-step-5" className="lg:col-span-2">
              <Suspense fallback={<FallbackBlock text="Loading Support Tickets..." />}>
                <SupportTicketsCard openTicketsByCategory={openTicketsByCategory} />
              </Suspense>
            </div>
          </div>

          <DamianixProAssistantChat />

          {/* Testing Hub - Centralized Testing Access */}
          <div id="tour-step-6">
            <Suspense fallback={<FallbackBlock text="Loading Testing Hub..." />}>
              <TestingHubCard />
            </Suspense>
          </div>

          {/* Platform Monitoring & Security Center */}
          <div id="tour-step-7">
            <Suspense fallback={<FallbackBlock text="Loading Platform Monitoring..." />}>
              <AdminMonitoringPanel />
            </Suspense>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default AdminDashboardPage;
