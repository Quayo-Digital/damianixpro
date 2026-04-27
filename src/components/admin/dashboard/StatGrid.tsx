import { StatCard } from '@/components/dashboard/StatCard';
import { Users, Home, Wallet, PieChart } from 'lucide-react';
import { Trend } from '@/hooks/useAdminDashboardData';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface StatGridProps {
  isLoading: boolean;
  totalUsers: number;
  totalProperties: number;
  totalRevenue: number;
  supportTickets: number;
  userTrend: Trend;
  propertiesTrend: Trend;
  revenueTrend: Trend;
  ticketsTrend: Trend;
}

export function StatGrid({
  isLoading,
  totalUsers,
  totalProperties,
  totalRevenue,
  supportTickets,
  userTrend,
  propertiesTrend,
  revenueTrend,
  ticketsTrend,
}: StatGridProps) {
  const isMobile = useIsMobile();

  const statCards = [
    {
      title: 'Total Users',
      value: isLoading ? '...' : totalUsers.toString(),
      icon: <Users className="h-4 w-4" />,
      trend: userTrend,
      description: 'vs. last 30 days',
    },
    {
      title: 'Listed Properties',
      value: isLoading ? '...' : totalProperties.toString(),
      icon: <Home className="h-4 w-4" />,
      trend: propertiesTrend,
      description: 'vs. last 30 days',
    },
    {
      title: 'Platform Revenue',
      value: isLoading ? '...' : `₦${(totalRevenue / 1000000).toFixed(2)}M`,
      icon: <Wallet className="h-4 w-4" />,
      trend: revenueTrend,
      description: 'vs. last 30 days',
    },
    {
      title: 'Support Tickets',
      value: isLoading ? '...' : supportTickets.toString(),
      icon: <PieChart className="h-4 w-4" />,
      trend: ticketsTrend,
      description: 'vs. last 30 days',
    },
  ];

  if (isMobile) {
    return (
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
    );
  }

  return (
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
  );
}
