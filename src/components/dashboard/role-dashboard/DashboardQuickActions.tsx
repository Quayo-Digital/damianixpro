import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoleDashboardQuickAction } from './types';

type Props = {
  title?: string;
  actions: RoleDashboardQuickAction[];
  className?: string;
};

export function DashboardQuickActions({ title = 'Quick actions', actions, className }: Props) {
  if (actions.length === 0) return null;

  return (
    <Card className={cn('rounded-2xl border-border shadow-md', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Button
              key={a.label}
              asChild
              variant={a.variant ?? 'outline'}
              className="h-auto justify-between gap-2 py-3 text-left font-medium"
            >
              <Link to={a.to}>
                <span className="flex min-w-0 items-center gap-2">
                  {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden /> : null}
                  <span className="truncate">{a.label}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
