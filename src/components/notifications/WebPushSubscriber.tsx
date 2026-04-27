import { useEffect } from 'react';
import { useAuthSession } from '@/contexts/auth';
import { ensureWebPushSubscription, getVapidPublicKey } from '@/lib/webPush';

/**
 * Re-registers the browser push subscription when the user previously opted in
 * (e.g. after login or SW update), if VITE_VAPID_PUBLIC_KEY is set.
 */
export function WebPushSubscriber() {
  const { user } = useAuthSession();

  useEffect(() => {
    if (!user?.id || !getVapidPublicKey()) return;
    void ensureWebPushSubscription(user.id);
  }, [user?.id]);

  return null;
}
