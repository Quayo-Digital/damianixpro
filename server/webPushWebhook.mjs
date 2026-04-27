/**
 * POST /api/push/webhook — optional bridge for Supabase Database Webhooks (notifications INSERT).
 * Headers: X-Webhook-Secret: <PUSH_WEBHOOK_SECRET> or Authorization: Bearer <PUSH_WEBHOOK_SECRET>
 * Body: Supabase payload { type, table, record } or a plain { user_id, title, description, link } object.
 */
import { Router } from 'express';
import { isWebPushConfigured, sendWebPushForUser } from './webPushService.mjs';

export function createWebPushWebhookRouter() {
  const router = Router();

  router.post('/webhook', async (req, res) => {
    const secret = process.env.PUSH_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(503).json({ error: 'PUSH_WEBHOOK_SECRET is not set' });
    }
    if (!isWebPushConfigured()) {
      return res.status(503).json({ error: 'VAPID keys are not configured on the server' });
    }

    const headerSecret =
      req.get('x-webhook-secret') ||
      req.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      '';
    if (headerSecret !== secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body || {};
    const record = body.record && typeof body.record === 'object' ? body.record : body;
    const userId = record.user_id;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'user_id is required' });
    }

    await sendWebPushForUser(userId, {
      title: record.title || 'DamianixPro',
      body: record.description || record.message || '',
      url: record.link || '/',
    });

    return res.json({ ok: true });
  });

  return router;
}
