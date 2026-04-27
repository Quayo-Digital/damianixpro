import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from './supabaseClient.mjs';
import { mapRentRowToLegacyPayment } from './rentLedgerCompat.mjs';
import { notifyPayment } from './paymentNotificationService.mjs';

const router = express.Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TTS_URL = process.env.TTS_URL || 'http://localhost:4010';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || process.env.VOICE_SERVER_URL || 'http://localhost:4000';
const REMINDER_DAYS_AHEAD = parseInt(process.env.RENT_REMINDER_DAYS_AHEAD || '5', 10);

function formatAmountNaira(amount) {
  const n = Number(amount);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} million naira`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} thousand naira`;
  return `${Math.round(n).toLocaleString()} naira`;
}

function buildReminderMessage(firstName, amount, daysUntilDue) {
  const amountStr = formatAmountNaira(amount);
  const daysStr = daysUntilDue === 0 ? 'today' : daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`;
  return `Hello ${firstName}, this is DamianixPro AI. Your rent of ${amountStr} is due ${daysStr}. Would you like to pay now?`;
}

async function generateTTSBuffer(text) {
  const res = await fetch(`${TTS_URL}/api/voice/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) return null;
  return res.arrayBuffer();
}

async function createPaystackLink(email, amountKobo, reference, metadata = {}) {
  if (!PAYSTACK_SECRET_KEY) return null;
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      currency: 'NGN',
      callback_url: `${PUBLIC_BASE_URL}/api/rent-reminders/callback?ref=${reference}`,
      metadata,
    }),
  });
  const data = await res.json();
  if (!data.status) return null;
  return { url: data.data?.authorization_url, reference: data.data?.reference };
}

async function sendSMS(phone, message) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) return false;
  const to = phone.startsWith('+') ? phone : `+234${phone.replace(/^0/, '')}`;
  const params = new URLSearchParams({
    To: to,
    From: TWILIO_PHONE_NUMBER,
    Body: message,
  });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );
  return res.ok;
}

async function initiateTwilioCall(to, url) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) return null;
  const toFormatted = to.startsWith('+') ? to : `+234${to.replace(/^0/, '')}`;
  const params = new URLSearchParams({
    To: toFormatted,
    From: TWILIO_PHONE_NUMBER,
    Url: url,
    Method: 'POST',
  });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );
  const data = await res.json();
  return data.sid || null;
}

// --- Queue tenants with rent due ---
router.get('/api/rent-reminders/queue', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Service not configured.' });
  }
  const daysAhead = parseInt(req.query.days || REMINDER_DAYS_AHEAD, 10);
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);

  try {
    const { data: rawRows, error } = await supabaseAdmin
      .from('rent_payments')
      .select(
        `
        id,
        amount,
        due_date,
        status,
        payment_date,
        reference,
        property_tenants!inner (
          tenant_id,
          tenants ( first_name, last_name, email, phone )
        )
      `
      )
      .in('status', ['pending', 'active'])
      .gte('due_date', startDate.toISOString().slice(0, 10))
      .lte('due_date', endDate.toISOString().slice(0, 10));

    if (error) {
      console.error('[rent-reminder] Queue fetch error', error);
      return res.status(500).json({ error: 'Failed to fetch queue.' });
    }

    const payments = (rawRows || [])
      .map((row) => {
        const legacy = mapRentRowToLegacyPayment(row);
        return {
          id: row.id,
          amount: row.amount,
          due_date: row.due_date,
          tenant_id: row.property_tenants?.tenant_id,
          lease_id: null,
          tenants: row.property_tenants?.tenants,
          status: legacy.status,
        };
      })
      .filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE');

    const alreadyReminded = await supabaseAdmin
      .from('rent_reminder_calls')
      .select('tenant_id, due_date')
      .in('status', ['pending', 'calling', 'payment_sent', 'completed']);

    const remindedSet = new Set(
      (alreadyReminded.data || []).map((r) => `${r.tenant_id}:${r.due_date}`)
    );

    const queue = payments
      .filter((p) => p.tenants?.phone && !remindedSet.has(`${p.tenant_id}:${p.due_date}`))
      .map((p) => ({
        payment_id: p.id,
        tenant_id: p.tenant_id,
        lease_id: p.lease_id,
        first_name: p.tenants?.first_name || 'Tenant',
        email: p.tenants?.email,
        phone: p.tenants?.phone,
        amount: Number(p.amount),
        due_date: p.due_date,
        days_until_due: Math.ceil(
          (new Date(p.due_date) - new Date()) / (1000 * 60 * 60 * 24)
        ),
      }));

    return res.json({ queue, count: queue.length });
  } catch (err) {
    console.error('[rent-reminder] Unexpected error', err);
    return res.status(500).json({ error: 'Unexpected error.' });
  }
});

// --- Trigger reminder processing (create records + initiate calls) ---
router.post('/api/rent-reminders/trigger', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Service not configured.' });
  }

  const daysAhead = parseInt(req.body?.days || REMINDER_DAYS_AHEAD, 10);

  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const { data: rawTrigger, error } = await supabaseAdmin
      .from('rent_payments')
      .select(
        `
        id,
        amount,
        due_date,
        status,
        property_tenants!inner (
          tenant_id,
          tenants ( user_id, first_name, email, phone )
        )
      `
      )
      .in('status', ['pending', 'active'])
      .gte('due_date', startDate.toISOString().slice(0, 10))
      .lte('due_date', endDate.toISOString().slice(0, 10));

    if (error) {
      console.error('[rent-reminder] Queue fetch error', error);
      return res.status(500).json({ error: 'Failed to fetch queue.' });
    }

    const payments = (rawTrigger || [])
      .map((row) => {
        const legacy = mapRentRowToLegacyPayment(row);
        return {
          id: row.id,
          amount: row.amount,
          due_date: row.due_date,
          tenant_id: row.property_tenants?.tenant_id,
          lease_id: null,
          tenants: row.property_tenants?.tenants,
          status: legacy.status,
        };
      })
      .filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE');

    const { data: alreadyReminded } = await supabaseAdmin
      .from('rent_reminder_calls')
      .select('tenant_id, due_date')
      .in('status', ['pending', 'calling', 'payment_sent', 'completed']);

    const remindedSet = new Set(
      (alreadyReminded || []).map((r) => `${r.tenant_id}:${r.due_date}`)
    );

    const queue = payments
      .filter((p) => p.tenants?.phone && !remindedSet.has(`${p.tenant_id}:${p.due_date}`))
      .map((p) => ({
        payment_id: p.id,
        tenant_id: p.tenant_id,
        lease_id: p.lease_id,
        first_name: p.tenants?.first_name || 'Tenant',
        email: p.tenants?.email,
        phone: p.tenants?.phone,
        user_id: p.tenants?.user_id,
        amount: Number(p.amount),
        due_date: p.due_date,
        days_until_due: Math.ceil(
          (new Date(p.due_date) - new Date()) / 86400000
        ),
      }));

    const initiated = [];
    for (const item of queue) {
      const reminder = await processReminder(item);
      if (reminder) initiated.push(reminder);
    }

    return res.json({ triggered: initiated.length, reminders: initiated });
  } catch (err) {
    console.error('[rent-reminder] Trigger error', err);
    return res.status(500).json({ error: 'Unexpected error.' });
  }
});

async function processReminder(item) {
  const ref = `RENT-REM-${uuidv4().slice(0, 8).toUpperCase()}`;
  const amountKobo = Math.round(Number(item.amount) * 100);

  const paystack = await createPaystackLink(
    item.email || `tenant-${item.tenant_id}@damianixpro.local`,
    amountKobo,
    ref,
    {
      tenant_id: item.tenant_id,
      payment_type: 'rent',
      due_date: item.due_date,
    }
  );

  // Multi-channel rent due reminder (Email, SMS, WhatsApp)
  const tenant = {
    user_id: item.user_id,
    first_name: item.first_name,
    phone: item.phone,
    email: item.email,
  };
  await notifyPayment({
    event: 'rent_due_reminder',
    tenant,
    amount: item.amount,
    dueDate: item.due_date,
    daysUntilDue: item.days_until_due ?? 0,
    paymentLink: paystack?.url,
    channels: ['email', 'sms', 'whatsapp'],
  });

  const { data: reminder, error } = await supabaseAdmin
    .from('rent_reminder_calls')
    .insert({
      tenant_id: item.tenant_id,
      lease_id: item.lease_id,
      payment_id: item.payment_id,
      phone: item.phone,
      amount: item.amount,
      due_date: item.due_date,
      days_until_due: item.days_until_due,
      paystack_reference: paystack?.reference || ref,
      paystack_authorization_url: paystack?.url,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !reminder) return null;

  const callUrl = `${PUBLIC_BASE_URL}/api/rent-reminders/call/${reminder.id}`;
  const callSid = await initiateTwilioCall(item.phone, callUrl);

  if (callSid) {
    await supabaseAdmin
      .from('rent_reminder_calls')
      .update({ call_sid: callSid, status: 'calling' })
      .eq('id', reminder.id);
  }

  return { id: reminder.id, call_sid: callSid };
}

// --- TTS audio for Twilio (Twilio fetches this URL) ---
router.get('/api/rent-reminders/tts/:id', async (req, res) => {
  if (!supabaseAdmin) return res.status(500).end();

  const { data: reminder } = await supabaseAdmin
    .from('rent_reminder_calls')
    .select('id, tenant_id, amount, days_until_due')
    .eq('id', req.params.id)
    .single();

  if (!reminder) return res.status(404).end();

  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('first_name')
    .eq('id', reminder.tenant_id)
    .single();

  const firstName = tenant?.first_name || 'Tenant';
  const message = buildReminderMessage(
    firstName,
    reminder.amount,
    reminder.days_until_due
  );

  const audio = await generateTTSBuffer(message);
  if (!audio) return res.status(502).end();

  res.setHeader('Content-Type', 'audio/mpeg');
  res.send(Buffer.from(audio));
});

// --- Twilio webhook: play reminder + gather ---
router.post('/api/rent-reminders/call/:id', express.urlencoded({ extended: true }), async (req, res) => {
  const id = req.params.id;
  const ttsUrl = `${PUBLIC_BASE_URL}/api/rent-reminders/tts/${id}`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${ttsUrl}</Play>
  <Gather numDigits="1" action="${PUBLIC_BASE_URL}/api/rent-reminders/call/${id}/action" method="POST" timeout="5">
    <Say voice="alice">Press 1 to pay now, or hang up.</Say>
  </Gather>
  <Say voice="alice">We will send you a payment link by SMS. Goodbye.</Say>
</Response>`;

  res.type('text/xml').send(twiml);
});

// --- Twilio webhook: user pressed 1 -> send SMS with payment link ---
router.post('/api/rent-reminders/call/:id/action', express.urlencoded({ extended: true }), async (req, res) => {
  const id = req.params.id;
  const digits = req.body?.Digits || '';

  if (!supabaseAdmin) {
    return res.type('text/xml').send('<?xml version="1.0"?><Response><Say>Service error.</Say></Response>');
  }

  const { data: reminder } = await supabaseAdmin
    .from('rent_reminder_calls')
    .select('id, phone, paystack_authorization_url, amount')
    .eq('id', id)
    .single();

  if (reminder && (digits === '1' || digits === '2') && reminder.paystack_authorization_url) {
    const msg = `DamianixPro: Pay your rent of ₦${Number(reminder.amount).toLocaleString()} now: ${reminder.paystack_authorization_url}`;
    await sendSMS(reminder.phone, msg);
    await supabaseAdmin
      .from('rent_reminder_calls')
      .update({ status: 'payment_sent', sms_sent_at: new Date().toISOString() })
      .eq('id', id);
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you. We have sent the payment link to your phone. Goodbye.</Say>
</Response>`;

  res.type('text/xml').send(twiml);
});

// --- Paystack callback (optional: update payment status) ---
router.get('/api/rent-reminders/callback', async (req, res) => {
  const ref = req.query.ref;
  if (!ref) return res.redirect('/');
  res.redirect(
    `${PUBLIC_BASE_URL.replace(/\/api.*/, '')}/tenant?payment_ref=${ref}`
  );
});

export function createRentReminderRouter() {
  return router;
}
