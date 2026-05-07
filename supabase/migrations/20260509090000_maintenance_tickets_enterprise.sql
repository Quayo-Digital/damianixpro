-- Enterprise maintenance ticketing (NEW tables only). PostgreSQL / Supabase.
-- Does not modify maintenance_requests or other legacy maintenance tables.

begin;

-- ---------------------------------------------------------------------------
-- maintenance_tickets
-- ---------------------------------------------------------------------------
create table if not exists public.maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  property_id uuid not null references public.properties (id) on delete cascade,
  unit_id uuid references public.units (id) on delete set null,
  title text not null,
  description text not null default '',
  priority text not null default 'medium'
    check (priority = any (array['low', 'medium', 'high', 'urgent']::text[])),
  status text not null default 'pending'
    check (status = any (array['pending', 'in_progress', 'resolved', 'cancelled']::text[])),
  assigned_to uuid references auth.users (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete restrict,
  cost_estimate numeric(14, 2) not null default 0 check (cost_estimate >= 0),
  actual_cost numeric(14, 2) check (actual_cost is null or actual_cost >= 0),
  sla_deadline timestamptz not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_maintenance_tickets_property on public.maintenance_tickets (property_id);
create index if not exists idx_maintenance_tickets_tenant on public.maintenance_tickets (tenant_id);
create index if not exists idx_maintenance_tickets_status on public.maintenance_tickets (status);
create index if not exists idx_maintenance_tickets_assigned on public.maintenance_tickets (assigned_to);
create index if not exists idx_maintenance_tickets_sla on public.maintenance_tickets (sla_deadline);

drop trigger if exists trg_maintenance_tickets_updated on public.maintenance_tickets;
create trigger trg_maintenance_tickets_updated
  before update on public.maintenance_tickets
  for each row execute function public.update_updated_at_column();

comment on table public.maintenance_tickets is
  'Enterprise work orders; separate from legacy maintenance_requests.';

-- ---------------------------------------------------------------------------
-- maintenance_comments
-- ---------------------------------------------------------------------------
create table if not exists public.maintenance_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.maintenance_tickets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_maintenance_comments_ticket on public.maintenance_comments (ticket_id);

-- ---------------------------------------------------------------------------
-- maintenance_attachments
-- ---------------------------------------------------------------------------
create table if not exists public.maintenance_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.maintenance_tickets (id) on delete cascade,
  file_url text not null,
  file_type text,
  created_at timestamptz not null default now()
);

create index if not exists idx_maintenance_attachments_ticket on public.maintenance_attachments (ticket_id);

-- ---------------------------------------------------------------------------
-- maintenance_history (audit)
-- ---------------------------------------------------------------------------
create table if not exists public.maintenance_history (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.maintenance_tickets (id) on delete cascade,
  action text not null
    check (
      action = any (
        array[
          'created',
          'assigned',
          'status_changed',
          'updated',
          'resolved',
          'comment_added',
          'attachment_added'
        ]::text[]
      )
    ),
  performed_by uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_maintenance_history_ticket on public.maintenance_history (ticket_id);

-- ---------------------------------------------------------------------------
-- Helper: visibility for RLS (after maintenance_tickets exists)
-- ---------------------------------------------------------------------------
create or replace function public.maintenance_ticket_visible(p_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select
        public.is_admin(auth.uid())
        or tn.user_id = auth.uid()
        or mt.assigned_to = auth.uid()
        or mt.created_by = auth.uid()
        or (pr.id is not null and pr.owner_id = auth.uid())
        or (pr.id is not null and pr.agent_id = auth.uid())
      from public.maintenance_tickets mt
      join public.tenants tn on tn.id = mt.tenant_id
      left join public.properties pr on pr.id = mt.property_id
      where mt.id = p_ticket_id
    ),
    false
  );
$$;

comment on function public.maintenance_ticket_visible(uuid) is
  'RLS helper: admin, ticket tenant user, assignee, creator, property owner/agent.';

revoke all on function public.maintenance_ticket_visible(uuid) from public;
grant execute on function public.maintenance_ticket_visible(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.maintenance_tickets to authenticated;
grant select, insert, update, delete on public.maintenance_comments to authenticated;
grant select, insert, update, delete on public.maintenance_attachments to authenticated;
grant select, insert on public.maintenance_history to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: tickets
-- ---------------------------------------------------------------------------
alter table public.maintenance_tickets enable row level security;

drop policy if exists maintenance_tickets_select on public.maintenance_tickets;
create policy maintenance_tickets_select on public.maintenance_tickets
  for select to authenticated
  using (public.maintenance_ticket_visible(id));

drop policy if exists maintenance_tickets_insert on public.maintenance_tickets;
create policy maintenance_tickets_insert on public.maintenance_tickets
  for insert to authenticated
  with check (
    public.is_admin(auth.uid())
    or (
      exists (select 1 from public.tenants t where t.id = tenant_id and t.user_id = auth.uid())
      and created_by = auth.uid()
      and exists (
        select 1
        from public.property_tenants pt
        where pt.property_id = maintenance_tickets.property_id
          and pt.tenant_id = maintenance_tickets.tenant_id
          and pt.status = 'active'
      )
    )
  );

drop policy if exists maintenance_tickets_update on public.maintenance_tickets;
create policy maintenance_tickets_update on public.maintenance_tickets
  for update to authenticated
  using (public.maintenance_ticket_visible(id))
  with check (public.maintenance_ticket_visible(id));

drop policy if exists maintenance_tickets_delete on public.maintenance_tickets;
create policy maintenance_tickets_delete on public.maintenance_tickets
  for delete to authenticated
  using (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- RLS: comments / attachments / history (inherit ticket visibility)
-- ---------------------------------------------------------------------------
alter table public.maintenance_comments enable row level security;

drop policy if exists maintenance_comments_select on public.maintenance_comments;
create policy maintenance_comments_select on public.maintenance_comments
  for select to authenticated
  using (public.maintenance_ticket_visible(ticket_id));

drop policy if exists maintenance_comments_insert on public.maintenance_comments;
create policy maintenance_comments_insert on public.maintenance_comments
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.maintenance_ticket_visible(ticket_id)
  );

alter table public.maintenance_attachments enable row level security;

drop policy if exists maintenance_attachments_select on public.maintenance_attachments;
create policy maintenance_attachments_select on public.maintenance_attachments
  for select to authenticated
  using (public.maintenance_ticket_visible(ticket_id));

drop policy if exists maintenance_attachments_insert on public.maintenance_attachments;
create policy maintenance_attachments_insert on public.maintenance_attachments
  for insert to authenticated
  with check (public.maintenance_ticket_visible(ticket_id));

alter table public.maintenance_history enable row level security;

drop policy if exists maintenance_history_select on public.maintenance_history;
create policy maintenance_history_select on public.maintenance_history
  for select to authenticated
  using (public.maintenance_ticket_visible(ticket_id));

drop policy if exists maintenance_history_insert on public.maintenance_history;
create policy maintenance_history_insert on public.maintenance_history
  for insert to authenticated
  with check (public.maintenance_ticket_visible(ticket_id));

commit;
