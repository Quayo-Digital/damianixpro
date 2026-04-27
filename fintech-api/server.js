/**
 * Ledger / wallet API entry — Postgres via DATABASE_URL, JWT auth, Flutterwave webhook at POST /api/webhooks/flutterwave.
 * Separate from the property sidecar: see docs/ARCHITECTURE_RUNTIMES.md and repo root server/index.mjs.
 */
import { createApp } from './src/app.js';
import { env } from './src/config/env.js';
import { pool } from './src/db/pool.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.info(`[fintech-api] listening on :${env.port} (${env.nodeEnv})`);
});

async function shutdown(signal) {
  console.info(`[fintech-api] ${signal} received, closing…`);
  server.close(() => {
    console.info('[fintech-api] HTTP server closed');
  });
  await pool.end();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
