-- 3D tour service requests (admin tour-requests UI + property form).
-- Apply with: supabase db push   or paste into Dashboard → SQL.

begin;

create table if not exists public.property_tour_service_requests (
    id uuid primary key default gen_random_uuid(),
    property_id uuid not null references public.properties (id) on delete cascade,
    requested_by uuid not null references public.profiles (id) on delete cascade,
    status text not null default 'pending'
 check (status in ('pending', 'in_progress', 'scheduled', 'completed', 'cancelled')),
    notes text,
    admin_notes text,
    scheduled_at timestamptz,
    assigned_to uuid references public.profiles (id) on delete set null,
    tour_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_property_tour_requests_property_id
    on public.property_tour_service_requests (property_id);

create index if not exists idx_property_tour_requests_requested_by
    on public.property_tour_service_requests (requested_by);

create index if not exists idx_property_tour_requests_status
    on public.property_tour_service_requests (status);

alter table public.property_tour_service_requests enable row level security;

drop policy if exists "Requesters can view their own tour requests" on public.property_tour_service_requests;
create policy "Requesters can view their own tour requests"
    on public.property_tour_service_requests
    for select
    to authenticated
    using (requested_by = auth.uid());

drop policy if exists "Requesters can create their own tour requests" on public.property_tour_service_requests;
create policy "Requesters can create their own tour requests"
    on public.property_tour_service_requests
    for insert
    to authenticated
    with check (requested_by = auth.uid());

drop policy if exists "Admins can view all tour requests" on public.property_tour_service_requests;
create policy "Admins can view all tour requests"
    on public.property_tour_service_requests
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.role in ('admin', 'super_admin')
        )
    );

drop policy if exists "Admins can update all tour requests" on public.property_tour_service_requests;
create policy "Admins can update all tour requests"
    on public.property_tour_service_requests
    for update
    to authenticated
    using (
        exists (
            select 1
            from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.role in ('admin', 'super_admin')
        )
    )
    with check (
        exists (
            select 1
            from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.role in ('admin', 'super_admin')
        )
    );

create or replace function public.update_property_tour_requests_updated_at()
returns trigger
language plpgsql
as $fn$
begin
    new.updated_at = now();
    return new;
end;
$fn$;

drop trigger if exists update_property_tour_requests_updated_at
    on public.property_tour_service_requests;

create trigger update_property_tour_requests_updated_at
    before update on public.property_tour_service_requests
    for each row
    execute function public.update_property_tour_requests_updated_at();

grant select, insert, update, delete on public.property_tour_service_requests to authenticated;
grant select, insert, update, delete on public.property_tour_service_requests to service_role;

commit;
