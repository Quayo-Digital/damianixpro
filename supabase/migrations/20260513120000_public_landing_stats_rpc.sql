-- Public marketing aggregates for the landing page (no row-level data exposed).
-- SECURITY DEFINER bypasses RLS; returns only scalar totals.

begin;

create or replace function public.get_public_landing_stats ()
returns table (
  properties_count bigint,
  successful_rent_volume_ngn numeric,
  landlords_managers_count bigint
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select
    (
      select count(*)::bigint
      from public.properties
    ) as properties_count,
    (
      select coalesce(
        sum(rp.amount) filter (
          where lower(trim(coalesce(rp.status, ''))) = 'successful'
        ),
        0::numeric
      )
      from public.rent_payments rp
    ) as successful_rent_volume_ngn,
    (
      select count(distinct ur.user_id)::bigint
      from public.user_roles ur
      where ur.user_id is not null
        and ur.role in (
          'owner',
          'agent',
          'manager',
          'facility_manager',
          'admin',
          'super_admin'
        )
    ) as landlords_managers_count;
$$;

comment on function public.get_public_landing_stats () is
  'Landing-page aggregates: property count, successful rent volume (NGN), distinct operator-role users. Callable by anon; no PII.';

revoke all on function public.get_public_landing_stats () from public;
grant execute on function public.get_public_landing_stats () to anon, authenticated;
grant execute on function public.get_public_landing_stats () to service_role;

commit;
