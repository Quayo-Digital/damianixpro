/**
 * AI listing copy generation for owners/agents/managers/admins.
 * POST /api/ai/property-copywriter
 *
 * Body: {
 *   propertyType: string,
 *   location: string,
 *   targetTenant: string,
 *   amenities?: string[],
 *   bedrooms?: string | number,
 *   bathrooms?: string | number,
 *   price?: string | number,
 *   uniqueSellingPoints?: string,
 * }
 *
 * Response: { short: string, professional: string, whatsapp: string, model: string }
 *
 * Requires: OPENAI_API_KEY, SUPABASE_JWT_SECRET. Fails 503 if unset so the
 * client knows to fall back to local templates.
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { OpenAI } from 'openai';
import { supabaseAdmin } from './supabaseClient.mjs';

const router = express.Router();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const MODEL = process.env.OPENAI_PROPERTY_COPY_MODEL || 'gpt-4o-mini';

function getTokenFromHeader(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
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
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();
    if (!profile) return null;
    return { id: profile.id, role: profile.role };
  } catch {
    return null;
  }
}

const ALLOWED_ROLES = ['admin', 'super_admin', 'owner', 'agent', 'manager'];

function clampString(input, max) {
  if (input == null) return '';
  return String(input).slice(0, max).trim();
}

function clampList(input, maxItems, maxItemLength) {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, maxItems)
    .map((s) => clampString(s, maxItemLength))
    .filter(Boolean);
}

router.post('/api/ai/property-copywriter', async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }
    if (!ALLOWED_ROLES.includes(user.role)) {
      return res.status(403).json({
        error: 'Property copywriter is for owners, agents, managers, or admins.',
      });
    }
    if (!openai) {
      return res.status(503).json({
        error: 'AI is not configured (missing OPENAI_API_KEY on the voice server).',
      });
    }

    const propertyType = clampString(req.body?.propertyType, 80);
    const location = clampString(req.body?.location, 80);
    const targetTenant = clampString(req.body?.targetTenant, 60);
    const amenities = clampList(req.body?.amenities, 30, 60);
    const bedrooms = clampString(req.body?.bedrooms, 5);
    const bathrooms = clampString(req.body?.bathrooms, 5);
    const price = clampString(req.body?.price, 16);
    const usp = clampString(req.body?.uniqueSellingPoints, 400);

    if (!propertyType || !location || !targetTenant) {
      return res.status(400).json({
        error: 'propertyType, location, and targetTenant are required.',
      });
    }

    const payload = {
      propertyType,
      location,
      targetTenant,
      amenities,
      bedrooms: bedrooms || null,
      bathrooms: bathrooms || null,
      annualRentNgn: price ? Number(price) : null,
      uniqueSellingPoints: usp || null,
    };

    const systemPrompt = [
      'You are a Nigerian real-estate copywriter. Output crisp, factual, locally idiomatic listing copy.',
      'Use the Nigerian Naira symbol (₦) for prices. Never invent amenities the user did not provide.',
      'Avoid US-centric phrases (do NOT say "HOA", "zoning", "ZIP", "school district").',
      'Return STRICTLY a JSON object matching this TypeScript shape and nothing else:',
      '{ "short": string, "professional": string, "whatsapp": string }',
      '- "short": 1–2 sentences, ~280 chars max, suitable for a property card.',
      '- "professional": 120–220 words, markdown allowed (** for headers, • for amenities). Include sections: title line, intro, amenities (only if provided), ideal-for, rent (if provided), CTA.',
      '- "whatsapp": punchy, emoji-led, <= 500 characters, with line breaks; end with a one-line CTA.',
      'Tone: professional and confident, never hyperbolic. No fabricated guarantees.',
    ].join('\n');

    const userPrompt = `Generate listing copy for this property:\n${JSON.stringify(payload, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.55,
      max_tokens: 900,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices?.[0]?.message?.content?.trim() || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        error: 'AI returned a non-JSON response. Try again.',
      });
    }

    const short = clampString(parsed.short, 1200);
    const professional = clampString(parsed.professional, 6000);
    const whatsapp = clampString(parsed.whatsapp, 1000);

    if (!short || !professional || !whatsapp) {
      return res.status(502).json({
        error: 'AI response was missing one of the variants. Try again.',
      });
    }

    return res.json({ short, professional, whatsapp, model: MODEL });
  } catch (err) {
    console.error('[ai/property-copywriter]', err?.message);
    return res.status(500).json({ error: 'AI request failed. Try again later.' });
  }
});

export function createPropertyCopywriterRouter() {
  return router;
}
