import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonError, jsonResponse, readJson } from '../_shared/http.ts';
import { asUuid, toOptionalFiniteNumber } from '../_shared/validation.ts';
import { assertCanManageProperty, type UserContext } from '../_shared/authz.ts';

type CompleteUploadBody = {
  mediaId: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  posterPath?: string;
  publicUrl?: string;
};

type MediaRow = {
  id: string;
  property_id: string;
  media_type: 'image' | 'video';
  storage_path: string;
};

export async function handleCompleteUpload(
  admin: SupabaseClient,
  ctx: UserContext,
  req: Request
): Promise<Response> {
  try {
    const body = await readJson<CompleteUploadBody>(req);
    const mediaId = asUuid(body.mediaId, 'mediaId');

    const { data: media, error: mediaErr } = await admin
      .from('property_media')
      .select('id,property_id,media_type,storage_path')
      .eq('id', mediaId)
      .maybeSingle<MediaRow>();
    if (mediaErr) return jsonError(mediaErr.message, 500);
    if (!media) return jsonError('Media not found', 404);

    await assertCanManageProperty(admin, ctx, media.property_id);

    const patch = {
      status: 'ready',
      duration_seconds: toOptionalFiniteNumber(body.durationSeconds),
      width: toOptionalFiniteNumber(body.width),
      height: toOptionalFiniteNumber(body.height),
      poster_path: body.posterPath ? String(body.posterPath) : null,
      public_url: body.publicUrl ? String(body.publicUrl) : null,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error: updateErr } = await admin
      .from('property_media')
      .update(patch)
      .eq('id', mediaId)
      .select('*')
      .maybeSingle();
    if (updateErr) return jsonError(updateErr.message, 500);

    return jsonResponse({
      media: {
        id: updated?.id ?? mediaId,
        status: updated?.status ?? 'ready',
        publicUrl: updated?.public_url ?? null,
        posterPath: updated?.poster_path ?? null,
        durationSeconds: updated?.duration_seconds ?? null,
        width: updated?.width ?? null,
        height: updated?.height ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to complete upload';
    const status = message.toLowerCase().includes('forbidden') ? 403 : 400;
    return jsonError(message, status);
  }
}
