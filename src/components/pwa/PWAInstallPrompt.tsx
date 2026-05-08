/**
 * PWA Install Prompt Component
 * Provides native app-like installation experience for Nigerian users
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone, Wifi, Zap } from 'lucide-react';
import { logger } from '@/utils/logger';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after a delay for better UX
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      logger.debug('PWA install choice', { outcome });

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      logger.error('Error during PWA installation', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or dismissed recently
  if (isInstalled) return null;

  const dismissedTime = localStorage.getItem('pwa-install-dismissed');
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
    return null;
  }

  if (!showPrompt && !isIOS) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-blue-100 p-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Install DamianixPro</h3>
              <p className="text-sm text-gray-600">Get the app experience</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Zap className="h-4 w-4 text-green-500" />
            <span>Faster loading & offline access</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Wifi className="h-4 w-4 text-blue-500" />
            <span>Works with slow Nigerian networks</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Download className="h-4 w-4 text-purple-500" />
            <span>Property alerts & notifications</span>
          </div>
        </div>

        {isIOS ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">To install on iPhone/iPad:</p>
            <ol className="ml-4 space-y-1 text-xs text-gray-600">
              <li>1. Tap the Share button in Safari</li>
              <li>2. Scroll down and tap "Add to Home Screen"</li>
              <li>3. Tap "Add" to install</li>
            </ol>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!deferredPrompt}
            >
              <Download className="mr-2 h-4 w-4" />
              Install App
            </Button>
            <Button variant="outline" onClick={handleDismiss} className="px-3">
              Later
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PWAInstallPrompt;
