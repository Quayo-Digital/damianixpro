
import React, { useEffect } from 'react';
import { AuthProvider } from '@/contexts/auth'; 
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppContent } from './AppContent';
import { initializePerformanceOptimizations } from '@/services/performance/performanceOptimizer';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import PWAStatus from '@/components/pwa/PWAStatus';

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
    
    // Register enhanced service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw-enhanced.js')
          .then((registration) => {
            console.log('Enhanced SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('Enhanced SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppContent />
            {/* PWA Components */}
            <PWAStatus />
            <PWAInstallPrompt />
          </AuthProvider>
          {/* React Query DevTools - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <div>DevTools would go here</div>
          )}
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// AppContent component has been moved to its own file

export default App;
