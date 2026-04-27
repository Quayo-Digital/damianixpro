import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VoiceAssistantService } from '@/services/voice/voiceAssistantService';

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  maxAlternatives = 3;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((ev: { error: string }) => void) | null = null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
}

describe('VoiceAssistantService', () => {
  beforeEach(() => {
    VoiceAssistantService.resetSingletonForTests();
    localStorage.clear();
    vi.stubGlobal('SpeechRecognition', MockSpeechRecognition);
    vi.stubGlobal('webkitSpeechRecognition', MockSpeechRecognition);
    globalThis.speechSynthesis = {
      cancel: vi.fn(),
      speak: vi.fn(),
      getVoices: vi.fn(() => []),
      pause: vi.fn(),
      resume: vi.fn(),
      pending: false,
      speaking: false,
      paused: false,
    } as unknown as SpeechSynthesis;
  });

  afterEach(() => {
    VoiceAssistantService.resetSingletonForTests();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('getBrowserSupport returns shape without throwing when mediaDevices is absent', () => {
    const original = navigator.mediaDevices;
    const desc = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
    if (desc?.configurable) {
      // @ts-expect-error jsdom allows delete when configurable
      delete navigator.mediaDevices;
    }

    expect(() => VoiceAssistantService.getBrowserSupport()).not.toThrow();
    const s = VoiceAssistantService.getBrowserSupport();
    expect(s.speechRecognition).toBe(true);
    expect(s.speechSynthesis).toBe(true);
    expect(s.mediaDevices).toBe(false);
    expect(s.getUserMedia).toBe(false);

    if (desc?.configurable && original !== undefined) {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: original,
        configurable: true,
        writable: true,
      });
    }
  });

  it('isSupported is true when SpeechRecognition exists', () => {
    expect(VoiceAssistantService.isSupported()).toBe(true);
  });

  it('isSupported is false when no SpeechRecognition', () => {
    vi.unstubAllGlobals();
    expect(VoiceAssistantService.isSupported()).toBe(false);
  });

  it('getNigerianFeatures returns expected keys', () => {
    const svc = VoiceAssistantService.getInstance();
    const n = svc.getNigerianFeatures();
    expect(n.currency_recognition).toBe(true);
    expect(n.time_zone).toBe('WAT');
    expect(n.local_languages).toContain('english');
    expect(n.local_languages.length).toBeGreaterThan(0);
  });

  it('processVoiceCommand matches view_properties intent', async () => {
    const svc = VoiceAssistantService.getInstance();
    svc.updateSettings({ enabled: false, auto_execute_commands: false });

    const res = await svc.processVoiceCommand('show my properties', 0.95);
    expect(res.text).toContain('properties');
    expect(res.action?.type).toBe('navigate');
    expect(res.action?.navigation).toBe('/properties');
    expect(res.suggestions?.length).toBeGreaterThan(0);
  });

  it('processVoiceCommand matches help intent', async () => {
    const svc = VoiceAssistantService.getInstance();
    svc.updateSettings({ enabled: false, auto_execute_commands: false });

    const res = await svc.processVoiceCommand('what can you do', 1);
    expect(res.text.toLowerCase()).toMatch(/properties|payments|tenants/);
  });

  it('processVoiceCommand returns unknown for low-signal input', async () => {
    const svc = VoiceAssistantService.getInstance();
    svc.updateSettings({ enabled: false, auto_execute_commands: false });

    const res = await svc.processVoiceCommand('xyzabc nonsense phrase', 0.2);
    expect(res.text.toLowerCase()).toMatch(/didn't understand|try/);
    expect(res.suggestions?.length).toBeGreaterThan(0);
  });

  it('updateSettings persists to localStorage', () => {
    const svc = VoiceAssistantService.getInstance();
    svc.updateSettings({ language: 'en-US', speech_rate: 1.2 });
    const raw = localStorage.getItem('voice-assistant-settings');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.language).toBe('en-US');
    expect(parsed.speech_rate).toBe(1.2);
  });

  it('startListening throws when recognition unavailable', async () => {
    vi.unstubAllGlobals();
    VoiceAssistantService.resetSingletonForTests();
    const svc = VoiceAssistantService.getInstance();
    await expect(svc.startListening()).rejects.toMatchObject({
      code: 'SPEECH_RECOGNITION_NOT_SUPPORTED',
    });
  });
});
