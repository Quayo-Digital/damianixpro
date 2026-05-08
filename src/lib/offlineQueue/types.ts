/**
 * Offline write queue — public types.
 *
 * The queue is intentionally narrow: it only handles a small allow-list of
 * mutations whose endpoints are idempotent (or naturally so). Adding a new
 * handler requires both a registration here and a server-side guarantee that
 * a replayed request will not double-write.
 */

export type OfflineHandlerName = 'create-maintenance-request' | 'mark-notification-read';

export interface OfflineQueueItem<P = unknown> {
  /** Stable client-generated id. Also used as the idempotency key. */
  id: string;
  name: OfflineHandlerName;
  payload: P;
  attempts: number;
  lastErrorMessage: string | null;
  lastErrorAt: number | null;
  createdAt: number;
  /** Human-readable label snapshot (computed at enqueue time). */
  label: string;
}

export interface OfflineQueueHandler<P> {
  name: OfflineHandlerName;
  /** Stable label for UI display. */
  label: (payload: P) => string;
  /**
   * Execute the queued mutation. Throwing `OfflineQueueFatalError` drops the
   * item and surfaces the error to the user. Any other throw is treated as
   * transient and retried with exponential backoff up to MAX_ATTEMPTS, after
   * which the item is dropped with an error label.
   *
   * Implementations MUST be idempotent: a successful prior run that the
   * client never confirmed must not produce a duplicate row.
   */
  execute: (payload: P, item: OfflineQueueItem<P>) => Promise<void>;
}

export class OfflineQueueRetryableError extends Error {
  constructor(
    message: string,
    public override cause?: unknown
  ) {
    super(message);
    this.name = 'OfflineQueueRetryableError';
  }
}

export class OfflineQueueFatalError extends Error {
  constructor(
    message: string,
    public override cause?: unknown
  ) {
    super(message);
    this.name = 'OfflineQueueFatalError';
  }
}

export interface OfflineQueueSnapshot {
  pending: number;
  draining: boolean;
  /** Last drain error surfaced to UI; cleared on next successful drain. */
  lastError: string | null;
  items: ReadonlyArray<OfflineQueueItem>;
  /** Currently-active userId, or null when signed out. */
  scope: string | null;
}
