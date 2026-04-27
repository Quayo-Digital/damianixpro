/**
 * Rate limits — IP-based blanket limit for /api plus optional per-route user limits after auth.
 */
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Applied to all `/api` traffic (before route handlers).
 * Webhook path gets a higher limit so bursts from Flutterwave are less likely to 429.
 */
export function createApiIpRateLimiter() {
  return rateLimit({
    windowMs: env.rateLimitWindowMs,
    limit: (req) => {
      const p = req.path || '';
      if (p.includes('/webhooks/flutterwave')) {
        return env.rateLimitWebhookMax;
      }
      return env.rateLimitIpMax;
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: 'Too many requests', code: 'rate_limited' } },
  });
}

/**
 * Stricter cap for sensitive money movement (use after `requireAuth`).
 * Keys by authenticated `sub`, falls back to IP.
 */
export function createSensitiveUserRateLimiter() {
  return rateLimit({
    windowMs: env.rateLimitWindowMs,
    limit: env.rateLimitSensitiveMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const sub = /** @type {{ auth?: { sub?: string } }} */ (req).auth?.sub;
      if (sub) return `user:${sub}`;
      return `ip:${req.ip || 'unknown'}`;
    },
    message: { error: { message: 'Too many requests', code: 'rate_limited_sensitive' } },
  });
}

/** Shared instance so rate-limit state is not reset per import site. */
export const sensitiveUserRateLimiter = createSensitiveUserRateLimiter();
