import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceAssistantWidget } from '../VoiceAssistantWidget';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

const TEST_STT = 'http://voice.test/stt';
const TEST_AI = 'http://voice.test/ai';
const TEST_TTS = 'http://voice.test/tts';

type RecorderState = 'inactive' | 'recording';

class MockMediaRecorder {
  static isTypeSupported = vi.fn(() => true);

  private _state: RecorderState = 'inactive';
  ondataavailable: ((ev: BlobEvent) => void) | null = null;
  onstart: (() => void) | null = null;
  onstop: (() => void) | null = null;

  constructor(_stream: MediaStream) {}

  get state(): RecorderState {
    return this._state;
  }

  start = vi.fn(() => {
    this._state = 'recording';
    queueMicrotask(() => this.onstart?.());
  });

  stop = vi.fn(() => {
    if (this._state !== 'recording') return;
    this._state = 'inactive';
    const chunk = new Blob([new Uint8Array(64)], { type: 'audio/webm' });
    this.ondataavailable?.({ data: chunk } as BlobEvent);
    queueMicrotask(() => this.onstop?.());
  });
}

describe('VoiceAssistantWidget (AI voice pipeline)', () => {
  const createObjectURLMock = vi.fn(() => 'blob:mock-playback');
  const revokeObjectURLMock = vi.fn();

  beforeEach(() => {
    globalThis.URL.createObjectURL = createObjectURLMock as typeof URL.createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURLMock as typeof URL.revokeObjectURL;

    vi.stubGlobal('MediaRecorder', MockMediaRecorder);

    const stopTrack = vi.fn();
    const fakeStream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(fakeStream),
      },
    });

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url === TEST_STT) {
        return new Response(JSON.stringify({ transcript: 'pay my rent please' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url === TEST_AI) {
        return new Response(JSON.stringify({ reply: 'Your balance is zero.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url === TEST_TTS) {
        return new Response(new Uint8Array([0xff, 0xf3, 0x80, 0x00]).buffer, { status: 200 });
      }
      return new Response('not found', { status: 404 });
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('records, then runs STT → AI → TTS and shows transcript, reply, and audio', async () => {
    const user = userEvent.setup();
    render(<VoiceAssistantWidget sttUrl={TEST_STT} aiUrl={TEST_AI} ttsUrl={TEST_TTS} />);

    const micButton = screen.getByRole('button');
    await user.click(micButton);

    await waitFor(() => {
      expect(screen.getByText(/Listening/i)).toBeInTheDocument();
    });

    await user.click(micButton);

    await waitFor(() => {
      expect(screen.getByText('pay my rent please')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Your balance is zero.')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Voice playback/i)).toBeInTheDocument();
    });

    expect(globalThis.fetch).toHaveBeenCalled();
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => c[0] as string
    );
    expect(calls.some((u) => String(u).includes('/stt'))).toBe(true);
    expect(calls.some((u) => String(u).includes('/ai'))).toBe(true);
    expect(calls.some((u) => String(u).includes('/tts'))).toBe(true);

    expect(createObjectURLMock).toHaveBeenCalled();
  });

  it('appends payment link text when AI returns payment_link', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url === TEST_STT) {
          return new Response(JSON.stringify({ transcript: 'pay rent' }), { status: 200 });
        }
        if (url === TEST_AI) {
          return new Response(
            JSON.stringify({
              reply: 'Open this link to pay.',
              payment_link: 'https://pay.example/r/1',
            }),
            { status: 200 }
          );
        }
        if (url === TEST_TTS) {
          return new Response(new ArrayBuffer(8), { status: 200 });
        }
        return new Response('', { status: 404 });
      }
    );

    const user = userEvent.setup();
    render(<VoiceAssistantWidget sttUrl={TEST_STT} aiUrl={TEST_AI} ttsUrl={TEST_TTS} />);

    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText(/Listening/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/Payment link:/i)).toBeInTheDocument();
      expect(screen.getByText(/https:\/\/pay\.example\/r\/1/)).toBeInTheDocument();
    });
  });

  it('shows microphone error when getUserMedia rejects', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('denied')),
      },
    });

    const user = userEvent.setup();
    render(<VoiceAssistantWidget sttUrl={TEST_STT} aiUrl={TEST_AI} ttsUrl={TEST_TTS} />);

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/Could not access microphone/i)).toBeInTheDocument();
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('shows processing error when STT fetch fails', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response('', { status: 500 })
    );

    const user = userEvent.setup();
    render(<VoiceAssistantWidget sttUrl={TEST_STT} aiUrl={TEST_AI} ttsUrl={TEST_TTS} />);

    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText(/Listening/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong while processing/i)).toBeInTheDocument();
    });
  });
});
