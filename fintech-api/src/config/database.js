/**
 * DB entry point for services — keeps imports stable if pool implementation changes.
 */
export { pool, withTransaction } from '../db/pool.js';
