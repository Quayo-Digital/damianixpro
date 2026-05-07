begin;

-- Phase 2: staging tables for server-side import worker.

create table if not exists public.data_import_staging_properties (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.data_import_jobs (id) on delete cascade,
  row_number int not null,
  sheet_name text not null default 'Properties',
  payload jsonb not null default '{}'::jsonb,
  validation_error text,
  status text not null default 'parsed'
    constraint data_import_staging_properties_status_ck
      check (status in ('parsed', 'imported', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, sheet_name, row_number)
);

create index if not exists data_import_staging_properties_job_id_idx
  on public.data_import_staging_properties (job_id);

create table if not exists public.data_import_staging_tenants (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.data_import_jobs (id) on delete cascade,
  row_number int not null,
  sheet_name text not null default 'Tenants',
  payload jsonb not null default '{}'::jsonb,
  validation_error text,
  status text not null default 'parsed'
    constraint data_import_staging_tenants_status_ck
      check (status in ('parsed', 'imported', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, sheet_name, row_number)
);

create index if not exists data_import_staging_tenants_job_id_idx
  on public.data_import_staging_tenants (job_id);

drop trigger if exists data_import_staging_properties_updated_at on public.data_import_staging_properties;
create trigger data_import_staging_properties_updated_at
  before update on public.data_import_staging_properties
  for each row
  execute function public.update_updated_at_column ();

drop trigger if exists data_import_staging_tenants_updated_at on public.data_import_staging_tenants;
create trigger data_import_staging_tenants_updated_at
  before update on public.data_import_staging_tenants
  for each row
  execute function public.update_updated_at_column ();

commit;
