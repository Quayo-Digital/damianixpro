## DamianixPro Voice Transcription Service

This service converts tenant/landlord voice input (browser mic or phone call recordings) into clean text using the OpenAI Whisper API and stores transcripts in Supabase.

### Tech stack

- **Node.js + Express** (`server/index.mjs`, `server/voiceTranscriptionService.mjs`)
- **OpenAI Whisper** (`whisper-1` model)
- **Supabase** (table `voice_transcripts`)
- Compatible with browser **WebRTC** recordings and telephony call recordings

### Environment variables

Set these in `.env` (or your deployment environment):

- `OPENAI_API_KEY` – OpenAI API key with access to `whisper-1`
- `SUPABASE_URL` – your Supabase project URL (e.g. `https://nocrbgzxcrirfpbuqhop.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role key (server-side only)
- `VOICE_SERVER_PORT` – optional, defaults to `4000`

### Database table

Create a `voice_transcripts` table in Supabase:

- `id` (uuid, primary key, default `gen_random_uuid()`)
- `created_at` (timestamp with time zone, default `now()`)
- `source` (text) – e.g. `'mic'` or `'call'`
- `user_id` (uuid, nullable) – links to `auth.users.id` if available
- `transcript` (text)
- `language` (text, e.g. `'en'`)

Example SQL:

```sql
create table if not exists public.voice_transcripts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null,
  user_id uuid null,
  transcript text not null,
  language text not null default 'en'
);
```

### Running the service locally

From the project root:

```bash
npm install
npm run voice:dev
```

The voice service will listen on `http://localhost:4000` (or `VOICE_SERVER_PORT`).

Health check:

```bash
GET /healthz
→ { "status": "ok", "service": "voice-transcription" }
```

### API endpoints

#### 1. Browser microphone: `POST /api/voice/transcribe/mic`

- **Content type**: `multipart/form-data`
- **Field**: `audio` – audio file from browser (e.g. WebM/OGG from MediaRecorder)
- Optional: `userId` in body if you want to associate with a logged-in user

Response:

```json
{
  "transcript": "When is my rent due?"
}
```

Behavior:

- Calls OpenAI Whisper (`whisper-1`) with a Nigeria-focused prompt to better handle Nigerian English and common place names (Abuja, Wuse, Lekki, etc.).
- Cleans whitespace and saves the transcript to `voice_transcripts` with `source = "mic"`.

#### 2. Phone/WebRTC call recordings: `POST /api/voice/transcribe/call`

- **Content type**: `multipart/form-data`
- **Field**: `audio` – call recording file (e.g. WAV/MP3/OGG) from your telephony/WebRTC backend
- Optional: `userId` in body

Response:

```json
{
  "transcript": "The bathroom tap is leaking and needs urgent repair."
}
```

Behavior:

- Same Whisper pipeline as mic, with a slightly different prompt for call/complaint language.
- Saves transcript to `voice_transcripts` with `source = "call"`.

### Frontend usage outline

#### Browser mic (WebRTC / MediaRecorder)

1. Record user audio to a `Blob` on the frontend.
2. Send it to the voice service:

```ts
async function sendMicRecording(blob: Blob, userId?: string) {
  const formData = new FormData();
  formData.append('audio', blob, 'recording.webm');
  if (userId) formData.append('userId', userId);

  const res = await fetch('http://localhost:4000/api/voice/transcribe/mic', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  // data: { transcript: string }
  return data.transcript as string;
}
```

#### Telephony / call recordings

Your telephony/WebRTC backend (e.g. Twilio, Vonage, or a SIP/WebRTC SFU) should:

1. Obtain a recording file (or generate one from RTP/Opus streams).
2. POST it to:

```http
POST http://localhost:4000/api/voice/transcribe/call
Content-Type: multipart/form-data
Field: audio=<recording file>
Field: userId=<optional user id>
```

And then use the returned transcript to:

- Route the intent (rent balance, maintenance, etc.).
- Attach it to support tickets, maintenance requests, or tenant records.
