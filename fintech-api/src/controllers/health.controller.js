import * as healthService from '../services/health.service.js';

export function live(_req, res) {
  res.json({ status: 'ok' });
}

export async function ready(req, res) {
  const db = await healthService.checkDatabase();
  const ok = db.ok;
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ready' : 'degraded',
    checks: { database: db },
    requestId: req.id,
  });
}

export async function me(req, res) {
  res.json({
    authenticated: Boolean(req.auth),
    subject: req.auth?.sub ?? null,
    requestId: req.id,
  });
}
