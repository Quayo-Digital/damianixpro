/**
 * React Hook for Camera Functionality
 * Provides camera access, photo capture, and state management for mobile users
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  cameraService,
  CameraCapabilities,
  CameraSettings,
  CapturedPhoto,
  CameraError,
} from '@/services/camera/CameraService';

export interface CameraState {
  isSupported: boolean;
  isInitialized: boolean;
  isInitializing: boolean;
  isCapturing: boolean;
  capabilities: CameraCapabilities | null;
  settings: CameraSettings;
  error: CameraError | null;
  photos: CapturedPhoto[];
  videoElement: HTMLVideoElement | null;
}

export interface CameraActions {
  initializeCamera: (customSettings?: Partial<CameraSettings>) => Promise<void>;
  capturePhoto: () => Promise<CapturedPhoto>;
  switchCamera: () => Promise<void>;
  toggleFlash: () => Promise<boolean>;
  updateSettings: (newSettings: Partial<CameraSettings>) => void;
  clearError: () => void;
  clearPhotos: () => void;
  removePhoto: (photoId: string) => void;
  cleanup: () => void;
  retryInitialization: () => Promise<void>;
}

export interface UseCameraReturn extends CameraState, CameraActions {}

export function useCamera(autoInitialize = false): UseCameraReturn {
  const [state, setState] = useState<CameraState>({
    isSupported: false,
    isInitialized: false,
    isInitializing: false,
    isCapturing: false,
    capabilities: null,
    settings: cameraService.getSettings(),
    error: null,
    photos: [],
    videoElement: null,
  });

  const initializationAttempted = useRef(false);
  const mountedRef = useRef(true);

  // Safe state update helper
  const safeSetState = useCallback((updater: (prev: CameraState) => CameraState) => {
    if (mountedRef.current) {
      setState(updater);
    }
  }, []);

  // Check camera support on mount
  useEffect(() => {
    let isMounted = true;

    const checkSupport = async () => {
      try {
        const capabilities = await cameraService.checkCameraSupport();

        if (isMounted) {
          safeSetState((prev) => ({
            ...prev,
            isSupported: capabilities.hasCamera,
            capabilities,
            error: null,
          }));

          // Auto-initialize if requested and camera is supported
          if (autoInitialize && capabilities.hasCamera && !initializationAttempted.current) {
            initializationAttempted.current = true;
            await initializeCamera();
          }
        }
      } catch (error) {
        if (isMounted) {
          safeSetState((prev) => ({
            ...prev,
            isSupported: false,
            error: error as CameraError,
          }));
        }
      }
    };

    checkSupport();

    return () => {
      isMounted = false;
    };
  }, [autoInitialize, safeSetState]);

  // Initialize camera
  const initializeCamera = useCallback(
    async (customSettings?: Partial<CameraSettings>) => {
      if (!mountedRef.current) return;

      safeSetState((prev) => ({
        ...prev,
        isInitializing: true,
        error: null,
      }));

      try {
        await cameraService.initializeCamera(customSettings);

        if (mountedRef.current) {
          const videoElement = cameraService.getVideoElement();
          const settings = cameraService.getSettings();

          safeSetState((prev) => ({
            ...prev,
            isInitialized: true,
            isInitializing: false,
            settings,
            videoElement,
            error: null,
          }));
        }
      } catch (error) {
        if (mountedRef.current) {
          safeSetState((prev) => ({
            ...prev,
            isInitialized: false,
            isInitializing: false,
            error: error as CameraError,
          }));
        }
      }
    },
    [safeSetState]
  );

  // Capture photo
  const capturePhoto = useCallback(async (): Promise<CapturedPhoto> => {
    if (!mountedRef.current) throw new Error('Component unmounted');

    safeSetState((prev) => ({
      ...prev,
      isCapturing: true,
      error: null,
    }));

    try {
      const photo = await cameraService.capturePhoto();

      if (mountedRef.current) {
        safeSetState((prev) => ({
          ...prev,
          isCapturing: false,
          photos: [...prev.photos, photo],
        }));
      }

      return photo;
    } catch (error) {
      if (mountedRef.current) {
        safeSetState((prev) => ({
          ...prev,
          isCapturing: false,
          error: error as CameraError,
        }));
      }
      throw error;
    }
  }, [safeSetState]);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (!mountedRef.current) return;

    safeSetState((prev) => ({
      ...prev,
      isInitializing: true,
      error: null,
    }));

    try {
      await cameraService.switchCamera();

      if (mountedRef.current) {
        const videoElement = cameraService.getVideoElement();
        const settings = cameraService.getSettings();

        safeSetState((prev) => ({
          ...prev,
          isInitializing: false,
          settings,
          videoElement,
        }));
      }
    } catch (error) {
      if (mountedRef.current) {
        safeSetState((prev) => ({
          ...prev,
          isInitializing: false,
          error: error as CameraError,
        }));
      }
    }
  }, [safeSetState]);

  // Toggle flash
  const toggleFlash = useCallback(async (): Promise<boolean> => {
    if (!mountedRef.current) return false;

    try {
      const flashState = await cameraService.toggleFlash();

      if (mountedRef.current) {
        const settings = cameraService.getSettings();
        safeSetState((prev) => ({
          ...prev,
          settings,
          error: null,
        }));
      }

      return flashState;
    } catch (error) {
      if (mountedRef.current) {
        safeSetState((prev) => ({
          ...prev,
          error: error as CameraError,
        }));
      }
      return false;
    }
  }, [safeSetState]);

  // Update settings
  const updateSettings = useCallback(
    (newSettings: Partial<CameraSettings>) => {
      if (!mountedRef.current) return;

      cameraService.updateSettings(newSettings);
      const settings = cameraService.getSettings();

      safeSetState((prev) => ({
        ...prev,
        settings,
      }));
    },
    [safeSetState]
  );

  // Clear error
  const clearError = useCallback(() => {
    if (!mountedRef.current) return;

    safeSetState((prev) => ({
      ...prev,
      error: null,
    }));
  }, [safeSetState]);

  // Clear all photos
  const clearPhotos = useCallback(() => {
    if (!mountedRef.current) return;

    safeSetState((prev) => ({
      ...prev,
      photos: [],
    }));
  }, [safeSetState]);

  // Remove specific photo
  const removePhoto = useCallback(
    (photoId: string) => {
      if (!mountedRef.current) return;

      safeSetState((prev) => ({
        ...prev,
        photos: prev.photos.filter((photo) => photo.id !== photoId),
      }));
    },
    [safeSetState]
  );

  // Retry initialization
  const retryInitialization = useCallback(async () => {
    if (!mountedRef.current) return;

    clearError();
    await initializeCamera();
  }, [clearError, initializeCamera]);

  // Cleanup
  const cleanup = useCallback(() => {
    cameraService.cleanup();

    if (mountedRef.current) {
      safeSetState((prev) => ({
        ...prev,
        isInitialized: false,
        isInitializing: false,
        isCapturing: false,
        videoElement: null,
        error: null,
      }));
    }
  }, [safeSetState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cameraService.cleanup();
    };
  }, []);

  return {
    // State
    isSupported: state.isSupported,
    isInitialized: state.isInitialized,
    isInitializing: state.isInitializing,
    isCapturing: state.isCapturing,
    capabilities: state.capabilities,
    settings: state.settings,
    error: state.error,
    photos: state.photos,
    videoElement: state.videoElement,

    // Actions
    initializeCamera,
    capturePhoto,
    switchCamera,
    toggleFlash,
    updateSettings,
    clearError,
    clearPhotos,
    removePhoto,
    cleanup,
    retryInitialization,
  };
}
