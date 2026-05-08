import React, { useEffect } from 'react';
import { AuthProvider } from '@/contexts/auth';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { AppContent } from './AppContent';
import { initializePerformanceOptimizations } from '@/services/performance/performanceOptimizer';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import PWAStatus from '@/components/pwa/PWAStatus';
import { logger } from '@/utils/logger';
import { WhiteLabelProvider } from '@/contexts/WhiteLabelContext';
import { defaultRetryDelay, defaultShouldRetry } from '@/utils/reactQueryRetry';

/**
 * QueryClient tuned for offline-first usage on the Nigerian market.
 *
 * - `gcTime` is bumped to 24h so persisted cache survives a reload while
 *   offline (paired with PersistQueryClientProvider in main.tsx / here).
 * - `networkMode: 'offlineFirst'` makes a query attempt the network once and
 *   then fall back to cached data instead of failing immediately when the
 *   user has no signal. Mutations stay on the default `'online'` mode so we
 *   don't silently swallow writes.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: defaultShouldRetry,
      retryDelay: defaultRetryDelay,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchInterval: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 0,
      retryDelay: defaultRetryDelay,
    },
  },
});

/**
 * Persist the React Query cache to `localStorage` so a cold start (especially
 * offline) shows the last-seen data immediately instead of skeletons.
 *
 * Safety notes:
 * - The buster is bumped any time the cache shape becomes incompatible with
 *   older entries; mismatched entries are silently discarded.
 * - `maxAge` keeps stale data from haunting users for too long.
 * - Server-only browsers / sandboxes without `localStorage` (SSR, Safari ITP
 *   private mode) get an undefined storage and the persister becomes a no-op.
 */
const QUERY_CACHE_BUSTER = 'dxp-rq-v1';
const QUERY_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const queryPersister =
  typeof window !== 'undefined'
    ? createSyncStoragePersister({
        storage: window.localStorage,
        key: 'dxp.react-query.cache',
        // Quietly throttle writes so we don't thrash localStorage on every state change.
        throttleTime: 1500,
      })
    : undefined;

function App() {
  // Initialize performance optimizations and PWA on app start
  useEffect(() => {
    initializePerformanceOptimizations();

    // Remove any service worker left from earlier builds — it breaks Vite lazy chunks (Dashboard.tsx, etc.).
    if (import.meta.env.DEV && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length === 0) return;
        void Promise.all(registrations.map((r) => r.unregister())).then(() => {
          logger.debug('Dev: unregistered service worker(s)', { count: registrations.length });
        });
      });
    }

    // PWA offline cache only in production — dev SW intercept breaks Vite dynamic imports (/src/*.tsx).
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw-enhanced.js')
          .then((registration) => {
            logger.debug('Enhanced SW registered', { registration });
          })
          .catch((registrationError) => {
            logger.error('Enhanced SW registration failed', registrationError);
          });
      });
    }
  }, []);

  // PersistQueryClientProvider keeps the public API of QueryClientProvider
  // and additionally rehydrates the cache from `localStorage` on mount and
  // persists it (throttled) on every cache change.
  return (
    <ErrorBoundary>
      <WhiteLabelProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: queryPersister!,
              buster: QUERY_CACHE_BUSTER,
              maxAge: QUERY_CACHE_MAX_AGE_MS,
              dehydrateOptions: {
                // Only persist queries whose data we *want* to survive a refresh.
                // Successful queries with non-empty results are great candidates;
                // errored or empty queries would just rehydrate junk.
                shouldDehydrateQuery: (query) =>
                  query.state.status === 'success' &&
                  query.state.data !== undefined &&
                  query.state.data !== null,
              },
            }}
          >
            <AuthProvider>
              <AppContent />
              {/* PWA Components */}
              <PWAStatus />
              <PWAInstallPrompt />
            </AuthProvider>
            {/* React Query DevTools - only in development */}
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
          </PersistQueryClientProvider>
        </ThemeProvider>
      </WhiteLabelProvider>
    </ErrorBoundary>
  );
}

// AppContent component has been moved to its own file

export default App;
