import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/auth';

/**
 * Primary property for the signed-in tenant (latest active property_tenants row).
 */
export function useTenantPrimaryPropertyId(): string | null {
  const { user } = useAuthSession();
  const [propertyId, setPropertyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setPropertyId(null);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data: tenant, error: tErr } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled || tErr || !tenant?.id) {
        if (!cancelled) setPropertyId(null);
        return;
      }

      const { data: pt, error: ptErr } = await supabase
        .from('property_tenants')
        .select('property_id')
        .eq('tenant_id', tenant.id)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled || ptErr) {
        if (!cancelled) setPropertyId(null);
        return;
      }

      if (!cancelled) setPropertyId(pt?.property_id ?? null);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return propertyId;
}
