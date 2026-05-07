/**
 * Supabase Edge Function: fintech-token-exchange
 *
 * Mobile/SPA flow:
 * 1) Client authenticates with Supabase and obtains a Supabase access token (JWT).
 * 2) Client calls this function with:
 *      Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
 * 3) This function verifies the user with Supabase (service role),
 *    maps their app role into fintech-api roles, and returns:
 *      { fintechToken: <FINTECH_API_JWT> }
 *
 * fintech-api expects:
 *  - Authorization: Bearer <FINTECH_API_JWT>
 *  - JWT signed with HS256 using FINTECH_API JWT_SECRET (must match this function's JWT_SECRET)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const JWT_SECRET = Deno.env.get('JWT_SECRET');
const JWT_ISSUER = Deno.env.get('JWT_ISSUER') || 'damianixpro-fintech';
const JWT_AUDIENCE = (Deno.env.get('JWT_AUDIENCE') || '').trim();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function base64UrlEncode(bytes: Uint8Array) {
  // base64url without padding
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64 = btoa(binary);
  return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function signJwtHs256({ payload }: { payload: Record<string, unknown> }) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');

  const header = { alg: 'HS256', typ: 'JWT' };
  const encoder = new TextEncoder();

  const headerJson = JSON.stringify(header);
  const payloadJson = JSON.stringify(payload);
  const unsigned = `${base64UrlEncode(encoder.encode(headerJson))}.${base64UrlEncode(
    encoder.encode(payloadJson)
  )}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(unsigned)));
  const signature = base64UrlEncode(sigBytes);
  return `${unsigned}.${signature}`;
}

type FintechRole = 'tenant' | 'landlord' | 'admin';

function mapRoleToFintech(role: string | null | undefined): FintechRole | null {
  const r = (role || '').trim().toLowerCase();
  if (!r) return null;
  if (r === 'tenant') return 'tenant';
  // App uses both "owner" and "landlord" depending on context.
  if (r === 'landlord' || r === 'owner') return 'landlord';
  if (r === 'admin' || r === 'super_admin') return 'admin';
  return null;
}

function pickBestFintechRole(roles: Array<string | null | undefined>): FintechRole | null {
  // Priority: admin > landlord > tenant
  const normalized = roles.map((r) => mapRoleToFintech(r));
  if (normalized.includes('admin')) return 'admin';
  if (normalized.includes('landlord')) return 'landlord';
  if (normalized.includes('tenant')) return 'tenant';
  return null;
}

async function getFintechRoleForUser(admin: ReturnType<typeof createClient>, userId: string) {
  // Prefer `user_roles` if present (more explicit role assignment).
  let roleRows: Array<{ role: string }> = [];
  try {
    const { data, error } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .limit(5);
    if (!error && Array.isArray(data)) roleRows = data as Array<{ role: string }>;
  } catch {
    // ignore and fallback to users.role
  }

  if (roleRows.length) {
    const rawRoles = roleRows.map((r) => r.role);
    return pickBestFintechRole(rawRoles);
  }

  // Fallback: `users.role` (schema often stores a single role).
  try {
    const { data, error } = await admin
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle<{ role: string }>();
    if (!error && data) return mapRoleToFintech(data.role);
  } catch {
    // ignore
  }

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Minimal input validation
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized: missing bearer token' }, 401);
  }
  const supabaseAccessToken = authHeader.slice(7).trim();
  if (!supabaseAccessToken) return jsonResponse({ error: 'Unauthorized' }, 401);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { error: 'Server misconfigured: missing SUPABASE_URL or service key' },
      500
    );
  }
  if (!JWT_SECRET) {
    return jsonResponse({ error: 'Server misconfigured: missing JWT_SECRET' }, 500);
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: `Method not allowed: ${req.method}` }, 405);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Verify the Supabase access token and extract the user id
    const { data: userData, error: userErr } = await admin.auth.getUser(supabaseAccessToken);
    if (userErr || !userData?.user) {
      return jsonResponse({ error: 'Invalid Supabase session' }, 401);
    }

    const userId = userData.user.id;

    const fintechRole = await getFintechRoleForUser(admin, userId);
    if (!fintechRole) {
      return jsonResponse({ error: 'Forbidden: no supported role for fintech-api' }, 403);
    }

    // Create FINTECH_API JWT
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 60 * 60; // 1h

    const payload: Record<string, unknown> = {
      sub: userId,
      role: fintechRole,
      roles: [fintechRole],
      iss: JWT_ISSUER,
      iat: now,
      exp,
    };
    if (JWT_AUDIENCE) payload.aud = JWT_AUDIENCE;

    const fintechToken = await signJwtHs256({ payload });
    return jsonResponse({ fintechToken }, 200);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Unhandled error' }, 500);
  }
});
