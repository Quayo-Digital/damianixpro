-- Ensure property-images storage bucket exists and accepts common property photo types.
-- Missing bucket or overly strict allowed_mime_types on the dashboard often yields HTTP 400 on upload.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  5242880,
  array[
    'image/jpeg'::text,
    'image/jpg'::text,
    'image/png'::text,
    'image/webp'::text,
    'image/gif'::text,
    'image/heic'::text,
    'image/heif'::text
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = coalesce(excluded.file_size_limit, storage.buckets.file_size_limit),
  -- Normalize MIME allowlist so dashboard-only restrictions cannot block uploads.
  allowed_mime_types = excluded.allowed_mime_types;
