-- Allow tenant payment flow to self-heal property_tenants links even when tenant
-- role cannot directly INSERT/UPDATE property_tenants due to RLS/privileges.

begin;

create or replace function public.ensure_current_user_property_tenant_link(
  p_tenant_id uuid,
  p_property_id uuid default null
)
returns table (id uuid, property_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_property_id uuid := p_property_id;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Caller can only request links for their own tenant profile.
  if not exists (
    select 1
    from public.tenants t
    where t.id = p_tenant_id
      and t.user_id = v_uid
  ) then
    raise exception 'tenant_not_owned_by_user';
  end if;

  if v_property_id is null then
    -- Prefer latest lease property.
    select l.property_id into v_property_id
    from public.leases l
    where l.tenant_id = p_tenant_id
    order by l.created_at desc
    limit 1;
  end if;

  if v_property_id is null then
    -- Fallback to latest approved rental application for this auth user.
    select ra.property_id into v_property_id
    from public.rental_applications ra
    where ra.user_id = v_uid
      and ra.status = 'approved'
    order by ra.updated_at desc nulls last, ra.created_at desc
    limit 1;
  end if;

  if v_property_id is null then
    return;
  end if;

  insert into public.property_tenants (
    property_id,
    tenant_id,
    start_date,
    rent_amount,
    status
  )
  values (
    v_property_id,
    p_tenant_id,
    current_date,
    null,
    'active'
  )
  on conflict (property_id, tenant_id) do update
    set updated_at = now();

  return query
  select pt.id, pt.property_id
  from public.property_tenants pt
  where pt.property_id = v_property_id
    and pt.tenant_id = p_tenant_id
  limit 1;
end;
$$;

revoke all on function public.ensure_current_user_property_tenant_link(uuid, uuid) from public;
grant execute on function public.ensure_current_user_property_tenant_link(uuid, uuid) to authenticated;

commit;

