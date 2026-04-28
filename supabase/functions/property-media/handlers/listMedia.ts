import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonError, jsonResponse, readJson } from '../_shared/http.ts';
import type { UserContext } from '../_shared/authz.ts';
import { asUuid } from '../_shared/validation.ts';
import { createSignedDownloadUrl, IMAGE_BUCKET, VIDEO_BUCKET } from '../_shared/storage.ts';

type ListBody = {
  propertyId: string;
  includeSignedUrls?: boolean;
};

type MediaRow = {
  id: string;
  media_type: 'image' | 'video';
  status: string;
  sort_order: number;
  is_primary: boolean;
  storage_path: string;
  poster_path: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown> | null;
  public_url: string | null;
};

export async function handleListMedia(
  admin: SupabaseClient,
  ctx: UserContext | null,
  req: Request
): Promise<Response> {
  try {
    const body = await readJson<ListBody>(req);
    const propertyId = asUuid(body.propertyId, 'propertyId');
    const includeSignedUrls = Boolean(body.includeSignedUrls);

    const { data: propertyRow, error: propertyErr } = await admin
      .from('properties')
      .select('owner_id,status')
      .eq('id', propertyId)
      .maybeSingle<{ owner_id: string | null; status: string | null }>();
    if (propertyErr) return jsonError(propertyErr.message, 500);
    if (!propertyRow) return jsonError('Property not found', 404);

    const isPubliclyVisible = String(propertyRow.status ?? '').toUpperCase() === 'AVAILABLE';
    const isOwner = Boolean(ctx?.userId && propertyRow.owner_id === ctx.userId);
    const canView = isPubliclyVisible || isOwner || Boolean(ctx?.isAdmin);
    if (!canView) return jsonError('Forbidden: property media is not accessible', 403);

    const includeSignedUrls =
      Boolean(body.includeSignedUrls) && (isPubliclyVisible || isOwner || Boolean(ctx?.isAdmin));

    const { data, error } = await admin
      .from('property_media')
      .select(
        'id,media_type,status,sort_order,is_primary,storage_path,poster_path,duration_seconds,width,height,metadata,public_url'
      )
      .eq('property_id', propertyId)
      .eq('status', 'ready')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) return jsonError(error.message, 500);

    const rows = (data ?? []) as MediaRow[];
    const items = await Promise.all(
      rows.map(async (row) => {
        const bucket = row.media_type === 'video' ? VIDEO_BUCKET : IMAGE_BUCKET;
        const deliveryUrl = includeSignedUrls
          ? await createSignedDownloadUrl(admin, bucket, row.storage_path)
          : row.public_url;
        const posterUrl = row.poster_path
          ? await createSignedDownloadUrl(admin, IMAGE_BUCKET, row.poster_path)
          : null;
        return {
          id: row.id,
          mediaType: row.media_type,
          status: row.status,
          sortOrder: row.sort_order,
          isPrimary: row.is_primary,
          storagePath: row.storage_path,
          deliveryUrl,
          posterUrl,
          durationSeconds: row.duration_seconds,
          width: row.width,
          height: row.height,
          metadata: row.metadata ?? {},
          publicUrl: row.public_url,
        };
      })
    );

    return jsonResponse({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list media';
    const status = message.toLowerCase().includes('forbidden')
      ? 403
      : message.toLowerCase().includes('not found')
        ? 404
        : 400;
    return jsonError(message, status);
  }
}
