-- Stabilize public/anon read access for properties + listings.
-- This migration removes overlapping SELECT policies that can trigger PostgREST 500s
-- and replaces them with minimal, predictable SELECT policies.
-- Owner/admin CRUD policies remain intact.

begin;

-- =========================================================
-- PROPERTIES: reset SELECT policies to minimal safe rules
-- =========================================================

alter table public.properties enable row level security;

-- Remove legacy/overlapping SELECT policies
drop policy if exists "Authenticated users can view properties" on public.properties;
drop policy if exists "Owners can view their own properties" on public.properties;
drop policy if exists "Properties are viewable by everyone" on public.properties;
drop policy if exists "Public can view properties" on public.properties;
drop policy if exists "Tenants can view their properties and available properties" on public.properties;
drop policy if exists "anon_read_public_properties" on public.properties;
drop policy if exists "anon_read_public_properties_v2" on public.properties;
drop policy if exists "authenticated_read_properties_v2" on public.properties;

create policy "anon_read_public_properties_v2"
on public.properties
for select
to anon
using (coalesce(status, ''::text) = 'Available'::text);

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
      and ur.role = 'admin'::text
  )
);

-- Explicit anon read on safe columns only
revoke all on table public.properties from anon;
grant select (
  id,
  name,
  address,
  city,
  state,
  shortlet_details,
  latitude,
  longitude,
  status,
  tour_url,
  amenities,
  features,
  is_shortlet,
  created_at
) on public.properties to anon;

-- =========================================================
-- LISTINGS: reset SELECT policies to minimal safe rules
-- =========================================================

alter table public.listings enable row level security;

-- Remove legacy/overlapping SELECT policies
drop policy if exists "Admins can view all listings" on public.listings;
drop policy if exists "Owners can view their own listings" on public.listings;
drop policy if exists "Public can view active listings" on public.listings;
drop policy if exists "Tenants can view listings and their bookings" on public.listings;
drop policy if exists "anon_read_active_listings" on public.listings;
drop policy if exists "anon_read_active_listings_v2" on public.listings;
drop policy if exists "authenticated_read_listings_v2" on public.listings;

create policy "anon_read_active_listings_v2"
on public.listings
for select
to anon
using (coalesce(active, false) = true);

create policy "authenticated_read_listings_v2"
on public.listings
for select
to authenticated
using (
  coalesce(active, false) = true
  or exists (
    select 1
    from public.properties p
    where p.id = listings.property_id
      and (p.owner_id = auth.uid() or p.agent_id = auth.uid())
  )
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'::text
  )
);

-- Explicit anon read on safe columns only
revoke all on table public.listings from anon;
grant select (
  id,
  property_id,
  title,
  description,
  capacity,
  amenities,
  base_price,
  cleaning_fee,
  security_deposit,
  timezone,
  instant_book,
  active,
  cancellation_policy,
  created_at,
  updated_at
) on public.listings to anon;

commit;
