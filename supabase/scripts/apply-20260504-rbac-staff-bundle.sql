-- AUTO-GENERATED — do not edit. Run: npm run build:supabase-manual-bundle
-- Paste into Supabase SQL Editor when CLI cannot reach api.supabase.com.


-- ========== 20260504120000_rbac_roles_accountant_facility_manager.sql ==========

-- Enterprise RBAC: extend user_role enum + user_roles check + signup whitelist (handle_new_user).

begin;

-- 1) Enum values (idempotent)
do $$
begin
  alter type public.user_role add value 'accountant';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter type public.user_role add value 'facility_manager';
exception
  when duplicate_object then null;
end $$;

-- 2) Relax / widen CHECK on user_roles.role (text column)
alter table public.user_roles drop constraint if exists user_roles_role_check;

alter table public.user_roles add constraint user_roles_role_check check (
  role = any (
    array[
      'super_admin',
      'admin',
      'owner',
      'agent',
      'tenant',
      'vendor',
      'user',
      'manager',
      'accountant',
      'facility_manager'
    ]::text[]
  )
);

-- 3) Signup: allow facility_manager from metadata; accountant remains invite-only (coerced to tenant if sent)
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


-- ========== 20260504180000_staff_read_properties_and_units.sql ==========

-- Allow accountant + facility_manager (via public.user_roles) to SELECT all properties and units
-- for portfolio context, aligned with RBAC properties.read (writes remain on existing policies).

begin;

-- ---------------------------------------------------------------------------
-- properties: extend authenticated_read_properties_v2
-- ---------------------------------------------------------------------------
drop policy if exists "authenticated_read_properties_v2" on public.properties;

create policy "authenticated_read_properties_v2"
on public.properties
for select
to authenticated
using (
  coalesce(status, ''::text) = 'Available'::text
  or owner_id = auth.uid()
  or agent_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in (
        'admin'::text,
        'super_admin'::text,
        'accountant'::text,
        'facility_manager'::text
      )
  )
);

-- ---------------------------------------------------------------------------
-- units: extend read policy (SELECT only; mutate still owner/agent/admin profiles path)
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view units for accessible properties" on public.units;

create policy "Users can view units for accessible properties"
on public.units
as permissive
for select
to public
using (
  exists (
    select 1
    from public.properties p
    where p.id = units.property_id
      and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
  )
  or exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and lower(coalesce(pr.role, '')::text) in ('admin', 'super_admin')
  )
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in (
        'admin'::text,
        'super_admin'::text,
        'accountant'::text,
        'facility_manager'::text
      )
  )
);

commit;


-- ========== 20260504183000_staff_read_property_announcements.sql ==========

-- Staff with portfolio access can read announcements (write still via check_property_access / admin).

begin;

drop policy if exists "property_announcements_select_residents" on public.property_announcements;

create policy "property_announcements_select_residents"
on public.property_announcements
for select
to authenticated
using (
  exists (
    select 1
    from public.property_tenants pt
    inner join public.tenants t on t.id = pt.tenant_id
    where pt.property_id = property_announcements.property_id
      and t.user_id = auth.uid()
      and coalesce(pt.status, 'active') = 'active'
      and (pt.end_date is null or pt.end_date >= current_date)
  )
  or public.is_admin(auth.uid())
  or public.check_property_access(property_id, auth.uid())
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in (
        'admin'::text,
        'super_admin'::text,
        'accountant'::text,
        'facility_manager'::text
      )
  )
);

commit;


-- ========== 20260504184500_property_media_select_agents_and_staff.sql ==========

-- Allow assigned agents and portfolio staff to SELECT property_media for any property they work with
-- (not only AVAILABLE + owner + admin). Mutations stay on existing owner/admin policies.

begin;

drop policy if exists property_media_select_public on public.property_media;

create policy property_media_select_public
on public.property_media
for select
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_media.property_id
      and (
        coalesce(upper(p.status), 'AVAILABLE') = 'AVAILABLE'
        or p.owner_id = auth.uid()
        or p.agent_id = auth.uid()
        or public.is_admin_or_super_admin(auth.uid())
        or exists (
          select 1
          from public.user_roles ur
          where ur.user_id = auth.uid()
            and ur.role in ('accountant'::text, 'facility_manager'::text)
        )
      )
  )
);

commit;


-- ========== 20260505100000_handle_new_user_allow_accountant_signup.sql ==========

-- No-op placeholder. An earlier iteration used this revision to widen signup roles; policy is finalized in 20260505110000_handle_new_user_staff_invite_only.sql.
-- Retain this file so clones match remote schema_migrations when that version was already applied.

begin;
commit;


-- ========== 20260505110000_handle_new_user_staff_invite_only.sql ==========

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

