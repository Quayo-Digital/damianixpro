/**
 * Channel delivery adapters. Email/SMS use existing transport; WhatsApp uses Meta Graph
 * when configured (same as paymentNotificationService).
 *
 * To add a provider (e.g. Termii SMS), implement sendSmsViaProvider() and branch in sendSmsAbstract.
 */

import { channelTransport } from '../paymentNotificationService.mjs';
import { TRIGGER_TEMPLATES } from './templates.mjs';

/**
 * @param {'twilio'|'noop'} provider
 * @param {string} phone
 * @param {string} text
 */
export async function sendSmsAbstract(phone, text, provider = 'twilio') {
  if (provider === 'noop') {
    console.info('[notifications][sms:noop]', phone?.slice(0, 6), text?.slice(0, 80));
    return true;
  }
  return channelTransport.sendSMS(phone, text);
}

/**
 * WhatsApp-ready: uses Meta Cloud API when WHATSAPP_* env is set; otherwise logs (noop).
 * Future: swap body for template_name + components for HSM.
 *
 * @param {string} phone
 * @param {string} text
 */
export async function sendWhatsAppAbstract(phone, text) {
  return channelTransport.sendWhatsApp(phone, text);
}

/**
 * @param {string} channel
 * @param {Record<string, unknown>} rendered - output of renderChannelPayload
 * @param {Record<string, unknown>} recipient
 * @param {Record<string, unknown>} [metadata]
 */
export async function deliverChannel(channel, rendered, recipient, metadata = {}) {
  if (channel === 'in_app' && rendered?.in_app) {
    const x = rendered.in_app;
    if (!recipient.user_id) return false;
    const triggerKey = typeof metadata.trigger_key === 'string' ? metadata.trigger_key : '';
    const tpl = triggerKey ? TRIGGER_TEMPLATES[triggerKey] : null;
    /** Other channels the same trigger fans out to via outbox (when recipient has email/phone). */
    const engineFanoutChannels =
      tpl?.channels?.filter((c) => c !== 'in_app') ?? ['email', 'sms', 'whatsapp'];
    return channelTransport.createInAppNotification(
      String(recipient.user_id),
      x.title,
      x.description,
      x.type || 'system',
      x.link || '/tenant',
      {
        ...metadata,
        channel: 'in_app',
        notification_engine: true,
        trigger_key: triggerKey || undefined,
        /** UI: parallel delivery attempts (email-ready / SMS abstract / WhatsApp when configured). */
        engine_fanout_channels: engineFanoutChannels,
      }
    );
  }
  if (channel === 'email' && rendered?.email) {
    if (!recipient.email) return false;
    return channelTransport.sendEmail(
      String(recipient.email),
      rendered.email.subject,
      rendered.email.html
    );
  }
  if (channel === 'sms' && rendered?.sms) {
    if (!recipient.phone) return false;
    const provider = process.env.SMS_PROVIDER === 'noop' ? 'noop' : 'twilio';
    return sendSmsAbstract(String(recipient.phone), rendered.sms.text, provider);
  }
  if (channel === 'whatsapp' && rendered?.whatsapp) {
    if (!recipient.phone) return false;
    return sendWhatsAppAbstract(String(recipient.phone), rendered.whatsapp.text);
  }
  return false;
}
