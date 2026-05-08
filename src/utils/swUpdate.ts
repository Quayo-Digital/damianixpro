/**
 * Service worker registration + update flow.
 *
 * Why this lives in its own module instead of inline in App.tsx:
 *
 * 1. The "Update available, refresh now?" UX is non-trivial — we have to
 *    register the SW, watch the registration's `updatefound` event, observe
 *    the new worker through its `installing` -> `installed` lifecycle, then
 *    open a sonner toast that postMessages SKIP_WAITING and reloads on the
 *    next `controllerchange`. Keeping it here keeps App.tsx clean.
 *
 * 2. We deliberately do NOT call this in dev — Vite serves source modules
 *    directly and an active service worker intercepts those requests, which
 *    breaks lazy-loaded chunks and HMR. App.tsx already unregisters any SWs
 *    left over from previous prod builds when running in dev mode.
 *
 * 3. The companion change in `public/sw-enhanced.js` removed the implicit
 *    `self.skipWaiting()` from the install event and added a message-driven
 *    skip-waiting handler — those two pieces work together.
 */

import { toast } from 'sonner';

import { logger } from '@/utils/logger';

const SW_URL = '/sw-enhanced.js';

/** Best-effort check: only fire 1 toast per page-lifetime. */
let updateToastShown = false;

function promptUserToReload(waitingWorker: ServiceWorker) {
  if (updateToastShown) return;
  updateToastShown = true;

  toast.info('A new version of DamianixPro is ready.', {
    description: 'Refresh now to get the latest features and fixes.',
    duration: Infinity,
    action: {
      label: 'Refresh',
      onClick: () => {
        // Ask the waiting worker to activate; we'll reload on controllerchange.
        try {
          waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        } catch (err) {
          // If postMessage fails (worker died, etc.), just hard-reload.
          logger.warn('SW postMessage(SKIP_WAITING) failed, falling back to reload', err);
          window.location.reload();
        }
      },
    },
  });
}

function listenForUpdates(reg: ServiceWorkerRegistration) {
  // Case A: a new SW is already waiting (page loaded mid-update).
  if (reg.waiting && navigator.serviceWorker.controller) {
    promptUserToReload(reg.waiting);
  }

  // Case B: SW updates while the user is on the page.
  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      // The new worker reaches 'installed' once it finishes downloading.
      // If `controller` exists, an old SW is still in charge — that's an update.
      // If `controller` is null, this is the very first SW install — no toast.
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        promptUserToReload(newWorker);
      }
    });
  });
}

/**
 * Register the production service worker and wire up the "update available"
 * toast. Safe to call from the browser; no-op in environments without
 * serviceWorker support.
 *
 * Call this exactly once from App.tsx in PROD builds. Do not call in DEV.
 */
export function registerServiceWorkerWithUpdates() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  // When the new worker takes over, reload so all open clients land on the
  // same bundle. Without this the user can keep loading lazy chunks from the
  // previous build. We guard with a flag so that React StrictMode doesn't
  // wire two listeners.
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  navigator.serviceWorker
    .register(SW_URL)
    .then((reg) => {
      logger.debug('SW registered', { scope: reg.scope });

      listenForUpdates(reg);

      // Periodic update check — useful when the user keeps a tab open for
      // hours and the network was offline at registration time. Once an hour
      // is enough to be useful without spamming the server.
      setInterval(
        () => {
          reg.update().catch((err) => {
            logger.debug('Periodic SW update check failed', err);
          });
        },
        60 * 60 * 1000
      );
    })
    .catch((err) => {
      logger.error('SW registration failed', err);
    });
}
