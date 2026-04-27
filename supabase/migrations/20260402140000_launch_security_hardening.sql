-- Launch hardening: super_admin bootstrap RPC, user_roles RLS, signup role whitelist,
-- payment_breakdown idempotency (unique payment_id), idempotent journal RPC.

begin;

-- ---------------------------------------------------------------------------
-- 1. super_admin_invite (bootstrap codes; no direct client table access needed)
-- ---------------------------------------------------------------------------
create table if not exists public.super_admin_invite (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  used boolean not null default false,
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create unique index if not exists super_admin_invite_code_key on public.super_admin_invite (code);

alter table public.super_admin_invite enable row level security;

comment on table public.super_admin_invite is
  'One-time codes for first super_admin; redeemed only via redeem_super_admin_invite().';

-- ---------------------------------------------------------------------------
-- 2. redeem_super_admin_invite — SECURITY DEFINER (bypasses RLS safely)
-- ---------------------------------------------------------------------------
create or replace function public.redeem_super_admin_invite(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  inv public.super_admin_invite%rowtype;
  uid uuid := auth.uid();
  norm text := nullif(trim(p_code), '');
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if norm is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  select * into inv
  from public.super_admin_invite
  where lower(trim(code)) = lower(norm) and used = false
  limit 1
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  if exists (select 1 from public.user_roles ur where ur.role = 'super_admin' limit 1) then
    return jsonb_build_object('ok', false, 'error', 'super_admin_exists');
  end if;

  insert into public.user_roles (user_id, role)
  values (uid, 'super_admin')
  on conflict (user_id) do update set role = excluded.role;

  update public.super_admin_invite
  set used = true, used_by = uid, used_at = now()
  where id = inv.id;

  return jsonb_build_object('ok', true);
end;
$fn$;

revoke all on function public.redeem_super_admin_invite(text) from public;
grant execute on function public.redeem_super_admin_invite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Unique one breakdown row per rent payment (webhook idempotency)
-- ---------------------------------------------------------------------------
do $m$
begin
  if exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'payment_breakdowns'
      and c.column_name = 'payment_id'
  ) then
    create unique index if not exists idx_payment_breakdowns_unique_payment_id
      on public.payment_breakdowns (payment_id);
  end if;
end $m$;

-- ---------------------------------------------------------------------------
-- 4. Idempotent journal posting for rent payments (safe webhook retries)
-- ---------------------------------------------------------------------------
create or replace function public.create_journal_entries_from_rent_payment(
  p_payment_id uuid,
  p_entry_date date default current_date,
  p_property_id uuid default null::uuid,
  p_tenant_id uuid default null::uuid
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_batch_id uuid := gen_random_uuid();
  v_breakdown record;
  v_ref text;
  v_existing_batch uuid;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'journal_entries'
      and column_name = 'source_type'
  )
  and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'journal_entries'
      and column_name = 'source_id'
  ) then
    select je.journal_batch_id
    into v_existing_batch
    from public.journal_entries je
    where je.source_type = 'rent_payment'
      and je.source_id = p_payment_id
    limit 1;

    if v_existing_batch is not null then
      return v_existing_batch;
    end if;
  end if;

  select * into v_breakdown
  from public.payment_breakdowns
  where payment_id = p_payment_id
  limit 1;

  if not found then
    raise exception 'Payment breakdown not found for payment_id %', p_payment_id;
  end if;

  v_ref := p_payment_id::text;

  insert into public.journal_entries (
    journal_batch_id, entry_date, account, debit, credit, description, reference,
    source_type, source_id, property_id, tenant_id
  )
  values (
    v_batch_id, p_entry_date, 'Cash/Bank Account', v_breakdown.total_amount, 0,
    'Payment received', v_ref, 'rent_payment', p_payment_id, p_property_id, p_tenant_id
  );

  if v_breakdown.platform_fee > 0 then
    insert into public.journal_entries (
      journal_batch_id, entry_date, account, debit, credit, description, reference,
      source_type, source_id, property_id, tenant_id
    )
    values (
      v_batch_id, p_entry_date, 'Platform Revenue', 0, v_breakdown.platform_fee,
      'Platform service fee', v_ref, 'rent_payment', p_payment_id, p_property_id, p_tenant_id
    );
  end if;

  if v_breakdown.agent_commission > 0 then
    insert into public.journal_entries (
      journal_batch_id, entry_date, account, debit, credit, description, reference,
      source_type, source_id, property_id, tenant_id
    )
    values (
      v_batch_id, p_entry_date, 'Agent Commission Payable', 0, v_breakdown.agent_commission,
      'Agent commission', v_ref, 'rent_payment', p_payment_id, p_property_id, p_tenant_id
    );
  end if;

  if v_breakdown.tax_amount > 0 then
    insert into public.journal_entries (
      journal_batch_id, entry_date, account, debit, credit, description, reference,
      source_type, source_id, property_id, tenant_id
    )
    values (
      v_batch_id, p_entry_date, 'Tax Payable', 0, v_breakdown.tax_amount,
      'VAT/Tax', v_ref, 'rent_payment', p_payment_id, p_property_id, p_tenant_id
    );
  end if;

  if v_breakdown.owner_amount > 0 then
    insert into public.journal_entries (
      journal_batch_id, entry_date, account, debit, credit, description, reference,
      source_type, source_id, property_id, tenant_id
    )
    values (
      v_batch_id, p_entry_date, 'Owner Payout Payable', 0, v_breakdown.owner_amount,
      'Amount due to property owner', v_ref, 'rent_payment', p_payment_id, p_property_id, p_tenant_id
    );
  end if;

  return v_batch_id;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 5. Signup: never assign admin/super_admin from raw_user_meta_data.role
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

    if lower(role_text) not in ('tenant', 'owner', 'agent', 'vendor', 'manager') then
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

-- ---------------------------------------------------------------------------
-- 6. user_roles: block self-service admin / super_admin; keep admin management
-- ---------------------------------------------------------------------------
drop policy if exists "Users can insert own role" on public.user_roles;
drop policy if exists "Users can update own role" on public.user_roles;

-- Idempotent: partial applies / retries must not fail on duplicate policy names
drop policy if exists "user_roles_self_insert_nonprivileged" on public.user_roles;
drop policy if exists "user_roles_self_update_nonprivileged" on public.user_roles;
drop policy if exists "user_roles_admin_insert" on public.user_roles;
drop policy if exists "user_roles_admin_update" on public.user_roles;
drop policy if exists "user_roles_admin_delete" on public.user_roles;

create policy "user_roles_self_insert_nonprivileged"
on public.user_roles
as permissive
for insert
to authenticated
with check (
  auth.uid() = user_id
  and role is not null
  and role not in ('admin', 'super_admin')
);

create policy "user_roles_self_update_nonprivileged"
on public.user_roles
as permissive
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and role not in ('admin', 'super_admin')
);

create policy "user_roles_admin_insert"
on public.user_roles
as permissive
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy "user_roles_admin_update"
on public.user_roles
as permissive
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "user_roles_admin_delete"
on public.user_roles
as permissive
for delete
to authenticated
using (public.is_admin(auth.uid()));

commit;
