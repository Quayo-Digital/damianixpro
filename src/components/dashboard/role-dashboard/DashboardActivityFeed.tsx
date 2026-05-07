import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RoleDashboardActivity } from './types';

type Props = {
  title?: string;
  items: RoleDashboardActivity[];
  emptyMessage?: string;
  className?: string;
};

export function DashboardActivityFeed({
  title = 'Activity',
  items,
  emptyMessage = 'No recent activity yet.',
  className,
}: Props) {
  return (
    <Card className={cn('rounded-2xl border-border shadow-md', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {items.length === 0 ? (
          <p className="px-6 pb-4 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="space-y-0 divide-y divide-border">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 px-6 py-3 transition-colors hover:bg-muted/40"
              >
                {item.icon ? (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm">
                    {item.icon}
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{item.title}</p>
                  {item.meta ? <p className="text-sm text-muted-foreground">{item.meta}</p> : null}
                  {item.time ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
