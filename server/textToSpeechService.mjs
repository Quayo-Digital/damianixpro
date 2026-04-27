import express from 'express';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

if (!ELEVENLABS_API_KEY) {
  console.warn('[tts] ELEVENLABS_API_KEY not set. TTS requests will fail until configured.');
}

async function streamElevenLabsTTS(text, res) {
  const voiceId = ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // default/fallback voice
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

  const elevenRes = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.9,
        style: 0.7,
        use_speaker_boost: true,
      },
    }),
  });

  if (!elevenRes.ok || !elevenRes.body) {
    console.error(
      '[tts] ElevenLabs error',
      elevenRes.status,
      await elevenRes.text().catch(() => '')
    );
    res.status(502).json({ error: 'TTS provider error' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Transfer-Encoding': 'chunked',
  });

  const reader = elevenRes.body.getReader();

  // Stream chunks for low-latency playback
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(Buffer.from(value));
  }

  res.end();
}

export function createTTSRouter() {
  const router = express.Router();

  router.post('/api/voice/tts', express.json(), async (req, res) => {
    try {
      const { text } = req.body || {};
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Missing text' });
      }
      if (!ELEVENLABS_API_KEY) {
        return res.status(500).json({ error: 'TTS not configured (missing ELEVENLABS_API_KEY)' });
      }

      await streamElevenLabsTTS(text, res);
    } catch (error) {
      console.error('[tts] Error generating TTS', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate audio' });
      } else {
        res.end();
      }
    }
  });

  return router;
}

