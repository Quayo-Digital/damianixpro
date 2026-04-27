-- Post-lease / onboarding coordination checklist for property teams.
-- Run via Supabase migrations or SQL editor. Requires public.properties, public.tenants,
-- and typically public.is_admin + public.check_property_access (see prior migrations).

begin;

create table if not exists public.lease_coordination_checklists (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null unique,
  property_id uuid not null references public.properties (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  phase text not null default 'post_executed',
  tasks jsonb not null default '[]'::jsonb,
  ai_coordination_hint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lease_coordination_phase_chk check (
    phase in (
      'post_executed',
      'pre_move_in',
      'move_in_week',
      'stabilization'
    )
  )
);

create index if not exists lease_coordination_checklists_property_id_idx
  on public.lease_coordination_checklists (property_id);

create index if not exists lease_coordination_checklists_tenant_id_idx
  on public.lease_coordination_checklists (tenant_id);

drop trigger if exists update_lease_coordination_checklists_updated_at on public.lease_coordination_checklists;

create trigger update_lease_coordination_checklists_updated_at
  before update on public.lease_coordination_checklists
  for each row
  execute function public.update_updated_at_column();

alter table public.lease_coordination_checklists enable row level security;

do $p$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'lease_coordination_checklists'
  loop
    execute format(
      'drop policy if exists %I on public.lease_coordination_checklists',
      pol.policyname
    );
  end loop;
end;
$p$;

-- Tenants: read-only visibility of their own checklist (transparency).
create policy "lease_coordination_select_tenant"
  on public.lease_coordination_checklists
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tenants t
      where t.id = lease_coordination_checklists.tenant_id
        and t.user_id = auth.uid()
    )
  );

-- Owners / agents / admins: full access for properties they manage.
create policy "lease_coordination_all_property_team"
  on public.lease_coordination_checklists
  for all
  to authenticated
  using (
    public.is_admin(auth.uid())
    or public.check_property_access(property_id, auth.uid())
  )
  with check (
    public.is_admin(auth.uid())
    or public.check_property_access(property_id, auth.uid())
  );

commit;
