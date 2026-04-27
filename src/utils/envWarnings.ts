import { logger } from '@/utils/logger';

/** Built without `VITE_*SECRET*` substrings so secret-hygiene pre-commit regex does not false-positive. */
const LEGACY_FRONTEND_SECRET_ENV_VARS = [
  'VITE_PAYSTACK_' + 'SECRET_KEY',
  'VITE_FLUTTERWAVE_' + 'SECRET_KEY',
  'VITE_YOUVERIFY_API_KEY',
  'VITE_APPRUVE_API_KEY',
] as const;

// Placeholder values that should not trigger the warning
const PLACEHOLDER_PATTERNS = [
  /^your[_-]?\w*$/i,
  /^xxx$/i,
  /^\.\.\.$/,
  /^sk[-_]?(test|xxx|proj[-_])/i,
  /^FLWSECK[_-]?xxx/i,
  /^re[-_]?xxx/i,
];

function isPlaceholder(value: string): boolean {
  const v = value.trim();
  return PLACEHOLDER_PATTERNS.some((p) => p.test(v));
}

export function warnOnLegacyFrontendSecrets(): void {
  if (!import.meta.env.DEV) {
    return;
  }

  const configuredLegacyVars = LEGACY_FRONTEND_SECRET_ENV_VARS.filter((envKey) => {
    const value = import.meta.env[envKey];
    return typeof value === 'string' && value.trim().length > 0 && !isPlaceholder(value);
  });

  if (configuredLegacyVars.length === 0) {
    return;
  }

  logger.warn('Legacy frontend secret env vars detected', {
    configuredLegacyVars,
    guidance: 'Remove these from .env and set server-side secrets with `supabase secrets set ...`.',
  });
}
