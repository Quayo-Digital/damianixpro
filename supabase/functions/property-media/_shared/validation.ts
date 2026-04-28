const MAX_VIDEO_FILE_SIZE = Number(Deno.env.get('PROPERTY_VIDEO_MAX_FILE_SIZE') ?? 209715200);
const ALLOWED_VIDEO_MIME_TYPES = String(
  Deno.env.get('PROPERTY_VIDEO_ALLOWED_MIME') ?? 'video/mp4,video/webm,video/quicktime'
)
  .split(',')
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean);

export type MediaType = 'image' | 'video';

export function asUuid(value: unknown, fieldName: string): string {
  const text = String(value ?? '').trim();
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(text)) throw new Error(`${fieldName} must be a valid UUID`);
  return text;
}

export function asMediaType(value: unknown): MediaType {
  const text = String(value ?? '')
    .trim()
    .toLowerCase();
  if (text !== 'image' && text !== 'video') throw new Error('mediaType must be image or video');
  return text;
}

export function ensureVideoMimeAndSize(mimeType: string, fileSize: number): void {
  const normalizedMime = String(mimeType || '')
    .trim()
    .toLowerCase();
  if (!ALLOWED_VIDEO_MIME_TYPES.includes(normalizedMime)) {
    throw new Error(`Unsupported mimeType for video: ${normalizedMime}`);
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    throw new Error('fileSize must be a positive number');
  }
  if (fileSize > MAX_VIDEO_FILE_SIZE) {
    throw new Error(`fileSize exceeds max limit (${MAX_VIDEO_FILE_SIZE} bytes)`);
  }
}

export function safeFilename(filename: unknown): string {
  const value = String(filename ?? '').trim();
  if (!value) throw new Error('filename is required');
  const base = value.split('/').pop() ?? value;
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function toOptionalFiniteNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num)) throw new Error('Expected a finite number');
  return num;
}

export function videoPolicyConfig() {
  return {
    maxFileSize: MAX_VIDEO_FILE_SIZE,
    allowedMimeTypes: ALLOWED_VIDEO_MIME_TYPES,
  };
}
