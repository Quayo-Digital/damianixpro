/**
 * Contract tests for the executive analytics API client.
 *
 * Covers:
 *  - Authorization header is attached from the Supabase session.
 *  - Throws a friendly error when the user is not signed in.
 *  - URL/query string is built correctly (date_from, date_to, property_id).
 *  - Non-2xx responses surface the server `error` field.
 *  - `VITE_ANALYTICS_API_URL` takes precedence over `VITE_VOICE_SERVER_URL`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
  },
}));

type FetchMock = ReturnType<typeof vi.fn>;

function installFetch(mock: FetchMock) {
  vi.stubGlobal('fetch', mock);
}

function jsonResponse(
  body: unknown,
  init: { ok?: boolean; status?: number; statusText?: string } = {}
) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    json: async () => body,
  } as unknown as Response;
}

const samplePayload = {
  range: { from: '2026-01-01T00:00:00.000Z', to: '2026-12-31T00:00:00.000Z' },
  kpis: {
    total_revenue_ngn: 1_500_000,
    rent_collected_ngn: 1_500_000,
    rent_outstanding_ngn: 0,
    arrears_ngn: 0,
    occupancy_rate: 0.85,
    maintenance_costs_ngn: 250_000,
  },
  occupancy: { rate: 0.85, occupied_properties: 17, total_properties: 20 },
  series: { monthly: [] },
  top_properties: [],
};

describe('fetchExecutiveAnalytics', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    mockGetSession.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('attaches the Supabase access token as a Bearer header', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok-abc' } } });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(samplePayload));
    installFetch(fetchMock);

    const { fetchExecutiveAnalytics } = await import('../executiveAnalyticsApi');
    const result = await fetchExecutiveAnalytics();

    expect(result).toEqual(samplePayload);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok-abc');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('throws a friendly error when the user is not signed in', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    installFetch(vi.fn());

    const { fetchExecutiveAnalytics } = await import('../executiveAnalyticsApi');
    await expect(fetchExecutiveAnalytics()).rejects.toThrow(/sign in/i);
  });

  it('builds the query string from dateFrom/dateTo/propertyId in order', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 't' } } });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(samplePayload));
    installFetch(fetchMock);

    const { fetchExecutiveAnalytics } = await import('../executiveAnalyticsApi');
    await fetchExecutiveAnalytics({
      dateFrom: '2026-01-01',
      dateTo: '2026-03-31',
      propertyId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/analytics/executive?');
    expect(url).toContain('date_from=2026-01-01');
    expect(url).toContain('date_to=2026-03-31');
    expect(url).toContain('property_id=aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
  });

  it('omits the query string when no params are passed', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 't' } } });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(samplePayload));
    installFetch(fetchMock);

    const { fetchExecutiveAnalytics } = await import('../executiveAnalyticsApi');
    await fetchExecutiveAnalytics();

    const [url] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/analytics\/executive$/);
  });

  it('surfaces the server error message on a non-2xx response', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 't' } } });
    installFetch(
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(
            { error: 'INVALID_DATE_RANGE' },
            { ok: false, status: 400, statusText: 'Bad Request' }
          )
        )
    );

    const { fetchExecutiveAnalytics } = await import('../executiveAnalyticsApi');
    await expect(
      fetchExecutiveAnalytics({ dateFrom: '2027-01-01', dateTo: '2026-01-01' })
    ).rejects.toThrow('INVALID_DATE_RANGE');
  });

  it('falls back to statusText when the body has no error field', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 't' } } });
    installFetch(
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({}, { ok: false, status: 503, statusText: 'Service Unavailable' })
        )
    );

    const { fetchExecutiveAnalytics } = await import('../executiveAnalyticsApi');
    await expect(fetchExecutiveAnalytics()).rejects.toThrow(/service unavailable/i);
  });

  it('prefers VITE_ANALYTICS_API_URL over VITE_VOICE_SERVER_URL', async () => {
    vi.stubEnv('VITE_ANALYTICS_API_URL', 'https://analytics.example.test');
    vi.stubEnv('VITE_VOICE_SERVER_URL', 'https://voice.example.test');
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 't' } } });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(samplePayload));
    installFetch(fetchMock);

    const { fetchExecutiveAnalytics } = await import('../executiveAnalyticsApi');
    await fetchExecutiveAnalytics();

    const [url] = fetchMock.mock.calls[0];
    expect(url).toMatch(/^https:\/\/analytics\.example\.test\/api\/analytics\/executive/);
  });

  it('falls back to VITE_VOICE_SERVER_URL when VITE_ANALYTICS_API_URL is unset', async () => {
    vi.stubEnv('VITE_ANALYTICS_API_URL', '');
    vi.stubEnv('VITE_VOICE_SERVER_URL', 'https://voice.example.test');
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 't' } } });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(samplePayload));
    installFetch(fetchMock);

    const { fetchExecutiveAnalytics } = await import('../executiveAnalyticsApi');
    await fetchExecutiveAnalytics();

    const [url] = fetchMock.mock.calls[0];
    expect(url).toMatch(/^https:\/\/voice\.example\.test\/api\/analytics\/executive/);
  });
});
