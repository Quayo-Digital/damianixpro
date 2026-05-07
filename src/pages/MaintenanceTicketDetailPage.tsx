import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuthSession } from '@/contexts/auth';
import {
  getMaintenanceTicket,
  patchMaintenanceTicket,
  postTicketAttachment,
  postTicketComment,
  resolveMaintenanceTicket,
} from '@/services/maintenance/maintenanceTicketsApi';
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from '@/components/maintenance-tickets/TicketBadges';
import type { MaintenanceTicketBundle } from '@/types/maintenanceTickets';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

function listPathFromPathname(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  parts.pop();
  return `/${parts.join('/')}`;
}

const MaintenanceTicketDetailPage = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, hasPermission } = useAuthSession();
  const listPath = useMemo(() => listPathFromPathname(location.pathname), [location.pathname]);

  const [bundle, setBundle] = useState<MaintenanceTicketBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('');
  const [costEstimate, setCostEstimate] = useState('');
  const [actualCost, setActualCost] = useState('');

  const load = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const b = await getMaintenanceTicket(ticketId);
      setBundle(b);
      setCostEstimate(String(b.ticket.cost_estimate ?? ''));
      setActualCost(b.ticket.actual_cost != null ? String(b.ticket.actual_cost) : '');
    } catch (e) {
      toast({
        title: 'Could not load ticket',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
      navigate(listPath);
    } finally {
      setLoading(false);
    }
  }, [ticketId, toast, navigate, listPath]);

  useEffect(() => {
    void load();
  }, [load]);

  const t = bundle?.ticket;
  const canWrite = hasPermission('maintenance.write');
  const showFmActions =
    canWrite &&
    (userRole === 'facility_manager' || userRole === 'vendor') &&
    !!t?.assigned_to &&
    t.assigned_to === user?.id;

  const saveCosts = async () => {
    if (!ticketId || !t) return;
    try {
      const ce = costEstimate === '' ? undefined : Number(costEstimate);
      const ac = actualCost === '' ? null : Number(actualCost);
      if (ce !== undefined && (!Number.isFinite(ce) || ce < 0)) throw new Error('Invalid estimate');
      if (ac !== null && ac !== undefined && (!Number.isFinite(ac) || ac < 0))
        throw new Error('Invalid actual');
      const b = await patchMaintenanceTicket(ticketId, {
        cost_estimate: ce,
        actual_cost: ac,
      });
      setBundle(b);
      toast({ title: 'Costs updated' });
    } catch (e) {
      toast({
        title: 'Update failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const setStatus = async (status: string) => {
    if (!ticketId) return;
    try {
      const b = await patchMaintenanceTicket(ticketId, { status });
      setBundle(b);
      toast({ title: 'Status updated' });
    } catch (e) {
      toast({
        title: 'Failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const submitComment = async () => {
    if (!ticketId || !comment.trim()) return;
    try {
      const b = await postTicketComment(ticketId, comment.trim());
      setBundle(b);
      setComment('');
      toast({ title: 'Comment added' });
    } catch (e) {
      toast({
        title: 'Failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const submitAttachment = async () => {
    if (!ticketId || !fileUrl.trim()) return;
    try {
      const b = await postTicketAttachment(ticketId, {
        file_url: fileUrl.trim(),
        file_type: fileType.trim() || null,
      });
      setBundle(b);
      setFileUrl('');
      setFileType('');
      toast({ title: 'Attachment recorded' });
    } catch (e) {
      toast({
        title: 'Failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const doResolve = async () => {
    if (!ticketId) return;
    try {
      const ac = actualCost === '' ? undefined : Number(actualCost);
      const b = await resolveMaintenanceTicket(ticketId, {
        actual_cost: ac !== undefined && Number.isFinite(ac) ? ac : undefined,
      });
      setBundle(b);
      toast({ title: 'Ticket resolved' });
    } catch (e) {
      toast({
        title: 'Resolve failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  if (loading || !bundle || !t) {
    return (
      <PageLayout>
        <PageContent title="Ticket" description="Loading…" showBreadcrumbs={false}>
          <TableSkeleton rows={4} cols={3} />
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageContent
        title={t.ticket_number}
        description={t.title}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={listPath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to list
            </Link>
          </Button>
        }
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>{t.description || 'No description provided.'}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <TicketPriorityBadge priority={t.priority} />
                <TicketStatusBadge status={t.status} isOverdue={t.is_overdue} />
                {t.is_overdue && t.status !== 'resolved' && t.status !== 'cancelled' && (
                  <Badge variant="destructive">SLA overdue</Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SLA</CardTitle>
                <CardDescription>Deadline computed from priority at creation.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <div>Deadline: {new Date(t.sla_deadline).toLocaleString('en-NG')}</div>
                {t.resolved_at && (
                  <div className="mt-1">
                    Resolved: {new Date(t.resolved_at).toLocaleString('en-NG')}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {bundle.comments.map((c) => (
                    <div key={c.id} className="rounded-md border p-3 text-sm">
                      <div className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleString('en-NG')}
                      </div>
                      <div className="mt-1 whitespace-pre-wrap">{c.comment}</div>
                    </div>
                  ))}
                </div>
                {canWrite && (
                  <>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />
                    <Button type="button" onClick={() => void submitComment()}>
                      Add comment
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
                <CardDescription>
                  Link to files in Supabase Storage or external URLs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bundle.attachments.map((a) => (
                  <div key={a.id} className="text-sm">
                    <a
                      href={a.file_url}
                      className="text-primary underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {a.file_type || 'File'}
                    </a>
                  </div>
                ))}
                {canWrite && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="File URL"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                    />
                    <Input
                      placeholder="MIME type (optional)"
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value)}
                    />
                    <Button
                      type="button"
                      className="sm:col-span-2"
                      onClick={() => void submitAttachment()}
                    >
                      Add attachment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {bundle.history.map((h) => (
                  <div key={h.id} className="border-l-2 pl-3">
                    <div className="font-medium">{h.action}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleString('en-NG')}
                    </div>
                    {Object.keys(h.metadata || {}).length > 0 && (
                      <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted p-2 text-xs">
                        {JSON.stringify(h.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Costs (₦)</CardTitle>
                <CardDescription>
                  Owners and admins can update estimates and actuals.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Estimate</Label>
                  <Input
                    value={costEstimate}
                    onChange={(e) => setCostEstimate(e.target.value)}
                    disabled={!canWrite || userRole === 'tenant'}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Actual</Label>
                  <Input
                    value={actualCost}
                    onChange={(e) => setActualCost(e.target.value)}
                    disabled={!canWrite || userRole === 'tenant'}
                  />
                </div>
                {canWrite && userRole !== 'tenant' && (
                  <Button type="button" variant="secondary" onClick={() => void saveCosts()}>
                    Save costs
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {showFmActions && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void setStatus('in_progress')}
                    >
                      In progress
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void setStatus('pending')}>
                      Pending
                    </Button>
                  </div>
                )}
                {canWrite && userRole !== 'tenant' && (
                  <Button className="w-full" onClick={() => void doResolve()}>
                    Mark resolved
                  </Button>
                )}
                {userRole === 'tenant' && (
                  <p className="text-xs text-muted-foreground">
                    Tenants track progress here; staff update status and costs.
                  </p>
                )}
                {hasPermission('maintenance.assign') && userRole !== 'tenant' && (
                  <p className="text-xs text-muted-foreground">
                    Use the admin list “Assign” flow or PATCH with <code>assigned_to</code>.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
};

export default MaintenanceTicketDetailPage;
