-- Fix: 42P17 "infinite recursion detected in policy for relation property_tenants".
--
-- Cause: 20260505193000_organization_setup_and_import_jobs.sql added a SELECT
-- policy on public.tenants that does
--   exists (select 1 from public.property_tenants pt join public.properties p ...).
-- That subquery triggers property_tenants RLS, whose tenant policy in turn
-- selects from public.tenants, which re-enters the new tenants policy:
--   rent_payments -> property_tenants -> tenants -> property_tenants -> ...
--
-- Fix: replace the subquery with a SECURITY DEFINER helper that runs with the
-- function owner's privileges and an empty search_path, so it bypasses RLS
-- while still enforcing the same owner_id/agent_id rule.

begin;

create or replace function public._tenant_visible_via_property_link(
  tenant_uuid uuid,
  viewer_uuid uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $fn$
  select exists (
    select 1
    from public.property_tenants pt
    join public.properties p on p.id = pt.property_id
    where pt.tenant_id = tenant_uuid
      and (p.owner_id = viewer_uuid or p.agent_id = viewer_uuid)
  );
$fn$;

revoke all on function public._tenant_visible_via_property_link(uuid, uuid) from public;
grant execute on function public._tenant_visible_via_property_link(uuid, uuid) to authenticated;
grant execute on function public._tenant_visible_via_property_link(uuid, uuid) to service_role;

comment on function public._tenant_visible_via_property_link(uuid, uuid) is
  'RLS helper: returns true when viewer_uuid owns or is the agent on a property linked to tenant_uuid via property_tenants. SECURITY DEFINER to break the property_tenants <-> tenants RLS cycle.';

drop policy if exists "tenants_select_via_property_link_owner_agent" on public.tenants;

create policy "tenants_select_via_property_link_owner_agent"
  on public.tenants
  for select
  to authenticated
  using (public._tenant_visible_via_property_link(tenants.id, auth.uid()));

commit;
