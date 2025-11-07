
-- Add 'message' to notification_type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'message' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE public.notification_type ADD VALUE 'message';
    END IF;
END
$$;

-- Trigger for new message notifications
CREATE OR REPLACE FUNCTION public.create_message_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  sender_profile public.profiles;
  sender_name TEXT;
BEGIN
  -- Get sender's profile
  SELECT * INTO sender_profile FROM public.profiles WHERE id = NEW.sender_id;
  
  -- Determine sender name
  IF sender_profile.full_name IS NOT NULL AND sender_profile.full_name <> '' THEN
    sender_name := sender_profile.full_name;
  ELSE
    sender_name := sender_profile.email;
  END IF;

  -- Insert a notification for the recipient
  INSERT INTO public.notifications(user_id, type, title, description, link, metadata)
  VALUES (
    NEW.recipient_id,
    'message',
    'New Message from ' || sender_name,
    LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
    '/messages',
    jsonb_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id)
  );
  
  RETURN NEW;
END;
$function$
;

-- Drop existing trigger if it exists, then create it
DROP TRIGGER IF EXISTS on_new_message_create_notification ON public.messages;
CREATE TRIGGER on_new_message_create_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_message_notification();


-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Unschedule existing job if it exists to avoid duplicates
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'overdue-rent-checker') THEN
        PERFORM cron.unschedule('overdue-rent-checker');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule daily check for overdue rent at 2 AM UTC
SELECT cron.schedule(
  'overdue-rent-checker',
  '0 2 * * *', -- Every day at 2 AM UTC
  $$
  select
    net.http_post(
        url:='https://nocrbgzxcrirfpbuqhop.supabase.co/functions/v1/overdue-rent-notifier',
        headers:='{
          "Content-Type": "application/json", 
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vY3JiZ3p4Y3JpcmZwYnVxaG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MDQ2NDEsImV4cCI6MjA2MjE4MDY0MX0.dyrmLzQu05-xyksMREPc5gwDE1nmjJUf1KZ10MvrVEA"
        }'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
