/**
 * Shared Flutterwave REST client (secret key never logged).
 */
import axios from 'axios';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function assertFlutterwaveSecretConfigured() {
  if (!env.flutterwaveSecretKey) {
    throw new AppError('Flutterwave secret key is not configured', 503, 'fw_not_configured');
  }
}

export function createFlutterwaveClient() {
  assertFlutterwaveSecretConfigured();
  return axios.create({
    baseURL: env.flutterwaveBaseUrl.replace(/\/$/, ''),
    timeout: 45_000,
    headers: {
      Authorization: `Bearer ${env.flutterwaveSecretKey}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * @param {import('axios').AxiosInstance} client
 * @param {string} method
 * @param {string} path
 * @param {object} [body]
 */
export async function flutterwaveRequest(client, method, path, body) {
  try {
    const res =
      method === 'GET'
        ? await client.get(path)
        : await client.post(path, body ?? {});

    const data = res.data;
    const ok = res.status >= 200 && res.status < 300 && data?.status === 'success';

    if (!ok) {
      const msg =
        data?.message || data?.data?.message || `Flutterwave HTTP ${res.status}`;
      const err = new AppError(msg, res.status >= 500 ? 502 : 400, 'flutterwave_error', {
        status: res.status,
        flutterwave: data,
      });
      err.flutterwaveStatus = res.status;
      err.flutterwaveBody = data;
      throw err;
    }

    return data;
  } catch (e) {
    if (e instanceof AppError) throw e;
    if (/** @type {import('axios').AxiosError} */ (e).response) {
      const ax = /** @type {import('axios').AxiosError} */ (e);
      const status = ax.response?.status ?? 0;
      const data = ax.response?.data;
      const msg = data?.message || ax.message;
      const err = new AppError(msg, status >= 500 ? 502 : 400, 'flutterwave_http', {
        status,
        flutterwave: data,
      });
      err.flutterwaveStatus = status;
      err.flutterwaveBody = data;
      err.isAxiosNetworkError = !ax.response;
      throw err;
    }
    throw e;
  }
}
