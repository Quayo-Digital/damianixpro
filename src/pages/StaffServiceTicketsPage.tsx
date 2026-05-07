import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { listMaintenanceTickets } from '@/services/maintenance/maintenanceTicketsApi';
import { CreateTicketForTenantForm } from '@/components/maintenance-tickets/CreateTicketForTenantForm';
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from '@/components/maintenance-tickets/TicketBadges';
import type { MaintenanceTicket } from '@/types/maintenanceTickets';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

export type StaffTicketsListMode = 'portfolio' | 'assigned';

export interface StaffServiceTicketsPageProps {
  /** URL prefix for ticket detail links (no trailing slash). */
  basePath: string;
  listMode: StaffTicketsListMode;
  title: string;
  description?: string;
}

const StaffServiceTicketsPage = ({
  basePath,
  listMode,
  title,
  description = 'Track SLA-backed work orders for your portfolio or assignments.',
}: StaffServiceTicketsPageProps) => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { tickets: rows } = await listMaintenanceTickets();
      setTickets(rows);
    } catch (e) {
      toast({
        title: 'Could not load tickets',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <PageLayout>
      <PageContent title={title} description={description}>
        <div className="space-y-6">
          {listMode === 'portfolio' && (
            <CreateTicketForTenantForm
              onCreated={() => {
                void load();
              }}
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tickets</CardTitle>
              <CardDescription>
                {listMode === 'assigned'
                  ? 'Work orders assigned to you (facility or vendor).'
                  : 'Work orders on properties you manage.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={8} cols={5} />
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tickets match your filters.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => (
                      <TableRow
                        key={t.id}
                        className={t.is_overdue ? 'bg-destructive/5' : undefined}
                      >
                        <TableCell>
                          <div className="font-medium">{t.ticket_number}</div>
                          <div className="line-clamp-1 text-xs text-muted-foreground">
                            {t.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TicketPriorityBadge priority={t.priority} />
                        </TableCell>
                        <TableCell>
                          <TicketStatusBadge status={t.status} isOverdue={t.is_overdue} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(t.sla_deadline).toLocaleString('en-NG')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`${basePath}/${t.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default StaffServiceTicketsPage;
