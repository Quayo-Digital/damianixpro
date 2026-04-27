// VR/AR Property Tours Service
// Comprehensive service for immersive property experiences

import {
  VRTour,
  VRScene,
  VRHotspot,
  VRTourSettings,
  VRTourSession,
  VRTourEvent,
  TourAnalytics,
  DeviceInfo,
  DeviceCapabilities,
  PerformanceMetrics,
  Vector3D,
  MediaAsset,
  VRTourFilter,
  VRTourSort,
  VRTourSearchResult,
} from '@/types/vrTours';

class VRTourService {
  private static instance: VRTourService;
  private tours: Map<string, VRTour> = new Map();
  private sessions: Map<string, VRTourSession> = new Map();
  private settings: Map<string, VRTourSettings> = new Map();
  private deviceInfo: DeviceInfo | null = null;
  private currentSession: VRTourSession | null = null;

  private constructor() {
    this.initializeDeviceDetection();
  }

  static getInstance(): VRTourService {
    if (!VRTourService.instance) {
      VRTourService.instance = new VRTourService();
    }
    return VRTourService.instance;
  }

  // Device Detection and Capabilities
  private async initializeDeviceDetection(): Promise<void> {
    try {
      const capabilities = await this.detectDeviceCapabilities();
      const performance = await this.measureDevicePerformance();

      this.deviceInfo = {
        type: this.detectDeviceType(),
        platform: navigator.platform,
        browser: this.detectBrowser(),
        version: this.detectBrowserVersion(),
        capabilities,
        performance,
      };
    } catch (error) {
      console.error('Failed to initialize device detection:', error);
    }
  }

  private async detectDeviceCapabilities(): Promise<DeviceCapabilities> {
    const capabilities: DeviceCapabilities = {
      webxr: 'xr' in navigator && 'XRSystem' in window,
      webgl: this.checkWebGLSupport(),
      webgl2: this.checkWebGL2Support(),
      webrtc: 'RTCPeerConnection' in window,
      fullscreen: 'requestFullscreen' in document.documentElement,
      pointerLock: 'requestPointerLock' in document.documentElement,
      deviceOrientation: 'DeviceOrientationEvent' in window,
      gamepad: 'getGamepads' in navigator,
      touchscreen: 'ontouchstart' in window,
      camera: false,
      microphone: false,
    };

    // Check media device access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        capabilities.camera = devices.some((device) => device.kind === 'videoinput');
        capabilities.microphone = devices.some((device) => device.kind === 'audioinput');
      } catch (error) {
        console.warn('Could not enumerate media devices:', error);
      }
    }

    return capabilities;
  }

  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (error) {
      return false;
    }
  }

  private checkWebGL2Support(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl2');
    } catch (error) {
      return false;
    }
  }

  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' | 'vr-headset' | 'ar-device' {
    const userAgent = navigator.userAgent.toLowerCase();

    // Check for VR/AR devices
    if (userAgent.includes('oculus') || userAgent.includes('quest') || userAgent.includes('vive')) {
      return 'vr-headset';
    }
    if (userAgent.includes('hololens') || userAgent.includes('magic leap')) {
      return 'ar-device';
    }

    // Check for mobile/tablet
    if (/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      if (/ipad|android(?!.*mobile)/i.test(userAgent)) {
        return 'tablet';
      }
      return 'mobile';
    }

    return 'desktop';
  }

  private detectBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(chrome|firefox|safari|edge)\/(\d+)/i);
    return match ? match[2] : 'Unknown';
  }

  private async measureDevicePerformance(): Promise<any> {
    // Basic performance measurement
    const start = performance.now();

    // Simulate some work to measure performance
    for (let i = 0; i < 100000; i++) {
      Math.random();
    }

    const end = performance.now();
    const computeTime = end - start;

    return {
      fps: 60, // Will be updated during actual rendering
      loadTime: 0,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      cpuUsage: computeTime,
      gpuUsage: 0,
      networkSpeed: (navigator as any).connection?.downlink || 0,
      batteryLevel: await this.getBatteryLevel(),
      thermalState: 'normal',
    };
  }

  private async getBatteryLevel(): Promise<number | undefined> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return battery.level * 100;
      }
    } catch (error) {
      console.warn('Battery API not available:', error);
    }
    return undefined;
  }

  // Tour Management
  async createTour(tourData: Partial<VRTour>): Promise<VRTour> {
    const tour: VRTour = {
      id: this.generateId(),
      propertyId: tourData.propertyId || '',
      title: tourData.title || 'Untitled Tour',
      description: tourData.description || '',
      thumbnailUrl: tourData.thumbnailUrl || '',
      duration: tourData.duration || 0,
      tourType: tourData.tourType || '360',
      quality: tourData.quality || 'hd',
      status: 'draft',
      scenes: [],
      hotspots: [],
      metadata: tourData.metadata || this.getDefaultMetadata(),
      accessibility: tourData.accessibility || this.getDefaultAccessibility(),
      analytics: this.getDefaultAnalytics(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tours.set(tour.id, tour);
    return tour;
  }

  async getTour(tourId: string): Promise<VRTour | null> {
    return this.tours.get(tourId) || null;
  }

  async updateTour(tourId: string, updates: Partial<VRTour>): Promise<VRTour | null> {
    const tour = this.tours.get(tourId);
    if (!tour) return null;

    const updatedTour = {
      ...tour,
      ...updates,
      updatedAt: new Date(),
    };

    this.tours.set(tourId, updatedTour);
    return updatedTour;
  }

  async deleteTour(tourId: string): Promise<boolean> {
    return this.tours.delete(tourId);
  }

  async searchTours(
    filter: VRTourFilter,
    sort: VRTourSort,
    page: number = 1,
    limit: number = 20
  ): Promise<VRTourSearchResult> {
    let tours = Array.from(this.tours.values());

    // Apply filters
    if (filter.propertyType?.length) {
      tours = tours.filter((tour) =>
        filter.propertyType!.includes(tour.metadata.propertyDetails.propertyType)
      );
    }

    if (filter.tourType?.length) {
      tours = tours.filter((tour) => filter.tourType!.includes(tour.tourType));
    }

    if (filter.quality?.length) {
      tours = tours.filter((tour) => filter.quality!.includes(tour.quality));
    }

    if (filter.status?.length) {
      tours = tours.filter((tour) => filter.status!.includes(tour.status));
    }

    // Apply sorting
    tours.sort((a, b) => {
      const aValue = this.getSortValue(a, sort.field);
      const bValue = this.getSortValue(b, sort.field);

      if (sort.order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTours = tours.slice(startIndex, endIndex);

    return {
      tours: paginatedTours,
      total: tours.length,
      page,
      limit,
      hasMore: endIndex < tours.length,
      filters: filter,
      sort,
    };
  }

  private getSortValue(tour: VRTour, field: string): any {
    switch (field) {
      case 'createdAt':
      case 'updatedAt':
        return tour[field].getTime();
      case 'title':
        return tour.title.toLowerCase();
      case 'duration':
        return tour.duration;
      case 'views':
        return tour.analytics.totalViews;
      case 'rating':
        return 0; // Placeholder for rating system
      default:
        return 0;
    }
  }

  // Session Management
  async startTourSession(tourId: string, userId?: string): Promise<VRTourSession> {
    const tour = this.tours.get(tourId);
    if (!tour) {
      throw new Error('Tour not found');
    }

    const session: VRTourSession = {
      id: this.generateId(),
      tourId,
      userId,
      startTime: new Date(),
      device: this.deviceInfo!,
      events: [],
      performance: this.getDefaultPerformanceMetrics(),
      completed: false,
    };

    this.sessions.set(session.id, session);
    this.currentSession = session;

    // Track session start event
    this.trackEvent({
      type: 'scene-enter',
      timestamp: new Date(),
      sessionId: session.id,
      data: { tourId, entryPoint: true },
    });

    return session;
  }

  async endTourSession(sessionId: string): Promise<VRTourSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.endTime = new Date();
    session.duration = session.endTime.getTime() - session.startTime.getTime();

    // Update analytics
    await this.updateTourAnalytics(session.tourId, session);

    this.sessions.set(sessionId, session);

    if (this.currentSession?.id === sessionId) {
      this.currentSession = null;
    }

    return session;
  }

  // Event Tracking
  trackEvent(event: Omit<VRTourEvent, 'timestamp'>): void {
    const fullEvent: VRTourEvent = {
      ...event,
      timestamp: new Date(),
    };

    if (this.currentSession) {
      this.currentSession.events.push(fullEvent);
    }
  }

  // Analytics
  private async updateTourAnalytics(tourId: string, session: VRTourSession): Promise<void> {
    const tour = this.tours.get(tourId);
    if (!tour) return;

    // Update basic metrics
    tour.analytics.totalViews++;
    if (session.userId) {
      tour.analytics.uniqueVisitors++;
    }

    if (session.duration) {
      const currentAvg = tour.analytics.averageViewTime;
      const totalSessions = tour.analytics.totalViews;
      tour.analytics.averageViewTime =
        (currentAvg * (totalSessions - 1) + session.duration) / totalSessions;
    }

    this.tours.set(tourId, tour);
  }

  async getTourAnalytics(tourId: string): Promise<TourAnalytics | null> {
    const tour = this.tours.get(tourId);
    return tour ? tour.analytics : null;
  }

  // Settings Management
  async getUserSettings(userId: string): Promise<VRTourSettings | null> {
    return this.settings.get(userId) || null;
  }

  async updateUserSettings(
    userId: string,
    settings: Partial<VRTourSettings>
  ): Promise<VRTourSettings> {
    const currentSettings = this.settings.get(userId) || this.getDefaultSettings(userId);
    const updatedSettings = { ...currentSettings, ...settings };
    this.settings.set(userId, updatedSettings);
    return updatedSettings;
  }

  // Utility Methods
  private generateId(): string {
    return `vr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultMetadata(): any {
    return {
      propertyDetails: {
        address: '',
        propertyType: 'apartment',
        bedrooms: 0,
        bathrooms: 0,
        squareFootage: 0,
        yearBuilt: new Date().getFullYear(),
        features: [],
        amenities: [],
        neighborhood: '',
      },
      captureInfo: {
        captureDate: new Date(),
        equipment: 'Unknown',
        photographer: 'Unknown',
        processingDate: new Date(),
        software: 'VR Tour Builder',
        version: '1.0.0',
        notes: '',
      },
      technicalSpecs: {
        totalScenes: 0,
        totalHotspots: 0,
        totalFileSize: 0,
        averageLoadTime: 0,
        supportedDevices: [],
        minSystemRequirements: {
          cpu: 'Intel i5 or equivalent',
          gpu: 'DirectX 11 compatible',
          ram: '8GB',
          storage: '1GB',
          bandwidth: '5 Mbps',
          browser: ['Chrome 80+', 'Firefox 75+', 'Safari 13+'],
          webgl: 'WebGL 2.0',
        },
        maxConcurrentUsers: 100,
      },
      seoData: {
        title: '',
        description: '',
        keywords: [],
        ogImage: '',
        ogTitle: '',
        ogDescription: '',
        structuredData: {},
      },
      tags: [],
      categories: [],
    };
  }

  private getDefaultAccessibility(): any {
    return {
      screenReader: false,
      keyboardNavigation: true,
      voiceCommands: false,
      subtitles: false,
      audioDescriptions: false,
      highContrast: false,
      textToSpeech: false,
      gestureControls: false,
      customizations: [],
    };
  }

  private getDefaultAnalytics(): TourAnalytics {
    return {
      totalViews: 0,
      uniqueVisitors: 0,
      averageViewTime: 0,
      completionRate: 0,
      dropoffPoints: [],
      heatmaps: [],
      userInteractions: [],
      deviceBreakdown: [],
      geographicData: [],
      conversionMetrics: {
        inquiryRate: 0,
        bookingRate: 0,
        shareRate: 0,
        favoriteRate: 0,
        contactRate: 0,
        tourCompletionToInquiry: 0,
      },
    };
  }

  private getDefaultPerformanceMetrics(): PerformanceMetrics {
    return {
      averageFPS: 60,
      minFPS: 30,
      maxFPS: 60,
      frameDrops: 0,
      loadTimes: {
        initial: 0,
        sceneTransitions: [],
        assetLoading: [],
        totalAssetSize: 0,
      },
      memoryUsage: {
        peak: 0,
        average: 0,
        current: 0,
        garbageCollections: 0,
      },
      networkMetrics: {
        totalBytesDownloaded: 0,
        averageDownloadSpeed: 0,
        connectionType: 'unknown',
        latency: 0,
        packetLoss: 0,
      },
    };
  }

  private getDefaultSettings(userId: string): VRTourSettings {
    return {
      userId,
      preferences: {
        defaultTourType: '360',
        autoPlay: false,
        showInstructions: true,
        enableAudio: true,
        preferredQuality: 'auto',
        language: 'en',
        favoriteFeatures: [],
      },
      controls: {
        movementSpeed: 1.0,
        rotationSensitivity: 1.0,
        zoomSensitivity: 1.0,
        invertY: false,
        snapTurning: false,
        teleportation: true,
        handTracking: false,
        eyeTracking: false,
        voiceCommands: false,
        gestureControls: false,
      },
      quality: {
        resolution: 'auto',
        frameRate: 'auto',
        antiAliasing: true,
        shadows: true,
        reflections: true,
        particleEffects: true,
        postProcessing: true,
        adaptiveQuality: true,
      },
      accessibility: {
        screenReaderEnabled: false,
        keyboardNavigationEnabled: true,
        voiceCommandsEnabled: false,
        subtitlesEnabled: false,
        audioDescriptionsEnabled: false,
        highContrastEnabled: false,
        textToSpeechEnabled: false,
        motionReductionEnabled: false,
        fontSize: 'medium',
        colorScheme: 'default',
      },
      privacy: {
        allowAnalytics: true,
        allowLocationTracking: false,
        allowDeviceInfo: true,
        allowCookies: true,
        shareUsageData: false,
        personalizedExperience: true,
      },
    };
  }

  // Device and Browser Support
  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  isVRSupported(): boolean {
    return this.deviceInfo?.capabilities.webxr || false;
  }

  isARSupported(): boolean {
    return this.deviceInfo?.capabilities.webxr || false;
  }

  getOptimalQuality(): string {
    if (!this.deviceInfo) return 'medium';

    const { type, performance } = this.deviceInfo;

    if (type === 'mobile' && performance.memoryUsage < 1000000000) {
      return 'low';
    }

    if (type === 'desktop' && performance.memoryUsage > 4000000000) {
      return 'ultra';
    }

    return 'high';
  }
}

export const vrTourService = VRTourService.getInstance();
