/**
 * Web Push (VAPID) — send notifications to browsers that registered via web_push_subscriptions.
 * Requires VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and optional VAPID_SUBJECT (mailto:...).
 */
import webpush from 'web-push';
import { supabaseAdmin } from './supabaseClient.mjs';

const vapidPublic = (process.env.VAPID_PUBLIC_KEY || '').trim();
const vapidPrivate = (process.env.VAPID_PRIVATE_KEY || '').trim();
const vapidSubject = (process.env.VAPID_SUBJECT || 'mailto:support@damianixpro.com').trim();

let configured = false;
if (vapidPublic && vapidPrivate) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    configured = true;
  } catch (e) {
    console.error('[web-push] Failed to set VAPID details', e?.message);
  }
}

export function isWebPushConfigured() {
  return configured;
}

/**
 * @param {string} userId
 * @param {{ title?: string, body?: string, url?: string }} payload
 * @returns {Promise<boolean>} true if at least one subscription received the push
 */
export async function sendWebPushForUser(userId, payload) {
  if (!configured || !supabaseAdmin || !userId) return false;

  const title = payload.title || 'DamianixPro';
  const body = payload.body || '';
  const url = payload.url || '/tenant';
  const data = JSON.stringify({ title, body, url });

  const { data: subs, error } = await supabaseAdmin
    .from('web_push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error) {
    console.warn('[web-push] Failed to load subscriptions', error.message);
    return false;
  }
  if (!subs?.length) return false;

  let anyOk = false;
  for (const sub of subs) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };
    try {
      await webpush.sendNotification(pushSub, data, {
        TTL: 86_400,
        urgency: 'normal',
      });
      anyOk = true;
    } catch (e) {
      const code = e?.statusCode;
      if (code === 404 || code === 410) {
        await supabaseAdmin.from('web_push_subscriptions').delete().eq('id', sub.id);
      } else {
        console.warn('[web-push] Send failed', code || e?.message);
      }
    }
  }
  return anyOk;
}
