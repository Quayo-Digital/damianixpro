-- Accounting module: operational expenses, agent commissions, extended ledger read for finance roles.
-- NGN amounts; Nigerian use-cases (rent, service charge, maintenance, utilities, VAT field optional).

begin;

-- ---------------------------------------------------------------------------
-- 1) Operational expenses (manual; maintenance_request link optional)
-- ---------------------------------------------------------------------------
create table if not exists public.accounting_expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties (id) on delete set null,
  maintenance_request_id uuid references public.maintenance_requests (id) on delete set null,
  expense_type text not null default 'other'
    check (
      expense_type = any (
        array[
          'maintenance',
          'utilities',
          'service_charge',
          'insurance',
          'legal',
          'agency_fee',
          'management_fee',
          'other'
        ]::text[]
      )
    ),
  amount_ngn numeric(14, 2) not null check (amount_ngn >= 0),
  vat_amount_ngn numeric(14, 2) not null default 0 check (vat_amount_ngn >= 0),
  expense_date date not null default (current_date),
  description text,
  reference text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_accounting_expenses_property on public.accounting_expenses (property_id);
create index if not exists idx_accounting_expenses_date on public.accounting_expenses (expense_date);

comment on table public.accounting_expenses is
  'Manual operating expenses in NGN (utilities, repairs, etc.). Rent/service charge income stays in rent_payments.';

-- ---------------------------------------------------------------------------
-- 2) Agent commission accruals (NGN)
-- ---------------------------------------------------------------------------
create table if not exists public.accounting_commissions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  agent_id uuid not null references public.profiles (id) on delete cascade,
  rent_payment_id uuid references public.rent_payments (id) on delete set null,
  basis_amount_ngn numeric(14, 2) not null check (basis_amount_ngn >= 0),
  commission_pct numeric(6, 3) not null check (commission_pct >= 0 and commission_pct <= 100),
  commission_amount_ngn numeric(14, 2) not null check (commission_amount_ngn >= 0),
  period_month date not null,
  status text not null default 'pending' check (status = any (array['pending', 'approved', 'paid']::text[])),
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_accounting_commissions_agent on public.accounting_commissions (agent_id);
create index if not exists idx_accounting_commissions_property on public.accounting_commissions (property_id);
create index if not exists idx_accounting_commissions_month on public.accounting_commissions (period_month);

comment on table public.accounting_commissions is
  'Agent commission lines in NGN; link optional rent_payment for reconciled deals.';

-- updated_at
drop trigger if exists trg_accounting_expenses_updated on public.accounting_expenses;
create trigger trg_accounting_expenses_updated
  before update on public.accounting_expenses
  for each row execute function public.update_updated_at_column();

drop trigger if exists trg_accounting_commissions_updated on public.accounting_commissions;
create trigger trg_accounting_commissions_updated
  before update on public.accounting_commissions
  for each row execute function public.update_updated_at_column();

-- Grants
grant select, insert, update, delete on public.accounting_expenses to authenticated;
grant select, insert, update, delete on public.accounting_commissions to authenticated;

alter table public.accounting_expenses enable row level security;
alter table public.accounting_commissions enable row level security;

-- Helper: accountant role
-- accounting_expenses policies
drop policy if exists accounting_expenses_select on public.accounting_expenses;
create policy accounting_expenses_select on public.accounting_expenses
  for select to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'accountant'
    )
    or (
      property_id is not null
      and exists (
        select 1 from public.properties p
        where p.id = accounting_expenses.property_id
          and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
      )
    )
    or (property_id is null and public.is_admin(auth.uid()))
  );

drop policy if exists accounting_expenses_insert on public.accounting_expenses;
create policy accounting_expenses_insert on public.accounting_expenses
  for insert to authenticated
  with check (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'accountant'
    )
    or (
      property_id is not null
      and exists (
        select 1 from public.properties p
        where p.id = accounting_expenses.property_id
          and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
      )
    )
  );

drop policy if exists accounting_expenses_update on public.accounting_expenses;
create policy accounting_expenses_update on public.accounting_expenses
  for update to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'accountant'
    )
    or (
      property_id is not null
      and exists (
        select 1 from public.properties p
        where p.id = accounting_expenses.property_id
          and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
      )
    )
  )
  with check (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'accountant'
    )
    or (
      property_id is not null
      and exists (
        select 1 from public.properties p
        where p.id = accounting_expenses.property_id
          and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
      )
    )
  );

drop policy if exists accounting_expenses_delete on public.accounting_expenses;
create policy accounting_expenses_delete on public.accounting_expenses
  for delete to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'accountant'
    )
    or (
      property_id is not null
      and exists (
        select 1 from public.properties p
        where p.id = accounting_expenses.property_id
          and p.owner_id = auth.uid()
      )
    )
  );

-- accounting_commissions policies
drop policy if exists accounting_commissions_select on public.accounting_commissions;
create policy accounting_commissions_select on public.accounting_commissions
  for select to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'accountant'
    )
    or agent_id = auth.uid()
    or exists (
      select 1 from public.properties p
      where p.id = accounting_commissions.property_id
        and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
    )
  );

drop policy if exists accounting_commissions_insert on public.accounting_commissions;
create policy accounting_commissions_insert on public.accounting_commissions
  for insert to authenticated
  with check (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'accountant'
    )
    or exists (
      select 1 from public.properties p
      where p.id = accounting_commissions.property_id
        and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
    )
  );

drop policy if exists accounting_commissions_update on public.accounting_commissions;
create policy accounting_commissions_update on public.accounting_commissions
  for update to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'accountant'
    )
    or exists (
      select 1 from public.properties p
      where p.id = accounting_commissions.property_id
        and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
    )
  )
  with check (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'accountant'
    )
    or exists (
      select 1 from public.properties p
      where p.id = accounting_commissions.property_id
        and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
    )
  );

drop policy if exists accounting_commissions_delete on public.accounting_commissions;
create policy accounting_commissions_delete on public.accounting_commissions
  for delete to authenticated
  using (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 3) Ledger read: owners/agents on property + accountants (select only)
--    Only if journal_entries has been extended with property_id (rent bridge).
-- ---------------------------------------------------------------------------
do $j$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'journal_entries'
      and column_name = 'property_id'
  ) then
    execute 'drop policy if exists journal_entries_owner_agent_select on public.journal_entries';
    execute $p$
      create policy journal_entries_owner_agent_select on public.journal_entries
        for select to authenticated
        using (
          property_id is not null
          and exists (
            select 1 from public.properties p
            where p.id = journal_entries.property_id
              and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
          )
        )
    $p$;

    execute 'drop policy if exists journal_entries_accountant_select on public.journal_entries';
    execute $q$
      create policy journal_entries_accountant_select on public.journal_entries
        for select to authenticated
        using (
          exists (
            select 1 from public.user_roles ur
            where ur.user_id = auth.uid() and ur.role = 'accountant'
          )
        )
    $q$;
  end if;
end;
$j$;

commit;
