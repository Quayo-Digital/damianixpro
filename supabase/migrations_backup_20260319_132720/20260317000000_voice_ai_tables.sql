-- DamianixPro Voice AI Tables
-- Creates: voice_sessions, voice_transcripts, voice_commands
-- Optionally fixes voice_command_history if it exists (adds session_id, creates index)

-- 1) If voice_command_history exists, add session_id and index (skip if table missing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'voice_command_history') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'voice_command_history' AND column_name = 'session_id') THEN
      ALTER TABLE public.voice_command_history ADD COLUMN session_id UUID;
    END IF;
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_voice_command_history_session_id ON public.voice_command_history(session_id)';
  END IF;
END $$;

-- 2) voice_sessions
CREATE TABLE IF NOT EXISTS public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ
);

-- 3) voice_transcripts (add session_id to existing table if it has old schema)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'voice_transcripts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'voice_transcripts' AND column_name = 'session_id') THEN
      ALTER TABLE public.voice_transcripts ADD COLUMN session_id UUID REFERENCES public.voice_sessions(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'voice_transcripts' AND column_name = 'timestamp') THEN
      ALTER TABLE public.voice_transcripts ADD COLUMN timestamp TIMESTAMPTZ DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- Create voice_transcripts if it doesn't exist
CREATE TABLE IF NOT EXISTS public.voice_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.voice_sessions(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) voice_commands
CREATE TABLE IF NOT EXISTS public.voice_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.voice_sessions(id) ON DELETE CASCADE,
  intent TEXT NOT NULL,
  response TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON public.voice_sessions(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_voice_transcripts_session ON public.voice_transcripts(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_voice_commands_session ON public.voice_commands(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_voice_commands_intent ON public.voice_commands(intent);
