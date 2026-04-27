import 'dotenv/config';
import express from 'express';
import { applyVoiceServerSecurity } from './httpSecurity.mjs';
import { createTTSRouter } from './textToSpeechService.mjs';

const app = express();
const port = process.env.TTS_SERVER_PORT || 4010;

applyVoiceServerSecurity(app, { jsonLimit: '512kb' });

app.use(createTTSRouter());

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', service: 'tts' });
});

app.listen(port, () => {
  console.log(`DamianixPro TTS service listening on http://localhost:${port}`);
});

