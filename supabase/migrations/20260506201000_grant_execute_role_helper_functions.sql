-- Fix: RLS policies call helper functions (e.g. public.is_admin(auth.uid())).
-- If EXECUTE is not granted to authenticated, PostgREST queries fail with:
-- "permission denied for function is_admin" (SQLSTATE 42501).

begin;

do $$
begin
  -- is_admin(uuid default auth.uid())
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'is_admin'
      and pg_get_function_identity_arguments(p.oid) = 'check_user_id uuid'
  ) then
    execute 'grant execute on function public.is_admin(uuid) to authenticated';
    execute 'grant execute on function public.is_admin(uuid) to anon';
  end if;

  -- is_owner(uuid default auth.uid())
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'is_owner'
      and pg_get_function_identity_arguments(p.oid) = 'user_id uuid'
  ) then
    execute 'grant execute on function public.is_owner(uuid) to authenticated';
    execute 'grant execute on function public.is_owner(uuid) to anon';
  end if;

  -- is_agent(uuid)
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'is_agent'
      and pg_get_function_identity_arguments(p.oid) = 'user_id uuid'
  ) then
    execute 'grant execute on function public.is_agent(uuid) to authenticated';
    execute 'grant execute on function public.is_agent(uuid) to anon';
  end if;
end;
$$;

commit;

