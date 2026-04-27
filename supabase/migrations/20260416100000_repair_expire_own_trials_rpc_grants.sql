-- Repair: expire_own_subscription_trials_if_due must be executable by authenticated.
-- Run this if you see "permission denied for function expire_own_subscription_trials_if_due"
-- (e.g. function created manually, or grants were revoked).

begin;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'expire_own_subscription_trials_if_due'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    execute 'revoke all on function public.expire_own_subscription_trials_if_due() from public';
    execute 'grant execute on function public.expire_own_subscription_trials_if_due() to authenticated';
    execute 'grant execute on function public.expire_own_subscription_trials_if_due() to service_role';
  end if;
end;
$$;

commit;
