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
  Image as ImageIcon
} from 'lucide-react';
import { CapturedPhoto } from '@/services/camera/CameraService';

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
  autoInitialize = true
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
    retryInitialization
  } = useCamera(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);

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
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <span className="font-medium">{title}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {mode === 'multiple' && (
              <Badge variant="secondary" className="bg-white/20 text-white">
                {photos.length}/{maxPhotos}
              </Badge>
            )}
            
            {showSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                className="text-white hover:bg-white/20"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col h-full pt-16 pb-24">
        {/* Camera Not Supported */}
        {!isSupported && (
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Camera Not Available</h3>
                <p className="text-muted-foreground mb-4">
                  Your device doesn't support camera access or camera permission was denied.
                </p>
                <Button onClick={handleClose} className="w-full">
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
                <p className="text-muted-foreground mb-4">{error.message}</p>
                <div className="flex gap-2">
                  <Button onClick={retryInitialization} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Initializing */}
        {isInitializing && (
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <RefreshCw className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2">Starting Camera</h3>
                <p className="text-muted-foreground">
                  Please allow camera access when prompted...
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Camera View */}
        {isInitialized && !error && (
          <div className="flex-1 relative">
            {/* Video Container */}
            <div 
              ref={videoContainerRef}
              className="w-full h-full bg-black rounded-lg overflow-hidden"
            />

            {/* Capture Success Overlay */}
            {captureSuccess && (
              <div className="absolute inset-0 bg-white/30 flex items-center justify-center">
                <div className="bg-green-500 rounded-full p-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
            )}

            {/* Settings Panel */}
            {showSettingsPanel && (
              <div className="absolute top-4 right-4 bg-black/80 rounded-lg p-4 text-white min-w-48">
                <h4 className="font-medium mb-3">Camera Settings</h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Camera:</span>
                    <span className="capitalize">{settings.facingMode}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Quality:</span>
                    <span className="capitalize">{settings.resolution}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Format:</span>
                    <span className="uppercase">{settings.format}</span>
                  </div>
                  
                  {capabilities?.supportsFlash && (
                    <div className="flex justify-between items-center">
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
                <div className="bg-black/80 rounded-lg p-3">
                  <div className="flex gap-2 overflow-x-auto">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative flex-shrink-0">
                        <img
                          src={photo.dataUrl}
                          alt="Captured"
                          className="w-16 h-16 object-cover rounded border-2 border-white/50"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removePhoto(photo.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
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
                className="text-white hover:bg-white/20 w-14 h-14 rounded-full"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
            )}

            {/* Capture Button */}
            <Button
              onClick={handleCapture}
              disabled={isCapturing || isInitializing}
              className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 text-black border-4 border-white/50"
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
                className={`text-white hover:bg-white/20 w-14 h-14 rounded-full ${
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
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full"
              >
                Done ({photos.length})
              </Button>
            )}
          </div>

          {/* Nigerian Network Info */}
          <div className="text-center mt-4">
            <p className="text-white/70 text-xs">
              📱 Optimized for Nigerian networks • Max {settings.maxFileSize}MB per photo
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CameraCapture;
