import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon, description, trend, className }: StatCardProps) {
  return (
    <Card
      className={cn(
        'rounded-2xl border-border bg-card/95 text-card-foreground shadow-md backdrop-blur-md',
        'dark:border-border dark:bg-card dark:shadow-[0_14px_34px_rgba(0,0,0,0.35)]',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="premium-title text-2xl">{value}</div>
        {trend && (
          <p className="mt-1 flex items-center text-xs text-muted-foreground">
            <span
              className={cn(
                'mr-1',
                trend.isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            {description}
          </p>
        )}
        {!trend && description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
