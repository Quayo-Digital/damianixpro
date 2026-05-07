import { supabase } from '@/integrations/supabase/client';

const VOICE_BASE = import.meta.env.VITE_VOICE_SERVER_URL || 'http://localhost:4000';

export type AiQueryIntent =
  | 'tenants_owing_rent'
  | 'rent_report_summary'
  | 'vacant_properties'
  | 'unknown';

export interface AiQueryColumn {
  key: string;
  label: string;
  format?: 'currency';
}

export interface AiQueryTablePayload {
  kind: 'table';
  title: string;
  columns: AiQueryColumn[];
  rows: Record<string, unknown>[];
  summary?: Record<string, unknown>;
}

export interface AiQuerySuccess {
  intent: AiQueryIntent;
  message?: string;
  data: AiQueryTablePayload | null;
  meta?: {
    router?: string;
    scoped?: boolean;
    empty_scope?: boolean;
    openai_configured?: boolean;
    intents_supported?: string[];
  };
}

export async function postAiQuery(
  query: string,
  options?: { preferOpenAI?: boolean }
): Promise<AiQuerySuccess> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error('Sign in to use the assistant.');
  }

  const res = await fetch(`${VOICE_BASE}/api/ai/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: query.trim(),
      preferOpenAI: Boolean(options?.preferOpenAI),
    }),
  });

  const body = (await res.json().catch(() => ({}))) as AiQuerySuccess & { error?: string };

  if (!res.ok) {
    throw new Error(body.error || res.statusText || 'Assistant request failed.');
  }

  return body;
}
