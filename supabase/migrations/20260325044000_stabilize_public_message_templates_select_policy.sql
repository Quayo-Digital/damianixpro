-- Stabilize public/anon read access for message_templates.
-- Ensures a minimal, predictable SELECT policy and safe column grants.

begin;

alter table public.message_templates enable row level security;

-- Remove overlapping/legacy SELECT policies (if any)
drop policy if exists "anon_read_message_templates" on public.message_templates;
drop policy if exists "anon_read_message_templates_v2" on public.message_templates;
drop policy if exists "authenticated_read_message_templates_v2" on public.message_templates;
drop policy if exists "Public can view message templates" on public.message_templates;
drop policy if exists "Authenticated users can view message templates" on public.message_templates;

-- Minimal read policies
create policy "anon_read_message_templates_v2"
on public.message_templates
for select
to anon
using (true);

create policy "authenticated_read_message_templates_v2"
on public.message_templates
for select
to authenticated
using (true);

-- Restrict anon grants to safe read columns only
revoke all on table public.message_templates from anon;
grant select (key, title, description) on public.message_templates to anon;

commit;
