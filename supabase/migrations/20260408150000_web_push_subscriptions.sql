-- Store Web Push subscriptions (one row per browser/device per user).

begin;

create table if not exists public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists idx_web_push_subscriptions_user_id
  on public.web_push_subscriptions (user_id);

alter table public.web_push_subscriptions enable row level security;

drop policy if exists "Users manage own web push subscriptions" on public.web_push_subscriptions;
create policy "Users manage own web push subscriptions"
  on public.web_push_subscriptions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
