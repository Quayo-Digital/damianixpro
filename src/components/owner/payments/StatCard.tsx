import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  Icon: LucideIcon;
}

export const StatCard = ({ title, value, Icon }: StatCardProps) => {
  return (
    <Card className="rounded-2xl border-border bg-card/95 text-card-foreground shadow-md backdrop-blur-md dark:border-border dark:bg-card dark:shadow-[0_14px_34px_rgba(0,0,0,0.35)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center">
          <Icon className="mr-2 h-5 w-5 text-primary" />
          <span className="premium-title text-2xl">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
};
