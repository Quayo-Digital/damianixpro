-- Canonical property_tenants table + RLS for tenant payments (Flutterwave / rent_payments).
-- App code expects: rent_amount, deposit_amount, status ('active'), start_date, end_date.
-- After applying: hard-refresh the app (or clear sessionStorage key nh_property_tenants_missing_until).

begin;

-- ---------------------------------------------------------------------------
-- 1. Table (matches CreateLeaseDialog + useEnhancedOwnerData inserts)
-- ---------------------------------------------------------------------------
create table if not exists public.property_tenants (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  start_date date not null default (current_date),
  end_date date,
  rent_amount numeric(12, 2),
  deposit_amount numeric(12, 2),
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (property_id, tenant_id)
);

-- Older scripts used monthly_rent / security_deposit — keep compatible.
alter table public.property_tenants add column if not exists monthly_rent numeric(12, 2);
alter table public.property_tenants add column if not exists security_deposit numeric(12, 2);

update public.property_tenants
set rent_amount = coalesce(rent_amount, monthly_rent)
where rent_amount is null and monthly_rent is not null;

update public.property_tenants
set deposit_amount = coalesce(deposit_amount, security_deposit)
where deposit_amount is null and security_deposit is not null;

create index if not exists idx_property_tenants_property on public.property_tenants (property_id);
create index if not exists idx_property_tenants_tenant on public.property_tenants (tenant_id);
create index if not exists idx_property_tenants_status on public.property_tenants (status);

-- ---------------------------------------------------------------------------
-- 2. updated_at trigger (function exists in remote_schema)
-- ---------------------------------------------------------------------------
drop trigger if exists update_property_tenants_updated_at on public.property_tenants;
create trigger update_property_tenants_updated_at
  before update on public.property_tenants
  for each row
  execute function public.update_updated_at_column ();

-- ---------------------------------------------------------------------------
-- 3. RLS — replace any prior policies so owner + agent + tenant + admin work
-- ---------------------------------------------------------------------------
alter table public.property_tenants enable row level security;

do $p$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'property_tenants'
  loop
    execute format('drop policy if exists %I on public.property_tenants', pol.policyname);
  end loop;
end;
$p$;

create policy "property_tenants_select_tenant"
  on public.property_tenants
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tenants t
      where t.id = property_tenants.tenant_id
        and t.user_id = auth.uid()
    )
  );

create policy "property_tenants_manage_owner"
  on public.property_tenants
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.properties p
      where p.id = property_tenants.property_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.properties p
      where p.id = property_tenants.property_id
        and p.owner_id = auth.uid()
    )
  );

create policy "property_tenants_manage_agent"
  on public.property_tenants
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.properties p
      where p.id = property_tenants.property_id
        and p.agent_id is not null
        and p.agent_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.properties p
      where p.id = property_tenants.property_id
        and p.agent_id is not null
        and p.agent_id = auth.uid()
    )
  );

create policy "property_tenants_admin_all"
  on public.property_tenants
  for all
  to authenticated
  using (public.is_admin (auth.uid()))
  with check (public.is_admin (auth.uid()));

comment on table public.property_tenants is
  'Links tenants to properties for rent collection; rent_payments.property_tenant_id references this.';

-- ---------------------------------------------------------------------------
-- 4. Realtime (optional; safe if already added)
-- ---------------------------------------------------------------------------
do $r$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'property_tenants'
  ) then
    alter publication supabase_realtime add table public.property_tenants;
  end if;
exception
  when undefined_object then
    null;
end;
$r$;

commit;

-- ---------------------------------------------------------------------------
-- After migrate: if payments still say "lease not linked", insert a row linking
-- the tenant to the property (replace UUIDs), then hard-refresh the browser:
--
-- insert into public.property_tenants (property_id, tenant_id, start_date, rent_amount, status)
-- values (
--   '<property-uuid>',
--   (select id from public.tenants where user_id = '<tenant-auth-user-uuid>' limit 1),
--   current_date,
--   500000,
--   'active'
-- )
-- on conflict (property_id, tenant_id) do update set
--   rent_amount = excluded.rent_amount,
--   status = excluded.status,
--   updated_at = now();
-- ---------------------------------------------------------------------------
