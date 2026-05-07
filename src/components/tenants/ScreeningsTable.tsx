import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Eye,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
} from 'lucide-react';
import { TenantScreening, useTenants } from '@/hooks/useTenants';
import { formatCurrency } from '@/lib/utils';

interface ScreeningsTableProps {
  onViewScreening?: (screening: TenantScreening) => void;
}

const ScreeningStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-accent text-accent-foreground', icon: Clock },
    passed: { label: 'Passed', color: 'bg-primary/15 text-primary', icon: CheckCircle },
    failed: { label: 'Failed', color: 'bg-destructive/10 text-destructive', icon: XCircle },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge className={config.color}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const CreditScoreBadge = ({ score }: { score?: number }) => {
  if (!score) return <span className="text-sm text-muted-foreground">N/A</span>;

  let color = 'bg-destructive/10 text-destructive';
  let label = 'Poor';

  if (score >= 750) {
    color = 'bg-primary/15 text-primary';
    label = 'Excellent';
  } else if (score >= 700) {
    color = 'bg-secondary text-secondary-foreground';
    label = 'Good';
  } else if (score >= 650) {
    color = 'bg-accent text-accent-foreground';
    label = 'Fair';
  }

  return (
    <div className="flex items-center space-x-2">
      <Badge className={color}>
        {score} - {label}
      </Badge>
    </div>
  );
};

export const ScreeningsTable = ({ onViewScreening }: ScreeningsTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { screenings, screeningsLoading } = useTenants();

  const filteredScreenings = screenings.filter((screening) => {
    const matchesSearch =
      screening.tenant?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      screening.tenant?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      screening.tenant?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      screening.employment_status?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || screening.background_check_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (screeningsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Background Screenings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-60" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Background Screenings ({filteredScreenings.length})</span>
          </CardTitle>

          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search screenings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredScreenings.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Shield className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">No screenings found</p>
            <p className="text-sm">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No background screenings yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Credit Score</TableHead>
                  <TableHead>Employment</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScreenings.map((screening) => (
                  <TableRow key={screening.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {screening.tenant?.first_name?.[0]}
                            {screening.tenant?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {screening.tenant?.first_name} {screening.tenant?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {screening.tenant?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <CreditScoreBadge score={screening.credit_score} />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{screening.employment_status}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {screening.monthly_income ? (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{formatCurrency(screening.monthly_income)}/month</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not provided</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <ScreeningStatusBadge status={screening.background_check_status} />
                    </TableCell>

                    <TableCell>
                      <span className="text-sm">
                        {new Date(screening.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewScreening?.(screening)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
