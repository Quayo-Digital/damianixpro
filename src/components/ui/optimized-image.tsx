import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Image optimization utilities
export const ImageOptimizer = {
  // Convert image to WebP format
  convertToWebP: (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to convert image to WebP'));
              }
            },
            'image/webp',
            0.8
          ); // 80% quality
        } else {
          reject(new Error('Canvas context not available'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  },

  // Resize image to specific dimensions
  resizeImage: (file: File, maxWidth: number, maxHeight: number, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to resize image'));
              }
            },
            'image/webp',
            quality
          );
        } else {
          reject(new Error('Canvas context not available'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  },

  // Generate multiple image sizes (responsive images)
  generateResponsiveImages: async (
    file: File
  ): Promise<{
    thumbnail: Blob;
    medium: Blob;
    large: Blob;
    original: Blob;
  }> => {
    const [thumbnail, medium, large, original] = await Promise.all([
      ImageOptimizer.resizeImage(file, 150, 150, 0.7), // Thumbnail
      ImageOptimizer.resizeImage(file, 400, 300, 0.8), // Medium
      ImageOptimizer.resizeImage(file, 800, 600, 0.85), // Large
      ImageOptimizer.convertToWebP(file), // Original size in WebP
    ]);

    return { thumbnail, medium, large, original };
  },

  // Check WebP support
  supportsWebP: (): Promise<boolean> => {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  },
};

// Lazy loading hook
export const useLazyLoading = (threshold = 0.1) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsIntersecting(true);
          setHasLoaded(true);
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, hasLoaded]);

  return { ref, isIntersecting, hasLoaded };
};

// Optimized Image Component
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  lazy?: boolean;
  placeholder?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  lazy = true,
  placeholder,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [webpSupported, setWebpSupported] = useState<boolean | null>(null);
  const { ref, isIntersecting } = useLazyLoading();

  // Check WebP support on mount
  useEffect(() => {
    ImageOptimizer.supportsWebP().then(setWebpSupported);
  }, []);

  // Determine if image should load
  const shouldLoad = !lazy || priority || isIntersecting;

  // Generate responsive image URLs
  const generateImageUrl = (baseSrc: string, size?: string) => {
    if (!baseSrc) return '';

    // If it's already a data URL or external URL, return as-is
    if (baseSrc.startsWith('data:') || baseSrc.startsWith('http')) {
      return baseSrc;
    }

    // Generate optimized URL based on size and WebP support
    const extension = webpSupported ? '.webp' : '.jpg';
    const sizeParam = size ? `_${size}` : '';

    // Remove existing extension and add optimized one
    const baseUrl = baseSrc.replace(/\.[^/.]+$/, '');
    return `${baseUrl}${sizeParam}${extension}`;
  };

  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (!webpSupported) return undefined;

    const sizes = ['400w', '800w', '1200w'];
    return sizes
      .map((size) => `${generateImageUrl(src, size.replace('w', ''))} ${size}`)
      .join(', ');
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Placeholder component
  const PlaceholderComponent = () => (
    <div
      className={cn('flex animate-pulse items-center justify-center bg-gray-200', className)}
      style={{ width, height }}
    >
      {placeholder ? (
        <img src={placeholder} alt="" className="opacity-50" />
      ) : (
        <div className="text-sm text-gray-400">Loading...</div>
      )}
    </div>
  );

  // Error component
  const ErrorComponent = () => (
    <div
      className={cn(
        'flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-100',
        className
      )}
      style={{ width, height }}
    >
      <div className="text-center text-gray-500">
        <svg className="mx-auto mb-2 h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <div className="text-xs">Image unavailable</div>
      </div>
    </div>
  );

  if (hasError) {
    return <ErrorComponent />;
  }

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      {!shouldLoad && <PlaceholderComponent />}

      {shouldLoad && (
        <>
          {!isLoaded && <PlaceholderComponent />}

          <img
            src={generateImageUrl(src)}
            srcSet={generateSrcSet()}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            loading={lazy && !priority ? 'lazy' : 'eager'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
          />
        </>
      )}
    </div>
  );
};

// Property Image Gallery Component with optimization
interface PropertyImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({
  images,
  alt,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  if (!images || images.length === 0) {
    return (
      <div
        className={cn('flex h-64 items-center justify-center rounded-lg bg-gray-200', className)}
      >
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto mb-2 h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <div>No images available</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Main image */}
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <OptimizedImage
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          className="h-full w-full object-cover"
          priority={currentIndex === 0}
          onLoad={() => setIsLoading(false)}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-gray-200">
            <div className="text-gray-400">Loading image...</div>
          </div>
        )}

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 transform rounded-full bg-black bg-opacity-50 p-2 text-white transition-opacity hover:bg-opacity-70"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={() => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 transform rounded-full bg-black bg-opacity-50 p-2 text-white transition-opacity hover:bg-opacity-70"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 rounded bg-black bg-opacity-50 px-2 py-1 text-sm text-white">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="mt-2 flex space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2',
                currentIndex === index ? 'border-blue-500' : 'border-gray-300'
              )}
            >
              <OptimizedImage
                src={image}
                alt={`${alt} - Thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
                lazy={index > 2} // Only lazy load thumbnails after the first 3
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Avatar component with optimization
interface OptimizedAvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

export const OptimizedAvatar: React.FC<OptimizedAvatarProps> = ({
  src,
  alt,
  size = 'md',
  fallback,
  className,
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const getFallbackInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-gray-300 font-medium text-gray-600',
          sizeClasses[size],
          className
        )}
      >
        {fallback ? getFallbackInitials(fallback) : '?'}
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-full', sizeClasses[size], className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        onError={() => setHasError(true)}
        priority={size === 'xl'} // Prioritize large avatars
      />
    </div>
  );
};

// Image upload component with optimization
interface OptimizedImageUploadProps {
  onUpload: (files: { thumbnail: Blob; medium: Blob; large: Blob; original: Blob }[]) => void;
  maxFiles?: number;
  accept?: string;
  className?: string;
}

export const OptimizedImageUpload: React.FC<OptimizedImageUploadProps> = ({
  onUpload,
  maxFiles = 5,
  accept = 'image/*',
  className,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const optimizedFiles = [];

      for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
        const file = files[i];
        const optimized = await ImageOptimizer.generateResponsiveImages(file);
        optimizedFiles.push(optimized);

        setProgress(((i + 1) / Math.min(files.length, maxFiles)) * 100);
      }

      onUpload(optimizedFiles);
    } catch (error) {
      console.error('Image optimization failed:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <input
        type="file"
        accept={accept}
        multiple
        onChange={handleFileChange}
        disabled={isProcessing}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />

      <div
        className={cn(
          'rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-gray-400',
          isProcessing && 'pointer-events-none opacity-50'
        )}
      >
        {isProcessing ? (
          <div>
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <div className="text-sm text-gray-600">
              Optimizing images... {Math.round(progress)}%
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto mb-2 h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Click to upload</span> or drag and drop
            </div>
            <div className="mt-1 text-xs text-gray-500">
              PNG, JPG, GIF up to 10MB (max {maxFiles} files)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
