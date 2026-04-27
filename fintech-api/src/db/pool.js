import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

function buildConfig() {
  if (env.databaseUrl) {
    return {
      connectionString: env.databaseUrl,
      max: Number(process.env.PG_POOL_MAX) || 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    };
  }

  if (!env.pg.host || !env.pg.user || !env.pg.database) {
    throw new Error('Set DATABASE_URL or PGHOST, PGUSER, PGDATABASE (and PGPASSWORD if needed)');
  }

  return {
    host: env.pg.host,
    port: env.pg.port || 5432,
    user: env.pg.user,
    password: env.pg.password,
    database: env.pg.database,
    max: Number(process.env.PG_POOL_MAX) || 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };
}

export const pool = new Pool(buildConfig());

pool.on('error', (err) => {
  console.error('[db] unexpected pool error', err);
});

/**
 * Run work inside a transaction (BEGIN / COMMIT / ROLLBACK).
 * @param {(client: import('pg').PoolClient) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
