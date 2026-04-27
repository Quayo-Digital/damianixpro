/**
 * Document OCR Service - Real text extraction using OpenAI Vision
 * POST /api/documents/ocr - Extract text from document images
 * Requires: OPENAI_API_KEY
 */

import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAI } from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
  dest: path.join(__dirname, 'uploads', 'ocr'),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const OCR_PROMPT = `Extract ALL text from this document image exactly as it appears. 
Preserve the structure, layout, and order of the text.
Include: headers, labels, values, numbers, dates, names, addresses, amounts (including ₦ Naira).
For Nigerian documents (ID cards, bank statements, lease agreements, pay slips), extract every field.
Return ONLY the extracted text - no explanations, no markdown, no formatting beyond line breaks.
If the image is blurry or unreadable, return "Unable to extract text from image."`;

async function extractWithVision(imagePath, mimeType) {
  if (!openai) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: OCR_PROMPT },
          {
            type: 'image_url',
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
    max_tokens: 4096,
  });

  const text = response.choices?.[0]?.message?.content?.trim() || '';
  return text || 'No text could be extracted from the document.';
}

async function extractPdfText(pdfPath) {
  try {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = pdfParseModule.default ?? pdfParseModule;
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data?.text?.trim() || null;
  } catch (err) {
    console.warn('[document-ocr] pdf-parse failed, PDF may be scanned/image-based:', err.message);
    return null;
  }
}

export function createDocumentOcrRouter() {
  const router = express.Router();

  router.post(
    '/api/documents/ocr',
    upload.single('file'),
    async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'Missing file', extracted_text: '' });
      }

      const tempPath = req.file.path;
      const mimeType = req.file.mimetype || 'image/jpeg';

      try {
        let extractedText = '';

        if (mimeType === 'application/pdf') {
          extractedText = await extractPdfText(tempPath);
          if (!extractedText) {
            return res.status(400).json({
              error: 'Could not extract text from PDF. The PDF may be scanned/image-based. Try uploading as PNG/JPEG image.',
              extracted_text: '',
            });
          }
        } else {
          extractedText = await extractWithVision(tempPath, mimeType);
        }

        res.json({
          extracted_text: extractedText,
          method: openai ? 'openai_vision' : 'none',
        });
      } catch (err) {
        console.error('[document-ocr] Error:', err);
        res.status(500).json({
          error: err.message || 'OCR processing failed',
          extracted_text: '',
        });
      } finally {
        try {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        } catch {
          /* best-effort temp file cleanup */
        }
      }
    }
  );

  return router;
}
