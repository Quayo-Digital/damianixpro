/**
 * Public support chatbot — POST /api/support/chat
 * Optional Bearer: Supabase JWT (adds non-PII role hint only).
 * Requires: OPENAI_API_KEY
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { OpenAI } from 'openai';

const router = express.Router();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const MAX_MESSAGES = 24;
const MAX_CONTENT_PER_MESSAGE = 3500;
const MODEL = process.env.OPENAI_SUPPORT_MODEL || 'gpt-4o-mini';

function getTokenFromHeader(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

function optionalRoleHint(token) {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!token || !jwtSecret) return '';
  try {
    const payload = jwt.verify(token, jwtSecret);
    const meta = payload.user_metadata && typeof payload.user_metadata === 'object' ? payload.user_metadata : {};
    const role = meta.role || payload.role || '';
    const r = String(role).trim().slice(0, 64);
    if (!r) return '';
    return `\nThe user is signed in. App role (for routing help only, do not repeat as PII): ${r}. Never ask for passwords, OTPs, or full account numbers.`;
  } catch {
    return '';
  }
}

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const m of raw.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== 'object') continue;
    const role = m.role === 'assistant' ? 'assistant' : m.role === 'user' ? 'user' : null;
    if (!role) continue;
    const content = String(m.content ?? '')
      .trim()
      .slice(0, MAX_CONTENT_PER_MESSAGE);
    if (!content) continue;
    out.push({ role, content });
  }
  return out;
}

const SYSTEM_PROMPT = `You are DamianixPro Support, a concise, friendly assistant for a Nigerian property platform (rentals, listings, short-lets, owner/agent/tenant workflows).

Help with: finding properties, applying to rent, maintenance requests, payments (often via Flutterwave), subscriptions, dashboards, and general navigation.

Rules:
- Use plain language; short paragraphs or bullets when helpful.
- Prefer pointing to in-app paths (e.g. tenant dashboard, public listings) when relevant.
- Never invent fees, legal advice, or company policies. If unsure, say so.
- For account-specific issues (charges, access, data errors), suggest contacting support or the Help Center rather than guessing.
- Never ask for passwords, OTPs, card numbers, or BVN/NIN.`;

router.post('/api/support/chat', async (req, res) => {
  try {
    const messages = sanitizeMessages(req.body?.messages);
    if (messages.length === 0) {
      return res.status(400).json({ error: 'Send at least one user message.' });
    }
    if (messages[messages.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'Last message must be from the user.' });
    }

    const token = getTokenFromHeader(req);
    const roleHint = optionalRoleHint(token);
    const pagePath =
      typeof req.body?.pagePath === 'string' ? req.body.pagePath.trim().slice(0, 500) : '';
    const pageNote = pagePath ? `\nThe user is viewing app path: ${pagePath}.` : '';

    if (!openai) {
      return res.status(200).json({
        message:
          "Thanks for reaching out. AI chat isn't configured in this environment yet. Try the Help Center (/help), browse listings at /public/properties, or email your platform support contact.",
        fallback: true,
      });
    }

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + roleHint + pageNote },
        ...messages,
      ],
      max_tokens: 900,
      temperature: 0.55,
    });

    const text =
      completion.choices?.[0]?.message?.content?.trim() ||
      'Sorry, I could not generate a reply. Please try again.';

    return res.json({ message: text });
  } catch (err) {
    console.error('[support/chat]', err?.message || err);
    return res.status(500).json({
      error: 'Support chat failed. Please try again later or use the Help Center.',
    });
  }
});

export function createSupportChatRouter() {
  return router;
}
