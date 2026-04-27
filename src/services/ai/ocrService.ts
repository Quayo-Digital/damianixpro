/**
 * OCR Service - Real text extraction
 * 1. Tries server API (OpenAI Vision) when voice server is running
 * 2. Falls back to Tesseract.js in browser for images
 */

const OCR_API_URL =
  (import.meta.env.VITE_VOICE_SERVER_URL || 'http://localhost:4000') + '/api/documents/ocr';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export type OcrMethod = 'openai_vision' | 'tesseract' | 'mock';

export interface OcrResult {
  extractedText: string;
  method: OcrMethod;
}

/**
 * Extract text via server OCR API (OpenAI Vision for images, pdf-parse for PDFs)
 */
async function extractViaServer(file: File): Promise<OcrResult | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(OCR_API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `OCR API error: ${res.status}`);
    }

    const data = await res.json();
    return {
      extractedText: data.extracted_text || '',
      method: 'openai_vision',
    };
  } catch (err) {
    console.warn('[ocr] Server OCR failed:', err);
    return null;
  }
}

/**
 * Extract text via Tesseract.js (client-side, images only)
 */
async function extractViaTesseract(file: File): Promise<OcrResult | null> {
  if (!IMAGE_TYPES.includes(file.type)) {
    return null;
  }

  try {
    const Tesseract = await import('tesseract.js');
    const { data } = await Tesseract.recognize(file, 'eng', {
      logger: () => {}, // Suppress progress logs
    });
    const text = data?.text?.trim() || '';
    return text ? { extractedText: text, method: 'tesseract' } : null;
  } catch (err) {
    console.warn('[ocr] Tesseract failed:', err);
    return null;
  }
}

/**
 * Perform OCR on a document file.
 * Tries server first (OpenAI Vision), then Tesseract.js for images.
 */
export async function performOcr(file: File): Promise<OcrResult> {
  // 1. Try server API first (best quality)
  const serverResult = await extractViaServer(file);
  if (serverResult?.extractedText) {
    return serverResult;
  }

  // 2. Fallback: Tesseract for images
  if (IMAGE_TYPES.includes(file.type)) {
    const tesseractResult = await extractViaTesseract(file);
    if (tesseractResult?.extractedText) {
      return tesseractResult;
    }
  }

  // 3. No OCR available - return empty (caller can handle)
  return {
    extractedText: '',
    method: 'mock',
  };
}
