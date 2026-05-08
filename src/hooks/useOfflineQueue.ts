import { useEffect, useState, useCallback } from 'react';
import { subscribe, drain, cancel, type OfflineQueueSnapshot } from '@/lib/offlineQueue';

const EMPTY_SNAPSHOT: OfflineQueueSnapshot = {
  pending: 0,
  draining: false,
  lastError: null,
  items: [],
  scope: null,
};

/**
 * Reactive snapshot of the offline write queue. Re-renders the consumer when
 * items are added, drained, or fail.
 */
export function useOfflineQueue() {
  const [snapshot, setSnapshot] = useState<OfflineQueueSnapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    const unsubscribe = subscribe(setSnapshot);
    return unsubscribe;
  }, []);

  const retryNow = useCallback(() => {
    void drain();
  }, []);

  const cancelItem = useCallback((id: string) => {
    void cancel(id);
  }, []);

  return {
    pending: snapshot.pending,
    draining: snapshot.draining,
    lastError: snapshot.lastError,
    items: snapshot.items,
    scope: snapshot.scope,
    retryNow,
    cancelItem,
  };
}
