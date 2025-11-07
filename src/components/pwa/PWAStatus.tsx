/**
 * PWA Status Component
 * Shows connection status and offline capabilities for Nigerian users
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Download, Smartphone } from 'lucide-react';

interface NetworkInfo {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

const PWAStatus: React.FC = () => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isOnline: navigator.onLine
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    // Check if PWA is installed
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    // Monitor network status
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection;
      setNetworkInfo({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt
      });
    };

    // Check service worker and cache status
    const checkCacheStatus = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (registration) {
            setCacheStatus('ready');
          }
        }
      } catch (error) {
        setCacheStatus('error');
      }
    };

    // Initial checks
    checkInstallStatus();
    updateNetworkInfo();
    checkCacheStatus();

    // Event listeners
    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);
    
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  const getNetworkBadge = () => {
    if (!networkInfo.isOnline) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      );
    }

    const { effectiveType, downlink } = networkInfo;
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let label = "Online";

    if (effectiveType) {
      if (effectiveType === '2g') {
        variant = "destructive";
        label = "2G";
      } else if (effectiveType === '3g') {
        variant = "secondary";
        label = "3G";
      } else if (effectiveType === '4g') {
        variant = "default";
        label = "4G";
      }
    }

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Wifi className="h-3 w-3" />
        {label}
        {downlink && ` (${downlink.toFixed(1)}Mbps)`}
      </Badge>
    );
  };

  const getCacheBadge = () => {
    if (cacheStatus === 'ready') {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Download className="h-3 w-3" />
          Cached
        </Badge>
      );
    }
    return null;
  };

  const getInstallBadge = () => {
    if (isInstalled) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <Smartphone className="h-3 w-3" />
          App Mode
        </Badge>
      );
    }
    return null;
  };

  // Only show on mobile or when offline
  const shouldShow = !networkInfo.isOnline || window.innerWidth <= 768 || isInstalled;
  
  if (!shouldShow) return null;

  return (
    <div className="fixed top-4 right-4 z-40 flex flex-col gap-1">
      {getNetworkBadge()}
      {getCacheBadge()}
      {getInstallBadge()}
    </div>
  );
};

export default PWAStatus;
