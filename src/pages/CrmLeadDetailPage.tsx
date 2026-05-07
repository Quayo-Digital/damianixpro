import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { useAuthSession } from '@/contexts/auth';
import { useProperties } from '@/hooks/useProperties';
import { useToast } from '@/hooks/use-toast';
import {
  createCrmDeal,
  createCrmInspection,
  getCrmLead,
  listCrmAgentOptions,
  patchCrmDeal,
  patchCrmLead,
} from '@/services/crm/crmPipelineApi';
import type {
  CrmAgentOption,
  CrmDeal,
  CrmInspection,
  CrmLead,
  CrmLeadDetailResponse,
  CrmPropertySummary,
} from '@/types/crmPipeline';
import { ArrowLeft, CalendarPlus, Save } from 'lucide-react';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

function stageLabel(d: CrmDeal): string {
  if (d.stage === 'closed') {
    if (d.outcome === 'won') return 'Closed won';
    if (d.outcome === 'lost') return 'Closed lost';
    return 'Closed';
  }
  if (d.stage === 'inspection') return 'Inspection';
  if (d.stage === 'negotiation') return 'Negotiation';
  return 'Lead';
}

const CrmLeadDetailPage = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = useAuthSession();
  const { properties } = useProperties();
  const canWrite = hasPermission('crm.write');

  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<CrmLead | null>(null);
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [inspections, setInspections] = useState<CrmInspection[]>([]);
  const [property, setProperty] = useState<CrmPropertySummary | null>(null);
  const [agents, setAgents] = useState<CrmAgentOption[]>([]);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPropertyId, setEditPropertyId] = useState('');
  const [savingLead, setSavingLead] = useState(false);

  const [inspOpen, setInspOpen] = useState(false);
  const [inspDealId, setInspDealId] = useState<string>('');
  const [inspStart, setInspStart] = useState('');
  const [inspNotes, setInspNotes] = useState('');

  const applyDetail = useCallback((data: CrmLeadDetailResponse) => {
    setLead(data.lead);
    setDeals(data.deals);
    setInspections(data.inspections);
    setProperty(data.property);
    setEditName(data.lead.full_name);
    setEditEmail(data.lead.email || '');
    setEditPhone(data.lead.phone || '');
    setEditSource(data.lead.source || '');
    setEditNotes(data.lead.notes || '');
    setEditPropertyId(data.lead.property_id || '');
  }, []);

  const load = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const data = await getCrmLead(leadId);
      applyDetail(data);
    } catch (e) {
      toast({
        title: 'Could not load lead',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
      navigate('/crm/pipeline', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [leadId, navigate, toast, applyDetail]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!canWrite) return;
    void (async () => {
      try {
        const { agents: a } = await listCrmAgentOptions();
        setAgents(a);
      } catch {
        setAgents([]);
      }
    })();
  }, [canWrite]);

  const dealTitleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of deals) m.set(d.id, d.title);
    return m;
  }, [deals]);

  const saveLead = async () => {
    if (!leadId || !canWrite) return;
    setSavingLead(true);
    try {
      await patchCrmLead(leadId, {
        full_name: editName.trim(),
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
        source: editSource.trim() || null,
        notes: editNotes.trim() || null,
        property_id: editPropertyId || null,
      });
      const data = await getCrmLead(leadId);
      applyDetail(data);
      toast({ title: 'Lead updated' });
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSavingLead(false);
    }
  };

  const onAgentChange = async (dealId: string, agentId: string | null) => {
    if (!canWrite) return;
    try {
      const { deal } = await patchCrmDeal(dealId, { assigned_agent_id: agentId });
      setDeals((prev) => prev.map((d) => (d.id === deal.id ? deal : d)));
      toast({ title: 'Agent updated' });
    } catch (e) {
      toast({
        title: 'Update failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
      void load();
    }
  };

  const createDealForLead = async () => {
    if (!lead || !canWrite) return;
    try {
      const { deal } = await createCrmDeal({
        lead_id: lead.id,
        property_id: lead.property_id || undefined,
      });
      setDeals((prev) => [deal, ...prev]);
      toast({ title: 'Deal created', description: deal.title });
    } catch (e) {
      toast({
        title: 'Could not create deal',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const submitInspection = async () => {
    if (!inspDealId || !inspStart) return;
    try {
      const { inspection } = await createCrmInspection(inspDealId, {
        scheduled_start: new Date(inspStart).toISOString(),
        notes: inspNotes || undefined,
      });
      setInspections((prev) =>
        [...prev, inspection].sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start))
      );
      toast({ title: 'Inspection scheduled' });
      setInspOpen(false);
      setInspDealId('');
      setInspStart('');
      setInspNotes('');
    } catch (e) {
      toast({
        title: 'Failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  if (loading || !lead) {
    return (
      <PageLayout>
        <PageContent title="Lead" description="">
          <TableSkeleton rows={4} cols={3} />
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageContent
        title={lead.full_name}
        description="Sales / letting lead — linked listing, pipeline deals, inspections, and agent assignment."
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/crm/pipeline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Pipeline
            </Link>
          </Button>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
              <CardDescription>Lead record (CRM)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Full name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={!canWrite}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    disabled={!canWrite}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    disabled={!canWrite}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Source</Label>
                <Input
                  value={editSource}
                  onChange={(e) => setEditSource(e.target.value)}
                  disabled={!canWrite}
                />
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  disabled={!canWrite}
                />
              </div>
              <div className="space-y-1">
                <Label>Linked property</Label>
                <Select
                  value={editPropertyId || '__none__'}
                  onValueChange={(v) => setEditPropertyId(v === '__none__' ? '' : v)}
                  disabled={!canWrite}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
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
              {canWrite && (
                <Button
                  type="button"
                  onClick={() => void saveLead()}
                  disabled={savingLead || !editName.trim()}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save lead
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listing</CardTitle>
              <CardDescription>Property linked to this lead</CardDescription>
            </CardHeader>
            <CardContent>
              {property ? (
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{property.name || 'Property'}</p>
                  {(property.address || property.city || property.state) && (
                    <p className="text-muted-foreground">
                      {[property.address, property.city, property.state]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                  <Button variant="secondary" size="sm" asChild>
                    <Link to={`/properties/${property.id}`}>Open property</Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No property linked. Choose a listing under Contact → Linked property (if you have
                  access).
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Pipeline deals</CardTitle>
              <CardDescription>
                Move stages on the Kanban board. Assign agents per deal.
              </CardDescription>
            </div>
            {canWrite && (
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => void createDealForLead()}>
                  New deal for this lead
                </Button>
                {deals.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setInspDealId(deals[0].id);
                      setInspOpen(true);
                    }}
                  >
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Schedule inspection
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No deals yet. Create one to track this lead on the board.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Assigned agent</TableHead>
                    <TableHead className="text-right">Budget max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stageLabel(d)}</Badge>
                      </TableCell>
                      <TableCell>
                        {canWrite ? (
                          <Select
                            value={d.assigned_agent_id || '__none__'}
                            onValueChange={(v) =>
                              void onAgentChange(d.id, v === '__none__' ? null : v)
                            }
                          >
                            <SelectTrigger className="w-[220px]">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Unassigned</SelectItem>
                              {agents.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                  {a.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {d.assigned_agent_id
                              ? agents.find((x) => x.id === d.assigned_agent_id)?.label ||
                                d.assigned_agent_id
                              : '—'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {d.budget_max != null
                          ? `${d.currency} ${Number(d.budget_max).toLocaleString('en-NG')}`
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inspections</CardTitle>
            <CardDescription>Scheduled viewings tied to deals for this lead</CardDescription>
          </CardHeader>
          <CardContent>
            {inspections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No inspections scheduled.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Deal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{new Date(i.scheduled_start).toLocaleString('en-NG')}</TableCell>
                      <TableCell>{dealTitleById.get(i.deal_id) || i.deal_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{i.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">
                        {i.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={inspOpen} onOpenChange={setInspOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule inspection</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-1">
                <Label>Deal</Label>
                <Select value={inspDealId || undefined} onValueChange={setInspDealId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select deal" />
                  </SelectTrigger>
                  <SelectContent>
                    {deals.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <Button onClick={() => void submitInspection()} disabled={!inspDealId || !inspStart}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContent>
    </PageLayout>
  );
};

export default CrmLeadDetailPage;
