-- Multi-unit estates: link leases to units, prevent double-leasing, public lease summary RPC.

begin;

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------
alter table public.property_tenants
  add column if not exists unit_id uuid references public.units (id) on delete set null;

create index if not exists idx_property_tenants_unit_id
  on public.property_tenants (unit_id)
  where unit_id is not null;

alter table public.rental_applications
  add column if not exists unit_id uuid references public.units (id) on delete set null;

create index if not exists idx_rental_applications_unit_id
  on public.rental_applications (unit_id)
  where unit_id is not null;

-- ---------------------------------------------------------------------------
-- 2. At most one active whole-property lease (no unit row) per property
--    At most one active lease per unit
-- ---------------------------------------------------------------------------
create unique index if not exists property_tenants_one_active_whole_property
  on public.property_tenants (property_id)
  where status = 'active'
    and unit_id is null;

create unique index if not exists property_tenants_one_active_per_unit
  on public.property_tenants (unit_id)
  where status = 'active'
    and unit_id is not null;

comment on column public.property_tenants.unit_id is
  'When set, this tenancy is for a specific unit in an estate. When null and the property has no units rows, the whole property is leased once.';

comment on column public.rental_applications.unit_id is
  'Tenant applies for a specific unit when the listing is multi-unit.';

-- ---------------------------------------------------------------------------
-- 3. RPC: lease counts for listing cards (anon-safe via SECURITY DEFINER)
-- ---------------------------------------------------------------------------
create or replace function public.get_property_lease_summaries (p_property_ids uuid[])
  returns table (
    property_id uuid,
    total_units integer,
    leased_units integer,
    fully_leased boolean
  )
  language sql
  stable
  security definer
  set search_path = public
as $$
  with ids as (
    select unnest(p_property_ids) as id
  ),
  unit_totals as (
    select u.property_id, count(*)::integer as n
    from public.units u
    where u.property_id = any (p_property_ids)
    group by u.property_id
  ),
  active_pt as (
    select
      pt.property_id,
      count(*) filter (
        where pt.status = 'active'
          and pt.unit_id is null
      )::integer as whole_active,
      count(*) filter (
        where pt.status = 'active'
          and pt.unit_id is not null
      )::integer as unit_leases
    from public.property_tenants pt
    where pt.property_id = any (p_property_ids)
    group by pt.property_id
  )
  select
    i.id as property_id,
    case
      when coalesce(ut.n, 0) = 0 then 1
      else ut.n
    end as total_units,
    case
      when coalesce(ut.n, 0) = 0 then least(1, coalesce(a.whole_active, 0))
      else coalesce(a.unit_leases, 0)
    end as leased_units,
    case
      when coalesce(ut.n, 0) = 0 then coalesce(a.whole_active, 0) >= 1
      else coalesce(a.unit_leases, 0) >= coalesce(ut.n, 0)
    end as fully_leased
  from ids i
  left join unit_totals ut on ut.property_id = i.id
  left join active_pt a on a.property_id = i.id;
$$;

grant execute on function public.get_property_lease_summaries (uuid[]) to anon;
grant execute on function public.get_property_lease_summaries (uuid[]) to authenticated;

-- Vacant / leased flags per unit (for application form)
create or replace function public.get_property_units_lease_status (p_property_id uuid)
  returns table (
    unit_id uuid,
    unit_number text,
    rent_amount numeric,
    is_leased boolean
  )
  language sql
  stable
  security definer
  set search_path = public
as $$
  select
    u.id as unit_id,
    u.unit_number,
    u.rent_amount,
    exists (
      select 1
      from public.property_tenants pt
      where pt.unit_id = u.id
        and pt.status = 'active'
    ) as is_leased
  from public.units u
  where u.property_id = p_property_id
  order by u.unit_number nulls last, u.id;
$$;

grant execute on function public.get_property_units_lease_status (uuid) to anon;
grant execute on function public.get_property_units_lease_status (uuid) to authenticated;

commit;
