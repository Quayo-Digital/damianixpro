/**
 * Camera Button Component
 * Quick access camera button for property photos and document capture
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Image as ImageIcon, FileText, Home } from 'lucide-react';
import CameraCapture from './CameraCapture';
import { CapturedPhoto } from '@/services/camera/CameraService';

export interface CameraButtonProps {
  onPhotoCapture?: (photo: CapturedPhoto) => void;
  onPhotosCapture?: (photos: CapturedPhoto[]) => void;
  mode?: 'single' | 'multiple';
  variant?: 'property' | 'document' | 'general';
  size?: 'sm' | 'md' | 'lg';
  maxPhotos?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const variantConfig = {
  property: {
    title: 'Property Photos',
    icon: Home,
    description: 'Capture property images',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  document: {
    title: 'Document Scan',
    icon: FileText,
    description: 'Scan documents',
    color: 'bg-green-600 hover:bg-green-700',
  },
  general: {
    title: 'Take Photo',
    icon: Camera,
    description: 'Capture image',
    color: 'bg-gray-600 hover:bg-gray-700',
  },
};

const sizeConfig = {
  sm: {
    button: 'h-8 px-3 text-xs',
    icon: 'h-3 w-3',
  },
  md: {
    button: 'h-10 px-4 text-sm',
    icon: 'h-4 w-4',
  },
  lg: {
    button: 'h-12 px-6 text-base',
    icon: 'h-5 w-5',
  },
};

export function CameraButton({
  onPhotoCapture,
  onPhotosCapture,
  mode = 'single',
  variant = 'general',
  size = 'md',
  maxPhotos = 10,
  disabled = false,
  className = '',
  children,
}: CameraButtonProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);

  const config = variantConfig[variant];
  const sizeStyles = sizeConfig[size];
  const IconComponent = config.icon;

  const handlePhotoCapture = (photo: CapturedPhoto) => {
    setCapturedCount((prev) => prev + 1);
    onPhotoCapture?.(photo);
  };

  const handlePhotosCapture = (photos: CapturedPhoto[]) => {
    setCapturedCount((prev) => prev + photos.length);
    onPhotosCapture?.(photos);
  };

  return (
    <>
      <Button
        onClick={() => setIsCameraOpen(true)}
        disabled={disabled}
        className={`
          ${config.color} 
          ${sizeStyles.button} 
          relative text-white
          ${className}
        `}
      >
        <IconComponent className={`${sizeStyles.icon} mr-2`} />
        {children || (
          <>
            <Camera className={`${sizeStyles.icon} mr-2`} />
            {size === 'lg' ? config.title : 'Camera'}
          </>
        )}

        {capturedCount > 0 && (
          <Badge
            variant="secondary"
            className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center bg-orange-500 p-0 text-xs text-white"
          >
            {capturedCount}
          </Badge>
        )}
      </Button>

      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCapture={handlePhotoCapture}
        onPhotosCapture={handlePhotosCapture}
        mode={mode}
        title={config.title}
        maxPhotos={maxPhotos}
      />
    </>
  );
}

export default CameraButton;
