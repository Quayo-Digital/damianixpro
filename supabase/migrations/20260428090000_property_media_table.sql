create extension if not exists pgcrypto;

create table if not exists public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  storage_path text not null,
  public_url text,
  poster_path text,
  duration_seconds numeric(8,2),
  width integer,
  height integer,
  file_size bigint,
  mime_type text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  status text not null default 'ready'
    check (status in ('uploading', 'processing', 'ready', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_property_media_property_type_sort
  on public.property_media (property_id, media_type, sort_order);

create index if not exists idx_property_media_owner
  on public.property_media (owner_id);

create unique index if not exists uq_property_media_single_primary
  on public.property_media (property_id)
  where is_primary = true;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'update_updated_at_column') then
    drop trigger if exists trg_property_media_updated_at on public.property_media;
    create trigger trg_property_media_updated_at
    before update on public.property_media
    for each row execute function public.update_updated_at_column();
  end if;
end $$;

alter table public.property_media enable row level security;
