import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  assignMaintenanceTicket,
  listMaintenanceTickets,
} from '@/services/maintenance/maintenanceTicketsApi';
import { CreateTicketForTenantForm } from '@/components/maintenance-tickets/CreateTicketForTenantForm';
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from '@/components/maintenance-tickets/TicketBadges';
import type { MaintenanceTicket } from '@/types/maintenanceTickets';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

const AdminMaintenanceTicketsPage = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTicketId, setAssignTicketId] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q: Record<string, string> = {};
      if (statusFilter !== 'all') q.status = statusFilter;
      const { tickets: rows } = await listMaintenanceTickets(q);
      let list = rows;
      if (priorityFilter !== 'all') list = list.filter((t) => t.priority === priorityFilter);
      setTickets(list);
    } catch (e) {
      toast({
        title: 'Could not load tickets',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, statusFilter, priorityFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitAssign = async () => {
    if (!assignTicketId || !assigneeId.trim()) return;
    try {
      await assignMaintenanceTicket(assignTicketId, assigneeId.trim());
      toast({ title: 'Ticket assigned' });
      setAssignOpen(false);
      setAssigneeId('');
      setAssignTicketId(null);
      await load();
    } catch (e) {
      toast({
        title: 'Assign failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const activeAssignTicket = assignTicketId ? tickets.find((x) => x.id === assignTicketId) : null;

  return (
    <PageLayout>
      <PageContent
        title="All maintenance tickets"
        description="Filter by status, assign facility staff or vendors, and monitor SLA breaches."
      >
        <div className="mb-6">
          <CreateTicketForTenantForm onCreated={() => void load()} />
        </div>
        <div className="mb-4 flex flex-wrap gap-3">
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

        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign ticket {activeAssignTicket?.ticket_number ?? ''}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label>Assignee user id (UUID)</Label>
              <Input value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void submitAssign()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
            <CardDescription>
              Overdue rows are highlighted for Nigerian SLA operations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={8} cols={6} />
            ) : tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tickets.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((t) => (
                    <TableRow key={t.id} className={t.is_overdue ? 'bg-destructive/5' : undefined}>
                      <TableCell>
                        <div className="font-medium">{t.ticket_number}</div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">{t.title}</div>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">
                        {t.property_id}
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
                      <TableCell className="space-x-2 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/maintenance-tickets/${t.id}`}>View</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAssignTicketId(t.id);
                            setAssigneeId('');
                            setAssignOpen(true);
                          }}
                        >
                          Assign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
};

export default AdminMaintenanceTicketsPage;
