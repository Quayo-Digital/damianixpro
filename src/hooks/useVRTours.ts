// VR/AR Property Tours React Hook
// Comprehensive hook for managing immersive property experiences

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { vrTourService } from '@/services/vr/vrTourService';
import { useSubscription } from '@/hooks/useSubscription';
import {
  VRTour,
  VRScene,
  VRHotspot,
  VRTourSession,
  VRTourSettings,
  VRTourFilter,
  VRTourSort,
  VRTourSearchResult,
  DeviceInfo,
  TourAnalytics,
  VRTourEvent,
} from '@/types/vrTours';

interface UseVRToursOptions {
  userId?: string;
  autoStart?: boolean;
  enableAnalytics?: boolean;
  enablePerformanceMonitoring?: boolean;
}

interface UseVRToursReturn {
  // Tour Management
  tours: VRTour[];
  currentTour: VRTour | null;
  isLoading: boolean;
  error: Error | null;

  // Search and Filtering
  searchTours: (
    filter: VRTourFilter,
    sort: VRTourSort,
    page?: number
  ) => Promise<VRTourSearchResult>;
  searchResults: VRTourSearchResult | null;
  isSearching: boolean;

  // Tour Operations
  createTour: (tourData: Partial<VRTour>) => Promise<VRTour>;
  updateTour: (tourId: string, updates: Partial<VRTour>) => Promise<VRTour | null>;
  deleteTour: (tourId: string) => Promise<boolean>;
  getTour: (tourId: string) => Promise<VRTour | null>;

  // Scene Management
  addScene: (tourId: string, sceneData: Partial<VRScene>) => Promise<VRScene | null>;
  updateScene: (
    tourId: string,
    sceneId: string,
    updates: Partial<VRScene>
  ) => Promise<VRScene | null>;
  deleteScene: (tourId: string, sceneId: string) => Promise<boolean>;

  // Hotspot Management
  addHotspot: (tourId: string, hotspotData: Partial<VRHotspot>) => Promise<VRHotspot | null>;
  updateHotspot: (
    tourId: string,
    hotspotId: string,
    updates: Partial<VRHotspot>
  ) => Promise<VRHotspot | null>;
  deleteHotspot: (tourId: string, hotspotId: string) => Promise<boolean>;

  // Session Management
  currentSession: VRTourSession | null;
  startTourSession: (tourId: string) => Promise<VRTourSession>;
  endTourSession: () => Promise<VRTourSession | null>;
  trackEvent: (event: Omit<VRTourEvent, 'timestamp' | 'sessionId'>) => void;

  // Settings and Preferences
  userSettings: VRTourSettings | null;
  updateSettings: (settings: Partial<VRTourSettings>) => Promise<VRTourSettings>;

  // Device and Capabilities
  deviceInfo: DeviceInfo | null;
  isVRSupported: boolean;
  isARSupported: boolean;
  optimalQuality: string;

  // Analytics
  analytics: TourAnalytics | null;
  getAnalytics: (tourId: string) => Promise<TourAnalytics | null>;

  // Subscription and Feature Access
  hasVRAccess: boolean;
  hasARAccess: boolean;
  hasPremiumFeatures: boolean;
  canCreateTours: boolean;
  canUseAdvancedFeatures: boolean;

  // Utility Functions
  refreshTours: () => void;
  clearCache: () => void;
  exportTour: (tourId: string) => Promise<Blob>;
  importTour: (file: File) => Promise<VRTour>;
}

export function useVRTours(options: UseVRToursOptions = {}): UseVRToursReturn {
  const {
    userId,
    autoStart = false,
    enableAnalytics = true,
    enablePerformanceMonitoring = true,
  } = options;

  const queryClient = useQueryClient();
  const { hasFeatureAccess, checkFeatureUsage } = useSubscription();

  // State
  const [currentTour, setCurrentTour] = useState<VRTour | null>(null);
  const [currentSession, setCurrentSession] = useState<VRTourSession | null>(null);
  const [searchResults, setSearchResults] = useState<VRTourSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [analytics, setAnalytics] = useState<TourAnalytics | null>(null);

  // Refs
  const sessionRef = useRef<VRTourSession | null>(null);
  const eventQueueRef = useRef<VRTourEvent[]>([]);

  // Feature Access Checks
  const hasVRAccess = hasFeatureAccess('vr_tours');
  const hasARAccess = hasFeatureAccess('ar_tours');
  const hasPremiumFeatures = hasFeatureAccess('premium_vr_features');
  const canCreateTours = hasFeatureAccess('create_vr_tours');
  const canUseAdvancedFeatures = hasFeatureAccess('advanced_vr_features');

  // Device Information
  const deviceInfo = vrTourService.getDeviceInfo();
  const isVRSupported = vrTourService.isVRSupported();
  const isARSupported = vrTourService.isARSupported();
  const optimalQuality = vrTourService.getOptimalQuality();

  // Tours Query
  const {
    data: tours = [],
    isLoading,
    error,
    refetch: refreshTours,
  } = useQuery({
    queryKey: ['vr-tours', userId],
    queryFn: async () => {
      if (!hasVRAccess) {
        throw new Error('VR Tours access not available in your subscription plan');
      }

      // Simulate fetching tours from API
      const mockTours: VRTour[] = [];
      return mockTours;
    },
    enabled: hasVRAccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  // User Settings Query
  const { data: userSettings } = useQuery({
    queryKey: ['vr-settings', userId],
    queryFn: () => vrTourService.getUserSettings(userId || ''),
    enabled: !!userId && hasVRAccess,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Tour Operations
  const createTourMutation = useMutation({
    mutationFn: async (tourData: Partial<VRTour>) => {
      if (!canCreateTours) {
        throw new Error('Creating VR tours is not available in your subscription plan');
      }

      const canCreate = await checkFeatureUsage('create_vr_tours');
      if (!canCreate) {
        throw new Error('You have reached your VR tour creation limit');
      }

      return vrTourService.createTour(tourData);
    },
    onSuccess: (newTour) => {
      queryClient.invalidateQueries({ queryKey: ['vr-tours'] });
      toast.success('VR tour created successfully');
      setCurrentTour(newTour);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create VR tour: ${error.message}`);
    },
  });

  const updateTourMutation = useMutation({
    mutationFn: async ({ tourId, updates }: { tourId: string; updates: Partial<VRTour> }) => {
      return vrTourService.updateTour(tourId, updates);
    },
    onSuccess: (updatedTour) => {
      if (updatedTour) {
        queryClient.invalidateQueries({ queryKey: ['vr-tours'] });
        toast.success('VR tour updated successfully');
        if (currentTour?.id === updatedTour.id) {
          setCurrentTour(updatedTour);
        }
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to update VR tour: ${error.message}`);
    },
  });

  const deleteTourMutation = useMutation({
    mutationFn: async (tourId: string) => {
      return vrTourService.deleteTour(tourId);
    },
    onSuccess: (success, tourId) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['vr-tours'] });
        toast.success('VR tour deleted successfully');
        if (currentTour?.id === tourId) {
          setCurrentTour(null);
        }
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete VR tour: ${error.message}`);
    },
  });

  // Scene Operations
  const addSceneMutation = useMutation({
    mutationFn: async ({ tourId, sceneData }: { tourId: string; sceneData: Partial<VRScene> }) => {
      if (!hasPremiumFeatures && tours.find((t) => t.id === tourId)?.scenes.length >= 5) {
        throw new Error('Scene limit reached. Upgrade to Premium for unlimited scenes.');
      }

      return vrTourService.addScene(tourId, sceneData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vr-tours'] });
      toast.success('Scene added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add scene: ${error.message}`);
    },
  });

  const updateSceneMutation = useMutation({
    mutationFn: async ({
      tourId,
      sceneId,
      updates,
    }: {
      tourId: string;
      sceneId: string;
      updates: Partial<VRScene>;
    }) => {
      return vrTourService.updateScene(tourId, sceneId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vr-tours'] });
      toast.success('Scene updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update scene: ${error.message}`);
    },
  });

  const deleteSceneMutation = useMutation({
    mutationFn: async ({ tourId, sceneId }: { tourId: string; sceneId: string }) => {
      return vrTourService.deleteScene(tourId, sceneId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vr-tours'] });
      toast.success('Scene deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete scene: ${error.message}`);
    },
  });

  // Hotspot Operations
  const addHotspotMutation = useMutation({
    mutationFn: async ({
      tourId,
      hotspotData,
    }: {
      tourId: string;
      hotspotData: Partial<VRHotspot>;
    }) => {
      return vrTourService.addHotspot(tourId, hotspotData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vr-tours'] });
      toast.success('Hotspot added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add hotspot: ${error.message}`);
    },
  });

  // Settings Operations
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<VRTourSettings>) => {
      if (!userId) throw new Error('User ID required');
      return vrTourService.updateUserSettings(userId, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vr-settings', userId] });
      toast.success('VR settings updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  // Session Management
  const startTourSession = useCallback(
    async (tourId: string): Promise<VRTourSession> => {
      if (!hasVRAccess) {
        throw new Error('VR Tours access not available');
      }

      try {
        const session = await vrTourService.startTourSession(tourId, userId);
        setCurrentSession(session);
        sessionRef.current = session;

        if (enableAnalytics) {
          // Start analytics tracking
          trackEvent({
            type: 'scene-enter',
            data: { tourId, sessionStart: true },
          });
        }

        return session;
      } catch (error) {
        toast.error('Failed to start VR tour session');
        throw error;
      }
    },
    [hasVRAccess, userId, enableAnalytics]
  );

  const endTourSession = useCallback(async (): Promise<VRTourSession | null> => {
    if (!sessionRef.current) return null;

    try {
      const session = await vrTourService.endTourSession(sessionRef.current.id);
      setCurrentSession(null);
      sessionRef.current = null;

      if (enableAnalytics && session) {
        // Process final analytics
        const analytics = await vrTourService.getTourAnalytics(session.tourId);
        setAnalytics(analytics);
      }

      return session;
    } catch (error) {
      toast.error('Failed to end VR tour session');
      throw error;
    }
  }, [enableAnalytics]);

  // Event Tracking
  const trackEvent = useCallback(
    (event: Omit<VRTourEvent, 'timestamp' | 'sessionId'>) => {
      if (!enableAnalytics || !sessionRef.current) return;

      const fullEvent: VRTourEvent = {
        ...event,
        timestamp: new Date(),
        sessionId: sessionRef.current.id,
        userId,
      };

      vrTourService.trackEvent(fullEvent);
      eventQueueRef.current.push(fullEvent);
    },
    [enableAnalytics, userId]
  );

  // Search Tours
  const searchTours = useCallback(
    async (
      filter: VRTourFilter,
      sort: VRTourSort,
      page: number = 1
    ): Promise<VRTourSearchResult> => {
      if (!hasVRAccess) {
        throw new Error('VR Tours access not available');
      }

      setIsSearching(true);
      try {
        const results = await vrTourService.searchTours(filter, sort, page);
        setSearchResults(results);
        return results;
      } catch (error) {
        toast.error('Failed to search VR tours');
        throw error;
      } finally {
        setIsSearching(false);
      }
    },
    [hasVRAccess]
  );

  // Analytics
  const getAnalytics = useCallback(
    async (tourId: string): Promise<TourAnalytics | null> => {
      if (!hasPremiumFeatures) {
        toast.error('Analytics are available in Premium plans only');
        return null;
      }

      try {
        const analytics = await vrTourService.getTourAnalytics(tourId);
        setAnalytics(analytics);
        return analytics;
      } catch (error) {
        toast.error('Failed to fetch tour analytics');
        return null;
      }
    },
    [hasPremiumFeatures]
  );

  // Utility Functions
  const clearCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['vr-tours'] });
    queryClient.removeQueries({ queryKey: ['vr-settings'] });
    setSearchResults(null);
    setAnalytics(null);
  }, [queryClient]);

  const exportTour = useCallback(
    async (tourId: string): Promise<Blob> => {
      if (!canUseAdvancedFeatures) {
        throw new Error('Tour export is available in Premium plans only');
      }

      const tour = await vrTourService.getTour(tourId);
      if (!tour) {
        throw new Error('Tour not found');
      }

      const exportData = {
        tour,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      return new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
    },
    [canUseAdvancedFeatures]
  );

  const importTour = useCallback(
    async (file: File): Promise<VRTour> => {
      if (!canCreateTours) {
        throw new Error('Tour import requires tour creation permissions');
      }

      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.tour) {
        throw new Error('Invalid tour file format');
      }

      // Create new tour from imported data
      const tourData = {
        ...importData.tour,
        id: undefined, // Generate new ID
        createdAt: undefined,
        updatedAt: undefined,
        status: 'draft' as const,
      };

      return createTourMutation.mutateAsync(tourData);
    },
    [canCreateTours, createTourMutation]
  );

  // Auto-start session if enabled
  useEffect(() => {
    if (autoStart && currentTour && !currentSession && hasVRAccess) {
      startTourSession(currentTour.id).catch(console.error);
    }
  }, [autoStart, currentTour, currentSession, hasVRAccess, startTourSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        endTourSession().catch(console.error);
      }
    };
  }, [endTourSession]);

  return {
    // Tour Management
    tours,
    currentTour,
    isLoading,
    error,

    // Search and Filtering
    searchTours,
    searchResults,
    isSearching,

    // Tour Operations
    createTour: createTourMutation.mutateAsync,
    updateTour: (tourId: string, updates: Partial<VRTour>) =>
      updateTourMutation.mutateAsync({ tourId, updates }),
    deleteTour: deleteTourMutation.mutateAsync,
    getTour: vrTourService.getTour.bind(vrTourService),

    // Scene Management
    addScene: (tourId: string, sceneData: Partial<VRScene>) =>
      addSceneMutation.mutateAsync({ tourId, sceneData }),
    updateScene: (tourId: string, sceneId: string, updates: Partial<VRScene>) =>
      updateSceneMutation.mutateAsync({ tourId, sceneId, updates }),
    deleteScene: (tourId: string, sceneId: string) =>
      deleteSceneMutation.mutateAsync({ tourId, sceneId }),

    // Hotspot Management
    addHotspot: (tourId: string, hotspotData: Partial<VRHotspot>) =>
      addHotspotMutation.mutateAsync({ tourId, hotspotData }),
    updateHotspot: async (tourId: string, hotspotId: string, updates: Partial<VRHotspot>) => {
      // Implementation would go here
      return null;
    },
    deleteHotspot: async (tourId: string, hotspotId: string) => {
      // Implementation would go here
      return false;
    },

    // Session Management
    currentSession,
    startTourSession,
    endTourSession,
    trackEvent,

    // Settings and Preferences
    userSettings,
    updateSettings: updateSettingsMutation.mutateAsync,

    // Device and Capabilities
    deviceInfo,
    isVRSupported,
    isARSupported,
    optimalQuality,

    // Analytics
    analytics,
    getAnalytics,

    // Subscription and Feature Access
    hasVRAccess,
    hasARAccess,
    hasPremiumFeatures,
    canCreateTours,
    canUseAdvancedFeatures,

    // Utility Functions
    refreshTours,
    clearCache,
    exportTour,
    importTour,
  };
}
