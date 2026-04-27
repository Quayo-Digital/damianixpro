
-- Create a table for message templates
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  title TEXT,
  description TEXT,
  lang TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Function trigger to set updated_at timestamp
CREATE TRIGGER set_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read all message templates
CREATE POLICY "Allow public read access to message templates"
ON public.message_templates
FOR SELECT
USING (true);

-- Policy: Admins can manage message templates
CREATE POLICY "Allow admin to manage message templates"
ON public.message_templates
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Seed the table with the current messages from PublicPropertyDetail.tsx
INSERT INTO public.message_templates (key, category, title, description)
VALUES
  ('contact_agent_unauthenticated_error', 'auth_error', 'Please sign in to contact an agent', NULL),
  ('contact_agent_success', 'property_action', 'An agent will be in touch with you shortly.', 'You can also reach us at support@example.com for any queries.'),
  ('request_viewing_unauthenticated_error', 'auth_error', 'Please sign in to request a viewing', NULL),
  ('request_viewing_success', 'property_action', 'Viewing request sent!', 'An agent will contact you shortly to schedule a viewing.'),
  ('apply_unauthenticated_error', 'auth_error', 'Please sign in to apply for this property', NULL),
  ('property_id_missing_error', 'error', 'Property ID is missing', NULL),
  ('property_not_found_error', 'error', 'Property not found', NULL);
