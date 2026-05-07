-- Portfolio onboarding: stable property keys for migrations, import job audit trail,
-- wizard state, and tenant visibility for owners/agents linked via property_tenants.

begin;

-- Align with app RBAC: super_admin should manage portfolio data same as admin.
drop policy if exists "Owners can create properties" on public.properties;

create policy "Owners can create properties"
  on public.properties
  as permissive
  for insert
  to public
  with check (
    (owner_id = auth.uid())
    and exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = any (array['owner'::text, 'admin'::text, 'super_admin'::text])
    )
  );

-- ---------------------------------------------------------------------------
-- 1) properties.migration_external_ref — match rows across Excel & re-imports
-- ---------------------------------------------------------------------------
alter table public.properties
  add column if not exists migration_external_ref text;

create unique index if not exists properties_org_migration_ref_unique
  on public.properties (organization_id, migration_external_ref)
  where migration_external_ref is not null and btrim(migration_external_ref) <> '';

comment on column public.properties.migration_external_ref is
  'Stable id from legacy systems / imports; unique per organization when set.';

-- Tracks rows created via bulk onboarding so INSERT ... RETURNING is visible under RLS.
alter table public.tenants add column if not exists created_by_import_user_id uuid;

drop policy if exists "tenants_select_import_creator" on public.tenants;

create policy "tenants_select_import_creator"
  on public.tenants
  for select
  to authenticated
  using (
    tenants.created_by_import_user_id is not null
      and tenants.created_by_import_user_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- 2) Tenant SELECT for owners & assigned agents (insert already allows user_id IS NULL)
-- ---------------------------------------------------------------------------
drop policy if exists "tenants_select_via_property_link_owner_agent" on public.tenants;

create policy "tenants_select_via_property_link_owner_agent"
  on public.tenants
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.property_tenants pt
      join public.properties p on p.id = pt.property_id
      where pt.tenant_id = tenants.id
        and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 3) Saved wizard progress (resume on large rollouts)
-- ---------------------------------------------------------------------------
create table if not exists public.organization_setup_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  step int not null default 0,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists organization_setup_state_user_id_idx
  on public.organization_setup_state (user_id);

drop trigger if exists organization_setup_state_updated_at on public.organization_setup_state;
create trigger organization_setup_state_updated_at
  before update on public.organization_setup_state
  for each row
  execute function public.update_updated_at_column ();

alter table public.organization_setup_state enable row level security;

drop policy if exists "organization_setup_state_own_all" on public.organization_setup_state;

create policy "organization_setup_state_own_all"
  on public.organization_setup_state
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.organization_setup_state to authenticated;

comment on table public.organization_setup_state is
  'Persisted company onboarding / migration wizard state per user.';

-- ---------------------------------------------------------------------------
-- 4) Import job log (auditing, large-org batch tracking)
-- ---------------------------------------------------------------------------
create table if not exists public.data_import_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  import_kind text not null
    constraint data_import_jobs_kind_ck
      check (
        import_kind in (
          'properties',
          'tenants',
          'properties_and_tenants'
        )
      ),
  file_name text,
  status text not null default 'draft'
    constraint data_import_jobs_status_ck
      check (
        status in (
          'draft',
          'validated',
          'importing',
          'completed',
          'failed',
          'cancelled'
        )
      ),
  total_rows int not null default 0,
  processed_rows int not null default 0,
  summary jsonb not null default '{}'::jsonb,
  error_report jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists data_import_jobs_created_by_idx on public.data_import_jobs (created_by);
create index if not exists data_import_jobs_org_idx on public.data_import_jobs (organization_id);
create index if not exists data_import_jobs_status_idx on public.data_import_jobs (status);

drop trigger if exists data_import_jobs_updated_at on public.data_import_jobs;
create trigger data_import_jobs_updated_at
  before update on public.data_import_jobs
  for each row
  execute function public.update_updated_at_column ();

alter table public.data_import_jobs enable row level security;

drop policy if exists "data_import_jobs_select" on public.data_import_jobs;
drop policy if exists "data_import_jobs_insert" on public.data_import_jobs;
drop policy if exists "data_import_jobs_update" on public.data_import_jobs;
drop policy if exists "data_import_jobs_delete" on public.data_import_jobs;

create policy "data_import_jobs_select"
  on public.data_import_jobs
  for select
  to authenticated
  using (created_by = auth.uid() or public.is_admin (auth.uid ()));

create policy "data_import_jobs_insert"
  on public.data_import_jobs
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "data_import_jobs_update"
  on public.data_import_jobs
  for update
  to authenticated
  using (created_by = auth.uid() or public.is_admin (auth.uid ()))
  with check (created_by = auth.uid() or public.is_admin (auth.uid ()));

create policy "data_import_jobs_delete"
  on public.data_import_jobs
  for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin (auth.uid ()));

grant select, insert, update, delete on public.data_import_jobs to authenticated;

comment on table public.data_import_jobs is
  'Excel/CSV bulk import runs: status, counts, structured errors for enterprise audit.';

commit;
