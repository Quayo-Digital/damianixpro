import { supabase } from '@/integrations/supabase/client';
import { resolveOrganizationIdForPortfolio } from './resolveOrganizationId';

const API_BASE = import.meta.env.VITE_VOICE_SERVER_URL || 'http://localhost:4000';

type ImportKind = 'properties' | 'tenants' | 'properties_and_tenants';

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const err = (body as { error?: string })?.error || res.statusText;
    throw new Error(typeof err === 'string' ? err : 'Request failed');
  }
  return body as T;
}

function inferKind(propertyRows: number, tenantRows: number): ImportKind {
  if (propertyRows > 0 && tenantRows > 0) return 'properties_and_tenants';
  if (propertyRows > 0) return 'properties';
  return 'tenants';
}

export async function createServerImportJob(options: {
  ownerId: string;
  fileName: string;
  propertyRows: number;
  tenantRows: number;
  sourceColumns?: string[];
}) {
  const organizationId = await resolveOrganizationIdForPortfolio(options.ownerId);
  const res = await fetch(`${API_BASE}/api/imports/jobs`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      organization_id: organizationId,
      file_name: options.fileName,
      import_kind: inferKind(options.propertyRows, options.tenantRows),
      total_rows: options.propertyRows + options.tenantRows,
      source_columns: options.sourceColumns ?? [],
    }),
  });
  return parseJson<{
    job: { id: string; status: string };
    upload: { bucket: string; path: string; token: string };
  }>(res);
}

export async function uploadWorkbookToSignedImportUrl(
  upload: {
    bucket: string;
    path: string;
    token: string;
  },
  file: File
): Promise<void> {
  const { error } = await supabase.storage
    .from(upload.bucket)
    .uploadToSignedUrl(upload.path, upload.token, file);
  if (error) throw new Error(error.message || 'Upload failed');
}

export async function markImportUploadComplete(jobId: string, checksumSha256?: string) {
  const res = await fetch(`${API_BASE}/api/imports/jobs/${encodeURIComponent(jobId)}/uploaded`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      checksum_sha256: checksumSha256 || null,
    }),
  });
  return parseJson<{ job: { id: string; status: string } }>(res);
}

export async function startServerImportJob(jobId: string) {
  const res = await fetch(`${API_BASE}/api/imports/jobs/${encodeURIComponent(jobId)}/start`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({}),
  });
  return parseJson<{ job: { id: string; status: string }; phase: string; message: string }>(res);
}

export async function getServerImportJob(jobId: string) {
  const res = await fetch(`${API_BASE}/api/imports/jobs/${encodeURIComponent(jobId)}`, {
    headers: await authHeaders(),
  });
  return parseJson<{
    job: {
      id: string;
      status: string;
      total_rows: number;
      processed_rows: number;
      created_at: string;
      updated_at: string;
    };
    events: Array<{
      id: string;
      event_type: string;
      created_at: string;
      metadata: Record<string, unknown>;
    }>;
  }>(res);
}
