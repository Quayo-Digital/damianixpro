import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getScreenings, processScreening } from '@/services/tenants/screening';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ArrowRight, Loader2 } from 'lucide-react';
import { TenantScreening } from './TenantScreening';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

export function TenantScreeningList() {
  const queryClient = useQueryClient();

  const {
    data: screenings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tenantScreenings'],
    queryFn: getScreenings,
  });

  const { mutate: runScreening, isPending: isProcessing } = useMutation({
    mutationFn: processScreening,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantScreenings'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardData'] });
    },
  });

  useEffect(() => {
    const screeningsChannel = supabase
      .channel('tenant-screenings-list-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenant_screenings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['tenantScreenings'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(screeningsChannel);
    };
  }, [queryClient]);

  const screeningStats = React.useMemo(() => {
    const stats = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      failed: 0,
      total: screenings?.length || 0,
    };
    if (!screenings) return stats;

    for (const screening of screenings) {
      switch (screening.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'in_progress':
          stats.in_progress++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'failed':
          stats.failed++;
          break;
        default:
          stats.pending++;
      }
    }
    return stats;
  }, [screenings]);

  if (isLoading) return <div className="p-4">Loading screenings...</div>;
  if (error)
    return <div className="p-4 text-red-500">Error loading screenings: {error.message}</div>;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant Screening Requests</CardTitle>
        <CardDescription>Manage and review all tenant screening processes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{screeningStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{screeningStats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{screeningStats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{screeningStats.failed}</div>
            </CardContent>
          </Card>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {screenings?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No screening requests have been made.
                </TableCell>
              </TableRow>
            ) : (
              screenings?.map((screening) => (
                <TableRow key={screening.id}>
                  <TableCell className="font-medium">
                    {screening.tenants
                      ? `${screening.tenants.first_name} ${screening.tenants.last_name}`
                      : 'Unknown Tenant'}
                  </TableCell>
                  <TableCell>{getStatusBadge(screening.status)}</TableCell>
                  <TableCell>{format(new Date(screening.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    {screening.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => runScreening(screening.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Start Screening
                      </Button>
                    )}
                    {(screening.status === 'completed' ||
                      screening.status === 'failed' ||
                      screening.status === 'in_progress') &&
                      screening.tenants && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              View Details <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[650px]">
                            <DialogHeader>
                              <DialogTitle>Screening Details</DialogTitle>
                            </DialogHeader>
                            <TenantScreening
                              tenantId={String(screening.tenants.id)}
                              tenantName={`${screening.tenants.first_name} ${screening.tenants.last_name}`}
                            />
                          </DialogContent>
                        </Dialog>
                      )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
