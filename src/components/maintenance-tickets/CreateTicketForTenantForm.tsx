import React, { useEffect, useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useProperties } from '@/hooks/useProperties';
import { createMaintenanceTicket } from '@/services/maintenance/maintenanceTicketsApi';
import { useToast } from '@/hooks/use-toast';

type TenantOption = { id: string; label: string };

export interface CreateTicketForTenantFormProps {
  onCreated: () => void;
}

/**
 * Owner / agent / manager: open an enterprise maintenance ticket on behalf of an
 * active tenant at a property you control (API sends tenant_id like admin flow).
 */
export function CreateTicketForTenantForm({ onCreated }: CreateTicketForTenantFormProps) {
  const { toast } = useToast();
  const { properties, isLoading: propsLoading } = useProperties();
  const [propertyId, setPropertyId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!propertyId) {
      setTenants([]);
      setTenantId('');
      return;
    }
    let cancelled = false;
    setLoadingTenants(true);
    (async () => {
      const { data, error } = await supabase
        .from('property_tenants')
        .select('tenant_id, tenants(id, first_name, last_name, email)')
        .eq('property_id', propertyId)
        .eq('status', 'active');
      if (cancelled) return;
      setLoadingTenants(false);
      if (error) {
        toast({
          title: 'Could not load tenants',
          description: error.message,
          variant: 'destructive',
        });
        setTenants([]);
        return;
      }
      const opts: TenantOption[] = (data || []).map((row: Record<string, unknown>) => {
        const tid = row.tenant_id as string;
        const t = row.tenants as { first_name?: string; last_name?: string; email?: string } | null;
        const name = [t?.first_name, t?.last_name].filter(Boolean).join(' ').trim();
        const label = name ? `${name} (${t?.email || tid})` : t?.email || tid;
        return { id: tid, label };
      });
      setTenants(opts);
      setTenantId('');
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId, toast]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !tenantId || !title.trim()) {
      toast({ title: 'Select property & tenant and enter a title', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await createMaintenanceTicket({
        property_id: propertyId,
        tenant_id: tenantId,
        title: title.trim(),
        description: description.trim(),
        priority,
      });
      toast({
        title: 'Ticket created',
        description: 'The tenant will see it under their service tickets.',
      });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setTenantId('');
      setPropertyId('');
      onCreated();
    } catch (err) {
      toast({
        title: 'Create failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open ticket for tenant</CardTitle>
        <CardDescription>
          Creates the work order in the tenant{"'"}s name (same as admin-style{' '}
          <code className="rounded bg-muted px-1">tenant_id</code>) with you recorded as{' '}
          <code className="rounded bg-muted px-1">created_by</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Property</Label>
            <Select value={propertyId} onValueChange={setPropertyId} disabled={propsLoading}>
              <SelectTrigger>
                <SelectValue
                  placeholder={propsLoading ? 'Loading properties…' : 'Select property'}
                />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name || p.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Tenant</Label>
            <Select
              value={tenantId}
              onValueChange={setTenantId}
              disabled={!propertyId || loadingTenants || tenants.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !propertyId
                      ? 'Choose a property first'
                      : loadingTenants
                        ? 'Loading tenants…'
                        : tenants.length === 0
                          ? 'No active tenant on this property'
                          : 'Select tenant'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="owner-mt-title">Title</Label>
            <Input
              id="owner-mt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="owner-mt-desc">Description</Label>
            <Textarea
              id="owner-mt-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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
          <div className="flex items-end md:col-span-2">
            <Button type="submit" disabled={submitting || !propertyId || !tenantId}>
              {submitting ? 'Creating…' : 'Create ticket for tenant'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
