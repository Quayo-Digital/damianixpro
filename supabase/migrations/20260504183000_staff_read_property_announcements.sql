-- Staff with portfolio access can read announcements (write still via check_property_access / admin).

begin;

drop policy if exists "property_announcements_select_residents" on public.property_announcements;

create policy "property_announcements_select_residents"
on public.property_announcements
for select
to authenticated
using (
  exists (
    select 1
    from public.property_tenants pt
    inner join public.tenants t on t.id = pt.tenant_id
    where pt.property_id = property_announcements.property_id
      and t.user_id = auth.uid()
      and coalesce(pt.status, 'active') = 'active'
      and (pt.end_date is null or pt.end_date >= current_date)
  )
  or public.is_admin(auth.uid())
  or public.check_property_access(property_id, auth.uid())
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
