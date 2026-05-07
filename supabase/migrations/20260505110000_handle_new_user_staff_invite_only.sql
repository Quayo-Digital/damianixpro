-- Staff roles (accountant, facility_manager) are assigned by admins only — not via public signup metadata.
-- Restores handle_new_user role whitelist to match original policy (facility_manager allowed; accountant coerced to tenant if sent).

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_nm text;
  fn text;
  ln text;
  em text;
  role_text text;

  has_full_name boolean := false;
  has_first_last boolean := false;
begin
  begin
    full_nm := trim(coalesce(meta->>'full_name', meta->>'name', ''));

    if full_nm <> '' then
      fn := split_part(full_nm, ' ', 1);
      ln := nullif(trim(substring(full_nm from length(fn) + 2)), '');
    else
      fn := nullif(trim(coalesce(meta->>'first_name', '')), '');
      ln := nullif(trim(coalesce(meta->>'last_name', '')), '');
    end if;

    em := nullif(trim(coalesce(new.email, meta->>'email', '')), '');
    if em is null then
      em := new.id::text || '@users.noreply.supabase';
    end if;

    role_text := trim(coalesce(meta->>'role', ''));
    if role_text = '' then
      role_text := 'tenant';
    end if;

    if lower(role_text) not in ('tenant', 'owner', 'agent', 'vendor', 'manager', 'facility_manager') then
      role_text := 'tenant';
    end if;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'full_name'
    )
    into has_full_name;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'first_name'
    )
    into has_first_last;

    if has_first_last then
      if not exists (select 1 from public.profiles p where p.id = new.id) then
        insert into public.profiles (id, first_name, last_name, email)
        values (new.id, fn, ln, em);
      end if;
    elsif has_full_name then
      if not exists (select 1 from public.profiles p where p.id = new.id) then
        insert into public.profiles (id, full_name, email)
        values (new.id, coalesce(full_nm, ''), em);
      end if;
    end if;

    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = 'user_roles'
    ) then
      if not exists (select 1 from public.user_roles ur where ur.user_id = new.id) then
        insert into public.user_roles (user_id, role)
        values (new.id, role_text);
      end if;
    end if;
  exception
    when others then
      raise notice 'handle_new_user nonfatal trigger error: %', sqlerrm;
  end;

  return new;
end;
$function$;

commit;
