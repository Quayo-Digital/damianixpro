// VR/AR Property Tour Viewer Component
// Immersive property viewing experience with VR/AR support

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVRTours } from '@/hooks/useVRTours';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  Minimize,
  RotateCcw,
  Navigation,
  Eye,
  Headphones,
  Smartphone,
  Monitor,
  Glasses,
  Info,
  MapPin,
  Clock,
  Users,
  Share2,
  Download,
  Heart,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Move3D,
  MousePointer,
  Gamepad2,
  Mic,
  Camera,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';
import { VRTour, VRScene, VRHotspot, VRTourSession } from '@/types/vrTours';

interface VRTourViewerProps {
  tourId: string;
  className?: string;
  autoStart?: boolean;
  showControls?: boolean;
  showInfo?: boolean;
  enableVR?: boolean;
  enableAR?: boolean;
  onTourComplete?: (session: VRTourSession) => void;
  onSceneChange?: (scene: VRScene) => void;
  onHotspotClick?: (hotspot: VRHotspot) => void;
}

export function VRTourViewer({
  tourId,
  className,
  autoStart = false,
  showControls = true,
  showInfo = true,
  enableVR = true,
  enableAR = true,
  onTourComplete,
  onSceneChange,
  onHotspotClick
}: VRTourViewerProps) {
  const {
    currentTour,
    currentSession,
    startTourSession,
    endTourSession,
    trackEvent,
    deviceInfo,
    isVRSupported,
    isARSupported,
    hasVRAccess,
    hasARAccess,
    userSettings
  } = useVRTours({ autoStart });

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [quality, setQuality] = useState('auto');
  const [viewMode, setViewMode] = useState<'360' | 'vr' | 'ar'>('360');
  const [showHotspots, setShowHotspots] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tourProgress, setTourProgress] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Refs
  const viewerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout>();

  // Mock tour data for demonstration
  const mockTour: VRTour = {
    id: tourId,
    propertyId: 'prop_123',
    title: 'Luxury 3BR Apartment in Victoria Island',
    description: 'Experience this stunning waterfront apartment with panoramic views of Lagos.',
    thumbnailUrl: '/api/placeholder/800/600',
    duration: 8,
    tourType: '360',
    quality: 'hd',
    status: 'published',
    scenes: [
      {
        id: 'scene_1',
        tourId,
        name: 'Living Room',
        description: 'Spacious living area with modern furnishing',
        roomType: 'living-room',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        mediaAssets: [
          {
            id: 'asset_1',
            type: 'panoramic',
            url: '/api/placeholder/4096/2048',
            format: 'jpg',
            resolution: '4096x2048',
            fileSize: 2048000,
            quality: 'high',
            compressionSettings: { quality: 85, format: 'webp', progressive: true, optimization: 'web' },
            metadata: { width: 4096, height: 2048 }
          }
        ],
        connections: [],
        annotations: [],
        lighting: {
          ambientLight: { color: '#ffffff', intensity: 0.4 },
          directionalLights: [],
          pointLights: [],
          shadows: true,
          shadowQuality: 'medium'
        },
        audio: {
          ambientSounds: [],
          spatialAudio: true,
          volume: 0.7,
          fadeIn: true,
          fadeOut: true
        },
        interactiveElements: [],
        order: 0,
        isEntryPoint: true
      },
      {
        id: 'scene_2',
        tourId,
        name: 'Master Bedroom',
        description: 'Elegant master suite with ensuite bathroom',
        roomType: 'bedroom',
        position: { x: 10, y: 0, z: 0 },
        rotation: { x: 0, y: 90, z: 0 },
        mediaAssets: [
          {
            id: 'asset_2',
            type: 'panoramic',
            url: '/api/placeholder/4096/2048',
            format: 'jpg',
            resolution: '4096x2048',
            fileSize: 1856000,
            quality: 'high',
            compressionSettings: { quality: 85, format: 'webp', progressive: true, optimization: 'web' },
            metadata: { width: 4096, height: 2048 }
          }
        ],
        connections: [],
        annotations: [],
        lighting: {
          ambientLight: { color: '#ffffff', intensity: 0.4 },
          directionalLights: [],
          pointLights: [],
          shadows: true,
          shadowQuality: 'medium'
        },
        audio: {
          ambientSounds: [],
          spatialAudio: true,
          volume: 0.7,
          fadeIn: true,
          fadeOut: true
        },
        interactiveElements: [],
        order: 1,
        isEntryPoint: false
      }
    ],
    hotspots: [
      {
        id: 'hotspot_1',
        sceneId: 'scene_1',
        type: 'navigation',
        position: { x: 2, y: 1, z: -3 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        title: 'Go to Bedroom',
        description: 'Navigate to the master bedroom',
        icon: 'arrow-right',
        color: '#3b82f6',
        action: { type: 'navigate', targetSceneId: 'scene_2' },
        visibility: { always: true, onHover: false, onClick: false, distance: { min: 0, max: 100 }, angle: { min: 0, max: 360 } },
        animation: { type: 'pulse', duration: 2000, easing: 'ease-in-out', loop: true, delay: 0 },
        trigger: { type: 'click', parameters: {}, conditions: [] }
      }
    ],
    metadata: {
      propertyDetails: {
        address: '123 Tiamiyu Savage Street, Victoria Island, Lagos',
        propertyType: 'apartment',
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: 1200,
        yearBuilt: 2020,
        features: ['Ocean View', 'Modern Kitchen', 'Balcony', 'Parking'],
        amenities: ['Pool', 'Gym', 'Security', '24/7 Power'],
        neighborhood: 'Victoria Island'
      },
      captureInfo: {
        captureDate: new Date('2024-01-15'),
        equipment: 'Insta360 Pro 2',
        photographer: 'Lagos VR Studios',
        processingDate: new Date('2024-01-16'),
        software: 'Matterport',
        version: '3.0',
        notes: 'High-quality 8K capture'
      },
      technicalSpecs: {
        totalScenes: 2,
        totalHotspots: 1,
        totalFileSize: 4000000,
        averageLoadTime: 3.2,
        supportedDevices: [],
        minSystemRequirements: {
          cpu: 'Intel i5 or equivalent',
          gpu: 'DirectX 11 compatible',
          ram: '8GB',
          storage: '1GB',
          bandwidth: '5 Mbps',
          browser: ['Chrome 80+', 'Firefox 75+', 'Safari 13+'],
          webgl: 'WebGL 2.0'
        },
        maxConcurrentUsers: 100
      },
      seoData: {
        title: 'Virtual Tour - Luxury Apartment Victoria Island',
        description: 'Take a virtual tour of this stunning 3-bedroom apartment',
        keywords: ['virtual tour', 'apartment', 'Lagos', 'Victoria Island'],
        ogImage: '/api/placeholder/1200/630',
        ogTitle: 'Virtual Property Tour',
        ogDescription: 'Immersive 360° property viewing experience',
        structuredData: {}
      },
      tags: ['luxury', 'waterfront', 'modern'],
      categories: ['residential', 'apartment']
    },
    accessibility: {
      screenReader: false,
      keyboardNavigation: true,
      voiceCommands: false,
      subtitles: false,
      audioDescriptions: false,
      highContrast: false,
      textToSpeech: false,
      gestureControls: false,
      customizations: []
    },
    analytics: {
      totalViews: 1247,
      uniqueVisitors: 892,
      averageViewTime: 4.2,
      completionRate: 68,
      dropoffPoints: [],
      heatmaps: [],
      userInteractions: [],
      deviceBreakdown: [],
      geographicData: [],
      conversionMetrics: {
        inquiryRate: 12,
        bookingRate: 3,
        shareRate: 8,
        favoriteRate: 15,
        contactRate: 7,
        tourCompletionToInquiry: 18
      }
    },
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-16')
  };

  // Initialize tour session
  useEffect(() => {
    if (autoStart && hasVRAccess) {
      handleStartTour();
    }
  }, [autoStart, hasVRAccess]);

  // Session timer
  useEffect(() => {
    if (currentSession && isPlaying) {
      sessionTimerRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [currentSession, isPlaying]);

  // Tour controls
  const handleStartTour = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate loading
      for (let i = 0; i <= 100; i += 10) {
        setLoadingProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const session = await startTourSession(tourId);
      setIsPlaying(true);
      setIsLoading(false);
      
      trackEvent({
        type: 'scene-enter',
        sceneId: mockTour.scenes[0].id,
        data: { viewMode, quality }
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start tour');
      setIsLoading(false);
    }
  }, [tourId, startTourSession, trackEvent, viewMode, quality]);

  const handleStopTour = useCallback(async () => {
    try {
      setIsPlaying(false);
      const session = await endTourSession();
      
      if (session && onTourComplete) {
        onTourComplete(session);
      }
      
      setSessionDuration(0);
      setTourProgress(0);
      setCurrentSceneIndex(0);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to stop tour');
    }
  }, [endTourSession, onTourComplete]);

  const handleSceneChange = useCallback((sceneIndex: number) => {
    if (sceneIndex >= 0 && sceneIndex < mockTour.scenes.length) {
      setCurrentSceneIndex(sceneIndex);
      const scene = mockTour.scenes[sceneIndex];
      
      trackEvent({
        type: 'scene-enter',
        sceneId: scene.id,
        data: { fromScene: mockTour.scenes[currentSceneIndex]?.id }
      });
      
      if (onSceneChange) {
        onSceneChange(scene);
      }
      
      // Update progress
      setTourProgress((sceneIndex + 1) / mockTour.scenes.length * 100);
    }
  }, [currentSceneIndex, trackEvent, onSceneChange]);

  const handleHotspotClick = useCallback((hotspot: VRHotspot) => {
    trackEvent({
      type: 'hotspot-click',
      hotspotId: hotspot.id,
      data: { hotspotType: hotspot.type, action: hotspot.action.type }
    });
    
    if (hotspot.action.type === 'navigate' && hotspot.action.targetSceneId) {
      const targetSceneIndex = mockTour.scenes.findIndex(s => s.id === hotspot.action.targetSceneId);
      if (targetSceneIndex !== -1) {
        handleSceneChange(targetSceneIndex);
      }
    }
    
    if (onHotspotClick) {
      onHotspotClick(hotspot);
    }
  }, [trackEvent, onHotspotClick, handleSceneChange]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentScene = mockTour.scenes[currentSceneIndex];
  const sceneHotspots = mockTour.hotspots.filter(h => h.sceneId === currentScene?.id);

  if (!hasVRAccess) {
    return (
      <FeatureGate 
        feature="vr_tours"
        fallback={
          <Card className={className}>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Glasses className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">VR Tours Available in Premium</h3>
                <p className="text-muted-foreground">
                  Upgrade to access immersive virtual reality property tours
                </p>
                <Button>Upgrade Now</Button>
              </div>
            </CardContent>
          </Card>
        }
      >
        <div />
      </FeatureGate>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden", className)} ref={viewerRef}>
      {/* Tour Header */}
      {showInfo && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{mockTour.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{mockTour.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{mockTour.tourType.toUpperCase()}</Badge>
              <Badge variant="outline">{mockTour.quality.toUpperCase()}</Badge>
              {mockTour.analytics.totalViews > 0 && (
                <Badge variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  {mockTour.analytics.totalViews.toLocaleString()}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Loading VR Tour...</p>
                <Progress value={loadingProgress} className="w-64" />
                <p className="text-xs text-muted-foreground">{loadingProgress}% complete</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert className="m-4">
            <Eye className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Viewer */}
        <div className="relative aspect-video bg-black">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ display: isLoading ? 'none' : 'block' }}
          />
          
          {/* Placeholder for actual 360/VR content */}
          {!isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
              <div className="text-center text-white space-y-4">
                <Glasses className="h-16 w-16 mx-auto opacity-50" />
                <p className="text-lg font-medium">VR Tour Viewer</p>
                <p className="text-sm opacity-75">
                  Scene: {currentScene?.name} ({currentSceneIndex + 1}/{mockTour.scenes.length})
                </p>
                {sceneHotspots.length > 0 && showHotspots && (
                  <div className="space-y-2">
                    <p className="text-xs opacity-60">Interactive Hotspots:</p>
                    {sceneHotspots.map(hotspot => (
                      <Button
                        key={hotspot.id}
                        variant="outline"
                        size="sm"
                        className="mx-1"
                        onClick={() => handleHotspotClick(hotspot)}
                      >
                        {hotspot.title}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tour Controls Overlay */}
          {showControls && !isLoading && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-background/90 backdrop-blur-sm rounded-lg p-4 space-y-3">
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Progress</span>
                    <span>{Math.round(tourProgress)}%</span>
                  </div>
                  <Progress value={tourProgress} />
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {!isPlaying ? (
                      <Button size="sm" onClick={handleStartTour}>
                        <Play className="h-4 w-4 mr-1" />
                        Start Tour
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={handleStopTour}>
                        <Square className="h-4 w-4 mr-1" />
                        Stop
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSceneChange(Math.max(0, currentSceneIndex - 1))}
                      disabled={currentSceneIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSceneChange(Math.min(mockTour.scenes.length - 1, currentSceneIndex + 1))}
                      disabled={currentSceneIndex === mockTour.scenes.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {currentSession && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(sessionDuration)}
                      </Badge>
                    )}
                    
                    <Button size="sm" variant="outline" onClick={toggleFullscreen}>
                      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* View Mode Selector */}
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    size="sm"
                    variant={viewMode === '360' ? 'default' : 'outline'}
                    onClick={() => setViewMode('360')}
                  >
                    <Monitor className="h-4 w-4 mr-1" />
                    360°
                  </Button>
                  
                  {isVRSupported && hasVRAccess && (
                    <Button
                      size="sm"
                      variant={viewMode === 'vr' ? 'default' : 'outline'}
                      onClick={() => setViewMode('vr')}
                    >
                      <Glasses className="h-4 w-4 mr-1" />
                      VR
                    </Button>
                  )}
                  
                  {isARSupported && hasARAccess && (
                    <Button
                      size="sm"
                      variant={viewMode === 'ar' ? 'default' : 'outline'}
                      onClick={() => setViewMode('ar')}
                    >
                      <Smartphone className="h-4 w-4 mr-1" />
                      AR
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions Overlay */}
          {showInstructions && !isLoading && (
            <div className="absolute top-4 right-4">
              <Card className="w-64">
                <CardContent className="p-3">
                  <div className="space-y-2 text-xs">
                    <p className="font-medium">Navigation:</p>
                    <p>• Click and drag to look around</p>
                    <p>• Click hotspots to navigate</p>
                    <p>• Use controls to change scenes</p>
                    {viewMode === 'vr' && <p>• Put on VR headset for immersion</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 w-full"
                    onClick={() => setShowInstructions(false)}
                  >
                    Got it
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Property Info Panel */}
        {showInfo && (
          <div className="p-4 border-t">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="scenes">Scenes</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Property Type</p>
                    <p className="text-muted-foreground capitalize">{mockTour.metadata.propertyDetails.propertyType}</p>
                  </div>
                  <div>
                    <p className="font-medium">Bedrooms</p>
                    <p className="text-muted-foreground">{mockTour.metadata.propertyDetails.bedrooms}</p>
                  </div>
                  <div>
                    <p className="font-medium">Square Footage</p>
                    <p className="text-muted-foreground">{mockTour.metadata.propertyDetails.squareFootage} sq ft</p>
                  </div>
                  <div>
                    <p className="font-medium">Year Built</p>
                    <p className="text-muted-foreground">{mockTour.metadata.propertyDetails.yearBuilt}</p>
                  </div>
                </div>
                
                <div>
                  <p className="font-medium text-sm mb-2">Features</p>
                  <div className="flex flex-wrap gap-1">
                    {mockTour.metadata.propertyDetails.features.map(feature => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="scenes" className="space-y-2">
                {mockTour.scenes.map((scene, index) => (
                  <div
                    key={scene.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-muted/50",
                      currentSceneIndex === index && "bg-muted"
                    )}
                    onClick={() => handleSceneChange(index)}
                  >
                    <div>
                      <p className="font-medium text-sm">{scene.name}</p>
                      <p className="text-xs text-muted-foreground">{scene.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {scene.roomType}
                    </Badge>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="stats" className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Total Views</p>
                    <p className="text-muted-foreground">{mockTour.analytics.totalViews.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Completion Rate</p>
                    <p className="text-muted-foreground">{mockTour.analytics.completionRate}%</p>
                  </div>
                  <div>
                    <p className="font-medium">Avg. View Time</p>
                    <p className="text-muted-foreground">{mockTour.analytics.averageViewTime} min</p>
                  </div>
                  <div>
                    <p className="font-medium">Inquiries</p>
                    <p className="text-muted-foreground">{mockTour.analytics.conversionMetrics.inquiryRate}%</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
