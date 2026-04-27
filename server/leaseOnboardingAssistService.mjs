/**
 * AI-assisted post-lease onboarding / internal coordination (priorities, handoffs, schedule hints).
 * POST /api/ai/lease-onboarding-coordination
 *
 * Requires: OPENAI_API_KEY, SUPABASE_JWT_SECRET, supabaseAdmin
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

router.post('/api/ai/lease-onboarding-coordination', async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    const allowedRoles = ['admin', 'super_admin', 'owner', 'agent', 'manager'];
    if (!allowedRoles.includes(user.role)) {
      return res
        .status(403)
        .json({ error: 'Onboarding coordination assist is for owners, agents, and managers.' });
    }

    if (!openai) {
      return res.status(503).json({
        error: 'AI is not configured (missing OPENAI_API_KEY on the voice server).',
      });
    }

    const lease = req.body?.lease;
    const phase = String(req.body?.phase || 'post_executed').trim();
    const tasks = Array.isArray(req.body?.tasks) ? req.body.tasks : [];

    if (!lease || typeof lease !== 'object') {
      return res.status(400).json({ error: 'Missing lease summary.' });
    }

    const allowedPhases = ['post_executed', 'pre_move_in', 'move_in_week', 'stabilization'];
    if (!allowedPhases.includes(phase)) {
      return res.status(400).json({ error: 'Unsupported phase.' });
    }

    const taskPayload = tasks.slice(0, 24).map((t) => ({
      key: t?.key,
      title: t?.title,
      status: t?.status,
      owner_team: t?.owner_team,
      due_at: t?.due_at,
    }));

    const systemPrompt = [
      'You help Nigerian property managers coordinate post-lease onboarding across internal teams (leasing, operations, finance).',
      'Output is for staff only — not legal advice. Do not invent tenant communications; suggest drafts as optional bullets.',
      'Given the lease summary and task list, produce:',
      '(1) a recommended order for the next 5–7 working days,',
      '(2) which owner_team should lead each urgent item,',
      '(3) 2–4 risks if items slip (vacancy cost, access issues, compliance gaps) — stated neutrally,',
      '(4) one short "stand-up" checklist the manager can use in a 10-minute sync.',
      'Respect tasks already marked done or skipped — do not reopen them unless there is a clear dependency risk.',
      'Keep under ~320 words. Use concise bullets.',
    ].join('\n');

    const userPrompt = `Phase: ${phase}\nLease summary:\n${JSON.stringify(lease, null, 2)}\nTasks:\n${JSON.stringify(taskPayload, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 900,
      temperature: 0.35,
    });

    const text =
      response.choices?.[0]?.message?.content?.trim() ||
      'Could not generate a coordination plan. Try again.';

    return res.json({ text });
  } catch (err) {
    console.error('[ai/lease-onboarding-coordination]', err?.message);
    return res.status(500).json({ error: 'AI request failed. Try again later.' });
  }
});

export function createLeaseOnboardingAssistRouter() {
  return router;
}
