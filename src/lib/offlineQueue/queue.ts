import { onlineManager, type QueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { loadQueue, saveQueue, clearQueue } from './storage';
import { getOfflineHandler } from './handlers';
import {
  OfflineQueueFatalError,
  type OfflineHandlerName,
  type OfflineQueueItem,
  type OfflineQueueSnapshot,
} from './types';

const MAX_ATTEMPTS = 6;
const BASE_BACKOFF_MS = 800;
const MAX_BACKOFF_MS = 30_000;

type Listener = (snapshot: OfflineQueueSnapshot) => void;

let activeUserId: string | null = null;
let items: OfflineQueueItem[] = [];
let draining = false;
let drainPromise: Promise<void> | null = null;
let lastError: string | null = null;
let queryClientRef: QueryClient | null = null;
const listeners = new Set<Listener>();

function snapshot(): OfflineQueueSnapshot {
  return {
    pending: items.length,
    draining,
    lastError,
    items: items.map((it) => ({ ...it })),
    scope: activeUserId,
  };
}

function notify(): void {
  const snap = snapshot();
  for (const l of listeners) {
    try {
      l(snap);
    } catch (err) {
      logger.error('offlineQueue: listener threw', { err });
    }
  }
}

async function persist(): Promise<void> {
  if (!activeUserId) return;
  await saveQueue(activeUserId, items);
}

function isOnlineNow(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine && onlineManager.isOnline();
}

function backoffMs(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** Math.max(0, attempts - 1), MAX_BACKOFF_MS);
}

async function executeOne(item: OfflineQueueItem): Promise<'success' | 'retry' | 'drop'> {
  const handler = getOfflineHandler(item.name);
  if (!handler) {
    item.lastErrorMessage = `No handler for "${item.name}"`;
    item.lastErrorAt = Date.now();
    return 'drop';
  }
  try {
    item.attempts += 1;
    await handler.execute(item.payload, item);
    return 'success';
  } catch (err) {
    if (err instanceof OfflineQueueFatalError) {
      item.lastErrorMessage = err.message;
      item.lastErrorAt = Date.now();
      return 'drop';
    }
    const message = err instanceof Error ? err.message : String(err);
    item.lastErrorMessage = message;
    item.lastErrorAt = Date.now();
    if (item.attempts >= MAX_ATTEMPTS) {
      logger.error('offlineQueue: dropping after max attempts', {
        name: item.name,
        attempts: item.attempts,
        message,
      });
      return 'drop';
    }
    return 'retry';
  }
}

export function setQueryClient(qc: QueryClient): void {
  queryClientRef = qc;
}

export async function init(userId: string): Promise<void> {
  if (activeUserId === userId) return;
  activeUserId = userId;
  items = await loadQueue(userId);
  notify();
  if (items.length > 0 && isOnlineNow()) {
    void drain();
  }
}

export async function signOut(): Promise<void> {
  await persist();
  activeUserId = null;
  items = [];
  draining = false;
  drainPromise = null;
  lastError = null;
  notify();
}

export async function clearForUser(userId: string): Promise<void> {
  if (activeUserId === userId) {
    items = [];
    notify();
  }
  await clearQueue(userId);
}

export function getActiveUserId(): string | null {
  return activeUserId;
}

export async function enqueue<P>(
  name: OfflineHandlerName,
  payload: P
): Promise<OfflineQueueItem<P>> {
  if (!activeUserId) {
    throw new Error('offlineQueue.enqueue: no active user — call init(userId) first');
  }
  const handler = getOfflineHandler<P>(name);
  if (!handler) {
    throw new Error(`offlineQueue.enqueue: no handler registered for "${name}"`);
  }
  const item: OfflineQueueItem<P> = {
    id: crypto.randomUUID(),
    name,
    payload,
    attempts: 0,
    lastErrorMessage: null,
    lastErrorAt: null,
    createdAt: Date.now(),
    label: handler.label(payload),
  };
  items.push(item as OfflineQueueItem);
  await persist();
  notify();
  if (isOnlineNow()) {
    void drain();
  }
  return item;
}

export async function cancel(id: string): Promise<void> {
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return;
  items.splice(idx, 1);
  await persist();
  notify();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  try {
    listener(snapshot());
  } catch {
    /* swallow: a buggy listener shouldn't crash subscription */
  }
  return () => {
    listeners.delete(listener);
  };
}

async function invalidateAfterDrain(processed: Set<OfflineHandlerName>): Promise<void> {
  const qc = queryClientRef;
  if (!qc) return;
  const tasks: Promise<unknown>[] = [];
  if (processed.has('create-maintenance-request')) {
    tasks.push(
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey;
          if (!Array.isArray(k)) return false;
          const head = String(k[0] ?? '');
          return head === 'maintenance-requests' || head === 'maintenance';
        },
      })
    );
  }
  if (processed.has('mark-notification-read')) {
    tasks.push(
      qc.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'notifications',
      })
    );
  }
  await Promise.allSettled(tasks);
}

export function drain(): Promise<void> {
  if (drainPromise) return drainPromise;
  drainPromise = (async () => {
    if (!activeUserId) return;
    if (!isOnlineNow()) return;
    if (items.length === 0) return;

    draining = true;
    lastError = null;
    notify();

    const processed = new Set<OfflineHandlerName>();

    try {
      while (items.length > 0 && isOnlineNow()) {
        const item = items[0];
        const result = await executeOne(item);

        if (result === 'success') {
          items.shift();
          processed.add(item.name);
          await persist();
          notify();
          continue;
        }

        if (result === 'drop') {
          items.shift();
          lastError = item.lastErrorMessage;
          await persist();
          notify();
          continue;
        }

        // retry: persist updated attempt count, sleep with backoff, then loop.
        await persist();
        notify();
        await new Promise((resolve) => setTimeout(resolve, backoffMs(item.attempts)));
        if (!isOnlineNow()) break;
      }
    } finally {
      draining = false;
      notify();
      void invalidateAfterDrain(processed);
    }
  })();
  drainPromise.finally(() => {
    drainPromise = null;
  });
  return drainPromise;
}

/**
 * Try the mutation directly while online; if the network attempt fails with a
 * non-fatal error, or if we are offline, enqueue it for later replay.
 *
 * Handlers MUST be idempotent so an inline-then-queued sequence cannot
 * double-write (e.g. via a `client_request_id` UNIQUE index server-side).
 */
export async function tryOnlineThenEnqueue<P>(
  name: OfflineHandlerName,
  payload: P
): Promise<{ mode: 'submitted' } | { mode: 'queued'; item: OfflineQueueItem<P> }> {
  const handler = getOfflineHandler<P>(name);
  if (!handler) {
    throw new Error(`offlineQueue: no handler registered for "${name}"`);
  }

  if (isOnlineNow()) {
    try {
      await handler.execute(payload, {
        id: 'inline',
        name,
        payload,
        attempts: 1,
        lastErrorMessage: null,
        lastErrorAt: null,
        createdAt: Date.now(),
        label: handler.label(payload),
      });
      return { mode: 'submitted' };
    } catch (err) {
      if (err instanceof OfflineQueueFatalError) throw err;
      logger.warn('offlineQueue: inline attempt failed; queuing for retry', {
        name,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (!activeUserId) {
    // Edge case: handler called before init (e.g. anonymous user). Surface a
    // clear error rather than silently swallowing the write.
    throw new Error(
      'offlineQueue: cannot queue mutation without an active user; sign in to retry later'
    );
  }

  const item = await enqueue(name, payload);
  return { mode: 'queued', item };
}
