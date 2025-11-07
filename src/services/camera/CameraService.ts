/**
 * Mobile Camera Service for Nigeria Homes Platform
 * Provides comprehensive camera functionality for property photos, documents, and inspections
 */

export interface CameraCapabilities {
  hasCamera: boolean;
  hasMultipleCameras: boolean;
  supportsFacingMode: boolean;
  supportsFlash: boolean;
  supportsZoom: boolean;
  maxResolution: { width: number; height: number };
  supportedFormats: string[];
}

export interface CameraSettings {
  facingMode: 'user' | 'environment';
  resolution: 'low' | 'medium' | 'high' | 'ultra';
  quality: number; // 0.1 to 1.0
  format: 'jpeg' | 'png' | 'webp';
  enableFlash: boolean;
  enableZoom: boolean;
  maxFileSize: number; // in MB
}

export interface CapturedPhoto {
  id: string;
  blob: Blob;
  dataUrl: string;
  filename: string;
  size: number;
  timestamp: Date;
  location?: { latitude: number; longitude: number };
  metadata: {
    width: number;
    height: number;
    format: string;
    quality: number;
    facingMode: string;
  };
}

export interface CameraError {
  code: string;
  message: string;
  details?: any;
}

export class CameraService {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private capabilities: CameraCapabilities | null = null;
  private settings: CameraSettings;
  private isInitialized = false;

  constructor() {
    this.settings = {
      facingMode: 'environment', // Default to back camera for property photos
      resolution: 'high',
      quality: 0.85,
      format: 'jpeg',
      enableFlash: false,
      enableZoom: false,
      maxFileSize: 10 // 10MB max for Nigerian networks
    };
  }

  /**
   * Check if camera is available and get capabilities
   */
  async checkCameraSupport(): Promise<CameraCapabilities> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          hasCamera: false,
          hasMultipleCameras: false,
          supportsFacingMode: false,
          supportsFlash: false,
          supportsZoom: false,
          maxResolution: { width: 0, height: 0 },
          supportedFormats: []
        };
      }

      // Check available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      const capabilities: CameraCapabilities = {
        hasCamera: videoDevices.length > 0,
        hasMultipleCameras: videoDevices.length > 1,
        supportsFacingMode: true,
        supportsFlash: false,
        supportsZoom: false,
        maxResolution: { width: 1920, height: 1080 },
        supportedFormats: ['jpeg', 'png', 'webp']
      };

      // Test camera access
      if (capabilities.hasCamera) {
        try {
          const testStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          
          const track = testStream.getVideoTracks()[0];
          const trackCapabilities = track.getCapabilities();
          
          capabilities.supportsFlash = 'torch' in trackCapabilities;
          capabilities.supportsZoom = 'zoom' in trackCapabilities;
          
          if (trackCapabilities.width && trackCapabilities.height) {
            capabilities.maxResolution = {
              width: trackCapabilities.width.max || 1920,
              height: trackCapabilities.height.max || 1080
            };
          }

          testStream.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.warn('Camera test failed:', error);
        }
      }

      this.capabilities = capabilities;
      return capabilities;
    } catch (error) {
      console.error('Camera support check failed:', error);
      throw this.createCameraError('SUPPORT_CHECK_FAILED', 'Failed to check camera support', error);
    }
  }

  /**
   * Initialize camera with specified settings
   */
  async initializeCamera(customSettings?: Partial<CameraSettings>): Promise<void> {
    try {
      if (customSettings) {
        this.settings = { ...this.settings, ...customSettings };
      }

      if (!this.capabilities) {
        await this.checkCameraSupport();
      }

      if (!this.capabilities?.hasCamera) {
        throw this.createCameraError('NO_CAMERA', 'No camera available on this device');
      }

      // Get resolution constraints
      const resolution = this.getResolutionConstraints();
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.settings.facingMode,
          width: resolution.width,
          height: resolution.height,
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      };

      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Create video element
      this.video = document.createElement('video');
      this.video.srcObject = this.stream;
      this.video.autoplay = true;
      this.video.playsInline = true;
      this.video.muted = true;

      // Create canvas for photo capture
      this.canvas = document.createElement('canvas');

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        if (!this.video) return reject(new Error('Video element not created'));
        
        this.video.onloadedmetadata = () => resolve();
        this.video.onerror = () => reject(new Error('Video loading failed'));
        
        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('Camera initialization timeout')), 10000);
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Camera initialization failed:', error);
      this.cleanup();
      throw this.createCameraError('INIT_FAILED', 'Failed to initialize camera', error);
    }
  }

  /**
   * Capture photo with current settings
   */
  async capturePhoto(): Promise<CapturedPhoto> {
    try {
      if (!this.isInitialized || !this.video || !this.canvas) {
        throw this.createCameraError('NOT_INITIALIZED', 'Camera not initialized');
      }

      const video = this.video;
      const canvas = this.canvas;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw this.createCameraError('CANVAS_ERROR', 'Failed to get canvas context');
      }

      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          `image/${this.settings.format}`,
          this.settings.quality
        );
      });

      // Check file size (Nigerian network optimization)
      const sizeMB = blob.size / (1024 * 1024);
      if (sizeMB > this.settings.maxFileSize) {
        throw this.createCameraError('FILE_TOO_LARGE', 
          `Photo size (${sizeMB.toFixed(1)}MB) exceeds limit (${this.settings.maxFileSize}MB)`);
      }

      // Create data URL
      const dataUrl = canvas.toDataURL(`image/${this.settings.format}`, this.settings.quality);

      // Get location if available
      let location: { latitude: number; longitude: number } | undefined;
      try {
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: false
            });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        }
      } catch (error) {
        console.warn('Location access failed:', error);
      }

      const photo: CapturedPhoto = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        blob,
        dataUrl,
        filename: `property_photo_${new Date().toISOString().replace(/[:.]/g, '-')}.${this.settings.format}`,
        size: blob.size,
        timestamp: new Date(),
        location,
        metadata: {
          width: canvas.width,
          height: canvas.height,
          format: this.settings.format,
          quality: this.settings.quality,
          facingMode: this.settings.facingMode
        }
      };

      return photo;
    } catch (error) {
      console.error('Photo capture failed:', error);
      throw this.createCameraError('CAPTURE_FAILED', 'Failed to capture photo', error);
    }
  }

  /**
   * Switch between front and back camera
   */
  async switchCamera(): Promise<void> {
    try {
      if (!this.capabilities?.hasMultipleCameras) {
        throw this.createCameraError('NO_MULTIPLE_CAMERAS', 'Device has only one camera');
      }

      const newFacingMode = this.settings.facingMode === 'user' ? 'environment' : 'user';
      
      // Stop current stream
      this.cleanup();
      
      // Reinitialize with new facing mode
      await this.initializeCamera({ facingMode: newFacingMode });
    } catch (error) {
      console.error('Camera switch failed:', error);
      throw this.createCameraError('SWITCH_FAILED', 'Failed to switch camera', error);
    }
  }

  /**
   * Toggle flash/torch (if supported)
   */
  async toggleFlash(): Promise<boolean> {
    try {
      if (!this.capabilities?.supportsFlash || !this.stream) {
        throw this.createCameraError('FLASH_NOT_SUPPORTED', 'Flash not supported on this device');
      }

      const track = this.stream.getVideoTracks()[0];
      const newFlashState = !this.settings.enableFlash;
      
      await track.applyConstraints({
        advanced: [{ torch: newFlashState }]
      });

      this.settings.enableFlash = newFlashState;
      return newFlashState;
    } catch (error) {
      console.error('Flash toggle failed:', error);
      throw this.createCameraError('FLASH_FAILED', 'Failed to toggle flash', error);
    }
  }

  /**
   * Update camera settings
   */
  updateSettings(newSettings: Partial<CameraSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current settings
   */
  getSettings(): CameraSettings {
    return { ...this.settings };
  }

  /**
   * Get camera capabilities
   */
  getCapabilities(): CameraCapabilities | null {
    return this.capabilities;
  }

  /**
   * Get video element for preview
   */
  getVideoElement(): HTMLVideoElement | null {
    return this.video;
  }

  /**
   * Check if camera is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }

    this.canvas = null;
    this.isInitialized = false;
  }

  /**
   * Get resolution constraints based on settings
   */
  private getResolutionConstraints() {
    const resolutions = {
      low: { width: 640, height: 480 },
      medium: { width: 1280, height: 720 },
      high: { width: 1920, height: 1080 },
      ultra: { width: 3840, height: 2160 }
    };

    return resolutions[this.settings.resolution] || resolutions.high;
  }

  /**
   * Create standardized camera error
   */
  private createCameraError(code: string, message: string, details?: any): CameraError {
    return { code, message, details };
  }
}

// Singleton instance
export const cameraService = new CameraService();
