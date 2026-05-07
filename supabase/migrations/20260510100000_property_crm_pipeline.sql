-- Property CRM & sales pipeline (NEW tables). Mini–HubSpot-style deals, leads, inspections, reminders.
-- Does not alter rental_applications, buyers, or existing sales tables.

begin;

-- ---------------------------------------------------------------------------
-- crm_leads
-- ---------------------------------------------------------------------------
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  source text,
  notes text,
  property_id uuid references public.properties (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_leads_property on public.crm_leads (property_id);
create index if not exists idx_crm_leads_created_by on public.crm_leads (created_by);

drop trigger if exists trg_crm_leads_updated on public.crm_leads;
create trigger trg_crm_leads_updated
  before update on public.crm_leads
  for each row execute function public.update_updated_at_column();

comment on table public.crm_leads is 'Inbound sales / letting leads (Nigerian property CRM extension).';

-- ---------------------------------------------------------------------------
-- crm_deals (pipeline card)
-- ---------------------------------------------------------------------------
create table if not exists public.crm_deals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads (id) on delete set null,
  property_id uuid references public.properties (id) on delete set null,
  title text not null,
  stage text not null default 'lead'
    check (stage = any (array['lead', 'inspection', 'negotiation', 'closed']::text[])),
  outcome text check (outcome is null or outcome = any (array['won', 'lost']::text[])),
  assigned_agent_id uuid references auth.users (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete cascade,
  budget_min numeric(14, 2),
  budget_max numeric(14, 2),
  currency text not null default 'NGN',
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_deals_stage_outcome_consistency check (
    (stage = 'closed' and outcome is not null)
    or (stage <> 'closed' and outcome is null)
  )
);

create index if not exists idx_crm_deals_stage on public.crm_deals (stage);
create index if not exists idx_crm_deals_property on public.crm_deals (property_id);
create index if not exists idx_crm_deals_agent on public.crm_deals (assigned_agent_id);
create index if not exists idx_crm_deals_follow_up on public.crm_deals (next_follow_up_at);

drop trigger if exists trg_crm_deals_updated on public.crm_deals;
create trigger trg_crm_deals_updated
  before update on public.crm_deals
  for each row execute function public.update_updated_at_column();

comment on table public.crm_deals is 'Sales pipeline deals; Kanban columns map to stage (+ closed won/lost).';

-- ---------------------------------------------------------------------------
-- crm_inspections (scheduled viewings tied to a deal)
-- ---------------------------------------------------------------------------
create table if not exists public.crm_inspections (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.crm_deals (id) on delete cascade,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz,
  status text not null default 'scheduled'
    check (status = any (array['scheduled', 'completed', 'cancelled', 'no_show']::text[])),
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_inspections_deal on public.crm_inspections (deal_id);
create index if not exists idx_crm_inspections_start on public.crm_inspections (scheduled_start);

drop trigger if exists trg_crm_inspections_updated on public.crm_inspections;
create trigger trg_crm_inspections_updated
  before update on public.crm_inspections
  for each row execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- crm_reminders (follow-ups)
-- ---------------------------------------------------------------------------
create table if not exists public.crm_reminders (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.crm_deals (id) on delete cascade,
  remind_at timestamptz not null,
  body text,
  completed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_reminders_deal on public.crm_reminders (deal_id);
create index if not exists idx_crm_reminders_due on public.crm_reminders (remind_at);

-- ---------------------------------------------------------------------------
-- Visibility helpers (RLS; defined after tables they reference)
-- ---------------------------------------------------------------------------
create or replace function public.crm_lead_visible(p_lead_id uuid)
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
        or l.created_by = auth.uid()
        or (
          l.property_id is not null
          and exists (
            select 1
            from public.properties p
            where p.id = l.property_id
              and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
          )
        )
      from public.crm_leads l
      where l.id = p_lead_id
    ),
    false
  );
$$;

create or replace function public.crm_deal_visible(p_deal_id uuid)
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
        or d.created_by = auth.uid()
        or d.assigned_agent_id = auth.uid()
        or (
          d.property_id is not null
          and exists (
            select 1
            from public.properties p
            where p.id = d.property_id
              and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
          )
        )
      from public.crm_deals d
      where d.id = p_deal_id
    ),
    false
  );
$$;

revoke all on function public.crm_lead_visible(uuid) from public;
grant execute on function public.crm_lead_visible(uuid) to authenticated;
revoke all on function public.crm_deal_visible(uuid) from public;
grant execute on function public.crm_deal_visible(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.crm_leads to authenticated;
grant select, insert, update, delete on public.crm_deals to authenticated;
grant select, insert, update, delete on public.crm_inspections to authenticated;
grant select, insert, update, delete on public.crm_reminders to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.crm_leads enable row level security;

drop policy if exists crm_leads_select on public.crm_leads;
create policy crm_leads_select on public.crm_leads
  for select to authenticated
  using (public.crm_lead_visible(id));

drop policy if exists crm_leads_insert on public.crm_leads;
create policy crm_leads_insert on public.crm_leads
  for insert to authenticated
  with check (created_by = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists crm_leads_update on public.crm_leads;
create policy crm_leads_update on public.crm_leads
  for update to authenticated
  using (public.crm_lead_visible(id))
  with check (public.crm_lead_visible(id));

drop policy if exists crm_leads_delete on public.crm_leads;
create policy crm_leads_delete on public.crm_leads
  for delete to authenticated
  using (public.is_admin(auth.uid()) or created_by = auth.uid());

alter table public.crm_deals enable row level security;

drop policy if exists crm_deals_select on public.crm_deals;
create policy crm_deals_select on public.crm_deals
  for select to authenticated
  using (public.crm_deal_visible(id));

drop policy if exists crm_deals_insert on public.crm_deals;
create policy crm_deals_insert on public.crm_deals
  for insert to authenticated
  with check (created_by = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists crm_deals_update on public.crm_deals;
create policy crm_deals_update on public.crm_deals
  for update to authenticated
  using (public.crm_deal_visible(id))
  with check (public.crm_deal_visible(id));

drop policy if exists crm_deals_delete on public.crm_deals;
create policy crm_deals_delete on public.crm_deals
  for delete to authenticated
  using (public.is_admin(auth.uid()));

alter table public.crm_inspections enable row level security;

drop policy if exists crm_inspections_select on public.crm_inspections;
create policy crm_inspections_select on public.crm_inspections
  for select to authenticated
  using (public.crm_deal_visible(deal_id));

drop policy if exists crm_inspections_insert on public.crm_inspections;
create policy crm_inspections_insert on public.crm_inspections
  for insert to authenticated
  with check (public.crm_deal_visible(deal_id));

drop policy if exists crm_inspections_update on public.crm_inspections;
create policy crm_inspections_update on public.crm_inspections
  for update to authenticated
  using (public.crm_deal_visible(deal_id))
  with check (public.crm_deal_visible(deal_id));

drop policy if exists crm_inspections_delete on public.crm_inspections;
create policy crm_inspections_delete on public.crm_inspections
  for delete to authenticated
  using (public.crm_deal_visible(deal_id));

alter table public.crm_reminders enable row level security;

drop policy if exists crm_reminders_select on public.crm_reminders;
create policy crm_reminders_select on public.crm_reminders
  for select to authenticated
  using (public.crm_deal_visible(deal_id));

drop policy if exists crm_reminders_insert on public.crm_reminders;
create policy crm_reminders_insert on public.crm_reminders
  for insert to authenticated
  with check (public.crm_deal_visible(deal_id));

drop policy if exists crm_reminders_update on public.crm_reminders;
create policy crm_reminders_update on public.crm_reminders
  for update to authenticated
  using (public.crm_deal_visible(deal_id))
  with check (public.crm_deal_visible(deal_id));

drop policy if exists crm_reminders_delete on public.crm_reminders;
create policy crm_reminders_delete on public.crm_reminders
  for delete to authenticated
  using (public.crm_deal_visible(deal_id));

commit;
