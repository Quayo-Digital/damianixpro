/**
 * Declarative notification templates per trigger_key.
 * Add new triggers here + corresponding enqueue helper in outboxTriggers.mjs.
 */

import { renderTemplate } from './templateEngine.mjs';

export const TRIGGER_KEYS = /** @type {const} */ ([
  'rent_due',
  'payment_received',
  'payment_failed',
  'maintenance_ticket_created',
  'maintenance_update',
]);

/** @param {string} key */
export function isKnownTrigger(key) {
  return TRIGGER_KEYS.includes(/** @type {any} */ (key));
}

/**
 * Each trigger defines which channels may be enqueued and template strings per channel.
 * @type {Record<string, { channels: string[], email?: { subject: string, html: string }, sms?: { text: string }, whatsapp?: { text: string }, in_app?: { title: string, description: string, type: string, link: string } }>}
 */
export const TRIGGER_TEMPLATES = {
  rent_due: {
    channels: ['in_app', 'email', 'sms', 'whatsapp'],
    in_app: {
      title: 'Rent Due Reminder',
      description:
        'Your rent of {{amount_formatted}} is due {{days_phrase}} ({{due_date_display}}).',
      type: 'payment',
      link: '/tenant',
    },
    email: {
      subject: 'Rent Due {{days_phrase}} – DamianixPro',
      html: `
        <p>Hi {{first_name}},</p>
        <p>This is a reminder that your rent of <strong>{{amount_formatted}}</strong> is due {{days_phrase}} ({{due_date_display}}).</p>
        {{#payment_link_block}}
        <p><a href="{{payment_link}}" style="background:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">Pay Now</a></p>
        {{/payment_link_block}}
        <p>Thank you,<br/>DamianixPro Team</p>
      `,
    },
    sms: {
      text: 'DamianixPro: Rent reminder – {{amount_formatted}} due {{days_phrase}} ({{due_date_display}}).{{payment_link_suffix}}',
    },
    whatsapp: {
      text: 'Hi {{first_name}},\n\nYour rent of {{amount_formatted}} is due {{days_phrase}} ({{due_date_display}}).\n\n{{payment_link_whatsapp}}\nThank you,\nDamianixPro',
    },
  },
  payment_received: {
    channels: ['in_app', 'email', 'sms', 'whatsapp'],
    in_app: {
      title: 'Rent Payment Received',
      description:
        'Your rent payment of {{amount_formatted}} has been received. Ref: {{tx_ref}}.',
      type: 'payment',
      link: '/tenant',
    },
    email: {
      subject: 'Rent Payment Received – DamianixPro',
      html: `
        <p>Hi {{first_name}},</p>
        <p>Your rent payment of <strong>{{amount_formatted}}</strong> has been received successfully.</p>
        <p>Transaction reference: <code>{{tx_ref}}</code></p>
        <p>Thank you for using DamianixPro.</p>
        <p>Best regards,<br/>DamianixPro Team</p>
      `,
    },
    sms: {
      text: 'DamianixPro: Your rent payment of {{amount_formatted}} was received. Ref: {{tx_ref}}.',
    },
    whatsapp: {
      text: 'Hi {{first_name}},\n\nYour rent payment of {{amount_formatted}} has been received.\nRef: {{tx_ref}}\n\nThank you,\nDamianixPro',
    },
  },
  payment_failed: {
    channels: ['in_app', 'email', 'sms', 'whatsapp'],
    in_app: {
      title: 'Rent Payment Failed',
      description: 'Your rent payment (Ref: {{tx_ref}}) was unsuccessful. Please try again.',
      type: 'payment',
      link: '/tenant',
    },
    email: {
      subject: 'Rent Payment Unsuccessful – DamianixPro',
      html: `
        <p>Hi {{first_name}},</p>
        <p>Your rent payment (Reference: <code>{{tx_ref}}</code>) was not completed successfully.</p>
        <p>Please try again from the app or contact support if the issue persists.</p>
        <p>Best regards,<br/>DamianixPro Team</p>
      `,
    },
    sms: {
      text: 'DamianixPro: Your rent payment (Ref: {{tx_ref}}) was unsuccessful. Please try again.',
    },
    whatsapp: {
      text: 'Hi {{first_name}},\n\nYour rent payment (Ref: {{tx_ref}}) was unsuccessful.\nPlease try again from the app.\n\nDamianixPro',
    },
  },
  maintenance_ticket_created: {
    channels: ['in_app', 'email', 'sms', 'whatsapp'],
    in_app: {
      title: 'Maintenance request received',
      description: 'We received "{{ticket_title}}" ({{ticket_number}}). Status: pending.',
      type: 'maintenance',
      link: '/tenant',
    },
    email: {
      subject: 'Maintenance request received – DamianixPro',
      html: `
        <p>Hi {{first_name}},</p>
        <p>We received your maintenance request <strong>{{ticket_title}}</strong> (reference {{ticket_number}}).</p>
        <p>Our team will review it shortly. You can track progress in the app.</p>
        <p>Thank you,<br/>DamianixPro Team</p>
      `,
    },
    sms: {
      text: 'DamianixPro: Maintenance "{{ticket_title}}" ({{ticket_number}}) received. We will update you.',
    },
    whatsapp: {
      text: 'Hi {{first_name}},\n\nWe received your maintenance request *{{ticket_title}}* (ref {{ticket_number}}).\nYou will get updates as the status changes.\n\nDamianixPro',
    },
  },
  maintenance_update: {
    channels: ['in_app', 'email', 'sms', 'whatsapp'],
    in_app: {
      title: 'Maintenance update',
      description: 'Ticket "{{ticket_title}}" is now {{new_status}} (was {{old_status}}).',
      type: 'maintenance',
      link: '/tenant',
    },
    email: {
      subject: 'Maintenance ticket update – DamianixPro',
      html: `
        <p>Hi {{first_name}},</p>
        <p>Your maintenance request <strong>{{ticket_title}}</strong> has been updated.</p>
        <p>Status: <strong>{{new_status}}</strong> (previously {{old_status}}).</p>
        <p>Thank you,<br/>DamianixPro Team</p>
      `,
    },
    sms: {
      text: 'DamianixPro: Maintenance "{{ticket_title}}" is now {{new_status}} (was {{old_status}}).',
    },
    whatsapp: {
      text: 'Hi {{first_name}},\n\nYour maintenance ticket "{{ticket_title}}" is now *{{new_status}}* (was {{old_status}}).\n\nDamianixPro',
    },
  },
};

/** @param {string} html */
function stripConditionalBlocks(html, vars) {
  const link = String(vars.payment_link || '').trim();
  let out = String(html || '');
  const block = /\{\{#payment_link_block\}\}([\s\S]*?)\{\{\/payment_link_block\}\}/g;
  out = out.replace(block, (_, inner) => (link ? inner : ''));
  return out;
}

/**
 * @param {string} triggerKey
 * @param {string} channel
 * @param {Record<string, unknown>} vars
 */
export function renderChannelPayload(triggerKey, channel, vars) {
  const def = TRIGGER_TEMPLATES[triggerKey];
  if (!def) return null;
  const v = { ...vars };
  const link = String(v.payment_link || '').trim();
  v.payment_link_suffix = link ? ` Pay now: ${link}` : '';
  v.payment_link_whatsapp = link ? `Pay now: ${link}` : '';

  if (channel === 'in_app' && def.in_app) {
    return {
      in_app: {
        title: renderTemplate(def.in_app.title, v),
        description: renderTemplate(def.in_app.description, v),
        type: def.in_app.type,
        link: renderTemplate(def.in_app.link, v),
      },
    };
  }
  if (channel === 'email' && def.email) {
    let html = def.email.html;
    html = stripConditionalBlocks(html, v);
    return {
      email: {
        subject: renderTemplate(def.email.subject, v),
        html: renderTemplate(html, v),
      },
    };
  }
  if (channel === 'sms' && def.sms) {
    return { sms: { text: renderTemplate(def.sms.text, v) } };
  }
  if (channel === 'whatsapp' && def.whatsapp) {
    return { whatsapp: { text: renderTemplate(def.whatsapp.text, v) } };
  }
  return null;
}
