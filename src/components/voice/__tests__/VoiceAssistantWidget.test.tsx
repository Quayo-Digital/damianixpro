import type { ReactElement } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceAssistantWidget } from '../VoiceAssistantWidget';
import { TestAuthProviders } from '@/tests/testProviders';

const mockToggle = vi.fn();
const mockSpeak = vi.fn().mockResolvedValue(undefined);

const baseHook = {
  isListening: false,
  isProcessing: false,
  isSpeaking: false,
  isEnabled: true,
  settings: {
    enabled: true,
    language: 'en-NG',
    voice_type: 'auto' as const,
    speech_rate: 1,
    speech_pitch: 1,
    speech_volume: 0.8,
    wake_word_enabled: false,
    wake_word: '',
    continuous_listening: false,
    auto_execute_commands: false,
    confirmation_required: true,
    privacy_mode: false,
    noise_cancellation: true,
  },
  suggestions: [] as string[],
  error: null as null | { code: string; message: string },
  commandHistory: [],
  currentSession: null,
  startListening: vi.fn(),
  stopListening: vi.fn(),
  toggleVoiceAssistant: mockToggle,
  speak: mockSpeak,
  getAvailableCommands: () => [
    { command: 'Show my properties', description: 'View properties' },
    { command: 'Help', description: 'Help' },
  ],
  getStatistics: () => ({
    totalCommands: 0,
    successfulCommands: 0,
    failedCommands: 0,
    successRate: 0,
    mostUsedIntent: 'unknown',
    averageConfidence: 0,
  }),
  browserSupport: {
    speechRecognition: true,
    speechSynthesis: true,
    mediaDevices: true,
    getUserMedia: true,
  },
  canUseVoiceAssistant: true,
  processCommand: vi.fn(),
  updateSettings: vi.fn(),
  clearHistory: vi.fn(),
  isStarting: false,
  isStopping: false,
};

vi.mock('@/hooks/useVoiceAssistant', () => ({
  useVoiceAssistant: vi.fn(() => ({ ...baseHook })),
}));

import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';

const mockedUseVoiceAssistant = vi.mocked(useVoiceAssistant);

function renderVoice(ui: ReactElement) {
  return render(<TestAuthProviders>{ui}</TestAuthProviders>);
}

describe('VoiceAssistantWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseVoiceAssistant.mockImplementation(() => ({ ...baseHook }));
  });

  it('compact mode calls toggleVoiceAssistant when the control is clicked', async () => {
    const user = userEvent.setup();
    renderVoice(<VoiceAssistantWidget compact />);

    const btn = screen.getByRole('button');
    expect(btn).not.toBeDisabled();
    await user.click(btn);
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('compact mode disables control when voice is not enabled', () => {
    mockedUseVoiceAssistant.mockReturnValue({
      ...baseHook,
      isEnabled: false,
      canUseVoiceAssistant: true,
    });

    renderVoice(<VoiceAssistantWidget compact />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows premium upsell when canUseVoiceAssistant is false', () => {
    mockedUseVoiceAssistant.mockReturnValue({
      ...baseHook,
      canUseVoiceAssistant: false,
    });

    renderVoice(<VoiceAssistantWidget />);
    expect(screen.getByText(/premium subscription/i)).toBeInTheDocument();
    expect(screen.getByText(/Upgrade to Premium/i)).toBeInTheDocument();
  });

  it('shows browser unsupported message when speech APIs are missing', () => {
    mockedUseVoiceAssistant.mockReturnValue({
      ...baseHook,
      browserSupport: {
        speechRecognition: false,
        speechSynthesis: true,
        mediaDevices: true,
        getUserMedia: true,
      },
    });

    renderVoice(<VoiceAssistantWidget />);
    expect(screen.getByText(/not supported in this browser/i)).toBeInTheDocument();
  });
});
