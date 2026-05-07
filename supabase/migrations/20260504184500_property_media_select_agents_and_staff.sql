-- Allow assigned agents and portfolio staff to SELECT property_media for any property they work with
-- (not only AVAILABLE + owner + admin). Mutations stay on existing owner/admin policies.

begin;

drop policy if exists property_media_select_public on public.property_media;

create policy property_media_select_public
on public.property_media
for select
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_media.property_id
      and (
        coalesce(upper(p.status), 'AVAILABLE') = 'AVAILABLE'
        or p.owner_id = auth.uid()
        or p.agent_id = auth.uid()
        or public.is_admin_or_super_admin(auth.uid())
        or exists (
          select 1
          from public.user_roles ur
          where ur.user_id = auth.uid()
            and ur.role in ('accountant'::text, 'facility_manager'::text)
        )
      )
  )
);

commit;
