// Voice Assistant Service for DamianixPro Platform
// Created: 2025-08-01
// Description: Core voice assistant functionality with speech recognition, intent processing, and TTS

import {
  VoiceCommand,
  VoiceIntent,
  VoiceEntity,
  VoiceResponse,
  VoiceAction,
  VoiceSettings,
  VoiceCommandPattern,
  VoiceIntentMatch,
  SpeechRecognitionResult,
  VoiceContext,
  VoiceError,
  VoiceErrorCode,
  NigerianVoiceFeatures,
} from '@/types/voiceAssistant';

export class VoiceAssistantService {
  private static instance: VoiceAssistantService | undefined;
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private settings: VoiceSettings;
  private context: VoiceContext;
  private commandPatterns: VoiceCommandPattern[];

  constructor() {
    this.settings = this.getDefaultSettings();
    this.context = this.getDefaultContext();
    this.commandPatterns = this.getCommandPatterns();
    this.initializeSpeechAPIs();
  }

  public static getInstance(): VoiceAssistantService {
    if (!VoiceAssistantService.instance) {
      VoiceAssistantService.instance = new VoiceAssistantService();
    }
    return VoiceAssistantService.instance;
  }

  /** Clears singleton — for automated tests only. */
  public static resetSingletonForTests(): void {
    VoiceAssistantService.instance = undefined;
  }

  // Initialize browser speech APIs
  private initializeSpeechAPIs(): void {
    try {
      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.setupSpeechRecognition();
      }

      // Initialize Speech Synthesis
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
      }
    } catch (error) {
      console.error('Failed to initialize speech APIs:', error);
    }
  }

  private setupSpeechRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.settings.continuous_listening;
    this.recognition.interimResults = true;
    this.recognition.lang = this.settings.language;
    this.recognition.maxAlternatives = 3;

    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('Voice recognition started');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('Voice recognition ended');
    };

    this.recognition.onerror = (event) => {
      this.handleSpeechError(event.error);
    };

    this.recognition.onresult = (event) => {
      this.handleSpeechResult(event);
    };
  }

  // Start listening for voice commands
  public async startListening(): Promise<void> {
    if (!this.recognition) {
      throw this.createError(
        'SPEECH_RECOGNITION_NOT_SUPPORTED',
        'Speech recognition not supported'
      );
    }

    if (this.isListening) return;

    try {
      this.recognition.start();
    } catch (error) {
      throw this.createError('MICROPHONE_ACCESS_DENIED', 'Microphone access denied');
    }
  }

  // Stop listening for voice commands
  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Process speech recognition results
  private handleSpeechResult(event: SpeechRecognitionEvent): void {
    const results: SpeechRecognitionResult[] = [];

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim();
      const confidence = result[0].confidence;

      results.push({
        transcript,
        confidence,
        is_final: result.isFinal,
        alternatives: Array.from(result)
          .slice(1)
          .map((alt) => ({
            transcript: alt.transcript,
            confidence: alt.confidence,
          })),
      });

      if (result.isFinal && transcript) {
        this.processVoiceCommand(transcript, confidence);
      }
    }
  }

  // Process voice command and execute actions
  public async processVoiceCommand(
    transcript: string,
    confidence: number = 1.0
  ): Promise<VoiceResponse> {
    try {
      // Clean and normalize transcript
      const cleanTranscript = this.normalizeTranscript(transcript);

      // Extract intent and entities
      const intentMatch = this.extractIntent(cleanTranscript);

      if (intentMatch.confidence < 0.5) {
        return this.createUnknownCommandResponse(cleanTranscript);
      }

      // Create voice command record
      const command: VoiceCommand = {
        id: this.generateId(),
        command: cleanTranscript,
        intent: intentMatch.intent,
        entities: intentMatch.entities,
        confidence: Math.min(confidence, intentMatch.confidence),
        timestamp: new Date().toISOString(),
        user_id: this.context.current_page, // This would be actual user ID in real app
        success: false,
      };

      // Generate response and action
      const response = await this.generateResponse(command);

      // Execute action if auto-execute is enabled
      if (
        this.settings.auto_execute_commands &&
        response.action &&
        !response.requires_confirmation
      ) {
        await this.executeAction(response.action);
        command.success = true;
        command.action_taken = response.action.type;
      }

      command.response = response.text;

      // Store command in history
      this.storeCommand(command);

      // Speak response if enabled
      if (this.settings.enabled) {
        await this.speak(response.text);
      }

      return response;
    } catch (error) {
      console.error('Error processing voice command:', error);
      return {
        text: "I'm sorry, I encountered an error processing your command. Please try again.",
        suggestions: ['Try rephrasing your command', 'Check your microphone', 'View help commands'],
      };
    }
  }

  // Extract intent and entities from transcript
  private extractIntent(transcript: string): VoiceIntentMatch {
    const normalizedTranscript = transcript.toLowerCase();
    let bestMatch: VoiceIntentMatch = {
      intent: 'unknown',
      confidence: 0,
      entities: [],
      matched_patterns: [],
    };

    for (const pattern of this.commandPatterns) {
      for (const patternText of pattern.patterns) {
        const confidence = this.calculatePatternMatch(normalizedTranscript, patternText);

        if (confidence > bestMatch.confidence) {
          bestMatch = {
            intent: pattern.intent,
            confidence,
            entities: this.extractEntities(transcript, pattern.entities),
            matched_patterns: [patternText],
          };
        }
      }
    }

    return bestMatch;
  }

  // Calculate pattern matching confidence
  private calculatePatternMatch(transcript: string, pattern: string): number {
    const transcriptWords = transcript.split(' ');
    const patternWords = pattern.toLowerCase().split(' ');

    let matches = 0;
    const totalWords = patternWords.length;

    for (const patternWord of patternWords) {
      if (patternWord.startsWith('{') && patternWord.endsWith('}')) {
        // Entity placeholder - check if any word could match
        if (transcriptWords.length > 0) matches++;
      } else if (transcriptWords.includes(patternWord)) {
        matches++;
      }
    }

    return matches / totalWords;
  }

  // Extract entities from transcript
  private extractEntities(transcript: string, entityTypes: any[]): VoiceEntity[] {
    const entities: VoiceEntity[] = [];
    const words = transcript.split(' ');

    // Simple entity extraction (in production, use NLP libraries)
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();

      // Extract numbers
      if (/^\d+$/.test(word)) {
        entities.push({
          type: 'number',
          value: word,
          confidence: 0.9,
          start_index: i,
          end_index: i,
        });
      }

      // Extract dates (simple patterns)
      if (
        /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(word) ||
        ['today', 'tomorrow', 'yesterday'].includes(word)
      ) {
        entities.push({
          type: 'date',
          value: word,
          confidence: 0.8,
          start_index: i,
          end_index: i,
        });
      }

      // Extract amounts (Naira)
      if (
        word.includes('naira') ||
        word.includes('₦') ||
        (i > 0 && words[i - 1].toLowerCase() === 'naira')
      ) {
        entities.push({
          type: 'amount',
          value: word,
          confidence: 0.8,
          start_index: i,
          end_index: i,
        });
      }
    }

    return entities;
  }

  // Generate response based on intent and entities
  private async generateResponse(command: VoiceCommand): Promise<VoiceResponse> {
    const pattern = this.commandPatterns.find((p) => p.intent === command.intent);

    if (!pattern) {
      return this.createUnknownCommandResponse(command.command);
    }

    const template = pattern.response_templates[0] || "I'll help you with that.";
    const responseText = this.fillTemplate(template, command.entities);

    const response: VoiceResponse = {
      text: responseText,
      action: this.createAction(command),
      suggestions: this.generateSuggestions(command.intent),
      requires_confirmation: pattern.requires_confirmation || false,
    };

    if (response.requires_confirmation) {
      response.confirmation_message = `Are you sure you want to ${command.intent.replace('_', ' ')}?`;
    }

    return response;
  }

  // Create action based on command
  private createAction(command: VoiceCommand): VoiceAction | undefined {
    switch (command.intent) {
      case 'view_properties':
        return {
          type: 'navigate',
          payload: { page: 'properties' },
          navigation: '/properties',
        };

      case 'view_tenants':
        return {
          type: 'navigate',
          payload: { page: 'tenants' },
          navigation: '/tenants',
        };

      case 'check_payments':
        return {
          type: 'navigate',
          payload: { page: 'payments' },
          navigation: '/owner/payments',
        };

      case 'view_analytics':
        return {
          type: 'navigate',
          payload: { page: 'dashboard' },
          navigation: '/owner/dashboard',
        };

      case 'add_property':
        return {
          type: 'open_modal',
          payload: { modal: 'add-property' },
        };

      case 'send_reminder':
        return {
          type: 'start_process',
          payload: { process: 'send-reminder', entities: command.entities },
        };

      default:
        return undefined;
    }
  }

  // Execute voice action
  private async executeAction(action: VoiceAction): Promise<void> {
    switch (action.type) {
      case 'navigate':
        if (action.navigation) {
          window.location.href = action.navigation;
        }
        break;

      case 'open_modal':
        // Dispatch custom event for modal opening
        window.dispatchEvent(
          new CustomEvent('voice-open-modal', {
            detail: action.payload,
          })
        );
        break;

      case 'start_process':
        // Dispatch custom event for process starting
        window.dispatchEvent(
          new CustomEvent('voice-start-process', {
            detail: action.payload,
          })
        );
        break;

      case 'api_call':
        if (action.api_call) {
          await this.makeApiCall(action.api_call);
        }
        break;
    }
  }

  // Text-to-speech functionality
  public async speak(text: string): Promise<void> {
    if (!this.synthesis || !this.settings.enabled) return;

    return new Promise((resolve, reject) => {
      try {
        // Cancel any ongoing speech
        this.synthesis!.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.settings.language;
        utterance.rate = this.settings.speech_rate;
        utterance.pitch = this.settings.speech_pitch;
        utterance.volume = this.settings.speech_volume;

        // Get appropriate voice
        const voices = this.synthesis!.getVoices();
        const selectedVoice = this.selectVoice(voices);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = (error) => reject(error);

        this.synthesis!.speak(utterance);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Select appropriate voice based on settings
  private selectVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const lang = this.settings.language;
    const voiceType = this.settings.voice_type;

    // Filter by language
    const langVoices = voices.filter((voice) => voice.lang.startsWith(lang));

    if (langVoices.length === 0) return voices[0] || null;

    // Filter by gender preference
    if (voiceType !== 'auto') {
      const genderVoices = langVoices.filter((voice) => {
        const name = voice.name.toLowerCase();
        if (voiceType === 'female') {
          return (
            name.includes('female') ||
            name.includes('woman') ||
            name.includes('samantha') ||
            name.includes('victoria')
          );
        } else {
          return (
            name.includes('male') ||
            name.includes('man') ||
            name.includes('daniel') ||
            name.includes('alex')
          );
        }
      });

      if (genderVoices.length > 0) return genderVoices[0];
    }

    return langVoices[0];
  }

  // Utility methods
  private normalizeTranscript(transcript: string): string {
    return transcript
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private fillTemplate(template: string, entities: VoiceEntity[]): string {
    let result = template;

    for (const entity of entities) {
      const placeholder = `{${entity.type}}`;
      result = result.replace(placeholder, entity.value);
    }

    return result;
  }

  private generateSuggestions(intent: VoiceIntent): string[] {
    const suggestions: Record<VoiceIntent, string[]> = {
      view_properties: ['Show me property details', 'List all properties', 'Filter properties'],
      view_tenants: ['Show tenant information', 'List all tenants', 'Find specific tenant'],
      check_payments: [
        'Show payment history',
        'Check outstanding payments',
        'View payment analytics',
      ],
      add_property: ['Add new property', 'Create property listing', 'Register property'],
      send_reminder: [
        'Send payment reminder',
        'Send maintenance reminder',
        'Send lease renewal reminder',
      ],
      unknown: ['Try "show my properties"', 'Say "check payments"', 'Ask "what can you do?"'],
      help: ['View properties', 'Check payments', 'Add new tenant', 'Send reminders'],
      navigate_to: ['Go to dashboard', 'Open properties page', 'Show tenant management'],
      view_analytics: ['Show dashboard', 'View reports', 'Check analytics'],
      add_tenant: ['Add new tenant', 'Register tenant', 'Create tenant profile'],
      schedule_maintenance: ['Schedule maintenance', 'Book repair', 'Request service'],
      create_lease: ['Create new lease', 'Generate lease agreement', 'Start lease process'],
      send_message: ['Send message to tenant', 'Contact property owner', 'Send notification'],
      view_documents: ['Show documents', 'View contracts', 'Check paperwork'],
      upload_document: ['Upload document', 'Add file', 'Submit paperwork'],
      check_alerts: ['Show alerts', 'Check notifications', 'View warnings'],
    };

    return suggestions[intent] || suggestions['unknown'];
  }

  private createUnknownCommandResponse(transcript: string): VoiceResponse {
    return {
      text: `I didn't understand "${transcript}". Try asking me to show properties, check payments, or say "help" for more options.`,
      suggestions: ['Show my properties', 'Check payments', 'View tenants', 'What can you do?'],
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private createError(code: VoiceErrorCode, message: string): VoiceError {
    return {
      code,
      message,
      timestamp: new Date().toISOString(),
      recoverable: code !== 'SPEECH_RECOGNITION_NOT_SUPPORTED',
    };
  }

  private handleSpeechError(error: string): void {
    console.error('Speech recognition error:', error);

    const errorMap: Record<string, VoiceErrorCode> = {
      'no-speech': 'MICROPHONE_ACCESS_DENIED',
      'audio-capture': 'MICROPHONE_ACCESS_DENIED',
      'not-allowed': 'MICROPHONE_ACCESS_DENIED',
      network: 'NETWORK_ERROR',
    };

    const errorCode = errorMap[error] || 'UNKNOWN_ERROR';
    const voiceError = this.createError(errorCode, `Speech recognition error: ${error}`);

    // Dispatch error event
    window.dispatchEvent(new CustomEvent('voice-error', { detail: voiceError }));
  }

  private async makeApiCall(apiCall: any): Promise<any> {
    // Implement API calls for voice commands
    // This would integrate with your existing API services
    console.log('Making API call:', apiCall);
  }

  private storeCommand(command: VoiceCommand): void {
    // Store command in local storage or send to backend
    const history = JSON.parse(localStorage.getItem('voice-command-history') || '[]');
    history.push(command);

    // Keep only last 100 commands
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    localStorage.setItem('voice-command-history', JSON.stringify(history));
  }

  // Settings management
  public updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    if (this.recognition) {
      this.recognition.continuous = this.settings.continuous_listening;
      this.recognition.lang = this.settings.language;
    }

    localStorage.setItem('voice-assistant-settings', JSON.stringify(this.settings));
  }

  public getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  private getDefaultSettings(): VoiceSettings {
    const saved = localStorage.getItem('voice-assistant-settings');
    if (saved) {
      return JSON.parse(saved);
    }

    return {
      enabled: true,
      language: 'en-NG', // Nigerian English
      voice_type: 'auto',
      speech_rate: 1.0,
      speech_pitch: 1.0,
      speech_volume: 0.8,
      wake_word_enabled: false,
      wake_word: 'Hey DamianixPro',
      continuous_listening: false,
      auto_execute_commands: false,
      confirmation_required: true,
      privacy_mode: false,
      noise_cancellation: true,
    };
  }

  private getDefaultContext(): VoiceContext {
    return {
      current_page: window.location.pathname,
      conversation_history: [],
      user_preferences: this.settings,
    };
  }

  // Command patterns for intent recognition
  private getCommandPatterns(): VoiceCommandPattern[] {
    return [
      {
        intent: 'view_properties',
        patterns: [
          'show my properties',
          'list all properties',
          'view properties',
          'display properties',
          'show properties',
          'what properties do i have',
        ],
        entities: [],
        examples: ['Show my properties', 'List all properties'],
        response_templates: ['Here are your properties. Navigating to the properties page.'],
        subscription_tier: 'free',
      },
      {
        intent: 'view_tenants',
        patterns: [
          'show my tenants',
          'list all tenants',
          'view tenants',
          'display tenants',
          'show tenants',
          'who are my tenants',
        ],
        entities: [],
        examples: ['Show my tenants', 'List all tenants'],
        response_templates: ['Here are your tenants. Opening the tenant management page.'],
        subscription_tier: 'free',
      },
      {
        intent: 'check_payments',
        patterns: [
          'check payments',
          'show payments',
          'view payment history',
          'payment status',
          'how much money have i received',
          'show my income',
        ],
        entities: ['date', 'amount'],
        examples: ['Check payments', 'Show payment history'],
        response_templates: ['Showing your payment information. Opening the payments page.'],
        subscription_tier: 'starter',
      },
      {
        intent: 'add_property',
        patterns: [
          'add new property',
          'create property',
          'register property',
          'add property',
          'new property',
        ],
        entities: ['property_name', 'location'],
        examples: ['Add new property', 'Create property in Lagos'],
        response_templates: [
          "I'll help you add a new property. Opening the property creation form.",
        ],
        requires_confirmation: true,
        subscription_tier: 'starter',
      },
      {
        intent: 'send_reminder',
        patterns: [
          'send reminder to {tenant_name}',
          'remind {tenant_name} about payment',
          'send payment reminder',
          'remind tenant',
          'send reminder',
        ],
        entities: ['tenant_name', 'date'],
        examples: ['Send reminder to John', 'Remind tenant about payment'],
        response_templates: ["I'll send a reminder to {tenant_name}."],
        requires_confirmation: true,
        subscription_tier: 'professional',
      },
      {
        intent: 'help',
        patterns: [
          'help',
          'what can you do',
          'commands',
          'how to use',
          'voice commands',
          'what are the options',
        ],
        entities: [],
        examples: ['Help', 'What can you do?'],
        response_templates: [
          'I can help you manage properties, check payments, view tenants, and more. Try saying "show my properties" or "check payments".',
        ],
      },
    ];
  }

  // Nigerian-specific features
  public getNigerianFeatures(): NigerianVoiceFeatures {
    return {
      local_languages: ['english', 'hausa', 'yoruba', 'igbo', 'pidgin'],
      currency_recognition: true,
      location_recognition: true,
      cultural_context: true,
      time_zone: 'WAT',
      date_format: 'DD/MM/YYYY',
      number_format: 'nigerian',
    };
  }

  // Check if voice assistant is supported
  public static isSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  // Get browser compatibility
  public static getBrowserSupport() {
    const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
    return {
      speechRecognition: VoiceAssistantService.isSupported(),
      speechSynthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
      mediaDevices: typeof navigator !== 'undefined' && 'mediaDevices' in navigator,
      getUserMedia: Boolean(md && 'getUserMedia' in md),
    };
  }
}
