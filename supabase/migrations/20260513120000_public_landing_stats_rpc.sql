-- Public aggregate stats for the marketing landing page (no row-level detail).

create or replace function public.get_public_landing_stats()
returns table (
  properties_count bigint,
  successful_rent_volume_ngn numeric,
  landlords_managers_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    (select count(*)::bigint from public.properties) as properties_count,
    (
      select coalesce(sum(rp.amount), 0)::numeric
      from public.rent_payments rp
      where lower(trim(coalesce(rp.status, ''))) in ('successful', 'success')
    ) as successful_rent_volume_ngn,
    (
      select count(distinct uid)::bigint
      from (
        select p.owner_id as uid
        from public.properties p
        where p.owner_id is not null
        union
        select p.agent_id as uid
        from public.properties p
        where p.agent_id is not null
      ) u
    ) as landlords_managers_count;
$$;

comment on function public.get_public_landing_stats() is
  'Anonymous-safe aggregates for landing page hero stats (counts + successful rent volume).';

revoke all on function public.get_public_landing_stats() from public;
grant execute on function public.get_public_landing_stats() to anon, authenticated;
