import { onlineManager } from '@tanstack/react-query';
import { drain } from './queue';

let installed = false;

/**
 * Installs reconnect listeners that drain the offline queue when connectivity
 * comes back. Idempotent — safe to call multiple times.
 */
export function installReconnectListeners(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  onlineManager.subscribe((isOnline) => {
    if (isOnline) {
      void drain();
    }
  });

  window.addEventListener('online', () => {
    void drain();
  });
}
