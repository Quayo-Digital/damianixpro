import React, { useEffect } from 'react';
import { AuthProvider } from '@/contexts/auth';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppContent } from './AppContent';
import { initializePerformanceOptimizations } from '@/services/performance/performanceOptimizer';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import PWAStatus from '@/components/pwa/PWAStatus';
import { logger } from '@/utils/logger';
import { WhiteLabelProvider } from '@/contexts/WhiteLabelContext';

// Optimized QueryClient configuration for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times instead of 3
      retry: 2,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Refetch on reconnect for data consistency
      refetchOnReconnect: true,
      // Enable background refetching for fresh data
      refetchInterval: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

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

  return (
    <ErrorBoundary>
      <WhiteLabelProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AppContent />
              {/* PWA Components */}
              <PWAStatus />
              <PWAInstallPrompt />
            </AuthProvider>
            {/* React Query DevTools - only in development */}
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
          </QueryClientProvider>
        </ThemeProvider>
      </WhiteLabelProvider>
    </ErrorBoundary>
  );
}

// AppContent component has been moved to its own file

export default App;
