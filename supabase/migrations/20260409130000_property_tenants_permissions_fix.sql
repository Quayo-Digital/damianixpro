-- Fix property_tenants permission denied (42501) for tenant payment flow.
-- 1) Ensure table privileges are granted to authenticated users.
-- 2) Keep tenant SELECT policy explicit.
-- 3) Allow tenant self-heal upsert for their own tenant_id only.

begin;

grant select, insert, update on table public.property_tenants to authenticated;

drop policy if exists "property_tenants_select_tenant" on public.property_tenants;
create policy "property_tenants_select_tenant"
  on public.property_tenants
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tenants t
      where t.id = property_tenants.tenant_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists "property_tenants_insert_update_tenant_self" on public.property_tenants;
create policy "property_tenants_insert_update_tenant_self"
  on public.property_tenants
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.tenants t
      where t.id = property_tenants.tenant_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists "property_tenants_update_tenant_self" on public.property_tenants;
create policy "property_tenants_update_tenant_self"
  on public.property_tenants
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.tenants t
      where t.id = property_tenants.tenant_id
        and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.tenants t
      where t.id = property_tenants.tenant_id
        and t.user_id = auth.uid()
    )
  );

commit;

