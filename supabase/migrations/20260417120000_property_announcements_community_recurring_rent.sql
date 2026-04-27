-- Property-scoped announcements, resident community posts, and Flutterwave recurring rent mandates.
-- Requires: public.properties, public.tenants, public.property_tenants, public.is_admin, public.check_property_access

begin;

-- ---------------------------------------------------------------------------
-- 1. Property announcements (replace demo feeds; managers post, residents read)
-- ---------------------------------------------------------------------------
create table if not exists public.property_announcements (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  title text not null,
  body text not null,
  audience text not null default 'all' check (audience in ('all', 'residential', 'commercial')),
  created_by uuid references auth.users (id) on delete set null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_announcements_property_published_idx
  on public.property_announcements (property_id, published_at desc);

drop trigger if exists update_property_announcements_updated_at on public.property_announcements;

create trigger update_property_announcements_updated_at
  before update on public.property_announcements
  for each row
  execute function public.update_updated_at_column();

alter table public.property_announcements enable row level security;

do $p$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'property_announcements'
  loop
    execute format('drop policy if exists %I on public.property_announcements', pol.policyname);
  end loop;
end;
$p$;

create policy "property_announcements_select_residents"
  on public.property_announcements
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.property_tenants pt
      inner join public.tenants t on t.id = pt.tenant_id
      where pt.property_id = property_announcements.property_id
        and t.user_id = auth.uid()
        and coalesce(pt.status, 'active') = 'active'
        and (pt.end_date is null or pt.end_date >= current_date)
    )
    or public.is_admin(auth.uid())
    or public.check_property_access(property_id, auth.uid())
  );

create policy "property_announcements_write_managers"
  on public.property_announcements
  for insert
  to authenticated
  with check (
    public.is_admin(auth.uid())
    or public.check_property_access(property_id, auth.uid())
  );

create policy "property_announcements_update_managers"
  on public.property_announcements
  for update
  to authenticated
  using (
    public.is_admin(auth.uid())
    or public.check_property_access(property_id, auth.uid())
  )
  with check (
    public.is_admin(auth.uid())
    or public.check_property_access(property_id, auth.uid())
  );

create policy "property_announcements_delete_managers"
  on public.property_announcements
  for delete
  to authenticated
  using (
    public.is_admin(auth.uid())
    or public.check_property_access(property_id, auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 2. Resident community posts (optional board per property)
-- ---------------------------------------------------------------------------
create table if not exists public.resident_community_posts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resident_community_posts_property_created_idx
  on public.resident_community_posts (property_id, created_at desc);

drop trigger if exists update_resident_community_posts_updated_at on public.resident_community_posts;

create trigger update_resident_community_posts_updated_at
  before update on public.resident_community_posts
  for each row
  execute function public.update_updated_at_column();

alter table public.resident_community_posts enable row level security;

do $p$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'resident_community_posts'
  loop
    execute format('drop policy if exists %I on public.resident_community_posts', pol.policyname);
  end loop;
end;
$p$;

create policy "community_posts_select"
  on public.resident_community_posts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.property_tenants pt
      inner join public.tenants t on t.id = pt.tenant_id
      where pt.property_id = resident_community_posts.property_id
        and t.user_id = auth.uid()
        and coalesce(pt.status, 'active') = 'active'
        and (pt.end_date is null or pt.end_date >= current_date)
    )
    or public.is_admin(auth.uid())
    or public.check_property_access(property_id, auth.uid())
  );

create policy "community_posts_insert_resident_or_manager"
  on public.resident_community_posts
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and (
      public.check_property_access(property_id, auth.uid())
      or exists (
        select 1
        from public.property_tenants pt
        inner join public.tenants t on t.id = pt.tenant_id
        where pt.property_id = resident_community_posts.property_id
          and t.user_id = auth.uid()
          and coalesce(pt.status, 'active') = 'active'
          and (pt.end_date is null or pt.end_date >= current_date)
      )
    )
  );

create policy "community_posts_update_own_or_manager"
  on public.resident_community_posts
  for update
  to authenticated
  using (
    author_id = auth.uid()
    or public.is_admin(auth.uid())
    or public.check_property_access(property_id, auth.uid())
  )
  with check (
    author_id = auth.uid()
    or public.is_admin(auth.uid())
    or public.check_property_access(property_id, auth.uid())
  );

create policy "community_posts_delete_own_or_manager"
  on public.resident_community_posts
  for delete
  to authenticated
  using (
    author_id = auth.uid()
    or public.is_admin(auth.uid())
    or public.check_property_access(property_id, auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 3. Recurring rent mandates (Flutterwave authorization capture via webhook)
-- ---------------------------------------------------------------------------
create table if not exists public.rent_recurrence_mandates (
  id uuid primary key default gen_random_uuid(),
  tenant_user_id uuid not null references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  property_tenant_id uuid references public.property_tenants (id) on delete set null,
  provider text not null default 'flutterwave',
  status text not null default 'pending_authorization'
    check (status in ('pending_authorization', 'active', 'paused', 'cancelled', 'failed')),
  amount_ngn numeric(14, 2) not null,
  frequency text not null default 'monthly' check (frequency in ('monthly')),
  flutterwave_authorization_code text,
  card_last4 text,
  card_brand text,
  last_successful_charge_at timestamptz,
  next_charge_due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rent_recurrence_mandates_tenant_user_idx
  on public.rent_recurrence_mandates (tenant_user_id);

create index if not exists rent_recurrence_mandates_property_idx
  on public.rent_recurrence_mandates (property_id);

create unique index if not exists rent_recurrence_mandates_one_active_per_tenancy
  on public.rent_recurrence_mandates (tenant_id, property_id)
  where status = 'active';

drop trigger if exists update_rent_recurrence_mandates_updated_at on public.rent_recurrence_mandates;

create trigger update_rent_recurrence_mandates_updated_at
  before update on public.rent_recurrence_mandates
  for each row
  execute function public.update_updated_at_column();

alter table public.rent_recurrence_mandates enable row level security;

do $p$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'rent_recurrence_mandates'
  loop
    execute format('drop policy if exists %I on public.rent_recurrence_mandates', pol.policyname);
  end loop;
end;
$p$;

create policy "rent_recurrence_select_own_or_manager"
  on public.rent_recurrence_mandates
  for select
  to authenticated
  using (
    tenant_user_id = auth.uid()
    or public.is_admin(auth.uid())
    or public.check_property_access(property_id, auth.uid())
  );

create policy "rent_recurrence_insert_own"
  on public.rent_recurrence_mandates
  for insert
  to authenticated
  with check (tenant_user_id = auth.uid());

create policy "rent_recurrence_update_own_or_manager"
  on public.rent_recurrence_mandates
  for update
  to authenticated
  using (
    tenant_user_id = auth.uid()
    or public.is_admin(auth.uid())
    or public.check_property_access(property_id, auth.uid())
  )
  with check (
    tenant_user_id = auth.uid()
    or public.is_admin(auth.uid())
    or public.check_property_access(property_id, auth.uid())
  );

commit;
