import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/auth';
import { formatDistanceToNow } from 'date-fns';
import type { RoleDashboardActivity } from '@/components/dashboard/role-dashboard/types';
import { logger } from '@/utils/logger';

const ngn = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function useAdminRoleDashboardExtras() {
  const { userRole } = useAuthSession();
  const enabled = userRole === 'admin' || userRole === 'super_admin';
  const [loading, setLoading] = useState(true);
  const [occupancyPct, setOccupancyPct] = useState<number | null>(null);
  const [outstandingRentNgn, setOutstandingRentNgn] = useState<number>(0);
  const [activeTenancies, setActiveTenancies] = useState<number>(0);
  const [activities, setActivities] = useState<RoleDashboardActivity[]>([]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const [unitsRes, pendingRentRes, tenanciesRes, paymentsFeedRes, maintFeedRes] =
          await Promise.all([
            supabase.from('units').select('status'),
            supabase
              .from('rent_payments')
              .select('amount, status')
              .not('status', 'eq', 'successful'),
            supabase
              .from('property_tenants')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'active'),
            supabase
              .from('rent_payments')
              .select('id, amount, status, created_at, reference')
              .eq('status', 'successful')
              .order('created_at', { ascending: false })
              .limit(5),
            supabase
              .from('maintenance_requests')
              .select('id, issue, category, status, created_at')
              .order('created_at', { ascending: false })
              .limit(5),
          ]);

        if (cancelled) return;

        if (!unitsRes.error && unitsRes.data?.length) {
          const total = unitsRes.data.length;
          const occ = unitsRes.data.filter(
            (u) => String(u.status || '').toLowerCase() === 'occupied'
          ).length;
          setOccupancyPct(Math.round((occ / Math.max(total, 1)) * 1000) / 10);
        } else {
          setOccupancyPct(null);
        }

        if (!pendingRentRes.error && pendingRentRes.data) {
          const sum = pendingRentRes.data.reduce((s, r) => s + Number(r.amount || 0), 0);
          setOutstandingRentNgn(sum);
        } else {
          setOutstandingRentNgn(0);
        }

        if (!tenanciesRes.error) {
          setActiveTenancies(tenanciesRes.count || 0);
        } else {
          setActiveTenancies(0);
        }

        type Row = { at: string; item: RoleDashboardActivity };
        const rows: Row[] = [];

        for (const p of paymentsFeedRes.data || []) {
          const at = (p as { created_at?: string }).created_at || '';
          rows.push({
            at,
            item: {
              id: `pay-${p.id}`,
              title: `Rent payment recorded (${ngn.format(Number(p.amount || 0))})`,
              meta: p.reference ? `Ref: ${p.reference}` : 'Successful payment',
              time: at ? formatDistanceToNow(new Date(at), { addSuffix: true }) : '',
              icon: '💳',
            },
          });
        }
        for (const m of maintFeedRes.data || []) {
          const row = m as {
            id: string;
            issue?: string | null;
            category?: string | null;
            status?: string | null;
            created_at?: string | null;
          };
          const at = row.created_at || '';
          rows.push({
            at,
            item: {
              id: `mnt-${row.id}`,
              title: row.issue?.trim() || row.category || 'Maintenance request',
              meta: [row.category, row.status].filter(Boolean).join(' · ') || undefined,
              time: at ? formatDistanceToNow(new Date(at), { addSuffix: true }) : '',
              icon: '🔧',
            },
          });
        }

        rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
        setActivities(rows.slice(0, 8).map((r) => r.item));
      } catch (e) {
        logger.warn('admin role dashboard extras', e);
        if (!cancelled) {
          setOccupancyPct(null);
          setOutstandingRentNgn(0);
          setActivities([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { loading, occupancyPct, outstandingRentNgn, activeTenancies, activities, enabled };
}
