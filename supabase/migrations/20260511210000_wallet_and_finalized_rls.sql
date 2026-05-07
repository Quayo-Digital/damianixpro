-- RLS for tables that had GRANT SELECT but no policies (RLS would block all reads).

-- ---------------------------------------------------------------------------
-- rent_payment_accounting_finalized
-- ---------------------------------------------------------------------------
drop policy if exists rent_payment_accounting_finalized_select on public.rent_payment_accounting_finalized;
create policy rent_payment_accounting_finalized_select on public.rent_payment_accounting_finalized
  for select to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.rent_payments rp
      join public.property_tenants pt on pt.id = rp.property_tenant_id
      join public.tenants t on t.id = pt.tenant_id
      where rp.id = rent_payment_accounting_finalized.rent_payment_id
        and t.user_id = auth.uid()
    )
    or exists (
      select 1 from public.rent_payments rp
      join public.property_tenants pt on pt.id = rp.property_tenant_id
      join public.properties p on p.id = pt.property_id
      where rp.id = rent_payment_accounting_finalized.rent_payment_id
        and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- wallet_entry_batches
-- ---------------------------------------------------------------------------
drop policy if exists wallet_entry_batches_select on public.wallet_entry_batches;
create policy wallet_entry_batches_select on public.wallet_entry_batches
  for select to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.rent_payments rp
      join public.property_tenants pt on pt.id = rp.property_tenant_id
      join public.tenants t on t.id = pt.tenant_id
      where rp.id = wallet_entry_batches.rent_payment_id
        and t.user_id = auth.uid()
    )
    or exists (
      select 1 from public.rent_payments rp
      join public.property_tenants pt on pt.id = rp.property_tenant_id
      join public.properties p on p.id = pt.property_id
      where rp.id = wallet_entry_batches.rent_payment_id
        and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- wallet_entry_lines (via batch → rent_payment)
-- ---------------------------------------------------------------------------
drop policy if exists wallet_entry_lines_select on public.wallet_entry_lines;
create policy wallet_entry_lines_select on public.wallet_entry_lines
  for select to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.wallet_entry_batches wb
      join public.rent_payments rp on rp.id = wb.rent_payment_id
      join public.property_tenants pt on pt.id = rp.property_tenant_id
      join public.tenants t on t.id = pt.tenant_id
      where wb.id = wallet_entry_lines.batch_id
        and t.user_id = auth.uid()
    )
    or exists (
      select 1 from public.wallet_entry_batches wb
      join public.rent_payments rp on rp.id = wb.rent_payment_id
      join public.property_tenants pt on pt.id = rp.property_tenant_id
      join public.properties p on p.id = pt.property_id
      where wb.id = wallet_entry_lines.batch_id
        and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- payment_wallets: extend to org-scoped wallets (owner/agent on any property in org)
-- ---------------------------------------------------------------------------
drop policy if exists payment_wallets_select on public.payment_wallets;
create policy payment_wallets_select on public.payment_wallets
  for select to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.property_tenants pt
      join public.tenants t on t.id = pt.tenant_id
      where pt.id = payment_wallets.property_tenant_id
        and t.user_id = auth.uid()
    )
    or (
      payment_wallets.organization_id is not null
      and exists (
        select 1 from public.properties p
        where p.organization_id = payment_wallets.organization_id
          and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
      )
    )
  );
