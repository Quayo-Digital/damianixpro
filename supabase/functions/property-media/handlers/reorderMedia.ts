import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonError, jsonResponse, readJson } from '../_shared/http.ts';
import { assertCanManageProperty, type UserContext } from '../_shared/authz.ts';
import { asUuid } from '../_shared/validation.ts';

type ReorderBody = {
  propertyId: string;
  orderedMediaIds: string[];
};

export async function handleReorderMedia(
  admin: SupabaseClient,
  ctx: UserContext,
  req: Request
): Promise<Response> {
  try {
    const body = await readJson<ReorderBody>(req);
    const propertyId = asUuid(body.propertyId, 'propertyId');
    if (!Array.isArray(body.orderedMediaIds) || body.orderedMediaIds.length === 0) {
      return jsonError('orderedMediaIds must be a non-empty array', 400);
    }

    await assertCanManageProperty(admin, ctx, propertyId);

    const ids = body.orderedMediaIds.map((id) => asUuid(id, 'orderedMediaId'));
    for (let i = 0; i < ids.length; i += 1) {
      const id = ids[i];
      const { error } = await admin
        .from('property_media')
        .update({ sort_order: i, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('property_id', propertyId);
      if (error) return jsonError(error.message, 500);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reorder media';
    const status = message.toLowerCase().includes('forbidden') ? 403 : 400;
    return jsonError(message, status);
  }
}
