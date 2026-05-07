import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Baseline middleware for `server/index.mjs` and `server/ttsServer.mjs`.
 * CORS: set `VOICE_SERVER_CORS_ORIGIN` or `CORS_ORIGIN` (comma-separated), or `*` for dynamic reflect (default).
 */
export function applyVoiceServerSecurity(app, { jsonLimit = '2mb' } = {}) {
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
  }

  app.use(
    helmet({
      // Keep CSP off for API server responses to avoid accidental integration breakage.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hsts: process.env.NODE_ENV === 'production',
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  const raw = (process.env.VOICE_SERVER_CORS_ORIGIN || process.env.CORS_ORIGIN || '*').trim();
  app.use(
    cors({
      origin: raw === '*' ? true : raw.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );

  const windowMs = Math.min(
    3_600_000,
    Math.max(1000, Number(process.env.VOICE_SERVER_RATE_LIMIT_WINDOW_MS) || 60_000),
  );
  const max = Math.min(
    50_000,
    Math.max(10, Number(process.env.VOICE_SERVER_RATE_LIMIT_MAX) || 300),
  );
  app.use(
    rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' },
    }),
  );

  app.use(
    express.json({
      limit: jsonLimit,
      verify: (req, _res, buf) => {
        req.rawBody = buf.toString('utf8');
      },
    }),
  );
}

export function createStrictRouteLimiter({
  windowMs = 60_000,
  max = 60,
  message = 'Too many requests for this endpoint.',
} = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'RATE_LIMITED', message },
  });
}
