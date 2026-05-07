-- Flutterwave-first rent settlement: fee breakdown, double-entry wallet lines, arrears, audit trail.
-- Idempotent per rent_payment_id via rent_payment_accounting_finalized.
-- Does not remove existing rent_payments / payment_webhook_events / journal RPCs — extends them.

-- ---------------------------------------------------------------------------
-- 1) payment_breakdowns: ensure wide columns (matches create_journal_entries_from_rent_payment)
-- ---------------------------------------------------------------------------
alter table public.payment_breakdowns add column if not exists payment_id uuid references public.rent_payments (id) on delete cascade;
alter table public.payment_breakdowns add column if not exists total_amount numeric(14, 2);
alter table public.payment_breakdowns add column if not exists platform_fee numeric(14, 2);
alter table public.payment_breakdowns add column if not exists agent_commission numeric(14, 2);
alter table public.payment_breakdowns add column if not exists owner_amount numeric(14, 2);
alter table public.payment_breakdowns add column if not exists tax_amount numeric(14, 2);
alter table public.payment_breakdowns add column if not exists tax_rate numeric(8, 6);
alter table public.payment_breakdowns add column if not exists paid_to_owner boolean default false;

do $cat$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'payment_breakdowns' and column_name = 'category'
  ) then
    alter table public.payment_breakdowns alter column category drop not null;
  end if;
end $cat$;

-- Backfill payment_id from legacy rent_payment_id when present
do $bk$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'payment_breakdowns' and column_name = 'rent_payment_id'
  ) then
    update public.payment_breakdowns pb
    set payment_id = pb.rent_payment_id
    where pb.payment_id is null and pb.rent_payment_id is not null;
  end if;
end $bk$;

create unique index if not exists idx_payment_breakdowns_payment_id_unique
  on public.payment_breakdowns (payment_id)
  where payment_id is not null;

-- ---------------------------------------------------------------------------
-- 2) Audit trail (append-only)
-- ---------------------------------------------------------------------------
create table if not exists public.payment_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  rent_payment_id uuid references public.rent_payments (id) on delete set null,
  property_tenant_id uuid,
  action text not null,
  provider text,
  external_id text,
  details jsonb not null default '{}'::jsonb
);

create index if not exists payment_audit_log_payment_idx on public.payment_audit_log (rent_payment_id, created_at desc);
create index if not exists payment_audit_log_external_idx on public.payment_audit_log (provider, external_id);

comment on table public.payment_audit_log is
  'Immutable-style audit log for payment settlement (Flutterwave and other providers).';

alter table public.payment_audit_log enable row level security;

-- ---------------------------------------------------------------------------
-- 3) Idempotent accounting completion gate (one successful finalize per rent payment)
-- ---------------------------------------------------------------------------
create table if not exists public.rent_payment_accounting_finalized (
  rent_payment_id uuid primary key references public.rent_payments (id) on delete cascade,
  provider text not null default 'flutterwave',
  external_id text,
  journal_batch_id uuid,
  wallet_batch_id uuid,
  finalized_at timestamptz not null default now()
);

comment on table public.rent_payment_accounting_finalized is
  'Exactly-once rent payment accounting (journal + wallets + arrears).';

alter table public.rent_payment_accounting_finalized enable row level security;

-- ---------------------------------------------------------------------------
-- 4) Wallets: one per property_tenant (tenant scope) and one per organization (owner pool / escrow)
-- ---------------------------------------------------------------------------
create table if not exists public.payment_wallets (
  id uuid primary key default gen_random_uuid(),
  property_tenant_id uuid references public.property_tenants (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  currency text not null default 'NGN',
  balance_ngn numeric(14, 2) not null default 0,
  cumulative_inflow_ngn numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_wallets_one_scope check (
    (property_tenant_id is not null and organization_id is null)
    or (property_tenant_id is null and organization_id is not null)
  )
);

create unique index if not exists payment_wallets_property_tenant_uidx
  on public.payment_wallets (property_tenant_id)
  where property_tenant_id is not null;

create unique index if not exists payment_wallets_organization_uidx
  on public.payment_wallets (organization_id)
  where organization_id is not null;

comment on table public.payment_wallets is
  'Balances: tenant wallet tracks cumulative inflow + optional running balance; org wallet tracks owner-escrow liability.';

alter table public.payment_wallets enable row level security;

-- ---------------------------------------------------------------------------
-- 5) Double-entry wallet lines (balanced per batch)
-- ---------------------------------------------------------------------------
create table if not exists public.wallet_entry_batches (
  id uuid primary key default gen_random_uuid(),
  rent_payment_id uuid not null references public.rent_payments (id) on delete cascade,
  provider text,
  external_id text,
  created_at timestamptz not null default now(),
  constraint wallet_entry_batches_payment_unique unique (rent_payment_id)
);

create table if not exists public.wallet_entry_lines (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.wallet_entry_batches (id) on delete cascade,
  line_no smallint not null,
  account_code text not null,
  debit_ngn numeric(14, 2) not null default 0 check (debit_ngn >= 0),
  credit_ngn numeric(14, 2) not null default 0 check (credit_ngn >= 0),
  narrative text,
  constraint wallet_entry_lines_one_side check (
    (debit_ngn > 0 and credit_ngn = 0) or (credit_ngn > 0 and debit_ngn = 0)
  ),
  constraint wallet_entry_lines_batch_line unique (batch_id, line_no)
);

create index if not exists wallet_entry_lines_batch_idx on public.wallet_entry_lines (batch_id);

comment on table public.wallet_entry_lines is
  'Double-entry lines per settlement batch; sum(debits) must equal sum(credits).';

alter table public.wallet_entry_batches enable row level security;
alter table public.wallet_entry_lines enable row level security;

-- ---------------------------------------------------------------------------
-- 6) Arrears snapshot (recomputed on each successful settlement)
-- ---------------------------------------------------------------------------
create table if not exists public.property_tenant_arrears (
  property_tenant_id uuid primary key references public.property_tenants (id) on delete cascade,
  overdue_ngn numeric(14, 2) not null default 0,
  outstanding_ngn numeric(14, 2) not null default 0,
  last_successful_payment_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.property_tenant_arrears is
  'overdue_ngn: non-successful rent_payments with due_date < today; outstanding_ngn: all non-successful.';

create index if not exists property_tenant_arrears_updated_idx on public.property_tenant_arrears (updated_at desc);

alter table public.property_tenant_arrears enable row level security;

-- ---------------------------------------------------------------------------
-- 7) ensure_payment_breakdown_for_payment
-- ---------------------------------------------------------------------------
create or replace function public.ensure_payment_breakdown_for_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  v_amount numeric(14, 2);
  v_pt_id uuid;
  v_prop_agent_rate numeric;
  v_agent_rate numeric;
  v_cfg_agent_rate numeric;
  v_platform_rate numeric;
  v_tax_rate numeric;
  v_platform_fee numeric;
  v_agent_comm numeric;
  v_tax numeric;
  v_owner numeric;
begin
  if exists (select 1 from public.payment_breakdowns where payment_id = p_payment_id limit 1) then
    return;
  end if;

  select rp.amount, rp.property_tenant_id, p.agent_commission_rate
    into v_amount, v_pt_id, v_prop_agent_rate
  from public.rent_payments rp
  join public.property_tenants pt on pt.id = rp.property_tenant_id
  join public.properties p on p.id = pt.property_id
  where rp.id = p_payment_id;

  if v_amount is null then
    raise exception 'rent_payment not found: %', p_payment_id;
  end if;

  select
    coalesce(max(case when key = 'platform_fee_rate' then (value #>> '{}')::numeric end), 0.05),
    coalesce(max(case when key = 'default_tax_rate' then (value #>> '{}')::numeric end), 0.075),
    coalesce(max(case when key = 'default_agent_commission_rate' then (value #>> '{}')::numeric end), 0.03)
  into v_platform_rate, v_tax_rate, v_cfg_agent_rate
  from public.accounting_config
  where key in ('platform_fee_rate', 'default_tax_rate', 'default_agent_commission_rate');

  v_agent_rate := coalesce(v_prop_agent_rate, v_cfg_agent_rate, 0.03);

  v_platform_fee := round(v_amount * v_platform_rate, 2);
  v_agent_comm := round(v_amount * v_agent_rate, 2);
  v_tax := round(v_amount * v_tax_rate, 2);
  v_owner := round(v_amount - (v_platform_fee + v_agent_comm + v_tax), 2);

  insert into public.payment_breakdowns (
    payment_id, total_amount, platform_fee, agent_commission, owner_amount, tax_amount, tax_rate, paid_to_owner
  )
  select p_payment_id, v_amount, v_platform_fee, v_agent_comm, v_owner, v_tax, v_tax_rate, false
  where not exists (select 1 from public.payment_breakdowns pb where pb.payment_id = p_payment_id);
end;
$fn$;

-- ---------------------------------------------------------------------------
-- 8) refresh_property_tenant_arrears
-- ---------------------------------------------------------------------------
create or replace function public.refresh_property_tenant_arrears(p_property_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  v_overdue numeric(14, 2);
  v_outstanding numeric(14, 2);
  v_last_paid timestamptz;
begin
  select
    coalesce(sum(case
      when lower(coalesce(rp.status, '')) <> 'successful'
        and rp.due_date is not null
        and rp.due_date < current_date
      then rp.amount else 0 end), 0),
    coalesce(sum(case
      when lower(coalesce(rp.status, '')) <> 'successful' then rp.amount else 0 end), 0)
  into v_overdue, v_outstanding
  from public.rent_payments rp
  where rp.property_tenant_id = p_property_tenant_id;

  select max(rp.updated_at)
  into v_last_paid
  from public.rent_payments rp
  where rp.property_tenant_id = p_property_tenant_id
    and lower(coalesce(rp.status, '')) = 'successful';

  insert into public.property_tenant_arrears (
    property_tenant_id, overdue_ngn, outstanding_ngn, last_successful_payment_at, updated_at
  ) values (
    p_property_tenant_id, v_overdue, v_outstanding, v_last_paid, now()
  )
  on conflict (property_tenant_id) do update set
    overdue_ngn = excluded.overdue_ngn,
    outstanding_ngn = excluded.outstanding_ngn,
    last_successful_payment_at = excluded.last_successful_payment_at,
    updated_at = now();
end;
$fn$;

-- ---------------------------------------------------------------------------
-- 9) apply_wallet_entries_for_rent_payment (balanced batch)
-- ---------------------------------------------------------------------------
create or replace function public.apply_wallet_entries_for_rent_payment(
  p_payment_id uuid,
  p_provider text,
  p_external_id text,
  p_property_tenant_id uuid,
  p_organization_id uuid,
  p_total numeric,
  p_owner_pool numeric
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  v_batch uuid := gen_random_uuid();
  v_tenant_wallet uuid;
  v_org_wallet uuid;
  v_sum_dr numeric(14, 2);
  v_sum_cr numeric(14, 2);
begin
  if exists (select 1 from public.wallet_entry_batches where rent_payment_id = p_payment_id) then
    select id into v_batch from public.wallet_entry_batches where rent_payment_id = p_payment_id limit 1;
    return v_batch;
  end if;

  if not exists (select 1 from public.payment_wallets w where w.property_tenant_id = p_property_tenant_id) then
    insert into public.payment_wallets (property_tenant_id, organization_id, currency)
    values (p_property_tenant_id, null, 'NGN');
  end if;

  if not exists (select 1 from public.payment_wallets w where w.organization_id = p_organization_id) then
    insert into public.payment_wallets (property_tenant_id, organization_id, currency)
    values (null, p_organization_id, 'NGN');
  end if;

  select id into v_tenant_wallet from public.payment_wallets where property_tenant_id = p_property_tenant_id limit 1;
  select id into v_org_wallet from public.payment_wallets where organization_id = p_organization_id limit 1;

  if v_tenant_wallet is null or v_org_wallet is null then
    raise exception 'wallet resolution failed for payment %', p_payment_id;
  end if;

  insert into public.wallet_entry_batches (id, rent_payment_id, provider, external_id)
  values (v_batch, p_payment_id, p_provider, p_external_id);

  -- Double-entry: tenant cumulative inflow (credit cash to tenant clearing); mirror debit gateway clearing.
  -- Lines 1–2: tenant scope (full payment acknowledged)
  insert into public.wallet_entry_lines (batch_id, line_no, account_code, debit_ngn, credit_ngn, narrative)
  values
    (v_batch, 1, 'TENANT_RENT_CLEARING', p_total, 0, 'Rent settlement — tenant obligation reduced'),
    (v_batch, 2, 'GATEWAY_SETTLEMENT', 0, p_total, 'Rent settlement — gateway inflow');

  -- Lines 3–4: organization owner escrow (owner pool portion)
  if p_owner_pool > 0 then
    insert into public.wallet_entry_lines (batch_id, line_no, account_code, debit_ngn, credit_ngn, narrative)
    values
      (v_batch, 3, 'GATEWAY_SETTLEMENT', p_owner_pool, 0, 'Allocate to owner escrow'),
      (v_batch, 4, 'ORG_OWNER_ESCROW', 0, p_owner_pool, 'Owner pool liability');
  end if;

  select coalesce(sum(debit_ngn), 0), coalesce(sum(credit_ngn), 0)
  into v_sum_dr, v_sum_cr
  from public.wallet_entry_lines
  where batch_id = v_batch;

  if v_sum_dr <> v_sum_cr then
    raise exception 'wallet batch % not balanced: dr % cr %', v_batch, v_sum_dr, v_sum_cr;
  end if;

  update public.payment_wallets
  set
    cumulative_inflow_ngn = cumulative_inflow_ngn + p_total,
    balance_ngn = balance_ngn + p_total,
    updated_at = now()
  where id = v_tenant_wallet;

  update public.payment_wallets
  set
    balance_ngn = balance_ngn + p_owner_pool,
    updated_at = now()
  where id = v_org_wallet;

  return v_batch;
end;
$fn$;

-- ---------------------------------------------------------------------------
-- 10) finalize_rent_payment_flutterwave — single entry point after successful rent_payments row
-- ---------------------------------------------------------------------------
create or replace function public.finalize_rent_payment_flutterwave(
  p_payment_id uuid,
  p_provider text default 'flutterwave',
  p_external_id text default null::text,
  p_property_id uuid default null::uuid,
  p_tenant_user_id uuid default null::uuid,
  p_entry_date date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  v_st text;
  v_pt_id uuid;
  v_org_id uuid;
  v_batch uuid;
  v_wallet_batch uuid;
  v_owner_amt numeric(14, 2);
  v_total numeric(14, 2);
begin
  if exists (select 1 from public.rent_payment_accounting_finalized where rent_payment_id = p_payment_id) then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  select lower(coalesce(status, '')), property_tenant_id
  into v_st, v_pt_id
  from public.rent_payments
  where id = p_payment_id
  for update;

  if v_pt_id is null then
    return jsonb_build_object('ok', false, 'reason', 'payment_not_found');
  end if;

  if v_st <> 'successful' then
    return jsonb_build_object('ok', false, 'reason', 'payment_not_successful');
  end if;

  perform public.ensure_payment_breakdown_for_payment(p_payment_id);

  v_batch := public.create_journal_entries_from_rent_payment(
    p_payment_id,
    p_entry_date,
    p_property_id,
    p_tenant_user_id
  );

  select pb.owner_amount, pb.total_amount
  into v_owner_amt, v_total
  from public.payment_breakdowns pb
  where pb.payment_id = p_payment_id
  limit 1;

  if v_total is null then
    return jsonb_build_object('ok', false, 'reason', 'breakdown_missing');
  end if;

  select p.organization_id
  into v_org_id
  from public.property_tenants pt
  join public.properties p on p.id = pt.property_id
  where pt.id = v_pt_id
  limit 1;

  if v_org_id is null then
    v_org_id := '00000000-0000-0000-0000-000000000001'::uuid;
  end if;

  v_wallet_batch := public.apply_wallet_entries_for_rent_payment(
    p_payment_id,
    p_provider,
    p_external_id,
    v_pt_id,
    v_org_id,
    v_total,
    coalesce(v_owner_amt, 0)
  );

  perform public.refresh_property_tenant_arrears(v_pt_id);

  insert into public.payment_audit_log (rent_payment_id, property_tenant_id, action, provider, external_id, details)
  values (
    p_payment_id,
    v_pt_id,
    'accounting_finalized',
    p_provider,
    p_external_id,
    jsonb_build_object(
      'journal_batch_id', v_batch,
      'wallet_batch_id', v_wallet_batch,
      'organization_id', v_org_id
    )
  );

  insert into public.rent_payment_accounting_finalized (
    rent_payment_id, provider, external_id, journal_batch_id, wallet_batch_id
  ) values (
    p_payment_id, p_provider, p_external_id, v_batch, v_wallet_batch
  );

  return jsonb_build_object(
    'ok', true,
    'journal_batch_id', v_batch,
    'wallet_batch_id', v_wallet_batch
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', true, 'duplicate', true);
end;
$fn$;

grant execute on function public.ensure_payment_breakdown_for_payment(uuid) to service_role;
grant execute on function public.refresh_property_tenant_arrears(uuid) to service_role;
grant execute on function public.apply_wallet_entries_for_rent_payment(uuid, text, text, uuid, uuid, numeric, numeric) to service_role;
grant execute on function public.finalize_rent_payment_flutterwave(uuid, text, text, uuid, uuid, date) to service_role;

grant select on public.payment_audit_log to authenticated;
grant select on public.property_tenant_arrears to authenticated;
grant select on public.payment_wallets to authenticated;
grant select on public.wallet_entry_batches to authenticated;
grant select on public.wallet_entry_lines to authenticated;
grant select on public.rent_payment_accounting_finalized to authenticated;

-- Authenticated read policies (minimal; service role bypasses)
drop policy if exists payment_audit_log_select_own on public.payment_audit_log;
create policy payment_audit_log_select_own on public.payment_audit_log
  for select to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.rent_payments rp
      join public.property_tenants pt on pt.id = rp.property_tenant_id
      join public.tenants t on t.id = pt.tenant_id
      where rp.id = payment_audit_log.rent_payment_id and t.user_id = auth.uid()
    )
  );

drop policy if exists property_tenant_arrears_select on public.property_tenant_arrears;
create policy property_tenant_arrears_select on public.property_tenant_arrears
  for select to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.property_tenants pt
      join public.tenants t on t.id = pt.tenant_id
      where pt.id = property_tenant_arrears.property_tenant_id and t.user_id = auth.uid()
    )
    or exists (
      select 1 from public.property_tenants pt
      join public.properties p on p.id = pt.property_id
      where pt.id = property_tenant_arrears.property_tenant_id
        and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
    )
  );

drop policy if exists payment_wallets_select on public.payment_wallets;
create policy payment_wallets_select on public.payment_wallets
  for select to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.property_tenants pt
      join public.tenants t on t.id = pt.tenant_id
      where pt.id = payment_wallets.property_tenant_id and t.user_id = auth.uid()
    )
  );
