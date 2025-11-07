import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { splitVendorChunkPlugin } from 'vite';

// Performance-optimized Vite configuration
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
    }),
    
    // Split vendor chunks for better caching
    splitVendorChunkPlugin(),
    
    // Bundle analyzer (only in build mode)
    process.env.ANALYZE && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  
  // Build optimizations
  build: {
    // Enable minification
    minify: 'terser',
    
    // Terser options for better compression
    terserOptions: {
      compress: {
        // Remove console logs in production
        drop_console: true,
        drop_debugger: true,
        // Remove unused code
        dead_code: true,
        // Optimize comparisons
        comparisons: true,
        // Inline functions where possible
        inline: 2,
        // Remove unused imports
        unused: true,
      },
      mangle: {
        // Mangle property names for better compression
        properties: {
          regex: /^_/,
        },
      },
      format: {
        // Remove comments
        comments: false,
      },
    },
    
    // Rollup options for advanced bundling
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal caching
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI components
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-switch',
            '@radix-ui/react-slider',
            '@radix-ui/react-progress',
            '@radix-ui/react-alert-dialog',
          ],
          
          // Data management
          'data-vendor': [
            '@tanstack/react-query',
            '@supabase/supabase-js',
            'react-hook-form',
            'zod',
          ],
          
          // Charts and visualization
          'chart-vendor': [
            'chart.js',
            'react-chartjs-2',
            'recharts',
          ],
          
          // Maps and location
          'map-vendor': [
            'mapbox-gl',
            'react-map-gl',
            '@mapbox/mapbox-gl-geocoder',
          ],
          
          // Utilities
          'utils-vendor': [
            'date-fns',
            'clsx',
            'tailwind-merge',
            'lucide-react',
          ],
          
          // Payment processing
          'payment-vendor': [
            // Payment gateway SDKs would go here
          ],
        },
        
        // Optimize chunk file names for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.[^.]*$/, '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash].${ext}`;
          }
          
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash].${ext}`;
          }
          
          return `assets/[name]-[hash].${ext}`;
        },
      },
      
      // External dependencies (for CDN usage)
      external: process.env.USE_CDN ? [
        // These would be loaded from CDN
        // 'react',
        // 'react-dom',
      ] : [],
    },
    
    // Target modern browsers for better optimization
    target: 'es2020',
    
    // Optimize CSS
    cssCodeSplit: true,
    
    // Source maps for debugging (disable in production)
    sourcemap: process.env.NODE_ENV === 'development',
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Asset inlining threshold
    assetsInlineLimit: 4096,
  },
  
  // Development server optimizations
  server: {
    // Enable HMR
    hmr: true,
    
    // Optimize deps pre-bundling
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        '@supabase/supabase-js',
        'react-hook-form',
        'zod',
        'date-fns',
        'clsx',
        'tailwind-merge',
        'lucide-react',
      ],
      exclude: [
        // Large dependencies that should be loaded on demand
        'chart.js',
        'mapbox-gl',
      ],
    },
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    // Force pre-bundling of these dependencies
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'react-hook-form',
      'zod',
      'date-fns',
      'clsx',
      'tailwind-merge',
      'lucide-react',
    ],
    
    // Exclude large dependencies from pre-bundling
    exclude: [
      'chart.js',
      'mapbox-gl',
      '@mapbox/mapbox-gl-geocoder',
    ],
  },
  
  // CSS optimizations
  css: {
    // PostCSS configuration
    postcss: {
      plugins: [
        // Autoprefixer for browser compatibility
        require('autoprefixer'),
        
        // PurgeCSS to remove unused styles
        ...(process.env.NODE_ENV === 'production' ? [
          require('@fullhuman/postcss-purgecss')({
            content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
            defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
            safelist: [
              // Tailwind CSS classes that might be dynamically generated
              /^(bg|text|border|ring|shadow|hover|focus|active|disabled|group|peer)-/,
              // Radix UI classes
              /^(radix|data-)/,
              // Chart.js classes
              /^chart/,
              // Mapbox classes
              /^mapbox/,
            ],
          }),
        ] : []),
      ],
    },
    
    // CSS modules configuration
    modules: {
      localsConvention: 'camelCase',
    },
  },
  
  // Environment variables
  define: {
    // Replace process.env.NODE_ENV for better tree shaking
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    
    // Enable/disable development features
    __DEV__: process.env.NODE_ENV === 'development',
  },
  
  // Experimental features
  experimental: {
    // Enable build optimizations
    renderBuiltUrl: true,
  },
});

// Bundle analysis script
export const analyzeBundleScript = `
// Add to package.json scripts:
// "analyze": "ANALYZE=true npm run build"
// "build:performance": "vite build --config vite.config.performance.ts"
// "preview:performance": "vite preview --config vite.config.performance.ts"
`;

// Performance monitoring utilities
export const performanceUtils = {
  // Measure bundle size
  measureBundleSize: () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const transferSize = navigation.transferSize || 0;
      
      console.log(`Bundle transfer size: ${(transferSize / 1024 / 1024).toFixed(2)} MB`);
      
      return {
        transferSize,
        transferSizeMB: transferSize / 1024 / 1024,
      };
    }
    return null;
  },
  
  // Measure loading performance
  measureLoadingPerformance: () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const metrics = {
        // Time to first byte
        ttfb: navigation.responseStart - navigation.requestStart,
        
        // DOM content loaded
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        
        // Full page load
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        
        // First paint
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        
        // First contentful paint
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
      
      console.log('Performance Metrics:', metrics);
      return metrics;
    }
    return null;
  },
  
  // Monitor Core Web Vitals
  measureCoreWebVitals: () => {
    if (typeof window !== 'undefined') {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          console.log('FID:', entry.processingStart - entry.startTime);
        });
      }).observe({ entryTypes: ['first-input'] });
      
      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        console.log('CLS:', clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
    }
  },
};
