import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonError, jsonResponse, readJson } from '../_shared/http.ts';
import { assertCanManageProperty, type UserContext } from '../_shared/authz.ts';
import {
  asMediaType,
  asUuid,
  ensureVideoMimeAndSize,
  safeFilename,
  videoPolicyConfig,
} from '../_shared/validation.ts';
import {
  createSignedUploadUrl,
  IMAGE_BUCKET,
  storagePathForMedia,
  VIDEO_BUCKET,
} from '../_shared/storage.ts';

type InitUploadBody = {
  propertyId: string;
  mediaType: 'image' | 'video';
  filename: string;
  mimeType: string;
  fileSize: number;
};

export async function handleInitUpload(
  admin: SupabaseClient,
  ctx: UserContext,
  req: Request
): Promise<Response> {
  try {
    const body = await readJson<InitUploadBody>(req);
    const propertyId = asUuid(body.propertyId, 'propertyId');
    const mediaType = asMediaType(body.mediaType);
    const filename = safeFilename(body.filename);
    const mimeType = String(body.mimeType ?? '').trim();
    const fileSize = Number(body.fileSize ?? 0);

    if (mediaType === 'video') ensureVideoMimeAndSize(mimeType, fileSize);

    const { ownerId } = await assertCanManageProperty(admin, ctx, propertyId);
    const mediaId = crypto.randomUUID();
    const storagePath = storagePathForMedia({ ownerId, propertyId, mediaId, filename });
    const bucket = mediaType === 'video' ? VIDEO_BUCKET : IMAGE_BUCKET;

    const { error: insertErr } = await admin.from('property_media').insert({
      id: mediaId,
      property_id: propertyId,
      owner_id: ownerId,
      media_type: mediaType,
      storage_path: storagePath,
      file_size: fileSize || null,
      mime_type: mimeType || null,
      status: 'uploading',
      metadata: { original_filename: filename },
    });
    if (insertErr) return jsonError(insertErr.message, 500);

    const signedUploadUrl = await createSignedUploadUrl(admin, bucket, storagePath);
    return jsonResponse({
      media: {
        id: mediaId,
        propertyId,
        ownerId,
        mediaType,
        storagePath,
        status: 'uploading',
      },
      upload: {
        bucket,
        path: storagePath,
        signedUploadUrl,
      },
      constraints: mediaType === 'video' ? videoPolicyConfig() : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initialize upload';
    const status = message.toLowerCase().includes('forbidden')
      ? 403
      : message.toLowerCase().includes('not found')
        ? 404
        : 400;
    return jsonError(message, status);
  }
}
