import { useCallback, useEffect, useState } from 'react';
import { listMaintenanceTickets } from '@/services/maintenance/maintenanceTicketsApi';
import type { MaintenanceTicketBundle } from '@/types/maintenanceTickets';
import { logger } from '@/utils/logger';

export function useFacilityManagerDashboardTickets() {
  const [tickets, setTickets] = useState<MaintenanceTicketBundle['ticket'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { tickets: rows } = await listMaintenanceTickets();
      setTickets(rows || []);
    } catch (e) {
      logger.warn('facility manager dashboard tickets', e);
      setError(e instanceof Error ? e.message : 'Could not load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openCount = tickets.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  ).length;
  const resolvedWeek = tickets.filter((t) => {
    if (t.status !== 'resolved' || !t.resolved_at) return false;
    const d = new Date(t.resolved_at).getTime();
    return Date.now() - d < 7 * 86400000;
  }).length;

  return { tickets, loading, error, refresh, openCount, resolvedWeek };
}
