/**
 * One-shot drain for import jobs worker scaffold.
 *
 * Usage:
 *   IMPORT_WORKER_SECRET=... VOICE_SERVER_URL=http://127.0.0.1:4000 node scripts/drain-import-jobs.mjs [limit] [--execute]
 *
 * Default mode is dry-run claim/requeue. Pass --execute to run scaffold terminal-failure path.
 */
import 'dotenv/config';

const base = (process.env.VOICE_SERVER_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
const secret = (process.env.IMPORT_WORKER_SECRET || '').trim();
const limit = Math.min(100, Math.max(1, Number.parseInt(String(process.argv[2] || '10'), 10) || 10));
const execute = process.argv.includes('--execute');

if (!secret) {
  console.error('Missing IMPORT_WORKER_SECRET');
  process.exit(1);
}

const res = await fetch(`${base}/api/imports/worker/process`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-import-worker-secret': secret,
  },
  body: JSON.stringify({
    limit,
    dry_run: !execute,
  }),
});

const text = await res.text();
console.log(res.status, text);
process.exit(res.ok ? 0 : 1);
