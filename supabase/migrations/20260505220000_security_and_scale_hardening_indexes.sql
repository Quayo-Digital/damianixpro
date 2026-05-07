begin;

-- Tighten execution scope for import worker RPCs: worker/server only.
revoke execute on function public.import_job_claim_next(text) from authenticated;
revoke execute on function public.import_job_update_progress(uuid, int, int) from authenticated;
revoke execute on function public.import_job_finalize(uuid, text, jsonb, jsonb) from authenticated;
revoke execute on function public.import_job_requeue(uuid, text) from authenticated;
revoke execute on function public.import_job_claim_no_ref_property_guard(uuid, text) from authenticated;

grant execute on function public.import_job_claim_next(text) to service_role;
grant execute on function public.import_job_update_progress(uuid, int, int) to service_role;
grant execute on function public.import_job_finalize(uuid, text, jsonb, jsonb) to service_role;
grant execute on function public.import_job_requeue(uuid, text) to service_role;
grant execute on function public.import_job_claim_no_ref_property_guard(uuid, text) to service_role;

-- Ownership/agent lookup hot paths.
create index if not exists properties_owner_id_idx
  on public.properties (owner_id);

create index if not exists properties_agent_id_idx
  on public.properties (agent_id);

create index if not exists properties_org_owner_idx
  on public.properties (organization_id, owner_id);

create index if not exists properties_org_agent_idx
  on public.properties (organization_id, agent_id);

-- Import worker queue claim: status + created_at.
create index if not exists data_import_jobs_status_created_at_idx
  on public.data_import_jobs (status, created_at);

-- Notification stale-processing recovery query support.
create index if not exists notification_outbox_processing_updated_at_idx
  on public.notification_outbox (status, updated_at);

commit;
