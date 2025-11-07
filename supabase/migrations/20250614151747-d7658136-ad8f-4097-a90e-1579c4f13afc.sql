
-- Create a new type for different kinds of notifications
CREATE TYPE public.notification_type AS ENUM ('payment', 'maintenance', 'lease', 'announcement', 'general');

-- Create the notifications table
CREATE TABLE public.notifications (
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

-- Add comments to explain each column
COMMENT ON COLUMN public.notifications.user_id IS 'The user who will receive the notification.';
COMMENT ON COLUMN public.notifications.title IS 'The main headline of the notification.';
COMMENT ON COLUMN public.notifications.description IS 'A more detailed message for the notification.';
COMMENT ON COLUMN public.notifications.type IS 'The category of the notification (e.g., payment, maintenance).';
COMMENT ON COLUMN public.notifications.is_read IS 'Whether the user has marked the notification as read.';
COMMENT ON COLUMN public.notifications.link IS 'A URL to navigate to when the notification is clicked.';
COMMENT ON COLUMN public.notifications.metadata IS 'Extra data related to the notification, like a payment or lease ID.';

-- Enable Row Level Security to ensure users only see their own notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow users to mark their own notifications as read
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow server-side processes to create notifications for users
CREATE POLICY "Allow service roles to insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Enable Realtime functionality for the new table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

