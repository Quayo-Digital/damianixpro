import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonError, jsonResponse } from '../_shared/http.ts';
import { assertCanManageProperty, type UserContext } from '../_shared/authz.ts';
import { IMAGE_BUCKET, VIDEO_BUCKET } from '../_shared/storage.ts';

type MediaDeleteRow = {
  id: string;
  property_id: string;
  media_type: 'image' | 'video';
  storage_path: string;
  poster_path: string | null;
};

export async function handleDeleteMedia(
  admin: SupabaseClient,
  ctx: UserContext,
  mediaId: string
): Promise<Response> {
  try {
    const { data: media, error: mediaErr } = await admin
      .from('property_media')
      .select('id,property_id,media_type,storage_path,poster_path')
      .eq('id', mediaId)
      .maybeSingle<MediaDeleteRow>();
    if (mediaErr) return jsonError(mediaErr.message, 500);
    if (!media) return jsonError('Media not found', 404);

    await assertCanManageProperty(admin, ctx, media.property_id);

    const bucket = media.media_type === 'video' ? VIDEO_BUCKET : IMAGE_BUCKET;
    const removals = [media.storage_path];
    const { error: removeErr } = await admin.storage.from(bucket).remove(removals);
    if (removeErr) console.warn('Storage remove warning:', removeErr.message);

    if (media.poster_path) {
      const { error: posterErr } = await admin.storage
        .from(IMAGE_BUCKET)
        .remove([media.poster_path]);
      if (posterErr) console.warn('Poster remove warning:', posterErr.message);
    }

    const { error: deleteErr } = await admin.from('property_media').delete().eq('id', mediaId);
    if (deleteErr) return jsonError(deleteErr.message, 500);

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete media';
    const status = message.toLowerCase().includes('forbidden') ? 403 : 400;
    return jsonError(message, status);
  }
}
