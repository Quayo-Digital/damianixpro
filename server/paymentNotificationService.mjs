/**
 * Payment Notification System
 *
 * Events: payment_successful | payment_failed | rent_due_reminder
 * Channels: Email (Resend) | SMS (Twilio) | WhatsApp (Meta)
 *
 * Usage:
 *   await notifyPayment({ event: 'payment_successful', tenant, amount, txRef });
 *   await notifyPayment({ event: 'payment_failed', tenant, txRef });
 *   await notifyPayment({ event: 'rent_due_reminder', tenant, amount, dueDate, daysUntilDue, paymentLink });
 */

import { supabaseAdmin } from "./supabaseClient.mjs";
import { isWebPushConfigured, sendWebPushForUser } from "./webPushService.mjs";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM_EMAIL || "DamianixPro <notifications@damianixpro.com>";
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

function formatPhone(phone) {
  if (!phone) return null;
  return phone.startsWith("+") ? phone : `+234${String(phone).replace(/^0/, "")}`;
}

function formatAmount(amount) {
  return `₦${Number(amount || 0).toLocaleString()}`;
}

// --- Channel senders ---

async function sendEmail(to, subject, htmlBody) {
  if (!RESEND_API_KEY || !to) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [to],
        subject,
        html: htmlBody,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[payment-notify] Email send failed", err?.message);
    return false;
  }
}

async function sendSMS(phone, message) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) return false;
  const to = formatPhone(phone);
  if (!to) return false;
  try {
    const params = new URLSearchParams({
      To: to,
      From: TWILIO_PHONE_NUMBER,
      Body: message,
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );
    return res.ok;
  } catch (err) {
    console.error("[payment-notify] SMS send failed", err?.message);
    return false;
  }
}

async function sendWhatsApp(to, text) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return false;
  const cleanTo = String(to || "").replace(/\D/g, "");
  if (!cleanTo) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "text",
        text: { body: text },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[payment-notify] WhatsApp send failed", err?.message);
    return false;
  }
}

async function createInAppNotification(userId, title, description, type, link, metadata) {
  if (!supabaseAdmin || !userId) return false;
  try {
    const resolvedLink = link || "/tenant";
    const { error } = await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title,
      description,
      type: type || "payment",
      link: resolvedLink,
      metadata: metadata || {},
    });
    if (!error && isWebPushConfigured()) {
      void sendWebPushForUser(userId, {
        title,
        body: description,
        url: resolvedLink,
      });
    }
    return !error;
  } catch (err) {
    console.error("[payment-notify] In-app notification failed", err?.message);
    return false;
  }
}

// --- Event message builders ---

function buildPaymentSuccessfulMessages(tenant, amount, txRef) {
  const name = tenant?.first_name || "Tenant";
  const amt = formatAmount(amount);
  const short = `Your rent payment of ${amt} has been received. Ref: ${txRef}. Thank you for using DamianixPro.`;
  return {
    sms: short,
    whatsapp: `Hi ${name},\n\n${short}\n\nYou can download your receipt from the app.`,
    email: {
      subject: "Rent Payment Received – DamianixPro",
      body: `
        <p>Hi ${name},</p>
        <p>Your rent payment of <strong>${amt}</strong> has been received successfully.</p>
        <p>Transaction reference: <code>${txRef}</code></p>
        <p>Thank you for using DamianixPro.</p>
        <p>Best regards,<br/>DamianixPro Team</p>
      `,
    },
    inApp: { title: "Rent Payment Received", description: short },
  };
}

function buildPaymentFailedMessages(tenant, txRef) {
  const name = tenant?.first_name || "Tenant";
  const short = `Your rent payment (Ref: ${txRef}) was unsuccessful. Please try again.`;
  return {
    sms: short,
    whatsapp: `Hi ${name},\n\n${short}\n\nIf you need help, please contact support or try again from the app.`,
    email: {
      subject: "Rent Payment Unsuccessful – DamianixPro",
      body: `
        <p>Hi ${name},</p>
        <p>Your rent payment (Reference: <code>${txRef}</code>) was not completed successfully.</p>
        <p>Please try again from the app or contact support if the issue persists.</p>
        <p>Best regards,<br/>DamianixPro Team</p>
      `,
    },
    inApp: { title: "Rent Payment Failed", description: short },
  };
}

function buildRentDueReminderMessages(tenant, amount, dueDate, daysUntilDue, paymentLink) {
  const name = tenant?.first_name || "Tenant";
  const amt = formatAmount(amount);
  const dueStr = new Date(dueDate).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const daysStr =
    daysUntilDue === 0 ? "today" : daysUntilDue === 1 ? "tomorrow" : `in ${daysUntilDue} days`;
  const linkPart = paymentLink ? ` Pay now: ${paymentLink}` : "";

  const sms = `DamianixPro: Rent reminder – ${amt} due ${daysStr} (${dueStr}).${linkPart}`;
  const whatsapp = `Hi ${name},\n\nYour rent of ${amt} is due ${daysStr} (${dueStr}).\n\n${
    paymentLink ? `Pay now: ${paymentLink}\n\n` : ""
  }Thank you,\nDamianixPro`;

  return {
    sms,
    whatsapp,
    email: {
      subject: `Rent Due ${daysStr} – DamianixPro`,
      body: `
        <p>Hi ${name},</p>
        <p>This is a reminder that your rent of <strong>${amt}</strong> is due ${daysStr} (${dueStr}).</p>
        ${
          paymentLink
            ? `<p><a href="${paymentLink}" style="background:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">Pay Now</a></p>`
            : ""
        }
        <p>Thank you,<br/>DamianixPro Team</p>
      `,
    },
    inApp: {
      title: "Rent Due Reminder",
      description: `Your rent of ${amt} is due ${daysStr}.`,
    },
  };
}

// --- Main notification dispatcher ---

/**
 * @param {Object} opts
 * @param {'payment_successful'|'payment_failed'|'rent_due_reminder'} opts.event
 * @param {Object} opts.tenant - { user_id, first_name, last_name, phone, email }
 * @param {number} [opts.amount]
 * @param {string} [opts.txRef]
 * @param {string} [opts.dueDate]
 * @param {number} [opts.daysUntilDue]
 * @param {string} [opts.paymentLink]
 * @param {string[]} [opts.channels] - ['email','sms','whatsapp'] or omit for all
 * @returns {Promise<{ sent: string[], failed: string[] }>}
 */
export async function notifyPayment(opts) {
  const { event, tenant, channels } = opts;
  const requestedChannels = Array.isArray(channels) ? channels : ["email", "sms", "whatsapp"];
  const sent = [];
  const failed = [];

  let messages;
  let inApp;

  switch (event) {
    case "payment_successful":
      messages = buildPaymentSuccessfulMessages(tenant, opts.amount, opts.txRef);
      inApp = messages.inApp;
      break;
    case "payment_failed":
      messages = buildPaymentFailedMessages(tenant, opts.txRef);
      inApp = messages.inApp;
      break;
    case "rent_due_reminder":
      messages = buildRentDueReminderMessages(
        tenant,
        opts.amount,
        opts.dueDate,
        opts.daysUntilDue ?? 0,
        opts.paymentLink
      );
      inApp = messages.inApp;
      break;
    default:
      console.warn("[payment-notify] Unknown event:", event);
      return { sent: [], failed: [] };
  }

  // In-app notification (always if user_id present)
  if (tenant?.user_id && supabaseAdmin) {
    const ok = await createInAppNotification(
      tenant.user_id,
      inApp.title,
      inApp.description,
      "payment",
      "/tenant",
      {
        event,
        amount: opts.amount,
        tx_ref: opts.txRef,
        due_date: opts.dueDate,
      }
    );
    if (ok) sent.push("in_app");
  }

  // Email
  if (requestedChannels.includes("email") && tenant?.email && messages.email) {
    const ok = await sendEmail(tenant.email, messages.email.subject, messages.email.body);
    if (ok) sent.push("email");
    else failed.push("email");
  }

  // SMS
  if (requestedChannels.includes("sms") && tenant?.phone && messages.sms) {
    const ok = await sendSMS(tenant.phone, messages.sms);
    if (ok) sent.push("sms");
    else failed.push("sms");
  }

  // WhatsApp (use phone for recipient)
  if (requestedChannels.includes("whatsapp") && tenant?.phone && messages.whatsapp) {
    const ok = await sendWhatsApp(tenant.phone, messages.whatsapp);
    if (ok) sent.push("whatsapp");
    else failed.push("whatsapp");
  }

  return { sent, failed };
}
