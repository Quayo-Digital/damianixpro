/**
 * One-shot drain for public.notification_outbox (cron-friendly).
 *
 * Usage:
 *   NOTIFICATION_WORKER_SECRET=... VOICE_SERVER_URL=http://127.0.0.1:4000 node scripts/drain-notification-outbox.mjs [limit]
 *
 * @see server/notificationSystemService.mjs
 */
import 'dotenv/config';

const base = (process.env.VOICE_SERVER_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
const secret = (process.env.NOTIFICATION_WORKER_SECRET || '').trim();
const limit = Math.min(200, Math.max(1, parseInt(String(process.argv[2] || '50'), 10) || 50));

if (!secret) {
  console.error('Missing NOTIFICATION_WORKER_SECRET');
  process.exit(1);
}

const res = await fetch(`${base}/api/notifications/outbox/process`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-notification-worker-secret': secret,
  },
  body: JSON.stringify({ limit }),
});

const text = await res.text();
console.log(res.status, text);
process.exit(res.ok ? 0 : 1);
