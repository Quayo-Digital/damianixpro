const required = (value: string | undefined, key: string) => {
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
};

export const env = {
  supabaseUrl: required(process.env.EXPO_PUBLIC_SUPABASE_URL, 'EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: required(
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  ),
  voiceApiBaseUrl: required(
    process.env.EXPO_PUBLIC_VOICE_API_BASE_URL,
    'EXPO_PUBLIC_VOICE_API_BASE_URL'
  ),
  fintechApiBaseUrl: required(
    process.env.EXPO_PUBLIC_FINTECH_API_BASE_URL,
    'EXPO_PUBLIC_FINTECH_API_BASE_URL'
  ),
  fintechExchangeUrl: required(
    process.env.EXPO_PUBLIC_FINTECH_EXCHANGE_URL,
    'EXPO_PUBLIC_FINTECH_EXCHANGE_URL'
  ),
};
