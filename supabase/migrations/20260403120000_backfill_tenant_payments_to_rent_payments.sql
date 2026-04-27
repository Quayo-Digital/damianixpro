-- One-off backfill: tenant_payments → rent_payments (canonical ledger).
--
-- Conflict / skip rules (in order):
--   1. Skip if tenant_payments.reference_number IS NULL or blank (cannot dedupe safely).
--   2. Skip if no property_tenant row can be resolved for that tenant_payments row.
--   3. Skip if rent_payments already has a row with the same reference (trim + lower match).
--   4. Insert-only: never UPDATE existing rent_payments; tenant_payments rows are left intact.
--   5. New rent_payments.id is always gen_random_uuid() (do not reuse tenant_payments.id).
--
-- property_tenant_id resolution:
--   A) If lease_id is set: match property_tenants where tenant_id = tp.tenant_id AND property_id =
--      (SELECT property_id FROM leases WHERE id = tp.lease_id).
--   B) Else: latest property_tenants row for tp.tenant_id by created_at DESC (NULLS LAST).

begin;

do $migration$
declare
  v_inserted integer := 0;
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'tenant_payments'
  ) then
    raise notice 'backfill: tenant_payments missing, skipping';
    return;
  end if;

  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'rent_payments'
  ) then
    raise notice 'backfill: rent_payments missing, skipping';
    return;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'rent_payments' and column_name = 'property_tenant_id'
  ) then
    raise notice 'backfill: rent_payments.property_tenant_id missing, skipping';
    return;
  end if;

  alter table public.rent_payments
    add column if not exists is_recurring boolean default false;

  with resolved as (
    select
      tp.id as source_id,
      tp.tenant_id,
      tp.amount,
      nullif(trim(tp.reference_number), '') as reference_number,
      tp.payment_status,
      tp.payment_type,
      tp.payment_method,
      tp.description,
      tp.due_date,
      tp.paid_at,
      tp.created_at,
      tp.updated_at,
      coalesce(
        (
          select pt.id
          from public.leases l
          join public.property_tenants pt
            on pt.tenant_id = tp.tenant_id
           and pt.property_id = l.property_id
          where tp.lease_id is not null
            and l.id = tp.lease_id
            and l.tenant_id = tp.tenant_id
          limit 1
        ),
        (
          select pt2.id
          from public.property_tenants pt2
          where pt2.tenant_id = tp.tenant_id
          order by pt2.created_at desc nulls last
          limit 1
        )
      ) as property_tenant_id
    from public.tenant_payments tp
    where tp.reference_number is not null
      and trim(tp.reference_number) <> ''
  ),
  to_insert as (
    select
      gen_random_uuid() as id,
      r.property_tenant_id,
      r.amount,
      r.reference_number as reference,
      case lower(trim(coalesce(r.payment_status, 'pending')))
        when 'completed' then 'successful'
        when 'successful' then 'successful'
        when 'failed' then 'failed'
        when 'cancelled' then 'cancelled'
        when 'refunded' then 'cancelled'
        else 'pending'
      end as status,
      case
        when lower(trim(coalesce(r.payment_status, 'pending'))) in ('completed', 'successful')
        then coalesce(r.paid_at::date, r.updated_at::date, r.created_at::date)
        else null
      end as payment_date,
      coalesce(r.due_date, r.created_at::date) as due_date,
      coalesce(nullif(trim(r.payment_type), ''), 'rent') as category,
      coalesce(left(trim(coalesce(r.description, '')), 2000), '') as description,
      coalesce(nullif(trim(r.payment_method), ''), 'bank_transfer') as payment_method,
      coalesce(r.created_at, now()) as created_at,
      coalesce(r.updated_at, now()) as updated_at
    from resolved r
    where r.property_tenant_id is not null
      and not exists (
        select 1
        from public.rent_payments rp
        where lower(trim(rp.reference)) = lower(trim(r.reference_number))
      )
  )
  insert into public.rent_payments (
    id,
    property_tenant_id,
    amount,
    reference,
    status,
    payment_date,
    due_date,
    category,
    description,
    payment_method,
    is_recurring,
    created_at,
    updated_at
  )
  select
    t.id,
    t.property_tenant_id,
    t.amount,
    t.reference,
    t.status,
    t.payment_date,
    t.due_date,
    t.category,
    t.description,
    t.payment_method,
    false,
    t.created_at,
    t.updated_at
  from to_insert t;

  get diagnostics v_inserted = row_count;
  raise notice 'backfill tenant_payments → rent_payments: inserted % rows', v_inserted;
end $migration$;

commit;
