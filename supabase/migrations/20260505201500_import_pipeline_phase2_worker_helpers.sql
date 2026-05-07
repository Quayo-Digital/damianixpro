begin;

-- Phase 2: SQL helpers for worker claim/progress/finalize lifecycle.

create or replace function public.import_job_claim_next(p_worker_instance text)
returns setof public.data_import_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidate as (
    select j.id
    from public.data_import_jobs j
    where j.status = 'queued'
    order by j.created_at asc
    for update skip locked
    limit 1
  )
  update public.data_import_jobs j
  set
    status = 'importing',
    worker_instance = nullif(btrim(p_worker_instance), ''),
    started_at = coalesce(j.started_at, now()),
    retry_count = coalesce(j.retry_count, 0) + 1,
    updated_at = now()
  from candidate
  where j.id = candidate.id
  returning j.*;
end;
$$;

create or replace function public.import_job_update_progress(
  p_job_id uuid,
  p_processed_rows int,
  p_batch_size int default null
)
returns public.data_import_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.data_import_jobs;
begin
  update public.data_import_jobs j
  set
    processed_rows = greatest(0, coalesce(p_processed_rows, 0)),
    batch_size = coalesce(p_batch_size, j.batch_size),
    updated_at = now()
  where j.id = p_job_id
  returning j.* into updated_row;

  return updated_row;
end;
$$;

create or replace function public.import_job_finalize(
  p_job_id uuid,
  p_status text,
  p_summary jsonb default '{}'::jsonb,
  p_error_report jsonb default '[]'::jsonb
)
returns public.data_import_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.data_import_jobs;
begin
  if p_status not in ('completed', 'failed', 'cancelled') then
    raise exception 'Invalid terminal status: %', p_status;
  end if;

  update public.data_import_jobs j
  set
    status = p_status,
    finished_at = now(),
    summary = coalesce(p_summary, '{}'::jsonb),
    error_report = coalesce(p_error_report, '[]'::jsonb),
    updated_at = now()
  where j.id = p_job_id
  returning j.* into updated_row;

  return updated_row;
end;
$$;

create or replace function public.import_job_requeue(
  p_job_id uuid,
  p_reason text default null
)
returns public.data_import_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.data_import_jobs;
  reason_text text;
begin
  reason_text := nullif(btrim(coalesce(p_reason, '')), '');

  update public.data_import_jobs j
  set
    status = 'queued',
    worker_instance = null,
    summary = case
      when reason_text is null then j.summary
      else coalesce(j.summary, '{}'::jsonb) || jsonb_build_object('requeue_reason', reason_text)
    end,
    updated_at = now()
  where j.id = p_job_id
  returning j.* into updated_row;

  return updated_row;
end;
$$;

revoke all on function public.import_job_claim_next(text) from public;
revoke all on function public.import_job_update_progress(uuid, int, int) from public;
revoke all on function public.import_job_finalize(uuid, text, jsonb, jsonb) from public;
revoke all on function public.import_job_requeue(uuid, text) from public;

grant execute on function public.import_job_claim_next(text) to authenticated;
grant execute on function public.import_job_update_progress(uuid, int, int) to authenticated;
grant execute on function public.import_job_finalize(uuid, text, jsonb, jsonb) to authenticated;
grant execute on function public.import_job_requeue(uuid, text) to authenticated;

commit;
