-- Tenants applying from demo listings need to read "available" properties.
-- RLS previously required exact status = 'Available', which failed for 'AVAILABLE' etc.

begin;

drop policy if exists "anon_read_public_properties_v2" on public.properties;
drop policy if exists "authenticated_read_properties_v2" on public.properties;

create policy "anon_read_public_properties_v2"
on public.properties
for select
to anon
using (lower(trim(coalesce(status, ''::text))) = 'available'::text);

create policy "authenticated_read_properties_v2"
on public.properties
for select
to authenticated
using (
  lower(trim(coalesce(status, ''::text))) = 'available'::text
  or owner_id = auth.uid()
  or agent_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'::text
  )
);

commit;
