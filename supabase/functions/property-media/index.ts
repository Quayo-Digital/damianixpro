import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonError } from './_shared/http.ts';
import { getOptionalUserContext, requireUserContext } from './_shared/authz.ts';
import { handleInitUpload } from './handlers/initUpload.ts';
import { handleCompleteUpload } from './handlers/completeUpload.ts';
import { handleListMedia } from './handlers/listMedia.ts';
import { handleReorderMedia } from './handlers/reorderMedia.ts';
import { handleSetPrimary } from './handlers/setPrimary.ts';
import { handleDeleteMedia } from './handlers/deleteMedia.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function routeFromPath(url: URL): string {
  const marker = '/property-media';
  const idx = url.pathname.indexOf(marker);
  if (idx < 0) return '/';
  const tail = url.pathname.slice(idx + marker.length);
  return tail || '/';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const route = routeFromPath(new URL(req.url));

    if (req.method === 'POST' && route === '/init-upload') {
      const userCtx = await requireUserContext(admin, req);
      return await handleInitUpload(admin, userCtx, req);
    }
    if (req.method === 'POST' && route === '/complete-upload') {
      const userCtx = await requireUserContext(admin, req);
      return await handleCompleteUpload(admin, userCtx, req);
    }
    if (req.method === 'POST' && route === '/list') {
      const userCtx = await getOptionalUserContext(admin, req);
      return await handleListMedia(admin, userCtx, req);
    }
    if (req.method === 'POST' && route === '/reorder') {
      const userCtx = await requireUserContext(admin, req);
      return await handleReorderMedia(admin, userCtx, req);
    }
    if (req.method === 'POST' && route === '/set-primary') {
      const userCtx = await requireUserContext(admin, req);
      return await handleSetPrimary(admin, userCtx, req);
    }
    if (req.method === 'DELETE' && route.startsWith('/')) {
      const userCtx = await requireUserContext(admin, req);
      const mediaId = route.split('/').filter(Boolean)[0];
      if (!mediaId) return jsonError('mediaId is required in path', 400);
      return await handleDeleteMedia(admin, userCtx, mediaId);
    }

    return jsonError(`No route for ${req.method} ${route}`, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unhandled function error';
    console.error('property-media error:', message);
    const status = message.toLowerCase().includes('unauthorized') ? 401 : 500;
    return jsonError(message, status);
  }
});
