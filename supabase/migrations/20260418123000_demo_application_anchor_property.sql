-- Stable row so demo public listings (demo-prop-*) can attach rental_applications.property_id
-- when the project has no owner-created properties yet.

begin;

insert into public.organizations (id, name)
values ('00000000-0000-0000-0000-000000000001'::uuid, 'Default Organization')
on conflict (id) do nothing;

insert into public.properties (
  id,
  organization_id,
  name,
  address,
  city,
  state,
  status,
  is_shortlet,
  owner_id
)
values (
  'c0ffee00-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Demo anchor — Abuja (tenant applications)',
  'Central Business District, Wuse Zone II',
  'Abuja',
  'FCT',
  'Available',
  false,
  null
)
on conflict (id) do nothing;

commit;
