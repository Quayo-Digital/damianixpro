-- Fix: rental application approval notifications not reaching tenants.
-- 1) RLS: allow owners/agents/admins to INSERT notifications for applicants (invoker is reviewer).
-- 2) Trigger: include legacy "message" column (some DBs require it).
-- 3) Replace notify function (idempotent with 20260405140000).

begin;

drop policy if exists "notifications_insert_rental_flow_parties" on public.notifications;

create policy "notifications_insert_rental_flow_parties"
on public.notifications
for insert
to authenticated
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.rental_applications ra
    inner join public.properties p on p.id = ra.property_id
    where ra.user_id = notifications.user_id
      and (
        p.owner_id = auth.uid()
        or p.agent_id = auth.uid()
        or public.is_admin(auth.uid())
      )
  )
);

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

  insert into public.notifications (
    user_id,
    type,
    title,
    description,
    message,
    link,
    metadata,
    is_read
  )
  values (
    new.user_id,
    'general',
    v_title,
    v_desc,
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

commit;
