import * as SecureStore from 'expo-secure-store';
import { env } from '../config/env';
import { getAccessToken } from './auth';

const FINTECH_TOKEN_KEY = 'fintech_token';

export const getFintechToken = async () => SecureStore.getItemAsync(FINTECH_TOKEN_KEY);

export const refreshFintechToken = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error('No Supabase access token found');

  const res = await fetch(env.fintechExchangeUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);

  const json = (await res.json()) as { fintechToken?: string };
  if (!json.fintechToken) throw new Error('Token exchange returned no fintechToken');

  await SecureStore.setItemAsync(FINTECH_TOKEN_KEY, json.fintechToken);
  return json.fintechToken;
};
