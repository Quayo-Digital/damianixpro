import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAI } from 'openai';
import { supabaseAdmin } from './supabaseClient.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config for temporary audio uploads
const upload = multer({ dest: path.join(__dirname, 'uploads') });

// --- OpenAI Whisper client ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function saveTranscriptToDb({ source, userId, transcript, language }) {
  if (!supabaseAdmin) {
    // Safe no-op if Supabase admin env vars are not configured yet
    console.warn(
      '[voice] Supabase admin client not configured; transcript not persisted',
      { source, userId }
    );
    return;
  }

  const { error } = await supabaseAdmin.from('voice_transcripts').insert({
    source,
    user_id: userId || null,
    transcript,
    language,
  });

  if (error) {
    console.error('[voice] Failed to save transcript to Supabase', error);
  }
}

function cleanTranscript(raw) {
  if (!raw) return '';
  return String(raw).replace(/\s+/g, ' ').trim();
}

async function transcribeWithWhisper(filePath, { languageHint = 'en', prompt } = {}) {
  const fileStream = fs.createReadStream(filePath);

  const response = await openai.audio.transcriptions.create({
    file: fileStream,
    model: 'whisper-1',
    language: languageHint,
    prompt:
      prompt ??
      'Nigerian real estate context. Terms like Abuja, Wuse, Maitama, Lekki, rent, service charge, Flutterwave, tenant, landlord, agent.',
  });

  const text = response.text || response.transcript || '';
  return cleanTranscript(text);
}

export function createVoiceRouter() {
  const router = express.Router();

  // Browser mic upload: multipart/form-data with field "audio"
  router.post(
    '/api/voice/transcribe/mic',
    upload.single('audio'),
    async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'Missing audio file' });
      }

      const tempPath = req.file.path;
      const userId = req.user?.id || req.body.userId || null;

      try {
        const transcript = await transcribeWithWhisper(tempPath, {
          languageHint: 'en',
        });

        await saveTranscriptToDb({
          source: 'mic',
          userId,
          transcript,
          language: 'en',
        });

        return res.json({ transcript });
      } catch (error) {
        console.error('[voice] Mic transcription error', error);
        return res.status(500).json({ error: 'Failed to transcribe audio' });
      } finally {
        fs.unlink(tempPath, () => {});
      }
    }
  );

  // Phone/WebRTC call recording: multipart/form-data with field "audio"
  router.post(
    '/api/voice/transcribe/call',
    upload.single('audio'),
    async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'Missing call audio file' });
      }

      const tempPath = req.file.path;
      const userId = req.body.userId || null;

      try {
        const transcript = await transcribeWithWhisper(tempPath, {
          languageHint: 'en',
          prompt:
            'Nigerian property management phone call. Terms like rent, arrears, service charge, Abuja, Lekki, maintenance, complaints, Paystack payment, landlord, tenant.',
        });

        await saveTranscriptToDb({
          source: 'call',
          userId,
          transcript,
          language: 'en',
        });

        return res.json({ transcript });
      } catch (error) {
        console.error('[voice] Call transcription error', error);
        return res.status(500).json({ error: 'Failed to transcribe call audio' });
      } finally {
        fs.unlink(tempPath, () => {});
      }
    }
  );

  return router;
}

