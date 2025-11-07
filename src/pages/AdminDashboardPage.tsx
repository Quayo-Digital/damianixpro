import { Suspense, lazy, useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { FallbackBlock } from '@/components/admin/dashboard/FallbackBlock';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { AdminOnboardingTour } from '@/components/admin/dashboard/AdminOnboardingTour';

// Use React.lazy for subcomponents
const StatGrid = lazy(() => import('@/components/admin/dashboard/StatGrid').then(m => ({ default: m.StatGrid })));
const UserDistributionCard = lazy(() => import('@/components/admin/dashboard/UserDistributionCard').then(m => ({ default: m.UserDistributionCard })));
const PlatformRevenueCard = lazy(() => import('@/components/admin/dashboard/PlatformRevenueCard').then(m => ({ default: m.PlatformRevenueCard })));
const UserManagementCard = lazy(() => import('@/components/admin/dashboard/UserManagementCard').then(m => ({ default: m.UserManagementCard })));
const SupportTicketsCard = lazy(() => import('@/components/admin/dashboard/SupportTicketsCard').then(m => ({ default: m.SupportTicketsCard })));
const AdminMonitoringPanel = lazy(() => import('@/components/admin/dashboard/AdminMonitoringPanel').then(m => ({ default: m.AdminMonitoringPanel })));
const TestingHubCard = lazy(() => import('@/components/admin/dashboard/TestingHubCard').then(m => ({ default: m.default })));

const AdminDashboardPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
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

  useEffect(() => {
    const invalidateDashboard = () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboardData'] });
    };

    const usersChannel = supabase.channel('admin-dashboard-users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, invalidateDashboard)
      .subscribe();

    const propertiesChannel = supabase.channel('admin-dashboard-properties-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, invalidateDashboard)
      .subscribe();
      
    // Listening to rent_payments as a proxy for financial activity affecting revenue.
    const paymentsChannel = supabase.channel('admin-dashboard-payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rent_payments' }, invalidateDashboard)
      .subscribe();

    const ticketsChannel = supabase.channel('admin-dashboard-tickets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' }, invalidateDashboard)
      .subscribe();

    const applicationsChannel = supabase.channel('admin-dashboard-applications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rental_applications' }, invalidateDashboard)
      .subscribe();
      
    const screeningsChannel = supabase.channel('admin-dashboard-screenings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenant_screenings' }, invalidateDashboard)
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
          console.error("Error checking onboarding tour status:", error);
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
        console.error("Error updating onboarding tour status:", error);
      }
    }
  };


  return (
    <PageLayout>
      {user && <AdminOnboardingTour run={runTour} onTourEnd={handleTourEnd} />}
      <PageContent 
        title="Admin Dashboard" 
        description="Platform management and analytics"
      >
        <div className="space-y-6">
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
                <UserManagementCard pendingApplicationsCount={pendingApplicationsCount} pendingScreeningsCount={pendingScreeningsCount} />
              </Suspense>
            </div>
            <div id="tour-step-5" className="lg:col-span-2">
              <Suspense fallback={<FallbackBlock text="Loading Support Tickets..." />}>
                <SupportTicketsCard openTicketsByCategory={openTicketsByCategory} />
              </Suspense>
            </div>
          </div>
          
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
