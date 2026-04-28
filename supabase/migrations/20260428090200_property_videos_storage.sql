insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-videos',
  'property-videos',
  false,
  209715200,
  array['video/mp4','video/webm','video/quicktime']
)
on conflict (id) do nothing;

drop policy if exists property_videos_insert_owner_admin on storage.objects;
drop policy if exists property_videos_select_owner_admin on storage.objects;
drop policy if exists property_videos_update_owner_admin on storage.objects;
drop policy if exists property_videos_delete_owner_admin on storage.objects;

create policy property_videos_insert_owner_admin
on storage.objects
for insert
with check (
  bucket_id = 'property-videos'
  and auth.uid() is not null
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin_or_super_admin(auth.uid())
  )
  and exists (
    select 1
    from public.properties p
    where p.id::text = (storage.foldername(name))[2]
      and (
        p.owner_id = auth.uid()
        or public.is_admin_or_super_admin(auth.uid())
      )
  )
);

create policy property_videos_select_owner_admin
on storage.objects
for select
using (
  bucket_id = 'property-videos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin_or_super_admin(auth.uid())
  )
);

create policy property_videos_update_owner_admin
on storage.objects
for update
using (
  bucket_id = 'property-videos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin_or_super_admin(auth.uid())
  )
)
with check (
  bucket_id = 'property-videos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin_or_super_admin(auth.uid())
  )
);

create policy property_videos_delete_owner_admin
on storage.objects
for delete
using (
  bucket_id = 'property-videos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin_or_super_admin(auth.uid())
  )
);
