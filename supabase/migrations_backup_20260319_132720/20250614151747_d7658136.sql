-- Create a new type for different kinds of notifications
DO $$ BEGIN
    CREATE TYPE public.notification_type AS ENUM ('payment', 'maintenance', 'lease', 'announcement', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  type public.notification_type NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  metadata JSONB
);

-- Add comments only if columns exist (table may have different schema)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='user_id') THEN
    COMMENT ON COLUMN public.notifications.user_id IS 'The user who will receive the notification.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='title') THEN
    COMMENT ON COLUMN public.notifications.title IS 'The main headline of the notification.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='description') THEN
    COMMENT ON COLUMN public.notifications.description IS 'A more detailed message for the notification.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='type') THEN
    COMMENT ON COLUMN public.notifications.type IS 'The category of the notification (e.g., payment, maintenance).';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='is_read') THEN
    COMMENT ON COLUMN public.notifications.is_read IS 'Whether the user has marked the notification as read.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='link') THEN
    COMMENT ON COLUMN public.notifications.link IS 'A URL to navigate to when the notification is clicked.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='metadata') THEN
    COMMENT ON COLUMN public.notifications.metadata IS 'Extra data related to the notification, like a payment or lease ID.';
  END IF;
END $$;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow service roles to insert notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow service roles to insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

DO $$
BEGIN
  ALTER TABLE public.notifications REPLICA IDENTITY FULL;
EXCEPTION WHEN OTHERS THEN null;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

