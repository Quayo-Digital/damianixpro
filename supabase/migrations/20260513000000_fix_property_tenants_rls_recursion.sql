-- Break infinite RLS recursion on public.tenants: the policy
-- "tenants_select_via_property_link_owner_agent" previously queried
-- property_tenants + properties in a way that could re-enter tenants RLS.
-- A SECURITY DEFINER helper evaluates visibility without tripping that cycle.

create or replace function public._tenant_visible_via_property_link(_tenant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.property_tenants pt
    join public.properties p on p.id = pt.property_id
    where pt.tenant_id = _tenant_id
      and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
  );
$$;

comment on function public._tenant_visible_via_property_link(uuid) is
  'Internal helper for tenants RLS: owner/agent visibility via property_tenants without policy recursion.';

revoke all on function public._tenant_visible_via_property_link(uuid) from public;
grant execute on function public._tenant_visible_via_property_link(uuid) to authenticated;

drop policy if exists "tenants_select_via_property_link_owner_agent" on public.tenants;

create policy "tenants_select_via_property_link_owner_agent"
  on public.tenants
  for select
  to authenticated
  using (public._tenant_visible_via_property_link(tenants.id));
