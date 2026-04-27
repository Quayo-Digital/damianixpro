/**
 * Image Grid Component
 * Displays images in a responsive grid layout
 */

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageGridProps {
  images: string[];
  title?: string;
  className?: string;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  onImageClick?: (index: number) => void;
}

export function ImageGrid({
  images,
  title,
  className,
  columns = 3,
  gap = 'md',
  onImageClick,
}: ImageGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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

  if (validImages.length === 0) {
    return (
      <div className={cn('flex h-64 items-center justify-center rounded-lg bg-muted', className)}>
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
    setIsLightboxOpen(true);
    onImageClick?.(index);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setSelectedIndex(null);
  };

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length);
    }
  };

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
    }
  };

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  const gapClass = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  }[gap];

  return (
    <>
      <div className={cn('grid', gridCols, gapClass, className)}>
        {validImages.map((image, index) => (
          <div
            key={index}
            className="group relative aspect-video cursor-pointer overflow-hidden rounded-lg bg-muted"
            onClick={() => handleImageClick(index)}
          >
            <img
              src={image}
              alt={title ? `${String(title)} - Image ${index + 1}` : `Image ${index + 1}`}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
              <Maximize2 className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        ))}
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

            {/* Navigation */}
            {validImages.length > 1 && selectedIndex !== null && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 z-50 -translate-y-1/2 text-white hover:bg-foreground/20"
                  onClick={goToPrevious}
                >
                  ←
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 z-50 -translate-y-1/2 text-white hover:bg-foreground/20"
                  onClick={goToNext}
                >
                  →
                </Button>
              </>
            )}

            {/* Main Image */}
            {selectedIndex !== null && (
              <div className="flex h-full w-full items-center justify-center overflow-hidden p-8">
                <img
                  src={validImages[selectedIndex]}
                  alt={
                    title
                      ? `${String(title)} - Image ${selectedIndex + 1}`
                      : `Image ${selectedIndex + 1}`
                  }
                  decoding="async"
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
                  }}
                />
              </div>
            )}

            {/* Image Counter */}
            {validImages.length > 1 && selectedIndex !== null && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/50 px-4 py-2 text-sm text-white">
                {selectedIndex + 1} / {validImages.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
