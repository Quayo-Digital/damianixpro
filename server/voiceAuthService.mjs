import express from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from './supabaseClient.mjs';
import { requireSupabaseJwt } from './middleware/supabaseJwt.mjs';
import { sendSmsAbstract } from './notifications/channelDeliver.mjs';

const router = express.Router();

const VERIFICATION_TTL_MINUTES = 15;
const OTP_TTL_MINUTES = 5;
const OTP_LENGTH = 6;
const PIN_SALT = process.env.VOICE_PIN_SALT || 'damianixpro-voice-pin-v1';

function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length === 13) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith('7')) return `+234${digits}`;
  return phone.startsWith('+') ? phone : `+${digits}`;
}

function hashPin(pin) {
  return crypto.pbkdf2Sync(pin, PIN_SALT, 100000, 64, 'sha256').toString('hex');
}

function verifyPin(inputPin, storedHash) {
  return crypto.timingSafeEqual(
    Buffer.from(hashPin(inputPin), 'hex'),
    Buffer.from(storedHash, 'hex')
  );
}

function createVerificationSession(_tenantId, _userId, _phone, _method) {
  const sessionId = `va-${uuidv4()}`;
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MINUTES * 60 * 1000);
  return { sessionId, expiresAt };
}

// --- 1) Phone number recognition: match caller phone to tenant ---
router.post('/api/voice-auth/recognize-phone', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Voice auth service not configured.' });
  }

  const { phone } = req.body ?? {};
  const normalized = normalizePhone(phone);

  if (!normalized) {
    return res.status(400).json({ error: 'Valid phone number required.' });
  }

  try {
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('id, first_name, last_name, user_id')
      .or(`phone.eq.${normalized},phone.eq.${phone},phone.ilike.%${normalized.slice(-10)}%`)
      .eq('status', 'ACTIVE')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[voice-auth] Phone lookup failed', error);
      return res.status(500).json({ error: 'Failed to look up tenant.' });
    }

    if (!tenant) {
      return res.json({ recognized: false, message: 'Phone number not linked to a tenant.' });
    }

    const { sessionId, expiresAt } = createVerificationSession(
      tenant.id,
      tenant.user_id,
      normalized,
      'phone'
    );

    const { error: insertErr } = await supabaseAdmin.from('voice_agent_verifications').insert({
      session_id: sessionId,
      tenant_id: tenant.id,
      user_id: tenant.user_id,
      phone: normalized,
      method: 'phone',
      expires_at: expiresAt.toISOString(),
    });

    if (insertErr) {
      console.error('[voice-auth] Failed to create verification', insertErr);
      return res.status(500).json({ error: 'Failed to create verification session.' });
    }

    return res.json({
      recognized: true,
      tenant_id: tenant.id,
      tenant_name: `${tenant.first_name} ${tenant.last_name}`,
      verification_token: sessionId,
      expires_at: expiresAt.toISOString(),
      method: 'phone',
      requires_strong_verification: true,
    });
  } catch (err) {
    console.error('[voice-auth] Unexpected error', err);
    return res.status(500).json({ error: 'Unexpected error.' });
  }
});

// --- 2) OTP: request code ---
router.post('/api/voice-auth/request-otp', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Voice auth service not configured.' });
  }

  const { phone, tenant_id } = req.body ?? {};
  const normalized = normalizePhone(phone);

  if (!normalized) {
    return res.status(400).json({ error: 'Valid phone number required.' });
  }

  try {
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .or(`phone.eq.${normalized},phone.ilike.%${normalized.slice(-10)}%`)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    const tid = tenant_id || tenant?.id;
    if (!tid) {
      return res.status(400).json({ error: 'Tenant not found for this phone.' });
    }

    const code = String(Math.floor(Math.random() * Math.pow(10, OTP_LENGTH)))
      .padStart(OTP_LENGTH, '0');
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const { error } = await supabaseAdmin.from('voice_agent_otp').insert({
      phone: normalized,
      code,
      tenant_id: tid,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      console.error('[voice-auth] OTP insert failed', error);
      return res.status(500).json({ error: 'Failed to create OTP.' });
    }

    let smsDelivered = false;
    if (process.env.VOICE_OTP_SMS_ENABLED === 'true') {
      try {
        smsDelivered = await sendSmsAbstract(
          normalized,
          `Your DamianixPro verification code is: ${code}. Expires in ${OTP_TTL_MINUTES} minutes.`,
          process.env.SMS_PROVIDER === 'noop' ? 'noop' : 'twilio'
        );
      } catch (smsErr) {
        console.error('[voice-auth] OTP SMS delivery failed', smsErr);
      }
    }

    /**
     * Only expose the OTP in the response in non-production environments AND
     * when SMS isn't actually being delivered. Production never exposes it.
     */
    const exposeDevCode =
      process.env.NODE_ENV !== 'production' &&
      process.env.VOICE_OTP_SMS_ENABLED !== 'true';

    return res.json({
      message: smsDelivered ? 'OTP sent via SMS.' : 'OTP generated.',
      expires_at: expiresAt.toISOString(),
      sms_delivered: smsDelivered,
      ...(exposeDevCode ? { dev_code: code } : {}),
    });
  } catch (err) {
    console.error('[voice-auth] Unexpected error', err);
    return res.status(500).json({ error: 'Unexpected error.' });
  }
});

// --- 3) OTP: verify code and issue verification token ---
router.post('/api/voice-auth/verify-otp', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Voice auth service not configured.' });
  }

  const { phone, code, tenant_id } = req.body ?? {};
  const normalized = normalizePhone(phone);

  if (!normalized || !code) {
    return res.status(400).json({ error: 'Phone and code required.' });
  }

  try {
    const { data: otpRow, error } = await supabaseAdmin
      .from('voice_agent_otp')
      .select('id, tenant_id, expires_at')
      .eq('phone', normalized)
      .eq('code', String(code).trim())
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !otpRow) {
      return res.status(401).json({ error: 'Invalid or expired OTP.' });
    }

    await supabaseAdmin
      .from('voice_agent_otp')
      .update({ used_at: new Date().toISOString() })
      .eq('id', otpRow.id);

    const tid = tenant_id || otpRow.tenant_id;
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, user_id, first_name, last_name')
      .eq('id', tid)
      .maybeSingle();

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    const { sessionId, expiresAt } = createVerificationSession(
      tenant.id,
      tenant.user_id,
      normalized,
      'otp'
    );

    await supabaseAdmin.from('voice_agent_verifications').insert({
      session_id: sessionId,
      tenant_id: tenant.id,
      user_id: tenant.user_id,
      phone: normalized,
      method: 'otp',
      expires_at: expiresAt.toISOString(),
    });

    return res.json({
      verified: true,
      tenant_id: tenant.id,
      verification_token: sessionId,
      expires_at: expiresAt.toISOString(),
      method: 'otp',
    });
  } catch (err) {
    console.error('[voice-auth] Unexpected error', err);
    return res.status(500).json({ error: 'Unexpected error.' });
  }
});

// --- 4) Tenant voice PIN: verify PIN and issue verification token ---
router.post('/api/voice-auth/verify-pin', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Voice auth service not configured.' });
  }

  const { tenant_id, pin } = req.body ?? {};

  if (!tenant_id || !pin) {
    return res.status(400).json({ error: 'tenant_id and pin required.' });
  }

  const pinStr = String(pin).replace(/\D/g, '');
  if (pinStr.length < 4 || pinStr.length > 8) {
    return res.status(400).json({ error: 'PIN must be 4–8 digits.' });
  }

  try {
    const { data: pinRow, error } = await supabaseAdmin
      .from('tenant_voice_pin')
      .select('pin_hash')
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    if (error || !pinRow) {
      return res.status(401).json({ error: 'Voice PIN not set for this tenant.' });
    }

    if (!verifyPin(pinStr, pinRow.pin_hash)) {
      return res.status(401).json({ error: 'Invalid PIN.' });
    }

    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, user_id')
      .eq('id', tenant_id)
      .maybeSingle();

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    const { sessionId, expiresAt } = createVerificationSession(
      tenant.id,
      tenant.user_id,
      null,
      'pin'
    );

    await supabaseAdmin.from('voice_agent_verifications').insert({
      session_id: sessionId,
      tenant_id: tenant.id,
      user_id: tenant.user_id,
      method: 'pin',
      expires_at: expiresAt.toISOString(),
    });

    return res.json({
      verified: true,
      tenant_id: tenant.id,
      verification_token: sessionId,
      expires_at: expiresAt.toISOString(),
      method: 'pin',
    });
  } catch (err) {
    console.error('[voice-auth] Unexpected error', err);
    return res.status(500).json({ error: 'Unexpected error.' });
  }
});

// --- 5) Set/update tenant voice PIN (requires auth) ---
router.post('/api/voice-auth/set-pin', requireSupabaseJwt, async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Voice auth service not configured.' });
  }

  const { tenant_id, pin } = req.body ?? {};

  if (!tenant_id || !pin) {
    return res.status(400).json({ error: 'tenant_id and pin required.' });
  }

  const pinStr = String(pin).replace(/\D/g, '');
  if (pinStr.length < 4 || pinStr.length > 8) {
    return res.status(400).json({ error: 'PIN must be 4–8 digits.' });
  }

  try {
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, user_id')
      .eq('id', tenant_id)
      .maybeSingle();

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    if (req.auth?.sub !== tenant.user_id) {
      return res.status(403).json({ error: 'Not authorized to set PIN for this tenant.' });
    }

    const pinHash = hashPin(pinStr);

    const { error } = await supabaseAdmin.from('tenant_voice_pin').upsert(
      {
        tenant_id,
        pin_hash: pinHash,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

    if (error) {
      console.error('[voice-auth] Set PIN failed', error);
      return res.status(500).json({ error: 'Failed to set PIN.' });
    }

    return res.json({ message: 'Voice PIN set successfully.' });
  } catch (err) {
    console.error('[voice-auth] Unexpected error', err);
    return res.status(500).json({ error: 'Unexpected error.' });
  }
});

// --- 6) Check verification token (for sensitive ops) ---
export async function validateVerificationToken(verificationToken) {
  if (!supabaseAdmin || !verificationToken) return null;

  const { data, error } = await supabaseAdmin
    .from('voice_agent_verifications')
    .select('tenant_id, user_id, method, expires_at')
    .eq('session_id', verificationToken)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

router.get('/api/voice-auth/check', async (req, res) => {
  const token = req.query.verification_token || req.headers['x-verification-token'];

  if (!token) {
    return res.status(400).json({ error: 'verification_token required.' });
  }

  const valid = await validateVerificationToken(token);
  if (!valid) {
    return res.status(401).json({ verified: false, error: 'Invalid or expired verification.' });
  }

  return res.json({
    verified: true,
    tenant_id: valid.tenant_id,
    method: valid.method,
  });
});

export function createVoiceAuthRouter() {
  return router;
}
