/**
 * AI assist for rental application review (owner / agent / manager).
 * POST /api/ai/leasing-assist
 *
 * Requires: OPENAI_API_KEY, SUPABASE_JWT_SECRET, supabaseAdmin (same as other AI routes)
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './supabaseClient.mjs';
import { OpenAI } from 'openai';

const router = express.Router();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function getTokenFromHeader(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

/** @param {unknown} raw */
function normalizeOcrSnippets(raw) {
  if (!raw || !Array.isArray(raw)) return [];

  const maxItems = 8;
  const maxPerText = 6000;
  let totalBudget = 22000;
  const out = [];

  for (const item of raw.slice(0, maxItems)) {
    if (!item || typeof item !== 'object') continue;
    const text = String(item.extracted_text ?? '').trim();
    if (!text) continue;
    const capped = text.length > maxPerText ? `${text.slice(0, maxPerText)}\n…[truncated]` : text;
    const take = Math.min(capped.length, totalBudget);
    if (take <= 0) break;

    out.push({
      document_type: String(item.document_type || 'other').slice(0, 120),
      file_label: String(item.file_label || item.name || 'document').slice(0, 240),
      extracted_text: capped.slice(0, take),
      ocr_method: item.ocr_method ? String(item.ocr_method).slice(0, 40) : undefined,
    });
    totalBudget -= take;
  }

  return out;
}

async function getUserFromToken(token) {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret || !supabaseAdmin) return null;
  try {
    const payload = jwt.verify(token, jwtSecret);
    const userId = payload.sub || payload.user_id || payload.id;
    if (!userId) return null;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return null;
    return { id: profile.id, role: profile.role, full_name: profile.full_name };
  } catch {
    return null;
  }
}

router.post('/api/ai/leasing-assist', async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    const task = String(req.body?.task || 'application_review').trim();
    const application = req.body?.application;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    const allowedRoles = ['admin', 'super_admin', 'owner', 'agent', 'manager'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'AI leasing assist is for owners, agents, and managers.' });
    }

    if (!openai) {
      return res.status(503).json({
        error: 'AI is not configured (missing OPENAI_API_KEY on the voice server).',
      });
    }

    if (task !== 'application_review') {
      return res.status(400).json({ error: 'Unsupported task.' });
    }

    if (!application || typeof application !== 'object') {
      return res.status(400).json({ error: 'Missing application payload.' });
    }

    const docCount =
      typeof req.body?.document_count === 'number' ? req.body.document_count : null;

    const documentOcrSnippets = normalizeOcrSnippets(req.body?.document_ocr_snippets);

    const payloadForModel = {
      property_name: application.property_name ?? null,
      applicant: {
        first_name: application.first_name,
        last_name: application.last_name,
        email: application.email,
        phone: application.phone ?? null,
        valid_id: application.valid_id ? '[provided]' : null,
      },
      employment: {
        occupation: application.occupation ?? null,
        monthly_income: application.monthly_income ?? null,
        employment_status: application.employment_status ?? null,
        employer_name: application.employer_name ?? null,
      },
      rental: {
        current_address: application.current_address ?? null,
        move_in_date: application.move_in_date ?? null,
        tenancy_period_months: application.tenancy_period ?? null,
        num_occupants: application.num_occupants ?? null,
        has_pets: application.has_pets ?? false,
        pets_details: application.pets_details ?? null,
        unit_requested: Boolean(application.unit_id),
      },
      emergency: {
        name: application.emergency_contact_name ?? null,
        phone: application.emergency_contact_phone ?? null,
      },
      application_status: application.status ?? null,
      attached_document_count: docCount,
      document_ocr_excerpt_count: documentOcrSnippets.length,
    };

    const systemPromptParts = [
      'You assist Nigerian landlords, agents, and property managers when reviewing rental applications.',
      'Output clear, practical screening notes — not legal advice. Do not claim you verified identity or income.',
      'Use short sections with bullets where helpful.',
      'Cover: (1) brief applicant summary, (2) completeness / gaps vs typical long-term lets in Nigeria,',
      '(3) consistency flags if something looks missing or vague, (4) 3–5 neutral follow-up questions the reviewer could ask.',
      'If income or ID is missing or thin, say so. Mention pets/occupants if relevant.',
      'Keep total length under ~280 words. Tone: professional, neutral.',
    ];

    if (documentOcrSnippets.length > 0) {
      systemPromptParts.push(
        'Optional OCR excerpts may be included. They are machine-extracted and unverified; they can be wrong or incomplete.',
        'Do not treat OCR text as proof. Only note possible alignments or mismatches versus the application form as items for human review.',
      );
    }

    const systemPrompt = systemPromptParts.join('\n');

    let userPrompt = `Review this rental application JSON and produce screening notes:\n${JSON.stringify(payloadForModel, null, 2)}`;

    if (documentOcrSnippets.length > 0) {
      userPrompt += `\n\nOptional OCR excerpts (unverified; file labels are for context only):\n${JSON.stringify(documentOcrSnippets, null, 2)}`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: documentOcrSnippets.length > 0 ? 900 : 600,
      temperature: 0.35,
    });

    const text =
      response.choices?.[0]?.message?.content?.trim() ||
      'Could not generate notes. Try again.';

    return res.json({ text });
  } catch (err) {
    console.error('[ai/leasing-assist]', err?.message);
    return res.status(500).json({ error: 'AI request failed. Try again later.' });
  }
});

export function createLeasingAssistRouter() {
  return router;
}
