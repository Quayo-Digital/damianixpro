-- Cross-handler idempotency: same gateway event must not run accounting twice when both
-- Supabase Edge Functions and the Node server receive the same webhook (or on retries).
--
-- Legacy backfill: public.payments (Flutterwave-style org ledger) → rent_payments when resolvable.

begin;

-- ---------------------------------------------------------------------------
-- payment_webhook_events
-- ---------------------------------------------------------------------------
create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_id text not null,
  created_at timestamptz not null default now(),
  constraint payment_webhook_events_provider_check check (
    provider in (
      'flutterwave',
      'paystack',
      'rent_callback'
    )
  ),
  constraint payment_webhook_events_provider_external_unique unique (provider, external_id)
);

comment on table public.payment_webhook_events is
  'Idempotency ledger for payment webhooks; first insert wins across Edge + Node.';

create index if not exists payment_webhook_events_created_at_idx
  on public.payment_webhook_events (created_at desc);

alter table public.payment_webhook_events enable row level security;

-- No policies: service role bypasses RLS; anon/authenticated have no access.

-- ---------------------------------------------------------------------------
-- Backfill: public.payments → rent_payments
-- ---------------------------------------------------------------------------
do $migration$
declare
  v_inserted integer := 0;
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'payments'
  ) then
    raise notice 'backfill payments: table public.payments missing, skipping';
    return;
  end if;

  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'rent_payments'
  ) then
    raise notice 'backfill payments: rent_payments missing, skipping';
    return;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'rent_payments' and column_name = 'property_tenant_id'
  ) then
    raise notice 'backfill payments: rent_payments.property_tenant_id missing, skipping';
    return;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'payments' and column_name = 'tx_ref'
  ) then
    raise notice 'backfill payments: payments.tx_ref missing, skipping';
    return;
  end if;

  alter table public.rent_payments
    add column if not exists is_recurring boolean default false;

  with resolved as (
    select
      p.id as source_id,
      p.tenant_id as payer_user_id,
      p.amount,
      nullif(trim(p.tx_ref), '') as tx_ref,
      p.status,
      p.paid_at,
      p.created_at,
      coalesce(
        (
          select t.id
          from public.tenants t
          where t.user_id = p.tenant_id
          limit 1
        ),
        (
          select t2.id
          from public.users u
          join public.tenants t2
            on lower(trim(t2.email)) = lower(trim(u.email))
          where u.id = p.tenant_id
            and u.email is not null
            and trim(u.email) <> ''
            and t2.email is not null
            and trim(t2.email) <> ''
          limit 1
        )
      ) as tenant_pk
    from public.payments p
    where p.tx_ref is not null
      and trim(p.tx_ref) <> ''
  ),
  with_pt as (
    select
      r.*,
      (
        select pt.id
        from public.property_tenants pt
        where pt.tenant_id = r.tenant_pk
        order by pt.created_at desc nulls last
        limit 1
      ) as property_tenant_id
    from resolved r
    where r.tenant_pk is not null
  ),
  to_insert as (
    select
      gen_random_uuid() as id,
      w.property_tenant_id,
      w.amount,
      w.tx_ref as reference,
      case lower(trim(coalesce(w.status, 'pending')))
        when 'completed' then 'successful'
        when 'successful' then 'successful'
        when 'failed' then 'failed'
        when 'cancelled' then 'cancelled'
        else 'pending'
      end as status,
      case
        when lower(trim(coalesce(w.status, 'pending'))) in ('completed', 'successful')
        then coalesce(w.paid_at::date, w.created_at::date)
        else null
      end as payment_date,
      coalesce(w.paid_at::date, w.created_at::date) as due_date,
      'rent' as category,
      'Legacy public.payments backfill' as description,
      'legacy_import' as payment_method,
      coalesce(w.created_at, now()) as created_at,
      coalesce(w.created_at, now()) as updated_at
    from with_pt w
    where w.property_tenant_id is not null
      and not exists (
        select 1
        from public.rent_payments rp
        where lower(trim(rp.reference)) = lower(trim(w.tx_ref))
      )
  )
  insert into public.rent_payments (
    id,
    property_tenant_id,
    amount,
    reference,
    status,
    payment_date,
    due_date,
    category,
    description,
    payment_method,
    is_recurring,
    created_at,
    updated_at
  )
  select
    t.id,
    t.property_tenant_id,
    t.amount,
    t.reference,
    t.status,
    t.payment_date,
    t.due_date,
    t.category,
    t.description,
    t.payment_method,
    false,
    t.created_at,
    t.updated_at
  from to_insert t;

  get diagnostics v_inserted = row_count;
  raise notice 'backfill public.payments → rent_payments: inserted % rows', v_inserted;
end $migration$;

commit;
