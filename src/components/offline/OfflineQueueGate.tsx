import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthSession } from '@/contexts/auth';
import {
  init as initQueue,
  signOut as signOutQueue,
  setQueryClient,
  installReconnectListeners,
  drain,
} from '@/lib/offlineQueue';
import { logger } from '@/utils/logger';

/**
 * Lifecycle bridge between AuthProvider and the offline write queue.
 *
 * - Wires the React Query client into the queue (so post-drain invalidation
 *   refetches affected views).
 * - Installs reconnect listeners once.
 * - Loads the per-user queue on signin and clears the in-memory copy on
 *   signout (the IDB record is preserved so the user can resume from another
 *   device or tab).
 */
export function OfflineQueueGate(): null {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    setQueryClient(queryClient);
    installReconnectListeners();
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;

    if (user?.id) {
      initQueue(user.id)
        .then(() => {
          if (cancelled) return;
          // initQueue already triggers a drain when online with non-empty
          // queue, but when the user has just signed back in we additionally
          // nudge it in case `online` fired before init resolved.
          void drain();
        })
        .catch((err) => {
          logger.error('OfflineQueueGate: init failed', { err });
        });
    } else {
      void signOutQueue();
    }

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return null;
}

export default OfflineQueueGate;
