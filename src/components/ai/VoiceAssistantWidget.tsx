'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type RecordingState = 'idle' | 'recording' | 'processing';

const VOICE_SERVER = import.meta.env.VITE_VOICE_SERVER_URL || 'http://localhost:4000';

interface VoiceAssistantWidgetProps {
  sttUrl?: string;
  aiUrl?: string;
  ttsUrl?: string;
}

export function VoiceAssistantWidget({
  sttUrl = `${VOICE_SERVER}/api/voice/transcribe/mic`,
  aiUrl = `${VOICE_SERVER}/api/ai/assistant`,
  ttsUrl = 'http://localhost:4010/api/voice/tts',
}: VoiceAssistantWidgetProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiContext, setAiContext] = useState<Record<string, unknown>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      setAiResponse('');
      setAudioUrl(null);
      setStatusMessage('Listening…');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setRecordingState('recording');
      };

      mediaRecorder.onstop = async () => {
        setRecordingState('processing');
        setStatusMessage('Processing your question…');

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          const text = await sendToSTT(blob);
          setTranscript(text);
          setStatusMessage('');

          const reply = await sendToAI(text);
          setAiResponse(reply);

          const voiceUrl = await sendToTTS(reply);
          setAudioUrl(voiceUrl);
        } catch (err: unknown) {
          console.error(err);
          setError('Something went wrong while processing your request.');
        } finally {
          setRecordingState('idle');
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          setStatusMessage('');
        }
      };

      mediaRecorder.start();
    } catch (err: unknown) {
      console.error(err);
      setError('Could not access microphone. Please check browser permissions.');
      setStatusMessage('');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const sendToSTT = async (blob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');

    const res = await fetch(sttUrl, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Speech-to-text request failed');
    }

    const data = await res.json();
    return data.transcript ?? '';
  };

  const sendToTTS = async (text: string): Promise<string> => {
    const res = await fetch(ttsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      throw new Error('Text-to-speech request failed');
    }

    const arrayBuffer = await res.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  };

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';

  const sendToAI = async (text: string): Promise<string> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch(aiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ message: text, context: aiContext }),
    });

    if (!res.ok) {
      throw new Error('AI assistant request failed');
    }

    const data = await res.json();
    if (data.context && typeof data.context === 'object') {
      setAiContext(data.context);
    } else {
      setAiContext({});
    }
    if (data.payment_link) {
      return `${data.reply ?? data.message ?? data.text ?? ''}\n\nPayment link: ${data.payment_link}`;
    }
    return data.reply ?? data.message ?? data.text ?? '';
  };

  return (
    <div className="rounded-2xl border border-border bg-card/95 p-4 text-card-foreground shadow-sm backdrop-blur dark:bg-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">🎤 Ask DamianixPro</h2>
          <p className="text-xs text-muted-foreground">
            Say &quot;Pay my rent&quot; to get a payment link, or ask about your balance.
          </p>
        </div>
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={[
            'inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-colors',
            isRecording
              ? 'border-red-500 bg-red-500 text-primary-foreground hover:bg-red-600'
              : 'border-emerald-500 bg-emerald-500 text-primary-foreground hover:bg-emerald-600',
            isProcessing && 'cursor-not-allowed opacity-60',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {isRecording ? (
            <span className="block h-3 w-3 rounded-sm bg-primary-foreground" />
          ) : (
            <span className="relative flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-emerald-200 opacity-60" />
              <span className="relative inline-flex h-3 w-3 items-center justify-center rounded-full bg-primary-foreground text-[10px] text-emerald-700 ring-1 ring-emerald-600 dark:text-emerald-200">
                🎤
              </span>
            </span>
          )}
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {statusMessage && (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200">
            {statusMessage}
          </div>
        )}

        {transcript && (
          <div className="rounded-xl border border-border bg-muted/50 px-3 py-2">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              You said
            </div>
            <p className="text-foreground">{transcript}</p>
          </div>
        )}

        {aiResponse && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 dark:border-emerald-800/60 dark:bg-emerald-950/40">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              DamianixPro
            </div>
            <p className="text-foreground">{aiResponse}</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {audioUrl && (
          <div className="mt-1 flex items-center justify-between rounded-xl border border-border bg-muted/50 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">Voice playback</span>
            <audio controls src={audioUrl} className="h-8">
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Status:{' '}
          <span className="font-medium">
            {isRecording ? 'Recording' : isProcessing ? 'Processing' : 'Idle'}
          </span>
        </span>
        <span>Powered by DamianixPro Voice AI</span>
      </div>
    </div>
  );
}
