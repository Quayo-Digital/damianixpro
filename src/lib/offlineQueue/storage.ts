import { createStore, get, set, del, keys } from 'idb-keyval';
import { logger } from '@/utils/logger';
import type { OfflineQueueItem } from './types';

const STORE = createStore('dxp-offline-queue', 'queue-v1');

const queueKey = (userId: string) => `queue:${userId}`;

function isItem(value: unknown): value is OfflineQueueItem {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.attempts === 'number' &&
    typeof v.createdAt === 'number'
  );
}

export async function loadQueue(userId: string): Promise<OfflineQueueItem[]> {
  try {
    const value = await get<unknown>(queueKey(userId), STORE);
    if (!Array.isArray(value)) return [];
    return value.filter(isItem);
  } catch (err) {
    logger.error('offlineQueue: failed to load from IDB', { err });
    return [];
  }
}

export async function saveQueue(userId: string, items: OfflineQueueItem[]): Promise<void> {
  try {
    if (items.length === 0) {
      await del(queueKey(userId), STORE);
      return;
    }
    await set(queueKey(userId), items, STORE);
  } catch (err) {
    logger.error('offlineQueue: failed to persist to IDB', { err });
  }
}

export async function clearQueue(userId: string): Promise<void> {
  try {
    await del(queueKey(userId), STORE);
  } catch (err) {
    logger.error('offlineQueue: failed to clear', { err });
  }
}

/** Used by debug tooling; not currently exposed in product UI. */
export async function listQueueOwners(): Promise<string[]> {
  try {
    const all = await keys(STORE);
    return all
      .map((k) => (typeof k === 'string' ? k : ''))
      .filter((k) => k.startsWith('queue:'))
      .map((k) => k.slice('queue:'.length));
  } catch (err) {
    logger.error('offlineQueue: failed to list owners', { err });
    return [];
  }
}
