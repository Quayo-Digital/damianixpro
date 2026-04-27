/**
 * Mobile Camera Capture Component
 * Provides full-screen camera interface for property photos and document capture
 */

import React, { useEffect, useRef, useState } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Camera,
  RotateCcw,
  Zap,
  ZapOff,
  Settings,
  X,
  Download,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { CapturedPhoto, cameraService } from '@/services/camera/CameraService';

export interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCapture?: (photo: CapturedPhoto) => void;
  onPhotosCapture?: (photos: CapturedPhoto[]) => void;
  mode?: 'single' | 'multiple';
  title?: string;
  maxPhotos?: number;
  showSettings?: boolean;
  autoInitialize?: boolean;
}

export function CameraCapture({
  isOpen,
  onClose,
  onPhotoCapture,
  onPhotosCapture,
  mode = 'single',
  title = 'Capture Photo',
  maxPhotos = 10,
  showSettings = true,
  autoInitialize = true,
}: CameraCaptureProps) {
  const {
    isSupported,
    isInitialized,
    isInitializing,
    isCapturing,
    capabilities,
    settings,
    error,
    photos,
    videoElement,
    initializeCamera,
    capturePhoto,
    switchCamera,
    toggleFlash,
    clearError,
    clearPhotos,
    removePhoto,
    cleanup,
    retryInitialization,
  } = useCamera(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'prompt' | 'unknown'
  >('unknown');

  // Check permission status when component opens
  useEffect(() => {
    if (isOpen) {
      cameraService.checkPermissionStatus().then((status) => {
        setPermissionStatus(status);
      });
    }
  }, [isOpen]);

  // Initialize camera when opened
  useEffect(() => {
    if (isOpen && autoInitialize && !isInitialized && !isInitializing) {
      initializeCamera();
    }
  }, [isOpen, autoInitialize, isInitialized, isInitializing, initializeCamera]);

  // Mount video element
  useEffect(() => {
    if (videoElement && videoContainerRef.current) {
      videoContainerRef.current.appendChild(videoElement);
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.objectFit = 'cover';
      videoElement.style.borderRadius = '0.5rem';
    }

    return () => {
      if (videoElement && videoContainerRef.current?.contains(videoElement)) {
        videoContainerRef.current.removeChild(videoElement);
      }
    };
  }, [videoElement]);

  // Handle photo capture
  const handleCapture = async () => {
    try {
      const photo = await capturePhoto();

      // Show success feedback
      setCaptureSuccess(true);
      setTimeout(() => setCaptureSuccess(false), 1000);

      // Handle single mode
      if (mode === 'single') {
        onPhotoCapture?.(photo);
        onClose();
        return;
      }

      // Handle multiple mode
      if (photos.length >= maxPhotos) {
        alert(`Maximum ${maxPhotos} photos allowed`);
      }
    } catch (error) {
      console.error('Capture failed:', error);
    }
  };

  // Handle multiple photos completion
  const handleCompleteMultiple = () => {
    if (photos.length > 0) {
      onPhotosCapture?.(photos);
      clearPhotos();
      onClose();
    }
  };

  // Handle close
  const handleClose = () => {
    cleanup();
    clearPhotos();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between text-primary-foreground">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <span className="font-medium">{title}</span>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'multiple' && (
              <Badge variant="secondary" className="bg-foreground/20 text-primary-foreground">
                {photos.length}/{maxPhotos}
              </Badge>
            )}

            {showSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                className="text-primary-foreground hover:bg-foreground/20"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-primary-foreground hover:bg-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-full flex-col pb-24 pt-16">
        {/* Camera Not Supported */}
        {!isSupported && !error && (
          <div className="flex flex-1 items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="space-y-4 p-6 text-center">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-orange-500" />
                <h3 className="mb-2 text-lg font-semibold">Camera Not Available</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Your device doesn't support camera access or camera permission was denied.</p>
                  <div className="mt-4 space-y-2 text-left">
                    <p className="font-medium">To enable camera access:</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>Check your browser's camera permissions</li>
                      <li>Ensure you're using HTTPS (required for camera access)</li>
                      <li>Try refreshing the page and allowing camera access when prompted</li>
                      <li>Check if another app is using your camera</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={async () => {
                      // Request permission by trying to initialize
                      clearError();
                      await initializeCamera();
                    }}
                    variant="default"
                    className="flex-1"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Request Access
                  </Button>
                  <Button onClick={retryInitialization} variant="outline" className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button onClick={handleClose} variant="outline" className="flex-1">
                    Close
                  </Button>
                </div>

                {/* Show permission status if available */}
                {permissionStatus !== 'unknown' && (
                  <div className="mt-2 text-center text-xs text-muted-foreground">
                    Permission status:{' '}
                    <span className="font-medium capitalize">{permissionStatus}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-1 items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="space-y-4 p-6 text-center">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                <h3 className="mb-2 text-lg font-semibold">Camera Error</h3>
                <p className="mb-4 text-muted-foreground">{error.message}</p>

                {/* Show specific guidance based on error code */}
                {error.code === 'PERMISSION_DENIED' && (
                  <div className="mt-4 space-y-2 rounded-md bg-muted p-3 text-left text-sm">
                    <p className="font-medium">How to enable camera access:</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>Click the camera icon in your browser's address bar</li>
                      <li>Select "Allow" for camera permissions</li>
                      <li>Refresh the page and try again</li>
                      <li>On mobile: Check Settings → Privacy → Camera</li>
                    </ul>
                  </div>
                )}

                {error.code === 'CAMERA_IN_USE' && (
                  <div className="mt-4 space-y-2 rounded-md bg-muted p-3 text-left text-sm">
                    <p className="font-medium">Camera is in use:</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>Close other apps using the camera (Zoom, Teams, etc.)</li>
                      <li>Check if another browser tab is using the camera</li>
                      <li>Restart your browser if the issue persists</li>
                    </ul>
                  </div>
                )}

                {error.code === 'NO_CAMERA' && (
                  <div className="mt-4 space-y-2 rounded-md bg-muted p-3 text-left text-sm">
                    <p className="font-medium">No camera detected:</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>Ensure your device has a camera</li>
                      <li>Check if camera drivers are installed</li>
                      <li>Try using a different device or browser</li>
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  {error.code === 'PERMISSION_DENIED' && (
                    <Button
                      onClick={async () => {
                        // Request permission by trying to initialize
                        clearError();
                        await initializeCamera();
                      }}
                      className="flex-1"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Request Permission
                    </Button>
                  )}
                  <Button onClick={retryInitialization} className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Close
                  </Button>
                </div>

                {/* Show permission status if available */}
                {permissionStatus !== 'unknown' && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Permission status:{' '}
                    <span className="font-medium capitalize">{permissionStatus}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Initializing */}
        {isInitializing && (
          <div className="flex flex-1 items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <RefreshCw className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-500" />
                <h3 className="mb-2 text-lg font-semibold">Starting Camera</h3>
                <p className="text-muted-foreground">Please allow camera access when prompted...</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Camera View */}
        {isInitialized && !error && (
          <div className="relative flex-1">
            {/* Video Container */}
            <div
              ref={videoContainerRef}
              className="h-full w-full overflow-hidden rounded-lg bg-black"
            />

            {/* Capture Success Overlay */}
            {captureSuccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                <div className="rounded-full bg-green-500 p-4">
                  <CheckCircle className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
            )}

            {/* Settings Panel */}
            {showSettingsPanel && (
              <div className="absolute right-4 top-4 min-w-48 rounded-lg bg-black/80 p-4 text-primary-foreground">
                <h4 className="mb-3 font-medium">Camera Settings</h4>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Camera:</span>
                    <span className="capitalize">{settings.facingMode}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Quality:</span>
                    <span className="capitalize">{settings.resolution}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Format:</span>
                    <span className="uppercase">{settings.format}</span>
                  </div>

                  {capabilities?.supportsFlash && (
                    <div className="flex items-center justify-between">
                      <span>Flash:</span>
                      <span>{settings.enableFlash ? 'On' : 'Off'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Photo Gallery (Multiple Mode) */}
            {mode === 'multiple' && photos.length > 0 && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="rounded-lg bg-black/80 p-3">
                  <div className="flex gap-2 overflow-x-auto">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative flex-shrink-0">
                        <img
                          src={photo.dataUrl}
                          alt="Captured"
                          className="h-16 w-16 rounded border-2 border-border object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removePhoto(photo.id)}
                          className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      {isInitialized && !error && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="flex items-center justify-center gap-6">
            {/* Switch Camera */}
            {capabilities?.hasMultipleCameras && (
              <Button
                variant="ghost"
                size="lg"
                onClick={switchCamera}
                disabled={isInitializing}
                className="h-14 w-14 rounded-full text-primary-foreground hover:bg-foreground/20"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
            )}

            {/* Capture Button */}
            <Button
              onClick={handleCapture}
              disabled={isCapturing || isInitializing}
              className="h-20 w-20 rounded-full border-4 border-border bg-card text-foreground hover:bg-muted"
            >
              {isCapturing ? (
                <RefreshCw className="h-8 w-8 animate-spin" />
              ) : (
                <Camera className="h-8 w-8" />
              )}
            </Button>

            {/* Flash Toggle */}
            {capabilities?.supportsFlash && (
              <Button
                variant="ghost"
                size="lg"
                onClick={toggleFlash}
                className={`h-14 w-14 rounded-full text-primary-foreground hover:bg-foreground/20 ${
                  settings.enableFlash ? 'bg-yellow-500/30' : ''
                }`}
              >
                {settings.enableFlash ? (
                  <Zap className="h-6 w-6" />
                ) : (
                  <ZapOff className="h-6 w-6" />
                )}
              </Button>
            )}

            {/* Complete Multiple Photos */}
            {mode === 'multiple' && photos.length > 0 && (
              <Button
                onClick={handleCompleteMultiple}
                className="rounded-full bg-green-600 px-6 py-3 text-primary-foreground hover:bg-green-700"
              >
                Done ({photos.length})
              </Button>
            )}
          </div>

          {/* Nigerian Network Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-primary-foreground/70">
              📱 Optimized for Nigerian networks • Max {settings.maxFileSize}MB per photo
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CameraCapture;
