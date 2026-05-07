-- Align RLS with owner `accounting.post`: property owners may write manual expenses
-- and commission accruals for their properties; remove listing-agent write on those tables
-- (agents keep SELECT where policies allow). Owners may delete draft commission lines.

begin;

-- ---------------------------------------------------------------------------
-- accounting_expenses: INSERT/UPDATE only for owner of property (not listing agent)
-- ---------------------------------------------------------------------------
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
          and p.owner_id = auth.uid()
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
          and p.owner_id = auth.uid()
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
          and p.owner_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- accounting_commissions: INSERT/UPDATE for property owner only (+ staff);
-- DELETE for admin, accountant, or property owner
-- ---------------------------------------------------------------------------
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
        and p.owner_id = auth.uid()
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
        and p.owner_id = auth.uid()
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
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists accounting_commissions_delete on public.accounting_commissions;
create policy accounting_commissions_delete on public.accounting_commissions
  for delete to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'accountant'
    )
    or exists (
      select 1 from public.properties p
      where p.id = accounting_commissions.property_id
        and p.owner_id = auth.uid()
    )
  );

commit;
