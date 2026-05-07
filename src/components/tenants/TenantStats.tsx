import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, Clock, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTenantStats } from '@/hooks/useTenants';

export const TenantStats = () => {
  const { data: stats, isLoading, error } = useTenantStats();

  if (isLoading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Failed to load tenant statistics</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: 'Total Tenants',
      value: stats?.totalTenants || 0,
      description: `${stats?.activeTenants || 0} active`,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/15',
    },
    {
      title: 'Applications',
      value: stats?.totalApplications || 0,
      description: `${stats?.pendingApplications || 0} pending review`,
      icon: FileText,
      color: 'text-accent-foreground',
      bgColor: 'bg-accent',
    },
    {
      title: 'Approved',
      value: stats?.approvedApplications || 0,
      description: 'Applications approved',
      icon: CheckCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/15',
    },
    {
      title: 'Screenings',
      value: stats?.totalScreenings || 0,
      description: 'Background checks',
      icon: UserCheck,
      color: 'text-secondary-foreground',
      bgColor: 'bg-secondary',
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export const TenantStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    active: { label: 'Active', variant: 'default' as const, color: 'bg-primary/15 text-primary' },
    inactive: {
      label: 'Inactive',
      variant: 'secondary' as const,
      color: 'bg-muted text-muted-foreground',
    },
    pending: {
      label: 'Pending',
      variant: 'outline' as const,
      color: 'bg-accent text-accent-foreground',
    },
    terminated: {
      label: 'Terminated',
      variant: 'destructive' as const,
      color: 'bg-destructive/10 text-destructive',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;

  return (
    <Badge variant={config.variant} className={config.color}>
      {config.label}
    </Badge>
  );
};

export const ApplicationStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-accent text-accent-foreground' },
    approved: { label: 'Approved', color: 'bg-primary/15 text-primary' },
    rejected: { label: 'Rejected', color: 'bg-destructive/10 text-destructive' },
    withdrawn: { label: 'Withdrawn', color: 'bg-muted text-muted-foreground' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return <Badge className={config.color}>{config.label}</Badge>;
};
