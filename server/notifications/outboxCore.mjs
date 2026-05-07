/**
 * Notification outbox: enqueue + process batches (durable queue).
 */

import { supabaseAdmin } from '../supabaseClient.mjs';
import { TRIGGER_TEMPLATES, renderChannelPayload } from './templates.mjs';
import { deliverChannel } from './channelDeliver.mjs';

/**
 * @param {Array<Record<string, unknown>>} rows
 */
export async function insertOutboxJobs(rows) {
  if (!supabaseAdmin || !rows?.length) return { inserted: 0 };
  const { error } = await supabaseAdmin.from('notification_outbox').insert(rows);
  if (error) {
    console.error('[notification-outbox] insert failed', error);
    throw new Error(error.message);
  }
  return { inserted: rows.length };
}

function mergeTemplateVars(row) {
  const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
  const recipient = row.recipient && typeof row.recipient === 'object' ? row.recipient : {};
  const first =
    (typeof payload.first_name === 'string' && payload.first_name) ||
    (typeof recipient.display_name === 'string' && recipient.display_name) ||
    'there';
  return { ...payload, ...recipient, first_name: first };
}

export async function processOutboxRow(row) {
  if (!supabaseAdmin || !row?.id) return;
  const vars = mergeTemplateVars(row);
  const rendered = renderChannelPayload(row.trigger_key, row.channel, vars);
  if (!rendered) {
    await supabaseAdmin
      .from('notification_outbox')
      .update({
        status: 'failed',
        last_error: 'No template for trigger/channel',
        attempts: (row.attempts || 0) + 1,
      })
      .eq('id', row.id);
    return;
  }

  const meta = {
    trigger_key: row.trigger_key,
    template_id: row.template_id,
    outbox_id: row.id,
  };

  let ok = false;
  try {
    ok = await deliverChannel(row.channel, rendered, row.recipient || {}, meta);
  } catch (e) {
    console.error('[notification-outbox] deliver', row.id, e?.message);
  }

  const attempts = (row.attempts || 0) + 1;
  const max = row.max_attempts ?? 5;
  if (ok) {
    await supabaseAdmin
      .from('notification_outbox')
      .update({ status: 'sent', last_error: null, attempts })
      .eq('id', row.id);
  } else if (attempts >= max) {
    await supabaseAdmin
      .from('notification_outbox')
      .update({
        status: 'dead',
        last_error: 'Max attempts exceeded',
        attempts,
      })
      .eq('id', row.id);
  } else {
    const retryAt = new Date(Date.now() + Math.min(60 * 60 * 1000 * attempts, 6 * 60 * 60 * 1000));
    await supabaseAdmin
      .from('notification_outbox')
      .update({
        status: 'pending',
        last_error: 'Delivery returned false',
        attempts,
        scheduled_at: retryAt.toISOString(),
      })
      .eq('id', row.id);
  }
}

/**
 * Claim pending jobs (best-effort single-node; safe for concurrent workers via status transition).
 * @param {number} limit
 */
export async function processOutboxBatch(limit = 25) {
  if (!supabaseAdmin) return { processed: 0, errors: 0 };

  const stale = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  await supabaseAdmin
    .from('notification_outbox')
    .update({ status: 'pending', last_error: 'Recovered stale processing' })
    .eq('status', 'processing')
    .lt('updated_at', stale);

  const { data: pending, error } = await supabaseAdmin
    .from('notification_outbox')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[notification-outbox] select pending', error);
    return { processed: 0, errors: 1 };
  }

  let processed = 0;
  let errors = 0;
  for (const row of pending || []) {
    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from('notification_outbox')
      .update({ status: 'processing' })
      .eq('id', row.id)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle();

    if (claimErr || !claimed) continue;

    try {
      await processOutboxRow(claimed);
      processed += 1;
    } catch (e) {
      errors += 1;
      console.error('[notification-outbox] process', claimed.id, e?.message);
    }
  }

  return { processed, errors };
}

/**
 * Build insert rows for a trigger from TRIGGER_TEMPLATES + recipient capabilities.
 *
 * @param {string} triggerKey
 * @param {Record<string, unknown>} recipient - user_id?, email?, phone?, display_name?
 * @param {Record<string, unknown>} payload - template vars
 * @param {string[]|null|undefined} channelsFilter - subset or all
 * @param {string} [scheduledAt] ISO
 */
export function buildOutboxRows(triggerKey, recipient, payload, channelsFilter, scheduledAt) {
  const def = TRIGGER_TEMPLATES[triggerKey];
  if (!def) return [];

  const channels = Array.isArray(channelsFilter) && channelsFilter.length ? channelsFilter : def.channels;

  const rows = [];
  const sched = scheduledAt || new Date().toISOString();

  for (const ch of channels) {
    if (!def.channels.includes(ch)) continue;
    if (ch === 'email' && !recipient.email) continue;
    if ((ch === 'sms' || ch === 'whatsapp') && !recipient.phone) continue;
    if (ch === 'in_app' && !recipient.user_id) continue;

    rows.push({
      trigger_key: triggerKey,
      template_id: 'default',
      channel: ch,
      status: 'pending',
      scheduled_at: sched,
      payload,
      recipient,
    });
  }
  return rows;
}
