import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

type Provider = 'youverify' | 'appruve' | 'flutterwave';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const DEFAULT_BASE_URL: Record<Provider, string> = {
  youverify: Deno.env.get('YOUVERIFY_BASE_URL') || 'https://api.youverify.co/v2',
  appruve: Deno.env.get('APPRUVE_BASE_URL') || 'https://api.appruve.co/v1',
  flutterwave: Deno.env.get('FLUTTERWAVE_BASE_URL') || 'https://api.flutterwave.com/v3',
};

const PROVIDER_SECRET: Record<Provider, string | undefined> = {
  youverify: Deno.env.get('YOUVERIFY_API_KEY'),
  appruve: Deno.env.get('APPRUVE_API_KEY'),
  flutterwave: Deno.env.get('FLUTTERWAVE_SECRET_KEY'),
};

const ALLOWED_ENDPOINTS: Record<Provider, ReadonlySet<string>> = {
  youverify: new Set(['/identities/ng/bvn', '/identities/ng/nin', '/identities/ng/phone', '/test']),
  appruve: new Set(['/verifications/ng/business_info', '/test']),
  flutterwave: new Set(['/transfers', '/test']),
};

const ALLOWED_METHODS = new Set<HttpMethod>(['GET', 'POST', 'PUT', 'DELETE']);

function jsonResponse(body: unknown, status: number = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const provider = body.provider as Provider | undefined;
    const endpoint = body.endpoint as string | undefined;
    const method = (body.method as HttpMethod | undefined) || 'POST';
    const data = body.data;
    const customHeaders = (body.headers as Record<string, string> | undefined) || {};
    const clientBaseUrl = body.base_url as string | undefined;

    if (!provider || !(provider in DEFAULT_BASE_URL)) {
      return jsonResponse({ success: false, error: 'Invalid provider' }, 400);
    }

    if (!endpoint || !ALLOWED_ENDPOINTS[provider].has(endpoint)) {
      return jsonResponse({ success: false, error: 'Endpoint not allowed for provider' }, 400);
    }

    if (!ALLOWED_METHODS.has(method)) {
      return jsonResponse({ success: false, error: 'Invalid HTTP method' }, 400);
    }

    if (endpoint === '/test') {
      return jsonResponse({
        success: true,
        data: {
          provider,
          configured: !!PROVIDER_SECRET[provider],
        },
      });
    }

    const providerSecret = PROVIDER_SECRET[provider];
    if (!providerSecret) {
      return jsonResponse(
        {
          success: false,
          error: `${provider} is not configured on server`,
        },
        500
      );
    }

    const baseUrl = clientBaseUrl || DEFAULT_BASE_URL[provider];
    const targetUrl = `${baseUrl}${endpoint}`;

    const response = await fetch(targetUrl, {
      method,
      headers: {
        Authorization: `Bearer ${providerSecret}`,
        'Content-Type': 'application/json',
        ...customHeaders,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseJson = await response.json().catch(() => ({}));
    if (!response.ok) {
      return jsonResponse(
        {
          success: false,
          status: response.status,
          error:
            responseJson?.message ||
            responseJson?.error ||
            `Provider request failed with status ${response.status}`,
          details: responseJson,
        },
        response.status
      );
    }

    return jsonResponse({
      success: true,
      status: response.status,
      data: responseJson,
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});
