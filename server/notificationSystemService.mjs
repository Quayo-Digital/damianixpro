/**
 * Notification system HTTP surface (worker + metrics).
 *
 * POST /api/notifications/outbox/process
 * Header: x-notification-worker-secret: <NOTIFICATION_WORKER_SECRET>
 * Body: { "limit": 50 } (optional)
 *
 * GET /api/notifications/outbox/stats  (same secret header)
 */

import express from 'express';
import { supabaseAdmin } from './supabaseClient.mjs';
import { processOutboxBatch } from './notifications/outboxCore.mjs';

const router = express.Router();

/** @returns {true} if response already sent (caller must stop). */
function assertWorkerSecret(req, res) {
  const expected = (process.env.NOTIFICATION_WORKER_SECRET || '').trim();
  if (!expected) {
    res.status(503).json({ error: 'NOTIFICATION_WORKER_SECRET is not configured.' });
    return true;
  }
  const got =
    req.headers['x-notification-worker-secret'] ||
    req.headers['X-Notification-Worker-Secret'];
  if (got !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return true;
  }
  return false;
}

router.post('/api/notifications/outbox/process', async (req, res) => {
  if (assertWorkerSecret(req, res)) return;
  try {
    const limit = Math.min(200, Math.max(1, parseInt(String(req.body?.limit || '40'), 10) || 40));
    const result = await processOutboxBatch(limit);
    return res.json({ ok: true, ...result });
  } catch (e) {
    console.error('[notifications/worker]', e);
    return res.status(500).json({ error: e?.message || 'process failed' });
  }
});

router.get('/api/notifications/outbox/stats', async (req, res) => {
  if (assertWorkerSecret(req, res)) return;
  if (!supabaseAdmin) return res.status(500).json({ error: 'Not configured.' });
  try {
    const { count: pending } = await supabaseAdmin
      .from('notification_outbox')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    const { count: processing } = await supabaseAdmin
      .from('notification_outbox')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing');
    const { count: dead } = await supabaseAdmin
      .from('notification_outbox')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'dead');
    return res.json({
      pending: pending ?? 0,
      processing: processing ?? 0,
      dead: dead ?? 0,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'stats failed' });
  }
});

export function createNotificationSystemRouter() {
  return router;
}
