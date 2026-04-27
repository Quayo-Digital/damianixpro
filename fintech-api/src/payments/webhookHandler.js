/**
 * Flutterwave webhooks — verif-hash validation and event dispatch.
 * Configure the same secret in Flutterwave Dashboard → Settings → Webhooks (secret hash).
 */
import { createFlutterwaveClient, flutterwaveRequest } from '../lib/flutterwaveClient.js';

export { validateFlutterwaveWebhookSignature } from '../middleware/webhookFlutterwave.js';

/** @typedef {{ event: string, payload: object, headers: import('express').Request['headers'] }} WebhookContext */

let webhookSubscriber = /** @type {((ctx: WebhookContext) => void | Promise<void>) | null} */ (null);

/**
 * Register async/sync handler for validated webhooks (idempotency should live inside handler).
 * @param {(ctx: WebhookContext) => void | Promise<void>} fn
 */
export function onFlutterwaveWebhook(fn) {
  webhookSubscriber = fn;
}

/**
 * Optional: re-verify charge with Flutterwave API when event is charge.completed.
 * @param {unknown} data - payload.data from webhook body
 */
export async function verifyChargeFromWebhookData(data) {
  const flwId = data?.id;
  if (!flwId) return { ok: false, reason: 'missing_transaction_id' };

  const client = createFlutterwaveClient();
  const path = `/transactions/${flwId}/verify`;
  const verified = await flutterwaveRequest(client, 'GET', path);
  return { ok: true, verified: verified?.data, raw: verified };
}

/**
 * Express handler — returns 200 after work so Flutterwave does not disable the URL.
 * Heavy work should stay idempotent (use provider id + your ledger idempotency keys).
 */
export async function handleFlutterwaveWebhook(req, res) {
  const payload = req.body ?? {};
  const event = typeof payload.event === 'string' ? payload.event : '';

  const ctx = {
    event,
    payload,
    headers: req.headers,
  };

  try {
    if (typeof webhookSubscriber === 'function') {
      await webhookSubscriber(ctx);
    } else {
      console.info(
        JSON.stringify({
          ts: new Date().toISOString(),
          op: 'flutterwave.webhook',
          event,
          txRef: payload?.data?.tx_ref,
          id: payload?.data?.id,
        })
      );
    }
  } catch (e) {
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        op: 'flutterwave.webhook.error',
        event,
        message: e instanceof Error ? e.message : String(e),
      })
    );
  }

  res.status(200).json({ received: true });
}
