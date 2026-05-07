import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthSession } from '@/contexts/auth';
import { useProperties } from '@/hooks/useProperties';
import { useToast } from '@/hooks/use-toast';
import {
  completeCrmReminder,
  createCrmDeal,
  createCrmInspection,
  createCrmLead,
  createCrmReminder,
  listCrmAgentOptions,
  listCrmDeals,
  listCrmLeads,
  listUpcomingReminders,
  patchCrmDeal,
} from '@/services/crm/crmPipelineApi';
import type { CrmDeal, CrmLead, CrmReminder, KanbanColumnId } from '@/types/crmPipeline';
import { CalendarClock, GripVertical, Plus, RefreshCw } from 'lucide-react';

const COLUMNS: { id: KanbanColumnId; label: string; hint: string }[] = [
  { id: 'lead', label: 'Lead', hint: 'New interest' },
  { id: 'inspection', label: 'Inspection', hint: 'Viewings scheduled' },
  { id: 'negotiation', label: 'Negotiation', hint: 'Offers & terms' },
  { id: 'won', label: 'Closed won', hint: 'Converted' },
  { id: 'lost', label: 'Closed lost', hint: 'Archive' },
];

function columnForDeal(deal: CrmDeal): KanbanColumnId {
  if (deal.stage === 'closed') {
    if (deal.outcome === 'won') return 'won';
    if (deal.outcome === 'lost') return 'lost';
    return 'lead';
  }
  if (deal.stage === 'lead' || deal.stage === 'inspection' || deal.stage === 'negotiation') {
    return deal.stage;
  }
  return 'lead';
}

function patchForColumn(columnId: KanbanColumnId): { stage: string; outcome?: string } {
  if (columnId === 'won') return { stage: 'closed', outcome: 'won' };
  if (columnId === 'lost') return { stage: 'closed', outcome: 'lost' };
  return { stage: columnId };
}

const CrmPipelinePage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuthSession();
  const { properties } = useProperties();
  const canWrite = hasPermission('crm.write');

  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [reminders, setReminders] = useState<CrmReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragDealId, setDragDealId] = useState<string | null>(null);

  const [leadOpen, setLeadOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const [inspOpen, setInspOpen] = useState(false);
  const [remOpen, setRemOpen] = useState(false);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);

  const [lfName, setLfName] = useState('');
  const [lEmail, setLEmail] = useState('');
  const [lPhone, setLPhone] = useState('');
  const [lSource, setLSource] = useState('');
  const [lNotes, setLNotes] = useState('');
  const [lPropertyId, setLPropertyId] = useState<string>('');

  const [dTitle, setDTitle] = useState('');
  const [dLeadId, setDLeadId] = useState<string>('');
  const [dPropertyId, setDPropertyId] = useState<string>('');
  const [dAgentId, setDAgentId] = useState('');

  const [inspStart, setInspStart] = useState('');
  const [inspNotes, setInspNotes] = useState('');

  const [remAt, setRemAt] = useState('');
  const [remBody, setRemBody] = useState('');
  const [agentOpts, setAgentOpts] = useState<{ id: string; label: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, l, r] = await Promise.all([
        listCrmDeals(),
        listCrmLeads(),
        listUpcomingReminders(14),
      ]);
      setDeals(d.deals);
      setLeads(l.leads);
      setReminders(r.reminders);
    } catch (e) {
      toast({
        title: 'Could not load CRM',
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

  useEffect(() => {
    if (!canWrite) return;
    void (async () => {
      try {
        const { agents } = await listCrmAgentOptions();
        setAgentOpts(agents);
      } catch {
        setAgentOpts([]);
      }
    })();
  }, [canWrite]);

  const byColumn = useMemo(() => {
    const map: Record<KanbanColumnId, CrmDeal[]> = {
      lead: [],
      inspection: [],
      negotiation: [],
      won: [],
      lost: [],
    };
    for (const deal of deals) {
      map[columnForDeal(deal)].push(deal);
    }
    return map;
  }, [deals]);

  const onDragStart = (e: React.DragEvent, dealId: string) => {
    setDragDealId(dealId);
    e.dataTransfer.setData('text/plain', dealId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDropColumn = async (e: React.DragEvent, columnId: KanbanColumnId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragDealId;
    setDragDealId(null);
    if (!id) return;
    try {
      const patch = patchForColumn(columnId);
      const { deal } = await patchCrmDeal(id, patch);
      setDeals((prev) => prev.map((x) => (x.id === deal.id ? deal : x)));
      toast({ title: 'Stage updated' });
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
      void load();
    }
  };

  const submitLead = async () => {
    try {
      await createCrmLead({
        full_name: lfName,
        email: lEmail || undefined,
        phone: lPhone || undefined,
        source: lSource || undefined,
        notes: lNotes || undefined,
        property_id: lPropertyId || null,
      });
      toast({ title: 'Lead captured' });
      setLeadOpen(false);
      setLfName('');
      setLEmail('');
      setLPhone('');
      setLSource('');
      setLNotes('');
      setLPropertyId('');
      void load();
    } catch (e) {
      toast({
        title: 'Failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const submitDeal = async () => {
    try {
      await createCrmDeal({
        title: dTitle.trim() || undefined,
        lead_id: dLeadId || undefined,
        property_id: dPropertyId || undefined,
        assigned_agent_id: dAgentId.trim() || undefined,
      });
      toast({ title: 'Deal created' });
      setDealOpen(false);
      setDTitle('');
      setDLeadId('');
      setDPropertyId('');
      setDAgentId('');
      void load();
    } catch (e) {
      toast({
        title: 'Failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const submitInspection = async () => {
    if (!activeDealId || !inspStart) return;
    try {
      await createCrmInspection(activeDealId, {
        scheduled_start: new Date(inspStart).toISOString(),
        notes: inspNotes || undefined,
      });
      toast({ title: 'Inspection scheduled' });
      setInspOpen(false);
      setInspStart('');
      setInspNotes('');
      setActiveDealId(null);
    } catch (e) {
      toast({
        title: 'Failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const submitReminder = async () => {
    if (!activeDealId || !remAt) return;
    try {
      await createCrmReminder(activeDealId, {
        remind_at: new Date(remAt).toISOString(),
        body: remBody || undefined,
      });
      toast({ title: 'Reminder set' });
      setRemOpen(false);
      setRemAt('');
      setRemBody('');
      setActiveDealId(null);
      void load();
    } catch (e) {
      toast({
        title: 'Failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const markReminderDone = async (id: string) => {
    try {
      await completeCrmReminder(id);
      void load();
    } catch (e) {
      toast({
        title: 'Failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <PageLayout>
      <PageContent
        title="Property CRM"
        description="Leads, pipeline, inspections, and follow-ups — a compact HubSpot-style workspace for Nigerian real estate teams."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            {canWrite && (
              <>
                <Button type="button" size="sm" onClick={() => setLeadOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New lead
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setDealOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New deal
                </Button>
              </>
            )}
          </div>
        }
      >
        <div className="space-y-5 sm:space-y-6">
          {reminders.length > 0 && (
            <Card className="border-amber-200/80 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock className="h-4 w-4" />
                  Follow-ups (next 14 days)
                </CardTitle>
                <CardDescription>
                  Snooze by editing the deal; mark done when contacted.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    className="flex max-w-xs flex-col rounded-md border bg-card px-3 py-2 text-sm shadow-sm"
                  >
                    <span className="line-clamp-1 font-medium">{r.deal?.title || 'Deal'}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.remind_at).toLocaleString('en-NG')}
                    </span>
                    {r.body && (
                      <span className="mt-1 line-clamp-2 text-muted-foreground">{r.body}</span>
                    )}
                    {canWrite && (
                      <Button
                        className="mt-2 h-7 self-start"
                        size="sm"
                        variant="outline"
                        onClick={() => markReminderDone(r.id)}
                      >
                        Done
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {COLUMNS.map((col) => (
              <div
                key={col.id}
                data-column={col.id}
                className="flex min-h-[22rem] flex-col rounded-xl border bg-muted/30 p-2"
                onDragOver={onDragOver}
                onDrop={(e) => void onDropColumn(e, col.id)}
              >
                <div className="mb-2 px-1">
                  <div className="font-semibold">{col.label}</div>
                  <div className="text-xs text-muted-foreground">{col.hint}</div>
                  <Badge variant="secondary" className="mt-1">
                    {byColumn[col.id].length}
                  </Badge>
                </div>
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                  {byColumn[col.id].map((deal) => (
                    <Card
                      key={deal.id}
                      draggable={canWrite}
                      onDragStart={(e) => canWrite && onDragStart(e, deal.id)}
                      className="cursor-grab border bg-card shadow-sm active:cursor-grabbing"
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          {canWrite && (
                            <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium leading-tight">{deal.title}</div>
                            {deal.lead && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {deal.lead.full_name}
                                {deal.lead.phone ? ` · ${deal.lead.phone}` : ''}
                                {deal.lead_id && (
                                  <>
                                    {' · '}
                                    <Link
                                      to={`/crm/leads/${deal.lead_id}`}
                                      className="font-medium text-primary underline-offset-2 hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Lead profile
                                    </Link>
                                  </>
                                )}
                              </div>
                            )}
                            {deal.budget_max != null && (
                              <div className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                Up to {deal.currency}{' '}
                                {Number(deal.budget_max).toLocaleString('en-NG')}
                              </div>
                            )}
                            {deal.next_follow_up_at && (
                              <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
                                Follow-up:{' '}
                                {new Date(deal.next_follow_up_at).toLocaleString('en-NG')}
                              </div>
                            )}
                            {canWrite && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setActiveDealId(deal.id);
                                    setInspOpen(true);
                                  }}
                                >
                                  Inspection
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setActiveDealId(deal.id);
                                    setRemOpen(true);
                                  }}
                                >
                                  Reminder
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {leads.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Open leads</CardTitle>
                <CardDescription>
                  Click a name to open the lead detail page (deals & inspections).
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {leads.slice(0, 24).map((l) => (
                  <Button key={l.id} variant="outline" size="sm" asChild>
                    <Link to={`/crm/leads/${l.id}`}>{l.full_name}</Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {loading && <p className="mt-4 text-sm text-muted-foreground">Loading pipeline…</p>}

        <Dialog open={leadOpen} onOpenChange={setLeadOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New lead</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-1">
                <Label>Full name</Label>
                <Input value={lfName} onChange={(e) => setLfName(e.target.value)} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input value={lEmail} onChange={(e) => setLEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={lPhone} onChange={(e) => setLPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Source</Label>
                <Input
                  value={lSource}
                  onChange={(e) => setLSource(e.target.value)}
                  placeholder="Web, referral, walk-in…"
                />
              </div>
              <div className="space-y-1">
                <Label>Property (optional)</Label>
                <Select
                  value={lPropertyId || '__none__'}
                  onValueChange={(v) => setLPropertyId(v === '__none__' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Link to listing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea value={lNotes} onChange={(e) => setLNotes(e.target.value)} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setLeadOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void submitLead()} disabled={!lfName.trim()}>
                Save lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={dealOpen} onOpenChange={setDealOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New deal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-1">
                <Label>Title (optional if lead chosen)</Label>
                <Input value={dTitle} onChange={(e) => setDTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Lead</Label>
                <Select
                  value={dLeadId || '__none__'}
                  onValueChange={(v) => setDLeadId(v === '__none__' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Property</Label>
                <Select
                  value={dPropertyId || '__none__'}
                  onValueChange={(v) => setDPropertyId(v === '__none__' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Assign agent</Label>
                <Select
                  value={dAgentId || '__none__'}
                  onValueChange={(v) => setDAgentId(v === '__none__' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {agentOpts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setDealOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void submitDeal()} disabled={!dTitle.trim() && !dLeadId}>
                Create deal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={inspOpen} onOpenChange={setInspOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule inspection</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-1">
                <Label>Start</Label>
                <Input
                  type="datetime-local"
                  value={inspStart}
                  onChange={(e) => setInspStart(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea
                  value={inspNotes}
                  onChange={(e) => setInspNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setInspOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void submitInspection()} disabled={!inspStart}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={remOpen} onOpenChange={setRemOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Follow-up reminder</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-1">
                <Label>Remind at</Label>
                <Input
                  type="datetime-local"
                  value={remAt}
                  onChange={(e) => setRemAt(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Note</Label>
                <Textarea value={remBody} onChange={(e) => setRemBody(e.target.value)} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setRemOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void submitReminder()} disabled={!remAt}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContent>
    </PageLayout>
  );
};

export default CrmPipelinePage;
