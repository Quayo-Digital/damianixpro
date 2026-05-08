-- Offline write queue idempotency support
--
-- The client-side offline write queue (src/lib/offlineQueue/*) replays a
-- queued mutation once connectivity returns. If a previous attempt actually
-- succeeded but the client never saw the response (network drop mid-reply),
-- naive retry would create a duplicate row. We protect against this by
-- attaching a client-generated UUID to each queued mutation and enforcing
-- uniqueness on it server-side.
--
-- A partial UNIQUE index (WHERE client_request_id IS NOT NULL) keeps the
-- column entirely optional for legacy / online inserts that do not supply a
-- key, and only deduplicates rows that explicitly opt in.

ALTER TABLE public.maintenance_requests
  ADD COLUMN IF NOT EXISTS client_request_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS maintenance_requests_client_request_id_uniq
  ON public.maintenance_requests (client_request_id)
  WHERE client_request_id IS NOT NULL;

COMMENT ON COLUMN public.maintenance_requests.client_request_id IS
  'Client-generated UUID set by the offline write queue. The partial unique '
  'index on this column makes inserts idempotent: if a queued INSERT is '
  'replayed after a flaky online attempt that actually succeeded, the second '
  'attempt fails with a unique-violation that the client treats as success.';
