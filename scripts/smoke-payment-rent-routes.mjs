/**
 * Smoke: POST /api/payments/rent and /api/payments/rent/webhook on a running payment API.
 *
 * Loads repo `.env` when present. Base URL resolution:
 *   1) PUBLIC_PAYMENT_BASE_URL
 *   2) http://127.0.0.1:${VOICE_SERVER_PORT} (default 4000 — matches server/index.mjs)
 *
 * Usage:
 *   npm run smoke:payment-rent
 *   PUBLIC_PAYMENT_BASE_URL=http://localhost:4000 node scripts/smoke-payment-rent-routes.mjs
 *
 * Exits: 0 = both routes responded with expected validation errors (400), 1 = failure / unreachable host.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const port = (process.env.VOICE_SERVER_PORT || '4000').trim();
const base =
  process.env.PUBLIC_PAYMENT_BASE_URL?.trim() || `http://127.0.0.1:${port}`;

if (!base.startsWith('http://') && !base.startsWith('https://')) {
  console.error(
    'smoke-payment-rent-routes: PUBLIC_PAYMENT_BASE_URL must be an absolute URL (got: %s)',
    base
  );
  process.exit(2);
}

const root = base.replace(/\/$/, '');

async function post(path, body) {
  const url = `${root}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text.slice(0, 500) };
  }
  return { url, status: res.status, json };
}

async function main() {
  const checks = [];

  checks.push({
    name: 'POST /api/payments/rent (missing tenant_id, amount → 400)',
    want: 400,
    ...(await post('/api/payments/rent', {})),
  });

  checks.push({
    name: 'POST /api/payments/rent/webhook (missing payment_reference → 400)',
    want: 400,
    ...(await post('/api/payments/rent/webhook', {})),
  });

  let failed = false;
  for (const c of checks) {
    const pass = c.status === c.want;
    if (!pass) failed = true;
    console.log(`${pass ? 'OK' : 'FAIL'} ${c.status} (expected ${c.want}) ${c.name}`);
    console.log(`  ${c.url}`);
    console.log(`  ${JSON.stringify(c.json)}`);
  }

  if (failed) {
    process.exit(1);
  }
  console.log('smoke-payment-rent-routes: all checks passed.');
}

main().catch((err) => {
  console.error(
    'smoke-payment-rent-routes: request failed — is the server running?',
    err?.message || err
  );
  console.error('  Tried base URL:', root);
  console.error('  Start the sidecar in another terminal: npm run voice:dev');
  process.exit(1);
});
