import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAI } from 'openai';
import { supabaseAdmin } from './supabaseClient.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VOICE_SERVER_URL = process.env.VOICE_SERVER_URL || 'http://localhost:4000';
const TTS_URL = process.env.TTS_URL || 'http://localhost:4010';

const NIGERIAN_PROMPT =
  'Nigerian real estate context. Terms like Abuja, Wuse, Maitama, Lekki, rent, service charge, Flutterwave, tenant, landlord, agent, property search, maintenance.';

function cleanTranscript(raw) {
  if (!raw) return '';
  return String(raw).replace(/\s+/g, ' ').trim();
}

async function transcribeAudio(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const response = await openai.audio.transcriptions.create({
    file: fileStream,
    model: 'whisper-1',
    language: 'en',
    prompt: NIGERIAN_PROMPT,
  });
  return cleanTranscript(response.text || response.transcript || '');
}

async function getAssistantReply(transcript, intent, context = {}) {
  const systemPrompt = [
    'You are DamianixPro Voice AI for Nigerian property management on WhatsApp.',
    'You help with: property search, maintenance reporting, rent balance checks.',
    'Be concise (1-3 sentences). Use Nigerian context (NGN, Lagos, Abuja).',
    '',
    'Context:',
    `- Intent: ${intent}`,
    context.propertyResults ? `- Properties found: ${JSON.stringify(context.propertyResults)}` : '',
    context.rentBalance ? `- Rent balance: ${JSON.stringify(context.rentBalance)}` : '',
    context.maintenanceCreated ? `- Maintenance: ${context.maintenanceCreated}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: transcript },
    ],
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content?.trim() || 'Sorry, I could not process that.';
}

async function classifyIntent(transcript) {
  if (!transcript?.trim()) return { intent: 'unknown', confidence: 0 };
  const lower = transcript.toLowerCase();
  if (/\b(search|find|looking|property|apartment|house|rent)\b/.test(lower))
    return { intent: 'search_property', confidence: 0.9 };
  if (/\b(maintenance|repair|fix|broken|leak|issue)\b/.test(lower))
    return { intent: 'report_maintenance', confidence: 0.9 };
  if (/\b(rent balance|balance|how much|owe|outstanding)\b/.test(lower))
    return { intent: 'check_rent_balance', confidence: 0.9 };
  return { intent: 'unknown', confidence: 0.5 };
}

async function fetchPropertySearch(location, maxPrice) {
  if (!VOICE_SERVER_URL) return [];
  const params = new URLSearchParams();
  if (location) params.set('location', location);
  if (maxPrice) params.set('max_price', maxPrice);
  const res = await fetch(`${VOICE_SERVER_URL}/api/properties/search?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data?.slice(0, 3) || [];
}

async function createMaintenanceRequest(tenantId, propertyId, issue) {
  if (!VOICE_SERVER_URL || !tenantId || !propertyId || !issue) return null;
  const res = await fetch(`${VOICE_SERVER_URL}/api/maintenance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenant_id: tenantId,
      property_id: propertyId,
      issue: String(issue).trim(),
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.ticket_number || data.message;
}

async function getRentBalance(tenantId, authToken) {
  if (!VOICE_SERVER_URL) return null;
  const res = await fetch(`${VOICE_SERVER_URL}/api/tenant/rent-balance`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function generateTTS(text) {
  const res = await fetch(`${TTS_URL}/api/voice/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) return null;
  return res.arrayBuffer();
}

async function downloadWhatsAppMedia(mediaId) {
  if (!WHATSAPP_TOKEN) return null;
  const metaRes = await fetch(
    `https://graph.facebook.com/v21.0/${mediaId}?access_token=${WHATSAPP_TOKEN}`
  );
  if (!metaRes.ok) return null;
  const meta = await metaRes.json();
  const url = meta.url;
  if (!url) return null;
  const fileRes = await fetch(url, {
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
  });
  if (!fileRes.ok) return null;
  return fileRes.arrayBuffer();
}

async function sendWhatsAppAudio(to, audioBuffer) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return false;
  const uploadForm = new FormData();
  uploadForm.append('file', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'reply.mp3');
  uploadForm.append('type', 'audio/mpeg');
  uploadForm.append('messaging_product', 'whatsapp');
  const uploadRes = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    body: uploadForm,
  });
  if (!uploadRes.ok) {
    console.error('[whatsapp-voice] Media upload failed', await uploadRes.text());
    return false;
  }
  const { id: mediaId } = await uploadRes.json();
  if (!mediaId) return false;
  const res = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: String(to).replace(/\D/g, ''),
      type: 'audio',
      audio: { id: mediaId },
    }),
  });
  return res.ok;
}

async function sendWhatsAppText(to, text) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return false;
  const res = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/\D/g, ''),
      type: 'text',
      text: { body: text },
    }),
  });
  return res.ok;
}

function extractMessagesFromWebhook(body) {
  const messages = [];
  const entries = body?.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      const value = change.value;
      const msgs = value?.messages || [];
      for (const msg of msgs) {
        messages.push({
          senderId: msg.from,
          messageId: msg.id,
          timestamp: msg.timestamp,
          type: msg.type,
          audio: msg.audio,
          text: msg.text?.body,
        });
      }
    }
  }
  return messages;
}

// Webhook verification (GET)
router.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'damianixpro-voice';
  if (mode === 'subscribe' && token === verifyToken) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Forbidden');
});

// Webhook handler (POST)
router.post('/api/whatsapp/webhook', express.json(), async (req, res) => {
  res.status(200).send('OK');

  const messages = extractMessagesFromWebhook(req.body);
  for (const msg of messages) {
    if (msg.type === 'audio' && msg.audio?.id) {
      processVoiceNote(msg).catch((err) =>
        console.error('[whatsapp-voice] Error processing voice note', err)
      );
    } else if (msg.type === 'text' && msg.text) {
      processTextMessage(msg).catch((err) =>
        console.error('[whatsapp-voice] Error processing text', err)
      );
    }
  }
});

async function processVoiceNote(msg) {
  const senderId = msg.senderId;
  let tempPath = null;

  try {
    const audioBuf = await downloadWhatsAppMedia(msg.audio.id);
    if (!audioBuf) {
      await sendWhatsAppText(senderId, 'Sorry, I could not download your voice note.');
      return;
    }

    tempPath = path.join(__dirname, 'uploads', `wa-${msg.messageId}.ogg`);
    fs.mkdirSync(path.dirname(tempPath), { recursive: true });
    fs.writeFileSync(tempPath, Buffer.from(audioBuf));

    const transcript = await transcribeAudio(tempPath);
    if (!transcript) {
      await sendWhatsAppText(senderId, 'I could not understand your voice message. Please try again.');
      return;
    }

    await handleAndReply(senderId, transcript);
  } finally {
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

async function processTextMessage(msg) {
  await handleAndReply(msg.senderId, msg.text);
}

async function handleAndReply(senderId, transcript) {
  const { intent } = await classifyIntent(transcript);
  let context = {};

  if (intent === 'search_property') {
    const location = transcript.match(/\b(Abuja|Lagos|Lekki|Ikeja|Wuse|Maitama|Port Harcourt)\b/i)?.[1] || '';
    const priceMatch = transcript.match(/(\d[\d,]*)\s*(?:k|thousand|million|m)/i);
    const maxPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) * (/\bm/i.test(transcript) ? 1_000_000 : 1000) : null;
    context.propertyResults = await fetchPropertySearch(location, maxPrice);
  } else if (intent === 'report_maintenance') {
    const tenant = await findTenantByPhone(senderId);
    if (tenant?.id && tenant?.property_id) {
      const created = await createMaintenanceRequest(tenant.id, tenant.property_id, transcript);
      if (created) context.maintenanceCreated = `Ticket ${created} created.`;
    }
  } else if (intent === 'check_rent_balance') {
    const tenant = await findTenantByPhone(senderId);
    if (tenant?.authToken) {
      context.rentBalance = await getRentBalance(tenant.id, tenant.authToken);
    }
  }

  const replyText = await getAssistantReply(transcript, intent, context);

  const audioBuf = await generateTTS(replyText);
  if (audioBuf && (await sendWhatsAppAudio(senderId, audioBuf))) {
    return;
  }
  await sendWhatsAppText(senderId, replyText);
}

async function findTenantByPhone(waId) {
  if (!supabaseAdmin) return null;
  const phone = waId.startsWith('234') ? `+${waId}` : `+234${waId.replace(/^0/, '')}`;
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('id, phone')
    .or(`phone.eq.${phone},phone.ilike.%${phone.slice(-10)}%`)
    .eq('status', 'ACTIVE')
    .limit(1)
    .maybeSingle();
  if (!tenant) return null;
  const { data: lease } = await supabaseAdmin
    .from('leases')
    .select('property_id')
    .eq('tenant_id', tenant.id)
    .eq('status', 'ACTIVE')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  return {
    id: tenant.id,
    property_id: lease?.property_id,
    authToken: null,
  };
}

export function createWhatsAppVoiceRouter() {
  return router;
}
