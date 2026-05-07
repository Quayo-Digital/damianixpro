import { Navigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { useAuthSession } from '@/contexts/auth';
import { RoleDashboardInsights } from '@/components/dashboard/role-dashboard/RoleDashboardInsights';
import type {
  RoleDashboardActivity,
  RoleDashboardQuickAction,
  RoleDashboardStat,
} from '@/components/dashboard/role-dashboard/types';
import { useFacilityManagerDashboardTickets } from '@/hooks/useFacilityManagerDashboardTickets';
import { AlertTriangle, CheckCircle2, ClipboardList, Wrench } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

const FacilityManagerDashboardPage = () => {
  const { user, userRole } = useAuthSession();
  const { tickets, loading, error, refresh, openCount, resolvedWeek } =
    useFacilityManagerDashboardTickets();

  if (!user || userRole !== 'facility_manager') {
    return <Navigate to="/unauthorized" replace />;
  }

  const overdue = tickets.filter((t) => t.is_overdue).length;

  const stats: RoleDashboardStat[] = [
    {
      title: 'Assigned tickets',
      value: loading ? '…' : String(tickets.length),
      icon: <ClipboardList className="h-4 w-4" />,
      description: 'Tickets assigned to you',
    },
    {
      title: 'Open / in progress',
      value: loading ? '…' : String(openCount),
      icon: <Wrench className="h-4 w-4" />,
      description: 'Needs attention',
    },
    {
      title: 'Resolved (7 days)',
      value: loading ? '…' : String(resolvedWeek),
      icon: <CheckCircle2 className="h-4 w-4" />,
      description: 'Recently closed',
    },
    {
      title: 'Overdue (SLA)',
      value: loading ? '…' : String(overdue),
      icon: <AlertTriangle className="h-4 w-4" />,
      description: 'Past SLA deadline',
    },
  ];

  const quickActions: RoleDashboardQuickAction[] = [
    { label: 'My assigned tickets', to: '/facility-manager/tickets', icon: ClipboardList },
    { label: 'Maintenance hub', to: '/maintenance', icon: Wrench },
  ];

  const activities: RoleDashboardActivity[] = tickets.slice(0, 10).map((t) => ({
    id: t.id,
    title: t.title,
    meta: [t.ticket_number, t.status, t.priority].filter(Boolean).join(' · '),
    time: t.created_at
      ? formatDistanceToNow(new Date(t.created_at), { addSuffix: true })
      : undefined,
    icon: t.is_overdue ? '⚠️' : '🔧',
  }));

  return (
    <PageLayout>
      <PageContent
        title="Facility manager dashboard"
        description="Work queue for tickets assigned to you. SLA highlights help you prioritise the field."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
            Refresh
          </Button>
        }
        showBreadcrumbs={false}
      >
        {error ? (
          <p className="text-sm text-muted-foreground">
            Ticket list unavailable ({error}). Ensure the API server is running if you use
            enterprise tickets.
          </p>
        ) : null}
        <RoleDashboardInsights
          sectionTitle="Operations pulse"
          stats={stats}
          quickActions={quickActions}
          activities={activities}
          activityTitle="Latest tickets"
          activityEmptyMessage="No tickets assigned yet."
        />
      </PageContent>
    </PageLayout>
  );
};

export default FacilityManagerDashboardPage;
