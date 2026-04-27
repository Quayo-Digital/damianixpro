-- Fix signup failure caused by missing document_processing_settings table.
-- Auth trigger create_document_settings_for_new_user calls public.create_default_document_settings().
-- If table is missing (or search_path is unexpected), signup returns 500.

CREATE TABLE IF NOT EXISTS public.document_processing_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_classification_enabled boolean DEFAULT true,
  auto_extraction_enabled boolean DEFAULT true,
  fraud_detection_enabled boolean DEFAULT true,
  notification_preferences jsonb DEFAULT '{
    "processing_complete": true,
    "validation_failed": true,
    "fraud_detected": true,
    "workflow_updates": true
  }'::jsonb,
  retention_policies jsonb DEFAULT '{
    "default_retention_days": 2555,
    "auto_archive_enabled": true,
    "secure_deletion_enabled": true
  }'::jsonb,
  quality_thresholds jsonb DEFAULT '{
    "min_confidence_score": 0.5,
    "require_manual_review_below": 0.7,
    "auto_approve_above": 0.9
  }'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_processing_settings ENABLE ROW LEVEL SECURITY;

-- Keep this trigger function non-fatal for signup.
CREATE OR REPLACE FUNCTION public.create_default_document_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  BEGIN
    INSERT INTO public.document_processing_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN others THEN
    -- Never block user signup because of ancillary settings setup.
    RAISE NOTICE 'create_default_document_settings skipped: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

