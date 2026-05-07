begin;

-- Replay-safe guard: atomically claim a no-ref property insert marker per job.

create or replace function public.import_job_claim_no_ref_property_guard(
  p_job_id uuid,
  p_marker text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_summary jsonb;
  current_marker text;
begin
  if p_marker is null or btrim(p_marker) = '' then
    raise exception 'p_marker is required';
  end if;

  select coalesce(j.summary, '{}'::jsonb)
  into current_summary
  from public.data_import_jobs j
  where j.id = p_job_id
  for update;

  if current_summary is null then
    raise exception 'Import job not found: %', p_job_id;
  end if;

  current_marker := current_summary #>> '{idempotency,no_ref_properties_marker}';

  if current_marker is null then
    update public.data_import_jobs j
    set
      summary = jsonb_set(
        jsonb_set(
          coalesce(j.summary, '{}'::jsonb),
          '{idempotency,no_ref_properties_marker}',
          to_jsonb(p_marker),
          true
        ),
        '{idempotency,no_ref_properties_claimed_at}',
        to_jsonb(now()::text),
        true
      ),
      updated_at = now()
    where j.id = p_job_id;
    return true;
  end if;

  if current_marker = p_marker then
    return false;
  end if;

  raise exception 'Idempotency marker mismatch for job %', p_job_id;
end;
$$;

revoke all on function public.import_job_claim_no_ref_property_guard(uuid, text) from public;
grant execute on function public.import_job_claim_no_ref_property_guard(uuid, text) to authenticated;

commit;
