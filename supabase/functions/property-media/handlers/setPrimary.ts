import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonError, jsonResponse, readJson } from '../_shared/http.ts';
import { assertCanManageProperty, type UserContext } from '../_shared/authz.ts';
import { asUuid } from '../_shared/validation.ts';

type SetPrimaryBody = {
  propertyId: string;
  mediaId: string;
};

export async function handleSetPrimary(
  admin: SupabaseClient,
  ctx: UserContext,
  req: Request
): Promise<Response> {
  try {
    const body = await readJson<SetPrimaryBody>(req);
    const propertyId = asUuid(body.propertyId, 'propertyId');
    const mediaId = asUuid(body.mediaId, 'mediaId');

    await assertCanManageProperty(admin, ctx, propertyId);

    const { error: clearErr } = await admin
      .from('property_media')
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq('property_id', propertyId)
      .eq('is_primary', true);
    if (clearErr) return jsonError(clearErr.message, 500);

    const { error: setErr } = await admin
      .from('property_media')
      .update({ is_primary: true, updated_at: new Date().toISOString() })
      .eq('id', mediaId)
      .eq('property_id', propertyId);
    if (setErr) return jsonError(setErr.message, 500);

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set primary media';
    const status = message.toLowerCase().includes('forbidden') ? 403 : 400;
    return jsonError(message, status);
  }
}
