// Mobile responsiveness utilities for DamianixPro
import { useEffect, useState } from 'react';

// Device breakpoints optimized for Nigerian market
export const BREAKPOINTS = {
  // Mobile-first approach
  mobile: 320, // Small phones
  mobileLg: 375, // Large phones (iPhone, Samsung)
  tablet: 768, // Tablets and small laptops
  desktop: 1024, // Desktop and large tablets
  wide: 1440, // Wide screens
} as const;

// Common Nigerian device resolutions
export const NIGERIAN_DEVICES = {
  // Popular budget smartphones in Nigeria
  tecnoSpark: { width: 360, height: 640, name: 'Tecno Spark Series' },
  infinixHot: { width: 360, height: 640, name: 'Infinix Hot Series' },
  samsungA: { width: 360, height: 740, name: 'Samsung Galaxy A Series' },

  // Mid-range devices
  xiaomiRedmi: { width: 393, height: 851, name: 'Xiaomi Redmi Series' },
  oppoA: { width: 360, height: 780, name: 'Oppo A Series' },

  // Premium devices
  iphone12: { width: 390, height: 844, name: 'iPhone 12/13/14' },
  samsungS: { width: 384, height: 854, name: 'Samsung Galaxy S Series' },

  // Tablets
  ipadMini: { width: 768, height: 1024, name: 'iPad Mini' },
  androidTablet: { width: 800, height: 1280, name: 'Android Tablet' },
} as const;

// Device detection utilities
export const DeviceDetection = {
  // Check if device is mobile
  isMobile: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < BREAKPOINTS.tablet;
  },

  // Check if device is tablet
  isTablet: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= BREAKPOINTS.tablet && window.innerWidth < BREAKPOINTS.desktop;
  },

  // Check if device is desktop
  isDesktop: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= BREAKPOINTS.desktop;
  },

  // Get current device type
  getDeviceType: (): 'mobile' | 'tablet' | 'desktop' => {
    if (DeviceDetection.isMobile()) return 'mobile';
    if (DeviceDetection.isTablet()) return 'tablet';
    return 'desktop';
  },

  // Check if device supports touch
  isTouchDevice: (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  // Get device pixel ratio for high-DPI displays
  getPixelRatio: (): number => {
    if (typeof window === 'undefined') return 1;
    return window.devicePixelRatio || 1;
  },

  // Check if device is in landscape mode
  isLandscape: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > window.innerHeight;
  },

  // Get safe area insets for devices with notches
  getSafeAreaInsets: () => {
    if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 };

    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
    };
  },
};

// React hooks for responsive design
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    deviceType: 'desktop' as 'mobile' | 'tablet' | 'desktop',
    isTouchDevice: false,
    isLandscape: false,
    pixelRatio: 1,
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo({
        isMobile: DeviceDetection.isMobile(),
        isTablet: DeviceDetection.isTablet(),
        isDesktop: DeviceDetection.isDesktop(),
        deviceType: DeviceDetection.getDeviceType(),
        isTouchDevice: DeviceDetection.isTouchDevice(),
        isLandscape: DeviceDetection.isLandscape(),
        pixelRatio: DeviceDetection.getPixelRatio(),
        safeAreaInsets: DeviceDetection.getSafeAreaInsets(),
      });
    };

    // Initial detection
    updateDeviceInfo();

    // Listen for resize and orientation changes
    const handleResize = () => updateDeviceInfo();
    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated
      setTimeout(updateDeviceInfo, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return deviceInfo;
};

// Viewport utilities
export const ViewportUtils = {
  // Get viewport dimensions
  getViewportSize: () => {
    if (typeof window === 'undefined') return { width: 1024, height: 768 };
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  },

  // Get document dimensions
  getDocumentSize: () => {
    if (typeof document === 'undefined') return { width: 1024, height: 768 };
    return {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    };
  },

  // Check if element is in viewport
  isElementInViewport: (element: Element): boolean => {
    const rect = element.getBoundingClientRect();
    const viewport = ViewportUtils.getViewportSize();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= viewport.height &&
      rect.right <= viewport.width
    );
  },

  // Get element position relative to viewport
  getElementViewportPosition: (element: Element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
    };
  },
};

// Touch and gesture utilities
export const TouchUtils = {
  // Minimum touch target size (44px as per Apple/Google guidelines)
  MIN_TOUCH_TARGET: 44,

  // Check if element meets touch target requirements
  isTouchTargetCompliant: (element: Element): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.width >= TouchUtils.MIN_TOUCH_TARGET && rect.height >= TouchUtils.MIN_TOUCH_TARGET;
  },

  // Add touch-friendly padding to elements
  makeTouchFriendly: (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const paddingNeeded = Math.max(
      0,
      TouchUtils.MIN_TOUCH_TARGET - Math.min(rect.width, rect.height)
    );

    if (paddingNeeded > 0) {
      const padding = paddingNeeded / 2;
      element.style.padding = `${padding}px`;
    }
  },

  // Prevent zoom on double tap (for form inputs)
  preventZoom: (element: HTMLElement) => {
    element.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    });
  },
};

// Responsive image utilities
export const ResponsiveImageUtils = {
  // Generate responsive image srcset for Nigerian devices
  generateSrcSet: (baseUrl: string, sizes: number[] = [320, 640, 768, 1024, 1440]): string => {
    return sizes.map((size) => `${baseUrl}?w=${size} ${size}w`).join(', ');
  },

  // Generate sizes attribute for responsive images
  generateSizes: (): string => {
    return [
      `(max-width: ${BREAKPOINTS.mobile}px) 100vw`,
      `(max-width: ${BREAKPOINTS.tablet}px) 50vw`,
      `(max-width: ${BREAKPOINTS.desktop}px) 33vw`,
      '25vw',
    ].join(', ');
  },

  // Get optimal image size for current viewport
  getOptimalImageSize: (): number => {
    const viewport = ViewportUtils.getViewportSize();
    const pixelRatio = DeviceDetection.getPixelRatio();

    // Account for high-DPI displays
    const effectiveWidth = viewport.width * pixelRatio;

    if (effectiveWidth <= BREAKPOINTS.mobile) return 640;
    if (effectiveWidth <= BREAKPOINTS.tablet) return 768;
    if (effectiveWidth <= BREAKPOINTS.desktop) return 1024;
    return 1440;
  },
};

// Performance utilities for mobile
export const MobilePerformanceUtils = {
  // Reduce motion for users who prefer it
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Check if user is on a slow connection
  isSlowConnection: (): boolean => {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) return false;
    const connection = (navigator as any).connection;
    return (
      connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')
    );
  },

  // Get connection information
  getConnectionInfo: () => {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return { effectiveType: '4g', downlink: 10, rtt: 50, saveData: false };
    }

    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType || '4g',
      downlink: connection.downlink || 10,
      rtt: connection.rtt || 50,
      saveData: connection.saveData || false,
    };
  },

  // Optimize for data saver mode
  shouldOptimizeForDataSaver: (): boolean => {
    const connection = MobilePerformanceUtils.getConnectionInfo();
    return connection.saveData || MobilePerformanceUtils.isSlowConnection();
  },
};

// Nigerian market specific utilities
export const NigerianMobileUtils = {
  // Common screen sizes in Nigerian market (based on popular devices)
  getCommonScreenSizes: () => [
    { width: 360, height: 640, name: 'Budget Smartphones' },
    { width: 360, height: 740, name: 'Mid-range Smartphones' },
    { width: 393, height: 851, name: 'Premium Smartphones' },
    { width: 768, height: 1024, name: 'Tablets' },
  ],

  // Optimize for Nigerian network conditions
  getOptimalSettings: () => {
    const connection = MobilePerformanceUtils.getConnectionInfo();
    const isSlowConnection = MobilePerformanceUtils.isSlowConnection();

    return {
      // Reduce image quality on slow connections
      imageQuality: isSlowConnection ? 60 : 80,

      // Lazy load more aggressively on slow connections
      lazyLoadThreshold: isSlowConnection ? '50px' : '100px',

      // Reduce animations on slow connections
      enableAnimations: !isSlowConnection && !MobilePerformanceUtils.prefersReducedMotion(),

      // Preload fewer resources on slow connections
      preloadResources: !isSlowConnection,

      // Use smaller font sizes on very small screens
      baseFontSize: DeviceDetection.isMobile() ? 14 : 16,
    };
  },

  // Currency formatting for mobile displays
  formatCurrencyForMobile: (amount: number): string => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const formatted = formatter.format(amount);

    // Shorten large numbers for mobile display
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(0)}K`;
    }

    return formatted;
  },
};

// Export all utilities
export default {
  DeviceDetection,
  ViewportUtils,
  TouchUtils,
  ResponsiveImageUtils,
  MobilePerformanceUtils,
  NigerianMobileUtils,
  BREAKPOINTS,
  NIGERIAN_DEVICES,
};
