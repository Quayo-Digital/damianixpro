/**
 * Image Gallery Component
 * Displays a gallery of images with thumbnail navigation and lightbox
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  title?: string;
  className?: string;
  showThumbnails?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  startIndex?: number;
}

export function ImageGallery({
  images,
  title,
  className,
  showThumbnails = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  startIndex = 0,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState(startIndex);

  // Reset zoom when image changes
  useEffect(() => {
    setZoom(1);
  }, [lightboxIndex]);

  // Ensure images is an array of strings
  const validImages = React.useMemo(() => {
    return (images || [])
      .map((img) => {
        if (typeof img === 'string') return img;
        if (img && typeof img === 'object' && 'url' in img) return String(img.url);
        if (img && typeof img === 'object' && 'src' in img) return String(img.src);
        return String(img || '');
      })
      .filter((img) => img && img.trim() !== '');
  }, [images]);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && !isLightboxOpen && validImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % validImages.length);
      }, autoPlayInterval);
      return () => clearInterval(interval);
    }
  }, [autoPlay, autoPlayInterval, validImages.length, isLightboxOpen]);

  // Keyboard navigation (must run before any conditional return — rules-of-hooks)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen || validImages.length === 0) return;

      switch (e.key) {
        case 'ArrowLeft':
          setLightboxIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
          break;
        case 'ArrowRight':
          setLightboxIndex((prev) => (prev + 1) % validImages.length);
          break;
        case 'Escape':
          setIsLightboxOpen(false);
          setZoom(1);
          break;
        case '+':
        case '=':
          setZoom((prev) => Math.min(prev + 0.25, 3));
          break;
        case '-':
          setZoom((prev) => Math.max(prev - 0.25, 0.5));
          break;
        case '0':
          setZoom(1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, validImages.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setZoom(1);
  };

  const lightboxGoToPrevious = () => {
    setLightboxIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const lightboxGoToNext = () => {
    setLightboxIndex((prev) => (prev + 1) % validImages.length);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  if (validImages.length === 0) {
    return (
      <div className={cn('flex h-64 items-center justify-center rounded-lg bg-muted', className)}>
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn('relative w-full', className)}>
        {/* Main Image */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <img
            src={validImages[currentIndex]}
            alt={
              title ? `${String(title)} - Image ${currentIndex + 1}` : `Image ${currentIndex + 1}`
            }
            decoding="async"
            className="h-full w-full cursor-pointer object-cover transition-transform duration-300 hover:scale-105"
            onClick={() => openLightbox(currentIndex)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
            }}
          />

          {/* Navigation Arrows */}
          {validImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Image Counter */}
          {validImages.length > 1 && (
            <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-sm text-white">
              {currentIndex + 1} / {validImages.length}
            </div>
          )}

          {/* Fullscreen Button */}
          {validImages.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 bg-black/50 text-white hover:bg-black/70"
              onClick={(e) => {
                e.stopPropagation();
                openLightbox(currentIndex);
              }}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Thumbnails */}
        {showThumbnails && validImages.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {validImages.map((image, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={cn(
                  'relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all',
                  index === currentIndex
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'border-transparent opacity-60 hover:opacity-100'
                )}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/100x100?text=Image';
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="h-[90vh] w-full max-w-7xl bg-black/95 p-0">
          <div className="relative flex h-full w-full items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-50 text-white hover:bg-foreground/20"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation Arrows */}
            {validImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 z-50 -translate-y-1/2 text-white hover:bg-foreground/20"
                  onClick={lightboxGoToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 z-50 -translate-y-1/2 text-white hover:bg-foreground/20"
                  onClick={lightboxGoToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Zoom Controls */}
            <div className="absolute left-4 top-4 z-50 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-foreground/20"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-foreground/20"
                onClick={handleResetZoom}
              >
                <span className="text-xs text-white">{Math.round(zoom * 100)}%</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-foreground/20"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Main Image */}
            <div className="flex h-full w-full items-center justify-center overflow-hidden p-8">
              <img
                src={validImages[lightboxIndex]}
                alt={
                  title
                    ? `${String(title)} - Image ${lightboxIndex + 1}`
                    : `Image ${lightboxIndex + 1}`
                }
                decoding="async"
                className="max-h-full max-w-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
                }}
              />
            </div>

            {/* Image Counter */}
            {validImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/50 px-4 py-2 text-sm text-white">
                {lightboxIndex + 1} / {validImages.length}
              </div>
            )}

            {/* Thumbnail Strip */}
            {showThumbnails && validImages.length > 1 && (
              <div className="absolute bottom-16 left-1/2 flex max-w-[90%] -translate-x-1/2 gap-2 overflow-x-auto pb-2">
                {validImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setLightboxIndex(index)}
                    className={cn(
                      'h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 transition-all',
                      index === lightboxIndex
                        ? 'border-primary-foreground ring-2 ring-primary-foreground'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    )}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/100x100?text=Image';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
