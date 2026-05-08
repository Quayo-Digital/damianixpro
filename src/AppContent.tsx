import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import AppRoutes from './App.routes';
import { SessionTimeoutGuard } from '@/components/security/SessionTimeoutGuard';
import { MfaGate } from '@/components/security/MfaGate';
import { NotificationRealtimeSubscriber } from '@/components/notifications/NotificationRealtimeSubscriber';
import { WebPushSubscriber } from '@/components/notifications/WebPushSubscriber';
import { SupportChatbot } from '@/components/support/SupportChatbot';
import { OfflineQueueGate } from '@/components/offline/OfflineQueueGate';
import { PendingSyncBadge } from '@/components/offline/PendingSyncBadge';

export function AppContent() {
  return (
    <div className="min-h-screen bg-background">
      <SessionTimeoutGuard />
      <NotificationRealtimeSubscriber />
      <WebPushSubscriber />
      <OfflineQueueGate />
      <Toaster richColors visibleToasts={5} closeButton />
      <MfaGate>
        <AppRoutes />
      </MfaGate>
      <SupportChatbot />
      <PendingSyncBadge />
    </div>
  );
}
