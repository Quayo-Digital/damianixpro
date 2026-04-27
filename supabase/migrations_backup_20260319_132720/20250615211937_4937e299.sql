
-- Unschedule existing job if it exists to avoid duplicates
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lease-milestone-checker') THEN
        PERFORM cron.unschedule('lease-milestone-checker');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule daily check for lease milestones at 3 AM UTC
SELECT cron.schedule(
  'lease-milestone-checker',
  '0 3 * * *', -- Every day at 3 AM UTC
  $$
  select
    net.http_post(
        url:='https://nocrbgzxcrirfpbuqhop.supabase.co/functions/v1/lease-milestone-notifier',
        headers:='{
          "Content-Type": "application/json",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vY3JiZ3p4Y3JpcmZwYnVxaG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MDQ2NDEsImV4cCI6MjA2MjE4MDY0MX0.dyrmLzQu05-xyksMREPc5gwDE1nmjJUf1KZ10MvrVEA"
        }'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
