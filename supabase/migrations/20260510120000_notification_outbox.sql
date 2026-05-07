-- Durable notification queue for multi-channel delivery (email, SMS, WhatsApp, in-app).
-- Written by the Node sidecar (service role). Processed by worker endpoint or inline drain.

begin;

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  trigger_key text not null,
  template_id text not null default 'default',
  channel text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'dead')),
  scheduled_at timestamptz not null default now(),
  attempts int not null default 0,
  max_attempts int not null default 5,
  payload jsonb not null default '{}'::jsonb,
  recipient jsonb not null default '{}'::jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notification_outbox_pending
  on public.notification_outbox (status, scheduled_at, created_at)
  where status = 'pending';

comment on table public.notification_outbox is
  'Queued outbound notifications. Extend triggers in server/notifications/templates.mjs + outboxTriggers.mjs.';

drop trigger if exists trg_notification_outbox_updated on public.notification_outbox;
create trigger trg_notification_outbox_updated
  before update on public.notification_outbox
  for each row execute function public.update_updated_at_column();

alter table public.notification_outbox enable row level security;

-- No policies: only service_role / postgres used by the sidecar.

commit;
