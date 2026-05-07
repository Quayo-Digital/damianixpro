import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardQuickActions } from './DashboardQuickActions';
import { DashboardActivityFeed } from './DashboardActivityFeed';
import { cn } from '@/lib/utils';
import type { RoleDashboardActivity, RoleDashboardQuickAction, RoleDashboardStat } from './types';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type Props = {
  /** Optional section heading above the stat row */
  sectionTitle?: string;
  stats: RoleDashboardStat[];
  quickActions: RoleDashboardQuickAction[];
  activities: RoleDashboardActivity[];
  activityTitle?: string;
  activityEmptyMessage?: string;
  quickActionsTitle?: string;
  className?: string;
};

export function RoleDashboardInsights({
  sectionTitle = 'At a glance',
  stats,
  quickActions,
  activities,
  activityTitle,
  activityEmptyMessage,
  quickActionsTitle,
  className,
}: Props) {
  const isMobile = useIsMobile();

  return (
    <section
      className={cn('space-y-4', className)}
      aria-labelledby="role-dashboard-insights-heading"
    >
      <h2 id="role-dashboard-insights-heading" className="text-lg font-semibold tracking-tight">
        {sectionTitle}
      </h2>

      {stats.length > 0 ? (
        isMobile ? (
          <ScrollArea className="w-full whitespace-nowrap pb-1">
            <div className="flex w-max gap-3 pr-2">
              {stats.map((s, i) => (
                <div key={`${s.title}-${i}`} className="w-[260px] shrink-0">
                  <StatCard
                    title={s.title}
                    value={s.value}
                    icon={s.icon}
                    description={s.description}
                    trend={s.trend}
                  />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s, i) => (
              <StatCard
                key={`${s.title}-${i}`}
                title={s.title}
                value={s.value}
                icon={s.icon}
                description={s.description}
                trend={s.trend}
              />
            ))}
          </div>
        )
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardQuickActions title={quickActionsTitle} actions={quickActions} />
        <DashboardActivityFeed
          title={activityTitle}
          items={activities}
          emptyMessage={activityEmptyMessage}
        />
      </div>
    </section>
  );
}
