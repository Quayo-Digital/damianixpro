
-- Function to send a notification to the property owner on a new maintenance request
CREATE OR REPLACE FUNCTION public.create_maintenance_notification_for_owner()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  property_record public.properties;
BEGIN
  -- Find the property and its owner
  SELECT * INTO property_record FROM public.properties WHERE id = NEW.property_id;

  -- If an owner is found and the owner is not the one creating the request, create a notification
  IF property_record.owner_id IS NOT NULL AND property_record.owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications(user_id, type, title, description, link, metadata)
    VALUES (
      property_record.owner_id,
      'maintenance',
      'New Maintenance Request: ' || NEW.title,
      'A new request for "' || property_record.name || '" has been submitted.',
      '/maintenance', -- Links to the maintenance page
      jsonb_build_object('request_id', NEW.id, 'property_id', NEW.property_id)
    );
  END IF;

  RETURN NEW;
END;
$function$
;

-- Drop existing trigger if it exists to avoid conflicts, then create the new trigger
DROP TRIGGER IF EXISTS on_new_maintenance_request_notify_owner ON public.maintenance_requests;
CREATE TRIGGER on_new_maintenance_request_notify_owner
  AFTER INSERT ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_maintenance_notification_for_owner();
