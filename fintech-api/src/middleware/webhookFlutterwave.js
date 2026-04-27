/**
 * Flutterwave webhook signature check (`verif-hash` header).
 * Uses timing-safe comparison to reduce timing side-channels.
 */
import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

/**
 * Express middleware — compare `verif-hash` header to FLUTTERWAVE_SECRET_HASH.
 * In production the hash must be configured or requests are rejected with 503.
 */
export function validateFlutterwaveWebhookSignature(req, res, next) {
  const expected = env.flutterwaveSecretHash;
  if (!expected) {
    if (env.isProd) {
      return res.status(503).json({ error: 'Webhook secret hash not configured' });
    }
    return next();
  }

  const received = req.headers['verif-hash'];
  if (received == null || typeof received !== 'string') {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const a = Buffer.from(received.trim(), 'utf8');
  const b = Buffer.from(String(expected).trim(), 'utf8');

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
}
