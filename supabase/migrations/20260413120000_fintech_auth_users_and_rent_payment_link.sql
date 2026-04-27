-- Bridge Supabase auth/profiles to fintech-api ledger identity without touching org-scoped public.users.
-- fintech-api expects rows keyed by auth.users.id (see FINTECH_USER_TABLE / fintech_auth_users).

begin;

-- ---------------------------------------------------------------------------
-- 1) Ledger identity mirror (one row per auth user)
-- ---------------------------------------------------------------------------
create table if not exists public.fintech_auth_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_fintech_auth_users_email on public.fintech_auth_users (email)
where
  email is not null;

comment on table public.fintech_auth_users is 'Auth-aligned users for fintech-api / ledger FKs; mirrors auth.users.id. Separate from org public.users.';

-- Backfill from profiles: EXECUTE per branch so missing columns are never parsed
-- (runtime WHERE does not hide invalid p.full_name / p.last_name from the planner.)
do $bf$
declare
  has_first boolean;
  has_last boolean;
  has_full boolean;
begin
  select
    exists (
      select
        1
      from
        information_schema.columns c
      where
        c.table_schema = 'public'
        and c.table_name = 'profiles'
        and c.column_name = 'first_name'
    )
  into has_first;

  select
    exists (
      select
        1
      from
        information_schema.columns c
      where
        c.table_schema = 'public'
        and c.table_name = 'profiles'
        and c.column_name = 'last_name'
    )
  into has_last;

  select
    exists (
      select
        1
      from
        information_schema.columns c
      where
        c.table_schema = 'public'
        and c.table_name = 'profiles'
        and c.column_name = 'full_name'
    )
  into has_full;

  if has_first and has_last then
    execute $q$
      insert into public.fintech_auth_users (id, email, full_name)
      select
        p.id,
        p.email,
        trim(
          both from
            concat_ws(' ', nullif(trim(p.first_name::text), ''), nullif(trim(p.last_name::text), ''))
        )
      from
        public.profiles p
      on conflict (id) do update
      set
        email = coalesce(excluded.email, public.fintech_auth_users.email),
        full_name = coalesce(nullif(excluded.full_name, ''), public.fintech_auth_users.full_name),
        updated_at = now()
    $q$;
  elsif has_first then
    execute $q$
      insert into public.fintech_auth_users (id, email, full_name)
      select
        p.id,
        p.email,
        trim(both from nullif(trim(p.first_name::text), ''))
      from
        public.profiles p
      on conflict (id) do update
      set
        email = coalesce(excluded.email, public.fintech_auth_users.email),
        full_name = coalesce(nullif(excluded.full_name, ''), public.fintech_auth_users.full_name),
        updated_at = now()
    $q$;
  elsif has_full then
    execute $q$
      insert into public.fintech_auth_users (id, email, full_name)
      select
        p.id,
        p.email,
        coalesce(nullif(trim(p.full_name::text), ''), '')
      from
        public.profiles p
      on conflict (id) do update
      set
        email = coalesce(excluded.email, public.fintech_auth_users.email),
        full_name = coalesce(nullif(excluded.full_name, ''), public.fintech_auth_users.full_name),
        updated_at = now()
    $q$;
  elsif exists (
    select
      1
    from
      information_schema.tables
    where
      table_schema = 'public'
      and table_name = 'profiles'
  ) then
    execute $q$
      insert into public.fintech_auth_users (id, email, full_name)
      select
        p.id,
        p.email,
        null::text
      from
        public.profiles p
      on conflict (id) do update
      set
        email = coalesce(excluded.email, public.fintech_auth_users.email),
        full_name = coalesce(public.fintech_auth_users.full_name, excluded.full_name),
        updated_at = now()
    $q$;
  end if;
end;
$bf$;

-- ---------------------------------------------------------------------------
-- 2) Optional rent_payments linkage to ledger (nullable, non-breaking)
-- ---------------------------------------------------------------------------
do $rp$
begin
  if exists (
    select
      1
    from
      information_schema.tables
    where
      table_schema = 'public'
      and table_name = 'rent_payments'
  ) then
    alter table public.rent_payments
      add column if not exists amount_minor bigint,
      add column if not exists currency_code char(3) default 'NGN',
      add column if not exists fintech_journal_id uuid,
      add column if not exists fintech_idempotency_key text;
  end if;
end;
$rp$;

do $ix$
begin
  if exists (
    select
      1
    from
      information_schema.tables where
      table_schema = 'public'
      and table_name = 'rent_payments'
  ) then
    execute 'create unique index if not exists uq_rent_payments_fintech_idempotency on public.rent_payments (fintech_idempotency_key) where fintech_idempotency_key is not null';
  end if;
end;
$ix$;

do $c$
begin
  if exists (
    select
      1
    from
      information_schema.tables
    where
      table_schema = 'public'
      and table_name = 'rent_payments'
  ) then
    execute 'comment on column public.rent_payments.amount_minor is ''Optional: rent amount in minor units (e.g. kobo) for fintech parity.''';
    execute 'comment on column public.rent_payments.fintech_journal_id is ''Optional: ledger journal id after successful wallet transfer.''';
    execute 'comment on column public.rent_payments.fintech_idempotency_key is ''Optional: idempotency key used with fintech-api debit-rent.''';
  end if;
end;
$c$;

-- ---------------------------------------------------------------------------
-- 3) Extend handle_new_user: upsert fintech_auth_users (non-fatal)
-- ---------------------------------------------------------------------------
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
    full_nm := trim(coalesce(meta ->> 'full_name', meta ->> 'name', ''));

    if full_nm <> '' then
      fn := split_part(full_nm, ' ', 1);
      ln := nullif(trim(substring(full_nm from length(fn) + 2)), '');
    else
      fn := nullif(trim(coalesce(meta ->> 'first_name', '')), '');
      ln := nullif(trim(coalesce(meta ->> 'last_name', '')), '');
    end if;

    em := nullif(trim(coalesce(new.email, meta ->> 'email', '')), '');
    if em is null then
      em := new.id::text || '@users.noreply.supabase';
    end if;

    role_text := trim(coalesce(meta ->> 'role', ''));
    if role_text = '' then
      role_text := 'tenant';
    end if;

    if lower(role_text) not in ('tenant', 'owner', 'agent', 'vendor', 'manager') then
      role_text := 'tenant';
    end if;

    select
      exists (
        select
          1
        from
          information_schema.columns
        where
          table_schema = 'public'
          and table_name = 'profiles'
          and column_name = 'full_name'
      )
    into has_full_name;

    select
      exists (
        select
          1
        from
          information_schema.columns
        where
          table_schema = 'public'
          and table_name = 'profiles'
          and column_name = 'first_name'
      )
    into has_first_last;

    if has_first_last then
      if not exists (
        select
          1
        from
          public.profiles p
        where
          p.id = new.id
      ) then
        insert into public.profiles (id, first_name, last_name, email)
        values (new.id, fn, ln, em);
      end if;
    elsif has_full_name then
      if not exists (
        select
          1
        from
          public.profiles p
        where
          p.id = new.id
      ) then
        insert into public.profiles (id, full_name, email)
        values (new.id, coalesce(full_nm, ''), em);
      end if;
    end if;

    if exists (
      select
        1
      from
        information_schema.tables
      where
        table_schema = 'public'
        and table_name = 'user_roles'
    ) then
      if not exists (
        select
          1 from
          public.user_roles ur
        where
          ur.user_id = new.id
      ) then
        insert into public.user_roles (user_id, role)
        values (new.id, role_text);
      end if;
    end if;

    -- Fintech bridge: same UUID as auth.users / profiles.id
    insert into public.fintech_auth_users (id, email, full_name)
    values (
      new.id,
      em,
      trim(
        both
        from
          concat_ws(' ', nullif(fn, ''), nullif(ln, ''))
      )
    )
    on conflict (id) do update
    set
      email = excluded.email,
      full_name = coalesce(nullif(excluded.full_name, ''), public.fintech_auth_users.full_name),
      updated_at = now();
  exception
    when others then
      raise notice 'handle_new_user nonfatal trigger error: %', sqlerrm;
  end;

  return new;
end;
$function$;

commit;
