create or replace function public.is_admin_or_super_admin(p_uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = p_uid
      and ur.role in ('admin', 'super_admin')
  );
$$;

drop policy if exists property_media_select_public on public.property_media;
drop policy if exists property_media_insert_owner_admin on public.property_media;
drop policy if exists property_media_update_owner_admin on public.property_media;
drop policy if exists property_media_delete_owner_admin on public.property_media;

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
        or public.is_admin_or_super_admin(auth.uid())
      )
  )
);

create policy property_media_insert_owner_admin
on public.property_media
for insert
with check (
  auth.uid() is not null
  and exists (
    select 1
    from public.properties p
    where p.id = property_media.property_id
      and (
        p.owner_id = auth.uid()
        or public.is_admin_or_super_admin(auth.uid())
      )
  )
  and (
    owner_id = auth.uid()
    or public.is_admin_or_super_admin(auth.uid())
  )
);

create policy property_media_update_owner_admin
on public.property_media
for update
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_media.property_id
      and (
        p.owner_id = auth.uid()
        or public.is_admin_or_super_admin(auth.uid())
      )
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_media.property_id
      and (
        p.owner_id = auth.uid()
        or public.is_admin_or_super_admin(auth.uid())
      )
  )
);

create policy property_media_delete_owner_admin
on public.property_media
for delete
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_media.property_id
      and (
        p.owner_id = auth.uid()
        or public.is_admin_or_super_admin(auth.uid())
      )
  )
);
