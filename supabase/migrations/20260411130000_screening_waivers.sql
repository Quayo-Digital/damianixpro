-- Optional admin screening waiver (NDPR-sensitive; admin-only writes).

begin;

create table if not exists public.screening_waivers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  active boolean not null default true,
  reason text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.screening_waivers is
  'When active, client-side role screening checks treat the user as cleared (use sparingly; audit via reason/created_by).';

create index if not exists screening_waivers_active_idx
  on public.screening_waivers (user_id)
  where active = true;

alter table public.screening_waivers enable row level security;

drop policy if exists screening_waivers_select on public.screening_waivers;
drop policy if exists screening_waivers_admin_insert on public.screening_waivers;
drop policy if exists screening_waivers_admin_update on public.screening_waivers;
drop policy if exists screening_waivers_admin_delete on public.screening_waivers;

create policy screening_waivers_select
  on public.screening_waivers
  as permissive
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy screening_waivers_admin_insert
  on public.screening_waivers
  as permissive
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

create policy screening_waivers_admin_update
  on public.screening_waivers
  as permissive
  for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy screening_waivers_admin_delete
  on public.screening_waivers
  as permissive
  for delete
  to authenticated
  using (public.is_admin(auth.uid()));

grant select on table public.screening_waivers to authenticated;
grant insert, update, delete on table public.screening_waivers to authenticated;

drop trigger if exists screening_waivers_set_updated_at on public.screening_waivers;
create trigger screening_waivers_set_updated_at
  before update on public.screening_waivers
  for each row execute function public.update_nigerian_api_updated_at();

commit;
