-- Rental application approved: deep-link tenant to Payments tab and classify as payment notification.

begin;

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
  v_link text;
  v_type public.notification_type;
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
        'Your rental application for %s was approved. Open Payments to complete rent or deposit.',
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

  v_link := case new.status
    when 'approved' then '/tenant/dashboard?tab=payments'
    else '/tenant/dashboard'
  end;

  v_type := case new.status
    when 'approved' then 'payment'::public.notification_type
    else 'general'::public.notification_type
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
    v_type,
    v_title,
    v_desc,
    v_desc,
    v_link,
    jsonb_build_object(
      'application_id', new.id,
      'property_id', new.property_id,
      'status', new.status,
      'primary_action', case when new.status = 'approved' then 'payment' else null end
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
