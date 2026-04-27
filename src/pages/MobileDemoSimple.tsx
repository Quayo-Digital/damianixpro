import React from 'react';
import { useDeviceDetection } from '@/utils/mobile';
import { Smartphone, Tablet, Monitor } from 'lucide-react';

export const MobileDemoSimple = () => {
  const deviceInfo = useDeviceDetection();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
        <h1 className="mb-4 text-2xl font-bold">Simple Mobile Demo</h1>

        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-lg font-semibold">Device Information</h2>
            <div className="grid gap-2">
              <div>Device Type: {String(deviceInfo.deviceType)}</div>
              <div>Is Mobile: {String(deviceInfo.isMobile)}</div>
              <div>Is Tablet: {String(deviceInfo.isTablet)}</div>
              <div>Is Desktop: {String(deviceInfo.isDesktop)}</div>
              <div>Touch Device: {String(deviceInfo.isTouchDevice)}</div>
              <div>Landscape: {String(deviceInfo.isLandscape)}</div>
              <div>Pixel Ratio: {String(deviceInfo.pixelRatio)}</div>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold">Device Icon</h2>
            <div className="flex items-center gap-2">
              {deviceInfo.isMobile ? (
                <Smartphone className="h-6 w-6 text-blue-600" />
              ) : deviceInfo.isTablet ? (
                <Tablet className="h-6 w-6 text-green-600" />
              ) : (
                <Monitor className="h-6 w-6 text-gray-600" />
              )}
              <span>Current Device</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDemoSimple;
