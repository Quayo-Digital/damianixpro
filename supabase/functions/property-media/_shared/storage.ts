import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const VIDEO_BUCKET = 'property-videos';
export const IMAGE_BUCKET = 'property-images';
const SIGNED_URL_TTL_SECONDS = Number(Deno.env.get('PROPERTY_VIDEO_SIGNED_URL_TTL') ?? 3600);

export function storagePathForMedia(params: {
  ownerId: string;
  propertyId: string;
  mediaId: string;
  filename: string;
}): string {
  const ext = params.filename.includes('.') ? params.filename.split('.').pop() : 'bin';
  const safeExt = String(ext ?? 'bin')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return `${params.ownerId}/${params.propertyId}/${params.mediaId}.${safeExt || 'bin'}`;
}

export async function createSignedUploadUrl(
  admin: SupabaseClient,
  bucket: string,
  path: string
): Promise<string> {
  const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Could not create upload URL');
  return data.signedUrl;
}

export async function createSignedDownloadUrl(
  admin: SupabaseClient,
  bucket: string,
  path: string
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
