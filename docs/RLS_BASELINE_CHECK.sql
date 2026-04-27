-- RLS Baseline Check
-- Run this in Supabase SQL Editor to detect policy/grant drift.
-- Scope: public.properties, public.listings, public.message_templates

-- =========================================================
-- 1) Table-level RLS enabled?
-- =========================================================
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('properties', 'listings', 'message_templates')
order by c.relname;

-- =========================================================
-- 2) Actual SELECT policies currently present
-- =========================================================
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
from pg_policies
where schemaname = 'public'
  and tablename in ('properties', 'listings', 'message_templates')
  and cmd = 'SELECT'
order by tablename, policyname;

-- =========================================================
-- 3) Expected baseline SELECT policies (drift detector)
--    Expect all rows to be PASS.
-- =========================================================
with expected as (
  select * from (
    values
      ('public'::text, 'properties'::text, 'anon_read_public_properties_v2'::text),
      ('public'::text, 'properties'::text, 'authenticated_read_properties_v2'::text),
      ('public'::text, 'listings'::text, 'anon_read_active_listings_v2'::text),
      ('public'::text, 'listings'::text, 'authenticated_read_listings_v2'::text),
      ('public'::text, 'message_templates'::text, 'anon_read_message_templates_v2'::text),
      ('public'::text, 'message_templates'::text, 'authenticated_read_message_templates_v2'::text)
  ) as t(schemaname, tablename, policyname)
),
actual as (
  select schemaname, tablename, policyname
  from pg_policies
  where cmd = 'SELECT'
)
select
  e.schemaname,
  e.tablename,
  e.policyname,
  case when a.policyname is not null then 'PASS' else 'MISSING' end as status
from expected e
left join actual a
  on a.schemaname = e.schemaname
 and a.tablename = e.tablename
 and a.policyname = e.policyname
order by e.tablename, e.policyname;

-- =========================================================
-- 4) Unexpected SELECT policies (extra drift)
--    Expect zero rows.
-- =========================================================
with expected as (
  select * from (
    values
      ('public'::text, 'properties'::text, 'anon_read_public_properties_v2'::text),
      ('public'::text, 'properties'::text, 'authenticated_read_properties_v2'::text),
      ('public'::text, 'listings'::text, 'anon_read_active_listings_v2'::text),
      ('public'::text, 'listings'::text, 'authenticated_read_listings_v2'::text),
      ('public'::text, 'message_templates'::text, 'anon_read_message_templates_v2'::text),
      ('public'::text, 'message_templates'::text, 'authenticated_read_message_templates_v2'::text)
  ) as t(schemaname, tablename, policyname)
)
select
  p.schemaname,
  p.tablename,
  p.policyname
from pg_policies p
left join expected e
  on e.schemaname = p.schemaname
 and e.tablename = p.tablename
 and e.policyname = p.policyname
where p.schemaname = 'public'
  and p.tablename in ('properties', 'listings', 'message_templates')
  and p.cmd = 'SELECT'
  and e.policyname is null
order by p.tablename, p.policyname;

-- =========================================================
-- 5) Column-level grants for anon (safe public fields)
--    Expect all rows to be PASS.
-- =========================================================
with expected as (
  select * from (
    values
      ('properties'::text, 'id'::text),
      ('properties', 'name'),
      ('properties', 'address'),
      ('properties', 'city'),
      ('properties', 'state'),
      ('properties', 'shortlet_details'),
      ('properties', 'latitude'),
      ('properties', 'longitude'),
      ('properties', 'status'),
      ('properties', 'tour_url'),
      ('properties', 'amenities'),
      ('properties', 'features'),
      ('properties', 'is_shortlet'),
      ('properties', 'created_at'),
      ('listings', 'id'),
      ('listings', 'property_id'),
      ('listings', 'title'),
      ('listings', 'description'),
      ('listings', 'capacity'),
      ('listings', 'amenities'),
      ('listings', 'base_price'),
      ('listings', 'cleaning_fee'),
      ('listings', 'security_deposit'),
      ('listings', 'timezone'),
      ('listings', 'instant_book'),
      ('listings', 'active'),
      ('listings', 'cancellation_policy'),
      ('listings', 'created_at'),
      ('listings', 'updated_at'),
      ('message_templates', 'key'),
      ('message_templates', 'title'),
      ('message_templates', 'description')
  ) as t(table_name, column_name)
),
actual as (
  select
    table_name,
    column_name
  from information_schema.column_privileges
  where table_schema = 'public'
    and grantee = 'anon'
    and privilege_type = 'SELECT'
)
select
  e.table_name,
  e.column_name,
  case when a.column_name is not null then 'PASS' else 'MISSING_GRANT' end as status
from expected e
left join actual a
  on a.table_name = e.table_name
 and a.column_name = e.column_name
order by e.table_name, e.column_name;

-- =========================================================
-- 6) Broad table-level anon SELECT grants (should be absent)
--    Expect zero rows.
-- =========================================================
select
  table_schema,
  table_name,
  privilege_type,
  grantee
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in ('properties', 'listings', 'message_templates')
  and grantee = 'anon'
  and privilege_type = 'SELECT'
order by table_name;

