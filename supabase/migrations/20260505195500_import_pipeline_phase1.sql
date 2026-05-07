begin;

-- Phase 1: server-side import pipeline foundation
-- signed upload metadata + append-only job events + richer lifecycle states

alter table public.data_import_jobs
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists checksum_sha256 text,
  add column if not exists uploaded_by_ip inet,
  add column if not exists started_at timestamptz,
  add column if not exists finished_at timestamptz,
  add column if not exists worker_instance text,
  add column if not exists retry_count int not null default 0,
  add column if not exists source_columns jsonb not null default '[]'::jsonb,
  add column if not exists batch_size int,
  add column if not exists correlation_id uuid;

alter table public.data_import_jobs
  drop constraint if exists data_import_jobs_status_ck;

alter table public.data_import_jobs
  add constraint data_import_jobs_status_ck
  check (
    status in (
      'draft',
      'uploaded',
      'validated',
      'queued',
      'importing',
      'completed',
      'failed',
      'cancelled'
    )
  );

create index if not exists data_import_jobs_correlation_id_idx
  on public.data_import_jobs (correlation_id);

create table if not exists public.data_import_job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.data_import_jobs (id) on delete cascade,
  event_type text not null
    constraint data_import_job_events_type_ck
      check (
        event_type in (
          'job_created',
          'upload_signed',
          'upload_completed',
          'start_requested',
          'queued',
          'status_changed',
          'worker_claimed',
          'batch_started',
          'batch_committed',
          'batch_failed',
          'completed',
          'failed',
          'cancelled'
        )
      ),
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_role text,
  request_ip inet,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists data_import_job_events_job_id_created_at_idx
  on public.data_import_job_events (job_id, created_at desc);

create index if not exists data_import_job_events_event_type_idx
  on public.data_import_job_events (event_type);

alter table public.data_import_job_events enable row level security;

drop policy if exists "data_import_job_events_select" on public.data_import_job_events;
drop policy if exists "data_import_job_events_insert" on public.data_import_job_events;
drop policy if exists "data_import_job_events_update" on public.data_import_job_events;
drop policy if exists "data_import_job_events_delete" on public.data_import_job_events;

create policy "data_import_job_events_select"
  on public.data_import_job_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.data_import_jobs j
      where j.id = data_import_job_events.job_id
        and (j.created_by = auth.uid() or public.is_admin(auth.uid()))
    )
  );

create policy "data_import_job_events_insert"
  on public.data_import_job_events
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.data_import_jobs j
      where j.id = data_import_job_events.job_id
        and (j.created_by = auth.uid() or public.is_admin(auth.uid()))
    )
  );

grant select, insert on public.data_import_job_events to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'organization-imports',
  'organization-imports',
  false,
  157286400,
  array[
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
