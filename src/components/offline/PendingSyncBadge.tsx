import React from 'react';
import { CloudOff, Loader2, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

function relativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

/**
 * Floating chip surfaced when there are pending offline mutations waiting to
 * sync. Click to open a popover that lists pending items and lets the user
 * trigger a manual retry or cancel an item.
 */
export function PendingSyncBadge(): React.ReactElement | null {
  const { pending, draining, lastError, items, retryNow, cancelItem } = useOfflineQueue();

  if (pending === 0 && !lastError) return null;

  const Icon = draining ? Loader2 : CloudOff;
  const label = draining
    ? `Syncing ${pending}…`
    : pending > 0
      ? `${pending} pending sync`
      : 'Sync error';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 shadow-md transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/60"
        >
          <Icon className={`h-4 w-4 ${draining ? 'animate-spin' : ''}`} />
          <span>{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Pending sync</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            These changes were saved on your device. They&apos;ll be sent automatically when
            you&apos;re back online.
          </p>
        </div>

        {lastError && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-100">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>{lastError}</span>
            </div>
          </div>
        )}

        <ul className="max-h-72 divide-y divide-border overflow-y-auto">
          {items.length === 0 ? (
            <li className="px-4 py-3 text-xs text-muted-foreground">
              All changes have been synced.
            </li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Queued {relativeTime(item.createdAt)}
                    {item.attempts > 0 &&
                      ` · ${item.attempts} attempt${item.attempts > 1 ? 's' : ''}`}
                  </p>
                  {item.lastErrorMessage && (
                    <p className="mt-1 line-clamp-2 text-xs text-amber-700 dark:text-amber-300">
                      {item.lastErrorMessage}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Cancel ${item.label}`}
                  onClick={() => cancelItem(item.id)}
                  disabled={draining}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))
          )}
        </ul>

        {items.length > 0 && (
          <div className="border-t border-border px-4 py-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={retryNow}
              disabled={draining}
            >
              {draining ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
              )}
              {draining ? 'Syncing…' : 'Try sync now'}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default PendingSyncBadge;
