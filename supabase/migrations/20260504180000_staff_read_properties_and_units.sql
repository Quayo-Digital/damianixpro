-- Allow accountant + facility_manager (via public.user_roles) to SELECT all properties and units
-- for portfolio context, aligned with RBAC properties.read (writes remain on existing policies).

begin;

-- ---------------------------------------------------------------------------
-- properties: extend authenticated_read_properties_v2
-- ---------------------------------------------------------------------------
drop policy if exists "authenticated_read_properties_v2" on public.properties;

create policy "authenticated_read_properties_v2"
on public.properties
for select
to authenticated
using (
  coalesce(status, ''::text) = 'Available'::text
  or owner_id = auth.uid()
  or agent_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in (
        'admin'::text,
        'super_admin'::text,
        'accountant'::text,
        'facility_manager'::text
      )
  )
);

-- ---------------------------------------------------------------------------
-- units: extend read policy (SELECT only; mutate still owner/agent/admin profiles path)
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view units for accessible properties" on public.units;

create policy "Users can view units for accessible properties"
on public.units
as permissive
for select
to public
using (
  exists (
    select 1
    from public.properties p
    where p.id = units.property_id
      and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
  )
  or exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and lower(coalesce(pr.role, '')::text) in ('admin', 'super_admin')
  )
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in (
        'admin'::text,
        'super_admin'::text,
        'accountant'::text,
        'facility_manager'::text
      )
  )
);

commit;
