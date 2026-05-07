import { supabase } from '@/integrations/supabase/client';

export class ApiError extends Error {
  status: number | null;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    opts: { status?: number | null; code?: string; details?: unknown } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = opts.status ?? null;
    this.code = opts.code ?? 'API_ERROR';
    this.details = opts.details;
  }
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError('Not authenticated', { status: 401, code: 'UNAUTHORIZED' });
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function parseJson(res: Response) {
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text ? { raw: text } : null;
  }
  if (!res.ok) {
    const msg =
      (body as { error?: string; message?: string })?.error ||
      (body as { message?: string })?.message ||
      res.statusText ||
      'Request failed';
    throw new ApiError(String(msg), { status: res.status, code: 'HTTP_ERROR', details: body });
  }
  return body;
}

export async function apiFetchJson<T>(
  url: string,
  init?: RequestInit & { auth?: boolean }
): Promise<T> {
  const headers: HeadersInit = {
    ...(init?.headers || {}),
  };
  const useAuth = init?.auth !== false;
  if (useAuth) {
    Object.assign(headers, await authHeaders());
  }
  const res = await fetch(url, {
    ...init,
    headers,
  });
  return (await parseJson(res)) as T;
}
