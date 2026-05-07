import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/auth';
import {
  createMaintenanceTicket,
  listMaintenanceTickets,
} from '@/services/maintenance/maintenanceTicketsApi';
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from '@/components/maintenance-tickets/TicketBadges';
import type { MaintenanceTicket } from '@/types/maintenanceTickets';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

type LeaseRow = {
  property_id: string;
  properties: { id: string; name: string | null } | null;
};

const TenantMaintenanceTicketsPage = () => {
  const { user } = useAuthSession();
  const { toast } = useToast();
  const [leases, setLeases] = useState<LeaseRow[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [propertyId, setPropertyId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  const loadTickets = useCallback(async () => {
    try {
      const { tickets: rows } = await listMaintenanceTickets();
      setTickets(rows);
    } catch (e) {
      toast({
        title: 'Could not load tickets',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) return;
      setLoading(true);
      const { data: ten, error: tenErr } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (tenErr || !ten?.id) {
        if (tenErr) {
          toast({ title: 'Tenant profile', description: tenErr.message, variant: 'destructive' });
        }
        setLeases([]);
        await loadTickets();
        setLoading(false);
        return;
      }
      const { data: pts, error: ptErr } = await supabase
        .from('property_tenants')
        .select('property_id, properties(id, name)')
        .eq('tenant_id', ten.id)
        .eq('status', 'active');
      if (cancelled) return;
      if (ptErr) {
        toast({
          title: 'Could not load your leases',
          description: ptErr.message,
          variant: 'destructive',
        });
        setLeases([]);
      } else {
        setLeases((pts || []) as unknown as LeaseRow[]);
      }
      await loadTickets();
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, toast, loadTickets]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !title.trim()) {
      toast({ title: 'Property and title are required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await createMaintenanceTicket({
        property_id: propertyId,
        title: title.trim(),
        description: description.trim(),
        priority,
      });
      toast({ title: 'Issue reported', description: 'Your ticket was created.' });
      setTitle('');
      setDescription('');
      setPriority('medium');
      await loadTickets();
    } catch (err) {
      toast({
        title: 'Failed to create ticket',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <PageContent
        title="Report an issue"
        description="Create enterprise maintenance tickets tied to your active lease."
      >
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>New ticket</CardTitle>
              <CardDescription>
                SLA is set automatically from priority (low 72h → urgent 8h).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Property</Label>
                  <Select
                    value={propertyId}
                    onValueChange={setPropertyId}
                    disabled={leases.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={leases.length ? 'Select property' : 'No active lease found'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {leases.map((row) => (
                        <SelectItem key={row.property_id} value={row.property_id}>
                          {row.properties?.name || row.property_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mt-title">Title</Label>
                  <Input
                    id="mt-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mt-desc">Description</Label>
                  <Textarea
                    id="mt-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={submitting || leases.length === 0}>
                  {submitting ? 'Submitting…' : 'Submit ticket'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Your tickets</CardTitle>
                <CardDescription>Status and SLA at a glance.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadTickets()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={6} cols={4} />
              ) : tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tickets yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((t) => (
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
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/tenant/maintenance-tickets/${t.id}`}>View</Link>
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

export default TenantMaintenanceTicketsPage;
