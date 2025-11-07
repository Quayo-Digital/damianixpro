// Voice Assistant React Hook for Nigeria Homes Platform
// Created: 2025-08-01
// Description: React hook for managing voice assistant state and functionality

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VoiceAssistantService } from '@/services/voice/voiceAssistantService';
import {
  VoiceAssistantState,
  VoiceCommand,
  VoiceResponse,
  VoiceSettings,
  VoiceSession,
  VoiceError,
  VoiceContext
} from '@/types/voiceAssistant';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import { useSubscription } from '@/hooks/useSubscription';

export const useVoiceAssistant = () => {
  const { user } = useAuth();
  const { hasFeatureAccess } = useSubscription();
  const queryClient = useQueryClient();
  const voiceService = useRef(VoiceAssistantService.getInstance());
  
  const [state, setState] = useState<VoiceAssistantState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    isEnabled: false,
    settings: voiceService.current.getSettings(),
    suggestions: [],
    context: {
      current_page: window.location.pathname,
      conversation_history: [],
      user_preferences: voiceService.current.getSettings()
    }
  });

  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const [currentSession, setCurrentSession] = useState<VoiceSession | null>(null);
  const [error, setError] = useState<VoiceError | null>(null);

  // Check if voice assistant feature is available for user's subscription
  const canUseVoiceAssistant = hasFeatureAccess('voice_assistant');

  // Initialize voice assistant
  useEffect(() => {
    const initializeVoiceAssistant = async () => {
      try {
        if (!VoiceAssistantService.isSupported()) {
          setError({
            code: 'SPEECH_RECOGNITION_NOT_SUPPORTED',
            message: 'Voice assistant is not supported in this browser',
            timestamp: new Date().toISOString(),
            recoverable: false
          });
          return;
        }

        if (!canUseVoiceAssistant) {
          setError({
            code: 'SUBSCRIPTION_LIMIT_EXCEEDED',
            message: 'Voice assistant requires a premium subscription',
            timestamp: new Date().toISOString(),
            recoverable: true
          });
          return;
        }

        setState(prev => ({ ...prev, isEnabled: true }));
        loadCommandHistory();
        setupEventListeners();
      } catch (err) {
        console.error('Failed to initialize voice assistant:', err);
        setError({
          code: 'UNKNOWN_ERROR',
          message: 'Failed to initialize voice assistant',
          timestamp: new Date().toISOString(),
          recoverable: true
        });
      }
    };

    initializeVoiceAssistant();
    
    return () => {
      cleanup();
    };
  }, [canUseVoiceAssistant]);

  // Setup event listeners for voice assistant
  const setupEventListeners = useCallback(() => {
    const handleVoiceError = (event: CustomEvent<VoiceError>) => {
      setError(event.detail);
      setState(prev => ({ 
        ...prev, 
        isListening: false, 
        isProcessing: false,
        error: event.detail.message 
      }));
    };

    const handleModalOpen = (event: CustomEvent) => {
      // Handle modal opening from voice commands
      console.log('Voice command opening modal:', event.detail);
    };

    const handleProcessStart = (event: CustomEvent) => {
      // Handle process starting from voice commands
      console.log('Voice command starting process:', event.detail);
    };

    window.addEventListener('voice-error', handleVoiceError as EventListener);
    window.addEventListener('voice-open-modal', handleModalOpen as EventListener);
    window.addEventListener('voice-start-process', handleProcessStart as EventListener);

    return () => {
      window.removeEventListener('voice-error', handleVoiceError as EventListener);
      window.removeEventListener('voice-open-modal', handleModalOpen as EventListener);
      window.removeEventListener('voice-start-process', handleProcessStart as EventListener);
    };
  }, []);

  // Load command history from storage
  const loadCommandHistory = useCallback(() => {
    try {
      const history = JSON.parse(localStorage.getItem('voice-command-history') || '[]');
      setCommandHistory(history);
    } catch (err) {
      console.error('Failed to load command history:', err);
    }
  }, []);

  // Start listening for voice commands
  const startListening = useCallback(async () => {
    if (!state.isEnabled || state.isListening) return;

    try {
      setState(prev => ({ ...prev, isListening: true, error: undefined }));
      setError(null);
      
      await voiceService.current.startListening();
      
      // Create new session if none exists
      if (!currentSession) {
        const session: VoiceSession = {
          id: generateSessionId(),
          user_id: user?.id || 'anonymous',
          started_at: new Date().toISOString(),
          commands: [],
          context: state.context,
          status: 'active'
        };
        setCurrentSession(session);
      }

      toast.success('Voice assistant is listening...', {
        description: 'Say a command or "help" for options'
      });
    } catch (err) {
      setState(prev => ({ ...prev, isListening: false }));
      const error = err as VoiceError;
      setError(error);
      toast.error('Failed to start voice assistant', {
        description: error.message
      });
    }
  }, [state.isEnabled, state.isListening, currentSession, user?.id, state.context]);

  // Stop listening for voice commands
  const stopListening = useCallback(() => {
    if (!state.isListening) return;

    try {
      voiceService.current.stopListening();
      setState(prev => ({ ...prev, isListening: false }));
      
      toast.info('Voice assistant stopped listening');
    } catch (err) {
      console.error('Failed to stop voice assistant:', err);
    }
  }, [state.isListening]);

  // Process voice command
  const processCommand = useMutation({
    mutationFn: async (transcript: string): Promise<VoiceResponse> => {
      setState(prev => ({ ...prev, isProcessing: true }));
      
      try {
        const response = await voiceService.current.processVoiceCommand(transcript);
        
        // Update suggestions
        setState(prev => ({ 
          ...prev, 
          suggestions: response.suggestions || [],
          isProcessing: false 
        }));

        // Update command history
        loadCommandHistory();
        
        return response;
      } catch (err) {
        setState(prev => ({ ...prev, isProcessing: false }));
        throw err;
      }
    },
    onSuccess: (response) => {
      toast.success('Command processed', {
        description: response.text
      });
    },
    onError: (err: any) => {
      toast.error('Failed to process command', {
        description: err.message
      });
    }
  });

  // Speak text using text-to-speech
  const speak = useMutation({
    mutationFn: async (text: string): Promise<void> => {
      setState(prev => ({ ...prev, isSpeaking: true }));
      
      try {
        await voiceService.current.speak(text);
      } finally {
        setState(prev => ({ ...prev, isSpeaking: false }));
      }
    },
    onError: (err: any) => {
      setState(prev => ({ ...prev, isSpeaking: false }));
      toast.error('Failed to speak text', {
        description: err.message
      });
    }
  });

  // Update voice assistant settings
  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    try {
      voiceService.current.updateSettings(newSettings);
      const updatedSettings = voiceService.current.getSettings();
      
      setState(prev => ({ 
        ...prev, 
        settings: updatedSettings,
        context: {
          ...prev.context,
          user_preferences: updatedSettings
        }
      }));

      toast.success('Voice assistant settings updated');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  }, []);

  // Toggle voice assistant on/off
  const toggleVoiceAssistant = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Clear command history
  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem('voice-command-history');
      setCommandHistory([]);
      toast.success('Command history cleared');
    } catch (err) {
      toast.error('Failed to clear history');
    }
  }, []);

  // Get available voice commands
  const getAvailableCommands = useCallback(() => {
    return [
      { command: 'Show my properties', description: 'View all your properties' },
      { command: 'Check payments', description: 'View payment history and status' },
      { command: 'List tenants', description: 'Show all your tenants' },
      { command: 'Add new property', description: 'Create a new property listing' },
      { command: 'Send reminder', description: 'Send payment or lease reminders' },
      { command: 'View analytics', description: 'Open dashboard analytics' },
      { command: 'Help', description: 'Get help with voice commands' }
    ];
  }, []);

  // Get voice assistant statistics
  const getStatistics = useCallback(() => {
    const totalCommands = commandHistory.length;
    const successfulCommands = commandHistory.filter(cmd => cmd.success).length;
    const failedCommands = totalCommands - successfulCommands;
    
    return {
      totalCommands,
      successfulCommands,
      failedCommands,
      successRate: totalCommands > 0 ? (successfulCommands / totalCommands) * 100 : 0,
      mostUsedIntent: getMostUsedIntent(),
      averageConfidence: getAverageConfidence()
    };
  }, [commandHistory]);

  const getMostUsedIntent = useCallback(() => {
    const intentCounts: Record<string, number> = {};
    
    commandHistory.forEach(cmd => {
      intentCounts[cmd.intent] = (intentCounts[cmd.intent] || 0) + 1;
    });
    
    return Object.entries(intentCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';
  }, [commandHistory]);

  const getAverageConfidence = useCallback(() => {
    if (commandHistory.length === 0) return 0;
    
    const totalConfidence = commandHistory.reduce((sum, cmd) => sum + cmd.confidence, 0);
    return totalConfidence / commandHistory.length;
  }, [commandHistory]);

  // Check browser support
  const browserSupport = VoiceAssistantService.getBrowserSupport();

  // Cleanup function
  const cleanup = useCallback(() => {
    if (state.isListening) {
      voiceService.current.stopListening();
    }
    
    if (currentSession) {
      const endedSession = {
        ...currentSession,
        ended_at: new Date().toISOString(),
        status: 'ended' as const
      };
      // Save session to storage or send to backend
      console.log('Voice session ended:', endedSession);
    }
  }, [state.isListening, currentSession]);

  // Generate session ID
  const generateSessionId = (): string => {
    return `voice_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Update context when page changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      context: {
        ...prev.context,
        current_page: window.location.pathname
      }
    }));
  }, [window.location.pathname]);

  return {
    // State
    isListening: state.isListening,
    isProcessing: state.isProcessing || processCommand.isPending,
    isSpeaking: state.isSpeaking || speak.isPending,
    isEnabled: state.isEnabled && canUseVoiceAssistant,
    settings: state.settings,
    suggestions: state.suggestions,
    error,
    commandHistory,
    currentSession,
    
    // Actions
    startListening,
    stopListening,
    toggleVoiceAssistant,
    processCommand: processCommand.mutateAsync,
    speak: speak.mutateAsync,
    updateSettings,
    clearHistory,
    
    // Utilities
    getAvailableCommands,
    getStatistics,
    browserSupport,
    canUseVoiceAssistant,
    
    // Loading states
    isStarting: false, // Could be added for initialization loading
    isStopping: false  // Could be added for cleanup loading
  };
};

export default useVoiceAssistant;
