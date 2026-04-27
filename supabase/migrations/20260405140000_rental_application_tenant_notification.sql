-- Notify the applicant when rental_applications.status changes (approved / rejected / more_info).
-- Runs as SECURITY DEFINER so the row is inserted even when the updater is the owner (cross-user).

begin;

-- Prefer auth.users so applicant UUIDs from rental_applications always resolve
alter table public.notifications drop constraint if exists notifications_user_id_fkey;

delete from public.notifications n
where n.user_id is not null
  and not exists (select 1 from auth.users u where u.id = n.user_id);

alter table public.notifications
  add constraint notifications_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

-- In-app toast: useNotifications subscribes to INSERT on this table
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'notifications'
     ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
end
$$;

-- Align notifications with app expectations (useNotifications, lease-milestone-notifier shape)
alter table public.notifications add column if not exists title text;
alter table public.notifications add column if not exists description text;
alter table public.notifications add column if not exists link text;
alter table public.notifications add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.notifications add column if not exists is_read boolean default false;

create or replace function public.notify_rental_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pname text;
  v_title text;
  v_desc text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if old.status is not distinct from new.status then
    return new;
  end if;
  if new.status not in ('approved', 'rejected', 'more_info') then
    return new;
  end if;

  select p.name into pname from public.properties p where p.id = new.property_id limit 1;

  v_title := case new.status
    when 'approved' then 'Application approved'
    when 'rejected' then 'Application not approved'
    else 'More information needed'
  end;

  v_desc := case new.status
    when 'approved' then
      format(
        'Your rental application for %s was approved. Open your tenant dashboard for next steps.',
        coalesce('"' || pname || '"', 'this property')
      )
    when 'rejected' then
      format(
        'Your rental application for %s was not approved.',
        coalesce('"' || pname || '"', 'this property')
      )
    else
      format(
        'The property manager needs more information for your application%s',
        case when pname is not null then ' for "' || pname || '".' else '.' end
      )
  end;

  insert into public.notifications (user_id, type, title, description, link, metadata, is_read)
  values (
    new.user_id,
    'general',
    v_title,
    v_desc,
    '/tenant/dashboard',
    jsonb_build_object(
      'application_id', new.id,
      'property_id', new.property_id,
      'status', new.status
    ),
    false
  );

  return new;
exception
  when others then
    raise warning 'notify_rental_application_status_change: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists trg_notify_tenant_rental_application on public.rental_applications;

create trigger trg_notify_tenant_rental_application
  after update of status on public.rental_applications
  for each row
  execute function public.notify_rental_application_status_change();

commit;
