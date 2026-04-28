import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export type PropertyMediaType = 'image' | 'video';
export type PropertyMediaStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface PropertyMediaItem {
  id: string;
  mediaType: PropertyMediaType;
  status: PropertyMediaStatus | string;
  sortOrder: number;
  isPrimary: boolean;
  storagePath: string;
  deliveryUrl: string | null;
  posterUrl: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown>;
  publicUrl: string | null;
}

export interface InitMediaUploadInput {
  propertyId: string;
  mediaType: PropertyMediaType;
  filename: string;
  mimeType: string;
  fileSize: number;
}

export interface InitMediaUploadResult {
  media: {
    id: string;
    propertyId: string;
    ownerId: string;
    mediaType: PropertyMediaType;
    storagePath: string;
    status: PropertyMediaStatus;
  };
  upload: {
    bucket: string;
    path: string;
    signedUploadUrl: string;
  };
  constraints: {
    maxFileSize: number;
    allowedMimeTypes: string[];
  } | null;
}

export interface CompleteMediaUploadInput {
  mediaId: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  posterPath?: string;
  publicUrl?: string;
}

const FUNCTION_NAME = 'property-media';

async function callMediaFunction<T>(
  route: string,
  method: 'POST' | 'DELETE',
  body?: unknown,
  requireAuth: boolean = true
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (requireAuth && !session?.access_token) {
    throw new Error('You must be logged in to manage property media');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL');

  const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}${route}`, {
    method,
    headers: {
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    details?: unknown;
  };
  if (!response.ok) {
    const msg =
      (typeof (data as { error?: unknown }).error === 'string' &&
        (data as { error?: string }).error) ||
      `Media function failed (${response.status})`;
    logger.error('property-media function call failed', {
      route,
      method,
      status: response.status,
      details: (data as { details?: unknown }).details,
    });
    throw new Error(msg);
  }
  return data as T;
}

export async function initPropertyMediaUpload(
  input: InitMediaUploadInput
): Promise<InitMediaUploadResult> {
  return await callMediaFunction<InitMediaUploadResult>('/init-upload', 'POST', input);
}

export async function completePropertyMediaUpload(
  input: CompleteMediaUploadInput
): Promise<{ media: Record<string, unknown> }> {
  return await callMediaFunction<{ media: Record<string, unknown> }>(
    '/complete-upload',
    'POST',
    input
  );
}

export async function listPropertyMedia(
  propertyId: string,
  includeSignedUrls: boolean = true
): Promise<PropertyMediaItem[]> {
  const result = await callMediaFunction<{ items: PropertyMediaItem[] }>(
    '/list',
    'POST',
    {
      propertyId,
      includeSignedUrls,
    },
    false
  );
  return result.items ?? [];
}

export async function reorderPropertyMedia(
  propertyId: string,
  orderedMediaIds: string[]
): Promise<void> {
  await callMediaFunction<{ ok: boolean }>('/reorder', 'POST', { propertyId, orderedMediaIds });
}

export async function setPrimaryPropertyMedia(propertyId: string, mediaId: string): Promise<void> {
  await callMediaFunction<{ ok: boolean }>('/set-primary', 'POST', { propertyId, mediaId });
}

export async function deletePropertyMedia(mediaId: string): Promise<void> {
  await callMediaFunction<{ ok: boolean }>(`/${mediaId}`, 'DELETE');
}
