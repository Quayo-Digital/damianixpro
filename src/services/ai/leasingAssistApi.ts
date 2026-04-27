import { supabase } from '@/integrations/supabase/client';
import type { RentalApplication } from '@/services/applications/types';
import type { LeasingDocumentOcrSnippet } from '@/services/ai/collectApplicationDocumentsOcr';

const API_BASE = import.meta.env.VITE_VOICE_SERVER_URL || 'http://localhost:4000';

export type LeasingAssistResult = { ok: true; text: string } | { ok: false; error: string };

export type LeasingAssistOptions = {
  /** Optional OCR excerpts (reviewer opt-in); sent only when non-empty. */
  documentOcrSnippets?: LeasingDocumentOcrSnippet[];
};

/**
 * Owner/agent/manager screening notes for a rental application (server uses OpenAI; not legal advice).
 */
export async function fetchLeasingApplicationAssist(
  application: RentalApplication,
  documentCount: number,
  options?: LeasingAssistOptions
): Promise<LeasingAssistResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { ok: false, error: 'Please sign in to use AI screening notes.' };
  }

  const res = await fetch(`${API_BASE}/api/ai/leasing-assist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      task: 'application_review',
      application,
      document_count: documentCount,
      document_ocr_snippets: options?.documentOcrSnippets?.length
        ? options.documentOcrSnippets
        : undefined,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };

  if (!res.ok) {
    return {
      ok: false,
      error: data.error || `Request failed (${res.status}). Try again later.`,
    };
  }

  const text = data.text?.trim();
  if (!text) {
    return { ok: false, error: 'No response from AI. Try again.' };
  }

  return { ok: true, text };
}
