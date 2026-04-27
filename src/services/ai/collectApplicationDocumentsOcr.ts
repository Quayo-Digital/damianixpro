import { supabase } from '@/integrations/supabase/client';
import type { ApplicationDocument } from '@/services/applications/types';
import { performOcr } from '@/services/ai/ocrService';

const MAX_FILES = 6;
const MAX_CHARS_PER_FILE = 5000;
const MAX_TOTAL_CHARS = 18000;

function guessMimeFromPath(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'application/octet-stream';
}

export type LeasingDocumentOcrSnippet = {
  document_type: string;
  file_label: string;
  extracted_text: string;
  ocr_method?: string;
};

export type CollectApplicationDocumentsOcrResult = {
  snippets: LeasingDocumentOcrSnippet[];
  skippedCount: number;
};

function truncateForPrompt(text: string, budget: number): string {
  const t = text.trim();
  if (t.length <= budget) return t;
  return `${t.slice(0, budget)}\n…[truncated]`;
}

/**
 * Download application uploads and OCR them for optional inclusion in leasing-assist (reviewer opt-in).
 */
export async function collectApplicationDocumentsOcr(
  documents: ApplicationDocument[]
): Promise<CollectApplicationDocumentsOcrResult> {
  const withPaths = documents.filter((d) => d.file_path);
  const toProcess = withPaths.slice(0, MAX_FILES);
  const skippedCount = withPaths.length - toProcess.length;

  const snippets: LeasingDocumentOcrSnippet[] = [];
  let totalUsed = 0;

  for (const doc of toProcess) {
    if (totalUsed >= MAX_TOTAL_CHARS) break;

    const path = doc.file_path;
    if (!path) continue;

    try {
      const { data, error } = await supabase.storage.from('application-documents').download(path);
      if (error || !data) continue;

      const mime =
        doc.file_type && doc.file_type !== 'application/octet-stream'
          ? doc.file_type
          : guessMimeFromPath(path);
      const label = doc.name || path.split('/').pop() || 'document';
      const file = new File([data], label, { type: mime });

      const ocr = await performOcr(file);
      const raw = ocr.extractedText?.trim();
      if (!raw) continue;

      const perFileBudget = Math.min(MAX_CHARS_PER_FILE, MAX_TOTAL_CHARS - totalUsed);
      const extracted_text = truncateForPrompt(raw, perFileBudget);
      totalUsed += extracted_text.length;

      snippets.push({
        document_type: doc.document_type || 'other',
        file_label: label.slice(0, 200),
        extracted_text,
        ocr_method: ocr.method,
      });
    } catch {
      /* skip unreadable */
    }
  }

  return { snippets, skippedCount };
}
