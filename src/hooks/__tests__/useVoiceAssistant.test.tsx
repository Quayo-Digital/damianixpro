import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { VoiceAssistantService } from '@/services/voice/voiceAssistantService';
import { useVoiceAssistant } from '../useVoiceAssistant';

const mockHasFeatureAccess = vi.fn((feature: string) => feature === 'voice_assistant');
const mockUser = { id: 'user-voice-1' };

vi.mock('@/contexts/auth', () => ({
  useAuthSession: () => ({
    user: mockUser,
    userRole: 'tenant',
    session: null,
    isLoading: false,
    loading: false,
    isSuperAdmin: () => false,
    isAdmin: () => false,
    isOwner: () => false,
    isAgent: () => false,
    isTenant: () => true,
    isVendor: () => false,
    isManager: () => false,
    isAccountant: () => false,
    isFacilityManager: () => false,
    isAuthenticated: () => true,
    getRoleDisplay: () => 'Tenant',
    permissions: [],
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    hasFeatureAccess: (f: string) => mockHasFeatureAccess(f),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useVoiceAssistant', () => {
  beforeEach(() => {
    VoiceAssistantService.resetSingletonForTests();
    localStorage.clear();
    mockHasFeatureAccess.mockImplementation((f: string) => f === 'voice_assistant');
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
    mockHasFeatureAccess.mockReset();
    mockHasFeatureAccess.mockImplementation((f: string) => f === 'voice_assistant');
  });

  it('sets subscription error when voice_assistant feature is not available', async () => {
    mockHasFeatureAccess.mockReturnValue(false);
    const { result } = renderHook(() => useVoiceAssistant(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.error?.code).toBe('SUBSCRIPTION_LIMIT_EXCEEDED');
    });
    expect(result.current.isEnabled).toBe(false);
    expect(result.current.canUseVoiceAssistant).toBe(false);
  });

  it('enables assistant when browser supports speech and subscription allows', async () => {
    const { result } = renderHook(() => useVoiceAssistant(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isEnabled).toBe(true);
    });
    expect(result.current.error).toBeNull();
    expect(result.current.canUseVoiceAssistant).toBe(true);
  });

  it('sets browser support error when SpeechRecognition is missing', async () => {
    vi.unstubAllGlobals();
    const { result } = renderHook(() => useVoiceAssistant(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.error?.code).toBe('SPEECH_RECOGNITION_NOT_SUPPORTED');
    });
    expect(result.current.isEnabled).toBe(false);
  });

  it('getAvailableCommands returns documented phrases', async () => {
    const { result } = renderHook(() => useVoiceAssistant(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isEnabled).toBe(true));
    const cmds = result.current.getAvailableCommands();
    expect(cmds.some((c) => c.command.includes('properties'))).toBe(true);
    expect(cmds.some((c) => c.command.toLowerCase().includes('help'))).toBe(true);
  });

  it('getStatistics reflects command history', async () => {
    localStorage.setItem(
      'voice-command-history',
      JSON.stringify([
        {
          id: '1',
          command: 'show my properties',
          intent: 'view_properties',
          entities: [],
          confidence: 0.9,
          timestamp: new Date().toISOString(),
          user_id: '/',
          success: true,
        },
      ])
    );

    const { result } = renderHook(() => useVoiceAssistant(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isEnabled).toBe(true));
    await waitFor(() => expect(result.current.commandHistory.length).toBeGreaterThan(0));

    const stats = result.current.getStatistics();
    expect(stats.totalCommands).toBeGreaterThanOrEqual(1);
    expect(stats.successfulCommands).toBeGreaterThanOrEqual(1);
  });

  it('clearHistory removes stored commands', async () => {
    localStorage.setItem(
      'voice-command-history',
      JSON.stringify([
        {
          id: '1',
          command: 'help',
          intent: 'help',
          entities: [],
          confidence: 1,
          timestamp: new Date().toISOString(),
          user_id: '/',
          success: true,
        },
      ])
    );

    const { result } = renderHook(() => useVoiceAssistant(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isEnabled).toBe(true));
    await waitFor(() => expect(result.current.commandHistory.length).toBe(1));

    act(() => {
      result.current.clearHistory();
    });

    expect(localStorage.getItem('voice-command-history')).toBeNull();
    expect(result.current.commandHistory).toEqual([]);
  });

  it('processCommand runs voice service and returns response', async () => {
    const { result } = renderHook(() => useVoiceAssistant(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isEnabled).toBe(true));

    const svc = VoiceAssistantService.getInstance();
    svc.updateSettings({ enabled: false, auto_execute_commands: false });

    const response = await act(async () => result.current.processCommand('what can you do'));

    expect(response.text.length).toBeGreaterThan(10);
    expect(response.suggestions?.length).toBeGreaterThan(0);
  });

  it('startListening delegates to VoiceAssistantService when enabled', async () => {
    const startSpy = vi
      .spyOn(VoiceAssistantService.prototype, 'startListening')
      .mockResolvedValue(undefined);

    const { result } = renderHook(() => useVoiceAssistant(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isEnabled).toBe(true));

    await act(async () => {
      await result.current.startListening();
    });

    expect(startSpy).toHaveBeenCalled();
    startSpy.mockRestore();
  });
});
