import { supabase } from '@/integrations/supabase/client';

const LS_KEY = 'push-notifications';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getVapidPublicKey(): string | undefined {
  const k = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  return k?.trim() || undefined;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Re-subscribe when the user previously enabled push (e.g. new browser session).
 */
export async function ensureWebPushSubscription(userId: string): Promise<boolean> {
  if (!isPushSupported() || !getVapidPublicKey()) return false;
  if (localStorage.getItem(LS_KEY) !== 'true') return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    const key = getVapidPublicKey()!;
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    }
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    const { error } = await supabase.from('web_push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        user_agent: navigator.userAgent.slice(0, 512),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,endpoint' }
    );
    return !error;
  } catch {
    return false;
  }
}

export async function subscribeWebPush(userId: string): Promise<{ ok: boolean; message?: string }> {
  if (!isPushSupported()) {
    return { ok: false, message: 'Push notifications are not supported in this browser.' };
  }
  const vapid = getVapidPublicKey();
  if (!vapid) {
    return {
      ok: false,
      message: 'Push is not configured (missing VITE_VAPID_PUBLIC_KEY).',
    };
  }

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    return { ok: false, message: 'Notification permission was not granted.' };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid),
    });
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, message: 'Could not read push subscription keys.' };
    }

    const { error } = await supabase.from('web_push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        user_agent: navigator.userAgent.slice(0, 512),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,endpoint' }
    );

    if (error) {
      return { ok: false, message: error.message };
    }
    localStorage.setItem(LS_KEY, 'true');
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Subscription failed.';
    return { ok: false, message: msg };
  }
}

export async function unsubscribeWebPush(userId: string): Promise<void> {
  localStorage.setItem(LS_KEY, 'false');
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await supabase
        .from('web_push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);
    } else {
      await supabase.from('web_push_subscriptions').delete().eq('user_id', userId);
    }
  } catch {
    await supabase.from('web_push_subscriptions').delete().eq('user_id', userId);
  }
}
