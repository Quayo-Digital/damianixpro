/**
 * Image Carousel Component
 * A simpler carousel-style image gallery
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageCarouselProps {
  images: string[];
  title?: string;
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  aspectRatio?: 'video' | 'square' | 'auto';
}

export function ImageCarousel({
  images,
  title,
  className,
  autoPlay = false,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  aspectRatio = 'video',
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

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

  useEffect(() => {
    if (autoPlay && validImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % validImages.length);
      }, autoPlayInterval);
      return () => clearInterval(interval);
    }
  }, [autoPlay, autoPlayInterval, validImages.length]);

  if (validImages.length === 0) {
    return (
      <div className={cn('flex h-64 items-center justify-center rounded-lg bg-muted', className)}>
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const aspectRatioClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    auto: 'aspect-auto',
  }[aspectRatio];

  return (
    <div className={cn('relative w-full', className)}>
      <div className={cn('relative w-full overflow-hidden rounded-lg bg-muted', aspectRatioClass)}>
        {/* Images Container */}
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {validImages.map((image, index) => (
            <div key={index} className="h-full min-w-full">
              <img
                src={image}
                alt={title ? `${String(title)} - Image ${index + 1}` : `Image ${index + 1}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
                }}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {showArrows && validImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {validImages.length > 1 && (
          <div className="absolute right-2 top-2 z-10 rounded bg-black/50 px-2 py-1 text-xs text-white">
            {currentIndex + 1} / {validImages.length}
          </div>
        )}
      </div>

      {/* Dots Indicator */}
      {showDots && validImages.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {validImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'h-2 rounded-full transition-all',
                index === currentIndex
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
