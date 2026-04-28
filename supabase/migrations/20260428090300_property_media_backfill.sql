insert into public.property_media (
  property_id,
  owner_id,
  media_type,
  storage_path,
  public_url,
  sort_order,
  is_primary,
  status,
  metadata
)
select
  p.id as property_id,
  p.owner_id,
  'image'::text as media_type,
  coalesce(
    nullif(split_part((p.shortlet_details->'form_meta'->>'imageUrl'), '/property-images/', 2), ''),
    'legacy/' || p.id::text || '/imageUrl'
  ) as storage_path,
  (p.shortlet_details->'form_meta'->>'imageUrl') as public_url,
  0 as sort_order,
  true as is_primary,
  'ready'::text as status,
  jsonb_build_object('source', 'legacy_form_meta_imageUrl')
from public.properties p
where p.owner_id is not null
  and p.shortlet_details is not null
  and (p.shortlet_details->'form_meta'->>'imageUrl') is not null
  and not exists (
    select 1
    from public.property_media pm
    where pm.property_id = p.id
      and pm.media_type = 'image'
      and pm.is_primary = true
  );
