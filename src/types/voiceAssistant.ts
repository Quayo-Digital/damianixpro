// Voice Assistant Types for Nigeria Homes Platform
// Created: 2025-08-01
// Description: TypeScript types for voice assistant integration and hands-free property management

export interface VoiceCommand {
  id: string;
  command: string;
  intent: VoiceIntent;
  entities: VoiceEntity[];
  confidence: number;
  timestamp: string;
  user_id: string;
  response?: string;
  action_taken?: string;
  success: boolean;
}

export type VoiceIntent = 
  | 'view_properties'
  | 'view_tenants'
  | 'add_property'
  | 'add_tenant'
  | 'schedule_maintenance'
  | 'send_reminder'
  | 'check_payments'
  | 'view_analytics'
  | 'create_lease'
  | 'send_message'
  | 'view_documents'
  | 'upload_document'
  | 'check_alerts'
  | 'navigate_to'
  | 'help'
  | 'unknown';

export interface VoiceEntity {
  type: VoiceEntityType;
  value: string;
  confidence: number;
  start_index?: number;
  end_index?: number;
}

export type VoiceEntityType = 
  | 'property_name'
  | 'tenant_name'
  | 'date'
  | 'amount'
  | 'location'
  | 'maintenance_type'
  | 'document_type'
  | 'page_name'
  | 'number'
  | 'email'
  | 'phone';

export interface VoiceResponse {
  text: string;
  action?: VoiceAction;
  data?: any;
  suggestions?: string[];
  requires_confirmation?: boolean;
  confirmation_message?: string;
}

export interface VoiceAction {
  type: VoiceActionType;
  payload: any;
  navigation?: string;
  api_call?: {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
  };
}

export type VoiceActionType = 
  | 'navigate'
  | 'create_record'
  | 'update_record'
  | 'delete_record'
  | 'send_notification'
  | 'display_data'
  | 'open_modal'
  | 'start_process'
  | 'confirm_action';

export interface VoiceSettings {
  enabled: boolean;
  language: string;
  voice_type: 'male' | 'female' | 'auto';
  speech_rate: number; // 0.5 to 2.0
  speech_pitch: number; // 0.0 to 2.0
  speech_volume: number; // 0.0 to 1.0
  wake_word_enabled: boolean;
  wake_word: string;
  continuous_listening: boolean;
  auto_execute_commands: boolean;
  confirmation_required: boolean;
  privacy_mode: boolean;
  noise_cancellation: boolean;
}

export interface VoiceSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  commands: VoiceCommand[];
  context: VoiceContext;
  status: 'active' | 'paused' | 'ended';
}

export interface VoiceContext {
  current_page: string;
  selected_property?: string;
  selected_tenant?: string;
  conversation_history: string[];
  user_preferences: VoiceSettings;
  last_action?: VoiceAction;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  is_final: boolean;
  alternatives?: {
    transcript: string;
    confidence: number;
  }[];
}

export interface VoiceIntentMatch {
  intent: VoiceIntent;
  confidence: number;
  entities: VoiceEntity[];
  matched_patterns: string[];
}

export interface VoiceCommandPattern {
  intent: VoiceIntent;
  patterns: string[];
  entities: VoiceEntityType[];
  examples: string[];
  response_templates: string[];
  requires_confirmation?: boolean;
  subscription_tier?: 'free' | 'starter' | 'professional' | 'enterprise';
}

export interface VoiceAnalytics {
  total_commands: number;
  successful_commands: number;
  failed_commands: number;
  most_used_intents: { intent: VoiceIntent; count: number }[];
  average_confidence: number;
  session_duration_avg: number;
  user_satisfaction_score?: number;
  error_patterns: string[];
  improvement_suggestions: string[];
}

export interface VoiceAccessibility {
  screen_reader_compatible: boolean;
  keyboard_shortcuts_enabled: boolean;
  visual_feedback_enabled: boolean;
  haptic_feedback_enabled: boolean;
  high_contrast_mode: boolean;
  large_text_mode: boolean;
  audio_descriptions_enabled: boolean;
}

export interface VoicePrivacy {
  data_retention_days: number;
  audio_storage_enabled: boolean;
  transcription_storage_enabled: boolean;
  analytics_enabled: boolean;
  third_party_sharing: boolean;
  encryption_enabled: boolean;
  anonymization_enabled: boolean;
}

// Nigerian-specific voice features
export interface NigerianVoiceFeatures {
  local_languages: ('english' | 'hausa' | 'yoruba' | 'igbo' | 'pidgin')[];
  currency_recognition: boolean; // Naira, Kobo
  location_recognition: boolean; // Nigerian states, cities, LGAs
  cultural_context: boolean; // Nigerian greetings, expressions
  time_zone: 'WAT'; // West Africa Time
  date_format: 'DD/MM/YYYY';
  number_format: 'nigerian'; // 1,000,000 format
}

export interface VoiceCommandHistory {
  id: string;
  user_id: string;
  command: string;
  intent: VoiceIntent;
  success: boolean;
  execution_time_ms: number;
  timestamp: string;
  context: Partial<VoiceContext>;
  error_message?: string;
}

export interface VoiceTraining {
  user_id: string;
  custom_commands: VoiceCommandPattern[];
  pronunciation_corrections: {
    word: string;
    correct_pronunciation: string;
    phonetic: string;
  }[];
  accent_adaptation: {
    region: string;
    adjustments: any;
  };
  vocabulary_extensions: string[];
}

export interface VoiceIntegration {
  platform: 'web' | 'mobile' | 'desktop';
  browser_support: {
    chrome: boolean;
    firefox: boolean;
    safari: boolean;
    edge: boolean;
  };
  device_support: {
    microphone_required: boolean;
    speakers_required: boolean;
    headset_recommended: boolean;
  };
  api_integrations: {
    web_speech_api: boolean;
    speechly: boolean;
    alan_ai: boolean;
    google_speech: boolean;
    azure_speech: boolean;
  };
}

// Voice assistant state management
export interface VoiceAssistantState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isEnabled: boolean;
  currentSession?: VoiceSession;
  lastCommand?: VoiceCommand;
  settings: VoiceSettings;
  error?: string;
  suggestions: string[];
  context: VoiceContext;
}

export interface VoiceAssistantActions {
  startListening: () => void;
  stopListening: () => void;
  processCommand: (transcript: string) => Promise<VoiceResponse>;
  speak: (text: string) => Promise<void>;
  updateSettings: (settings: Partial<VoiceSettings>) => void;
  clearHistory: () => void;
  exportData: () => Promise<any>;
  importData: (data: any) => Promise<void>;
}

// Error types
export interface VoiceError {
  code: VoiceErrorCode;
  message: string;
  details?: any;
  timestamp: string;
  recoverable: boolean;
}

export type VoiceErrorCode = 
  | 'MICROPHONE_ACCESS_DENIED'
  | 'SPEECH_RECOGNITION_NOT_SUPPORTED'
  | 'NETWORK_ERROR'
  | 'INTENT_RECOGNITION_FAILED'
  | 'COMMAND_EXECUTION_FAILED'
  | 'TEXT_TO_SPEECH_FAILED'
  | 'SUBSCRIPTION_LIMIT_EXCEEDED'
  | 'PRIVACY_SETTINGS_VIOLATION'
  | 'UNKNOWN_ERROR';

export interface VoiceMetrics {
  accuracy_rate: number;
  response_time_ms: number;
  user_satisfaction: number;
  command_completion_rate: number;
  error_rate: number;
  session_length_avg: number;
  daily_usage_count: number;
  feature_adoption_rate: number;
}
