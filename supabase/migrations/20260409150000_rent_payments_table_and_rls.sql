-- Create rent_payments + payment_breakdowns tables with grants + RLS.
-- Matches columns used by paymentService.ts insertPendingRentPayment and backfill migrations.

begin;

-- ---------------------------------------------------------------------------
-- 1. rent_payments
-- ---------------------------------------------------------------------------
create table if not exists public.rent_payments (
  id uuid primary key default gen_random_uuid(),
  property_tenant_id uuid not null references public.property_tenants (id) on delete cascade,
  amount numeric(12, 2) not null,
  payment_date date,
  due_date date,
  reference text,
  status text default 'pending',
  payment_method text,
  transaction_id text,
  category text,
  description text,
  is_recurring boolean default false,
  recurring_type text,
  next_payment_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_rent_payments_property_tenant on public.rent_payments (property_tenant_id);
create index if not exists idx_rent_payments_date on public.rent_payments (payment_date);
create index if not exists idx_rent_payments_status on public.rent_payments (status);
create index if not exists idx_rent_payments_reference on public.rent_payments (reference);
create index if not exists idx_rent_payments_due_date on public.rent_payments (due_date);

-- updated_at trigger
drop trigger if exists update_rent_payments_updated_at on public.rent_payments;
create trigger update_rent_payments_updated_at
  before update on public.rent_payments
  for each row
  execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 2. payment_breakdowns (optional companion)
-- ---------------------------------------------------------------------------
create table if not exists public.payment_breakdowns (
  id uuid primary key default gen_random_uuid(),
  rent_payment_id uuid not null references public.rent_payments (id) on delete cascade,
  category text not null,
  amount numeric(12, 2) not null,
  description text,
  created_at timestamptz default now()
);

create index if not exists idx_payment_breakdowns_rent_payment on public.payment_breakdowns (rent_payment_id);

-- ---------------------------------------------------------------------------
-- 3. Grants
-- ---------------------------------------------------------------------------
grant select, insert, update on public.rent_payments to authenticated;
grant select, insert on public.payment_breakdowns to authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
alter table public.rent_payments enable row level security;
alter table public.payment_breakdowns enable row level security;

-- Drop any stale policies
do $p$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'rent_payments' loop
    execute format('drop policy if exists %I on public.rent_payments', pol.policyname);
  end loop;
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'payment_breakdowns' loop
    execute format('drop policy if exists %I on public.payment_breakdowns', pol.policyname);
  end loop;
end;
$p$;

-- Tenant: select + insert own payments (via property_tenants link)
create policy "rent_payments_tenant_select"
  on public.rent_payments for select to authenticated
  using (
    exists (
      select 1 from public.property_tenants pt
      join public.tenants t on t.id = pt.tenant_id
      where pt.id = rent_payments.property_tenant_id
        and t.user_id = auth.uid()
    )
  );

create policy "rent_payments_tenant_insert"
  on public.rent_payments for insert to authenticated
  with check (
    exists (
      select 1 from public.property_tenants pt
      join public.tenants t on t.id = pt.tenant_id
      where pt.id = rent_payments.property_tenant_id
        and t.user_id = auth.uid()
    )
  );

-- Owner: select payments for their properties
create policy "rent_payments_owner_select"
  on public.rent_payments for select to authenticated
  using (
    exists (
      select 1 from public.property_tenants pt
      join public.properties p on p.id = pt.property_id
      where pt.id = rent_payments.property_tenant_id
        and p.owner_id = auth.uid()
    )
  );

-- Admin: full access
create policy "rent_payments_admin_all"
  on public.rent_payments for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- payment_breakdowns: tenant select
create policy "payment_breakdowns_tenant_select"
  on public.payment_breakdowns for select to authenticated
  using (
    exists (
      select 1 from public.rent_payments rp
      join public.property_tenants pt on pt.id = rp.property_tenant_id
      join public.tenants t on t.id = pt.tenant_id
      where rp.id = payment_breakdowns.rent_payment_id
        and t.user_id = auth.uid()
    )
  );

-- payment_breakdowns: owner select
create policy "payment_breakdowns_owner_select"
  on public.payment_breakdowns for select to authenticated
  using (
    exists (
      select 1 from public.rent_payments rp
      join public.property_tenants pt on pt.id = rp.property_tenant_id
      join public.properties p on p.id = pt.property_id
      where rp.id = payment_breakdowns.rent_payment_id
        and p.owner_id = auth.uid()
    )
  );

-- payment_breakdowns: admin full
create policy "payment_breakdowns_admin_all"
  on public.payment_breakdowns for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 5. Realtime (optional)
-- ---------------------------------------------------------------------------
do $r$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rent_payments'
  ) then
    alter publication supabase_realtime add table public.rent_payments;
  end if;
exception when undefined_object then null;
end;
$r$;

commit;
