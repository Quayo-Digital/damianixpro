import { supabase } from '@/integrations/supabase/client';

const API_BASE = import.meta.env.VITE_VOICE_SERVER_URL || 'http://localhost:4000';

export interface PropertyCopywriterInput {
  propertyType: string;
  location: string;
  targetTenant: string;
  amenities?: string[];
  bedrooms?: string;
  bathrooms?: string;
  price?: string;
  uniqueSellingPoints?: string;
}

export interface PropertyCopyResult {
  short: string;
  professional: string;
  whatsapp: string;
}

export type PropertyCopywriterResponse =
  | { ok: true; copy: PropertyCopyResult; model: string }
  | {
      ok: false;
      /** Distinguish "not configured / try fallback" from real errors so the UI can decide. */
      kind: 'unconfigured' | 'unauthorized' | 'forbidden' | 'rate_limited' | 'server_error';
      error: string;
    };

/**
 * Generate listing copy via the server-side LLM.
 * The voice server fails 503 when OPENAI_API_KEY is unset — callers should fall
 * back to the local heuristic templates in that case.
 */
export async function generatePropertyCopy(
  input: PropertyCopywriterInput
): Promise<PropertyCopywriterResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { ok: false, kind: 'unauthorized', error: 'Please sign in to use AI copy generation.' };
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/ai/property-copywriter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });
  } catch (err) {
    return {
      ok: false,
      kind: 'server_error',
      error: err instanceof Error ? err.message : 'Network error contacting AI server.',
    };
  }

  const data = (await res.json().catch(() => ({}))) as Partial<{
    short: string;
    professional: string;
    whatsapp: string;
    model: string;
    error: string;
  }>;

  if (res.status === 503) {
    return {
      ok: false,
      kind: 'unconfigured',
      error: data.error || 'AI is not configured on the server.',
    };
  }
  if (res.status === 401) {
    return {
      ok: false,
      kind: 'unauthorized',
      error: data.error || 'Session expired. Sign in again.',
    };
  }
  if (res.status === 403) {
    return {
      ok: false,
      kind: 'forbidden',
      error: data.error || 'Your role cannot use AI copy generation.',
    };
  }
  if (res.status === 429) {
    return {
      ok: false,
      kind: 'rate_limited',
      error: data.error || 'Rate limit hit. Try again in a minute.',
    };
  }
  if (!res.ok || !data.short || !data.professional || !data.whatsapp) {
    return {
      ok: false,
      kind: 'server_error',
      error: data.error || `Request failed (${res.status}).`,
    };
  }

  return {
    ok: true,
    copy: { short: data.short, professional: data.professional, whatsapp: data.whatsapp },
    model: data.model || 'unknown',
  };
}
