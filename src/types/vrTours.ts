// VR/AR Property Tours Types
// Comprehensive type definitions for immersive property experiences

export interface VRTour {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number; // in minutes
  tourType: 'vr' | 'ar' | '360' | 'guided' | 'self-guided';
  quality: 'standard' | 'hd' | '4k' | '8k';
  status: 'draft' | 'processing' | 'published' | 'archived';
  scenes: VRScene[];
  hotspots: VRHotspot[];
  metadata: VRTourMetadata;
  accessibility: AccessibilityFeatures;
  analytics: TourAnalytics;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface VRScene {
  id: string;
  tourId: string;
  name: string;
  description: string;
  roomType: RoomType;
  position: Vector3D;
  rotation: Vector3D;
  mediaAssets: MediaAsset[];
  connections: SceneConnection[];
  annotations: SceneAnnotation[];
  lighting: LightingConfig;
  audio: AudioConfig;
  interactiveElements: InteractiveElement[];
  order: number;
  isEntryPoint: boolean;
}

export interface MediaAsset {
  id: string;
  type: 'panoramic' | 'stereoscopic' | '3d-model' | 'video' | 'image' | 'audio';
  url: string;
  thumbnailUrl?: string;
  format: string; // jpg, mp4, glb, etc.
  resolution: string; // 4096x2048, 1920x1080, etc.
  fileSize: number;
  duration?: number; // for video/audio
  quality: 'low' | 'medium' | 'high' | 'ultra';
  compressionSettings: CompressionSettings;
  metadata: MediaMetadata;
}

export interface VRHotspot {
  id: string;
  sceneId: string;
  type: 'navigation' | 'information' | 'media' | 'interaction' | 'measurement' | 'annotation';
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  title: string;
  description: string;
  icon: string;
  color: string;
  action: HotspotAction;
  visibility: VisibilitySettings;
  animation: AnimationConfig;
  trigger: TriggerConfig;
}

export interface HotspotAction {
  type: 'navigate' | 'show-info' | 'play-media' | 'toggle-visibility' | 'measure' | 'bookmark' | 'share' | 'contact';
  targetSceneId?: string;
  mediaUrl?: string;
  infoContent?: string;
  customAction?: string;
  parameters?: Record<string, any>;
}

export interface SceneConnection {
  id: string;
  fromSceneId: string;
  toSceneId: string;
  transitionType: 'fade' | 'slide' | 'zoom' | 'teleport' | 'walk';
  transitionDuration: number;
  direction: Vector3D;
  doorway?: DoorwayConfig;
}

export interface SceneAnnotation {
  id: string;
  type: 'text' | 'arrow' | 'highlight' | 'measurement' | 'feature' | 'warning';
  position: Vector3D;
  content: string;
  style: AnnotationStyle;
  visibility: VisibilitySettings;
  interactive: boolean;
}

export interface InteractiveElement {
  id: string;
  type: 'furniture' | 'appliance' | 'fixture' | 'door' | 'window' | 'switch' | 'custom';
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  model3DUrl?: string;
  actions: InteractiveAction[];
  states: ElementState[];
  currentState: string;
}

export interface InteractiveAction {
  id: string;
  type: 'click' | 'hover' | 'drag' | 'rotate' | 'scale' | 'toggle' | 'animate';
  trigger: string;
  effect: ActionEffect;
  sound?: string;
  haptic?: HapticFeedback;
}

export interface ActionEffect {
  type: 'state-change' | 'animation' | 'sound' | 'particle' | 'lighting' | 'material-change';
  parameters: Record<string, any>;
  duration?: number;
  easing?: string;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface LightingConfig {
  ambientLight: {
    color: string;
    intensity: number;
  };
  directionalLights: DirectionalLight[];
  pointLights: PointLight[];
  environmentMap?: string;
  shadows: boolean;
  shadowQuality: 'low' | 'medium' | 'high';
}

export interface DirectionalLight {
  color: string;
  intensity: number;
  direction: Vector3D;
  castShadow: boolean;
}

export interface PointLight {
  color: string;
  intensity: number;
  position: Vector3D;
  distance: number;
  decay: number;
  castShadow: boolean;
}

export interface AudioConfig {
  backgroundMusic?: string;
  ambientSounds: AmbientSound[];
  spatialAudio: boolean;
  volume: number;
  fadeIn: boolean;
  fadeOut: boolean;
}

export interface AmbientSound {
  url: string;
  volume: number;
  loop: boolean;
  position?: Vector3D;
  maxDistance?: number;
}

export interface VRTourMetadata {
  propertyDetails: PropertyDetails;
  captureInfo: CaptureInfo;
  technicalSpecs: TechnicalSpecs;
  seoData: SEOData;
  tags: string[];
  categories: string[];
}

export interface PropertyDetails {
  address: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  yearBuilt: number;
  features: string[];
  amenities: string[];
  neighborhood: string;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface CaptureInfo {
  captureDate: Date;
  equipment: string;
  photographer: string;
  processingDate: Date;
  software: string;
  version: string;
  notes: string;
}

export interface TechnicalSpecs {
  totalScenes: number;
  totalHotspots: number;
  totalFileSize: number;
  averageLoadTime: number;
  supportedDevices: DeviceSupport[];
  minSystemRequirements: SystemRequirements;
  maxConcurrentUsers: number;
}

export interface DeviceSupport {
  type: 'desktop' | 'mobile' | 'tablet' | 'vr-headset' | 'ar-device';
  platform: string;
  minVersion: string;
  features: string[];
  performance: 'excellent' | 'good' | 'fair' | 'limited';
}

export interface SystemRequirements {
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  bandwidth: string;
  browser: string[];
  webgl: string;
  webxr?: boolean;
}

export interface AccessibilityFeatures {
  screenReader: boolean;
  keyboardNavigation: boolean;
  voiceCommands: boolean;
  subtitles: boolean;
  audioDescriptions: boolean;
  highContrast: boolean;
  textToSpeech: boolean;
  gestureControls: boolean;
  customizations: AccessibilityCustomization[];
}

export interface AccessibilityCustomization {
  type: 'font-size' | 'color-scheme' | 'motion-reduction' | 'audio-cues' | 'haptic-feedback';
  options: string[];
  defaultValue: string;
}

export interface TourAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  averageViewTime: number;
  completionRate: number;
  dropoffPoints: DropoffPoint[];
  heatmaps: HeatmapData[];
  userInteractions: InteractionData[];
  deviceBreakdown: DeviceAnalytics[];
  geographicData: GeographicAnalytics[];
  conversionMetrics: ConversionMetrics;
}

export interface DropoffPoint {
  sceneId: string;
  sceneName: string;
  dropoffRate: number;
  averageTimeSpent: number;
  commonExitReasons: string[];
}

export interface HeatmapData {
  sceneId: string;
  interactionPoints: InteractionPoint[];
  gazeDuration: GazeData[];
  clickDensity: ClickData[];
}

export interface InteractionPoint {
  position: Vector3D;
  interactionCount: number;
  averageDuration: number;
  interactionType: string;
}

export interface GazeData {
  position: Vector3D;
  duration: number;
  frequency: number;
}

export interface ClickData {
  position: Vector3D;
  clickCount: number;
  clickType: string;
}

export interface InteractionData {
  hotspotId: string;
  interactionType: string;
  count: number;
  averageEngagementTime: number;
  conversionRate: number;
}

export interface DeviceAnalytics {
  deviceType: string;
  platform: string;
  userCount: number;
  averagePerformance: number;
  crashRate: number;
  loadTime: number;
}

export interface GeographicAnalytics {
  country: string;
  region: string;
  city: string;
  userCount: number;
  averageViewTime: number;
  conversionRate: number;
}

export interface ConversionMetrics {
  inquiryRate: number;
  bookingRate: number;
  shareRate: number;
  favoriteRate: number;
  contactRate: number;
  tourCompletionToInquiry: number;
}

export interface VRTourSettings {
  userId: string;
  preferences: UserPreferences;
  controls: ControlSettings;
  quality: QualitySettings;
  accessibility: AccessibilitySettings;
  privacy: PrivacySettings;
}

export interface UserPreferences {
  defaultTourType: 'vr' | 'ar' | '360';
  autoPlay: boolean;
  showInstructions: boolean;
  enableAudio: boolean;
  preferredQuality: 'auto' | 'low' | 'medium' | 'high' | 'ultra';
  language: string;
  subtitleLanguage?: string;
  favoriteFeatures: string[];
}

export interface ControlSettings {
  movementSpeed: number;
  rotationSensitivity: number;
  zoomSensitivity: number;
  invertY: boolean;
  snapTurning: boolean;
  teleportation: boolean;
  handTracking: boolean;
  eyeTracking: boolean;
  voiceCommands: boolean;
  gestureControls: boolean;
}

export interface QualitySettings {
  resolution: 'auto' | '1080p' | '1440p' | '4k' | '8k';
  frameRate: 'auto' | '30fps' | '60fps' | '90fps' | '120fps';
  antiAliasing: boolean;
  shadows: boolean;
  reflections: boolean;
  particleEffects: boolean;
  postProcessing: boolean;
  adaptiveQuality: boolean;
}

export interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  keyboardNavigationEnabled: boolean;
  voiceCommandsEnabled: boolean;
  subtitlesEnabled: boolean;
  audioDescriptionsEnabled: boolean;
  highContrastEnabled: boolean;
  textToSpeechEnabled: boolean;
  motionReductionEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorScheme: 'default' | 'high-contrast' | 'dark' | 'light';
}

export interface PrivacySettings {
  allowAnalytics: boolean;
  allowLocationTracking: boolean;
  allowDeviceInfo: boolean;
  allowCookies: boolean;
  shareUsageData: boolean;
  personalizedExperience: boolean;
}

export interface VRTourError extends Error {
  code: string;
  details?: any;
  recoverable: boolean;
  userMessage: string;
}

export interface VRTourEvent {
  type: 'scene-enter' | 'scene-exit' | 'hotspot-click' | 'interaction' | 'error' | 'completion';
  timestamp: Date;
  sceneId?: string;
  hotspotId?: string;
  data?: any;
  userId?: string;
  sessionId: string;
}

export interface VRTourSession {
  id: string;
  tourId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  device: DeviceInfo;
  events: VRTourEvent[];
  performance: PerformanceMetrics;
  completed: boolean;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'vr-headset' | 'ar-device';
  platform: string;
  browser: string;
  version: string;
  capabilities: DeviceCapabilities;
  performance: DevicePerformance;
}

export interface DeviceCapabilities {
  webxr: boolean;
  webgl: boolean;
  webgl2: boolean;
  webrtc: boolean;
  fullscreen: boolean;
  pointerLock: boolean;
  deviceOrientation: boolean;
  gamepad: boolean;
  touchscreen: boolean;
  camera: boolean;
  microphone: boolean;
}

export interface DevicePerformance {
  fps: number;
  loadTime: number;
  memoryUsage: number;
  cpuUsage: number;
  gpuUsage: number;
  networkSpeed: number;
  batteryLevel?: number;
  thermalState?: string;
}

export interface PerformanceMetrics {
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  frameDrops: number;
  loadTimes: LoadTimeMetrics;
  memoryUsage: MemoryUsageMetrics;
  networkMetrics: NetworkMetrics;
}

export interface LoadTimeMetrics {
  initial: number;
  sceneTransitions: number[];
  assetLoading: number[];
  totalAssetSize: number;
}

export interface MemoryUsageMetrics {
  peak: number;
  average: number;
  current: number;
  garbageCollections: number;
}

export interface NetworkMetrics {
  totalBytesDownloaded: number;
  averageDownloadSpeed: number;
  connectionType: string;
  latency: number;
  packetLoss: number;
}

// Utility types
export type RoomType = 'living-room' | 'bedroom' | 'kitchen' | 'bathroom' | 'dining-room' | 'office' | 'garage' | 'basement' | 'attic' | 'balcony' | 'garden' | 'hallway' | 'closet' | 'laundry' | 'storage' | 'other';

export type TourQuality = 'low' | 'medium' | 'high' | 'ultra';
export type TourStatus = 'draft' | 'processing' | 'published' | 'archived';
export type TourType = 'vr' | 'ar' | '360' | 'guided' | 'self-guided';

export interface CompressionSettings {
  quality: number;
  format: string;
  progressive: boolean;
  optimization: string;
}

export interface MediaMetadata {
  width: number;
  height: number;
  bitrate?: number;
  codec?: string;
  colorSpace?: string;
  frameRate?: number;
  channels?: number;
  sampleRate?: number;
}

export interface AnnotationStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  opacity: number;
  shadow: boolean;
}

export interface VisibilitySettings {
  always: boolean;
  onHover: boolean;
  onClick: boolean;
  distance: {
    min: number;
    max: number;
  };
  angle: {
    min: number;
    max: number;
  };
}

export interface AnimationConfig {
  type: 'none' | 'pulse' | 'bounce' | 'rotate' | 'scale' | 'fade' | 'custom';
  duration: number;
  easing: string;
  loop: boolean;
  delay: number;
}

export interface TriggerConfig {
  type: 'immediate' | 'proximity' | 'gaze' | 'click' | 'voice' | 'gesture' | 'time';
  parameters: Record<string, any>;
  conditions: TriggerCondition[];
}

export interface TriggerCondition {
  type: 'user-state' | 'scene-state' | 'time' | 'interaction-count' | 'custom';
  operator: 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'contains';
  value: any;
}

export interface DoorwayConfig {
  position: Vector3D;
  size: Vector3D;
  shape: 'rectangle' | 'arch' | 'circle' | 'custom';
  frame: boolean;
  frameColor: string;
  transparency: number;
}

export interface ElementState {
  id: string;
  name: string;
  properties: Record<string, any>;
  transitions: StateTransition[];
}

export interface StateTransition {
  fromState: string;
  toState: string;
  trigger: string;
  animation: AnimationConfig;
  sound?: string;
}

export interface HapticFeedback {
  type: 'vibration' | 'force' | 'texture' | 'temperature';
  intensity: number;
  duration: number;
  pattern?: number[];
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  ogTitle: string;
  ogDescription: string;
  structuredData: Record<string, any>;
}

// Export utility functions types
export type VRTourFilter = {
  propertyType?: string[];
  tourType?: TourType[];
  quality?: TourQuality[];
  status?: TourStatus[];
  priceRange?: [number, number];
  location?: string;
  features?: string[];
  dateRange?: [Date, Date];
};

export type VRTourSort = {
  field: 'createdAt' | 'updatedAt' | 'title' | 'duration' | 'views' | 'rating';
  order: 'asc' | 'desc';
};

export type VRTourSearchResult = {
  tours: VRTour[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  filters: VRTourFilter;
  sort: VRTourSort;
};
