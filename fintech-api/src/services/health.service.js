import { pool } from '../db/pool.js';

export async function checkDatabase() {
  const start = Date.now();
  try {
    await pool.query('SELECT 1 AS ok');
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: e instanceof Error ? e.message : 'unknown',
    };
  }
}
