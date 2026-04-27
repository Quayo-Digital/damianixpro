import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { StatCard } from '@/components/dashboard/StatCard';
import { PaymentChart } from '@/components/dashboard/PaymentChart';
import { MaintenanceStatus } from '@/components/dashboard/MaintenanceStatus';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { PropertyList } from '@/components/dashboard/PropertyList';
import { Home, Users, Wallet, Settings } from 'lucide-react';
import { useAuthSession } from '@/contexts/auth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { PageLoader } from '@/components/ui/PageLoader';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const Dashboard = () => {
  const { userRole, isLoading, isAdmin } = useAuthSession();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isLoading || !userRole) return;

    // Wait a bit to ensure role is fully loaded
    const redirectTimer = setTimeout(() => {
      if (isAdmin()) {
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'tenant') {
        navigate('/tenant/dashboard', { replace: true });
      } else if (userRole === 'owner') {
        navigate('/owner/dashboard', { replace: true });
      } else if (userRole === 'agent' || userRole === 'manager') {
        navigate('/agent/dashboard', { replace: true });
      } else if (userRole === 'vendor') {
        navigate('/vendor/dashboard', { replace: true });
      }
    }, 100);

    return () => clearTimeout(redirectTimer);
  }, [userRole, isLoading, isAdmin, navigate]);

  // While checking the role and redirecting, show a loader.
  if (
    isLoading ||
    !userRole ||
    isAdmin() ||
    userRole === 'tenant' ||
    userRole === 'owner' ||
    userRole === 'agent' ||
    userRole === 'manager' ||
    userRole === 'vendor'
  ) {
    return <PageLoader />;
  }

  const statCards = [
    {
      title: 'Properties',
      value: '3',
      icon: <Home className="h-4 w-4" />,
      description: 'Total managed properties',
    },
    {
      title: 'Tenants',
      value: '12',
      icon: <Users className="h-4 w-4" />,
      trend: { value: 2, isPositive: true },
      description: 'Active tenants',
    },
    {
      title: 'Revenue',
      value: '₦1.2M',
      icon: <Wallet className="h-4 w-4" />,
      trend: { value: 8, isPositive: true },
      description: 'Annual rental income (Nigeria standard)',
    },
    {
      title: 'Maintenance',
      value: '5',
      icon: <Settings className="h-4 w-4" />,
      trend: { value: 2, isPositive: false },
      description: 'Pending requests',
    },
  ];

  // For other roles (agent, vendor, etc.), render a generic dashboard as a fallback.
  return (
    <PageLayout>
      <PageContent title="Dashboard" description="Welcome to your property management dashboard">
        <div className="space-y-6">
          {isMobile ? (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max space-x-4 pb-4">
                {statCards.map((card, index) => (
                  <div key={index} className="w-[280px]">
                    <StatCard
                      title={card.title}
                      value={card.value}
                      icon={card.icon}
                      trend={card.trend}
                      description={card.description}
                    />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((card, index) => (
                <StatCard
                  key={index}
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  trend={card.trend}
                  description={card.description}
                />
              ))}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PaymentChart />
            </div>
            <MaintenanceStatus />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <PropertyList />
            </div>
            <RecentActivity />
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default Dashboard;
