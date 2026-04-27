/**
 * 3D Virtual Property Tour Viewer
 * Displays 360° panoramas and immersive photo galleries.
 * Works with property images - supports equirectangular 360° photos and regular galleries.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Move,
  X,
  ImageIcon,
} from 'lucide-react';

// Check if image is likely equirectangular (2:1 aspect = 360° panorama)
function isLikelyPanorama(url: string, width?: number, height?: number): boolean {
  if (width && height && width > 0) {
    const ratio = width / height;
    return ratio >= 1.8 && ratio <= 2.2; // ~2:1
  }
  return false;
}

interface PropertyVirtualTourViewerProps {
  images: string[];
  tourUrl?: string | null;
  propertyName?: string;
  className?: string;
}

export function PropertyVirtualTourViewer({
  images,
  tourUrl,
  propertyName = 'Property',
  className,
}: PropertyVirtualTourViewerProps) {
  const [panoramaImages, setPanoramaImages] = useState<string[]>([]);
  const [regularImages, setRegularImages] = useState<string[]>([]);
  const [mode, setMode] = useState<'gallery' | 'panorama' | 'embed'>('gallery');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [panoramaIndex, setPanoramaIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasEmbedTour = !!tourUrl;

  useEffect(() => {
    const checkImages = async () => {
      const pans: string[] = [];
      const regs: string[] = [];

      for (let i = 0; i < Math.min(images.length, 5); i++) {
        const url = images[i];
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Load failed'));
            img.src = url;
          });
          if (isLikelyPanorama(url, img.naturalWidth, img.naturalHeight)) {
            pans.push(url);
          } else {
            regs.push(url);
          }
        } catch {
          regs.push(url);
        }
      }
      for (let i = 5; i < images.length; i++) regs.push(images[i]);
      if (pans.length > 0) setPanoramaImages(pans);
      setRegularImages(regs.length > 0 ? regs : images);
    };

    if (images.length > 0) checkImages();
  }, [images]);

  const hasPanoramas = panoramaImages.length > 0;

  // Set initial mode when data is ready
  useEffect(() => {
    if (hasEmbedTour) setMode('embed');
    else if (hasPanoramas) setMode('panorama');
    else setMode('gallery');
  }, [hasEmbedTour, hasPanoramas]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Mode selector */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={mode === 'gallery' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('gallery')}
        >
          <ImageIcon className="mr-1.5 h-4 w-4" />
          Photo Gallery
        </Button>
        {hasPanoramas && (
          <Button
            variant={mode === 'panorama' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('panorama')}
          >
            <Move className="mr-1.5 h-4 w-4" />
            360° View
          </Button>
        )}
        {hasEmbedTour && (
          <Button
            variant={mode === 'embed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('embed')}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Virtual Tour
          </Button>
        )}
      </div>

      {/* Embed mode - external tour (Matterport, Kuula, etc.) */}
      {mode === 'embed' && tourUrl && (
        <div className="aspect-video overflow-hidden rounded-lg bg-muted">
          <iframe
            src={tourUrl}
            title={`3D Virtual Tour - ${propertyName}`}
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>
      )}

      {/* 360° Panorama mode */}
      {mode === 'panorama' && hasPanoramas && (
        <PanoramaViewer
          src={panoramaImages[panoramaIndex]}
          onPrev={panoramaIndex > 0 ? () => setPanoramaIndex((i) => i - 1) : undefined}
          onNext={
            panoramaIndex < panoramaImages.length - 1
              ? () => setPanoramaIndex((i) => i + 1)
              : undefined
          }
          sceneLabel={`Scene ${panoramaIndex + 1} of ${panoramaImages.length}`}
        />
      )}

      {/* Gallery mode - immersive photo viewer */}
      {mode === 'gallery' && (
        <ImmersiveGallery
          images={regularImages}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
          propertyName={propertyName}
        />
      )}
    </div>
  );
}

/**
 * 360° Equirectangular Panorama Viewer (Canvas-based, no deps)
 */
function PanoramaViewer({
  src,
  onPrev,
  onNext,
  sceneLabel,
}: {
  src: string;
  onPrev?: () => void;
  onNext?: () => void;
  sceneLabel?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fovRef = useRef(75);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    const yawDeg = yawRef.current;
    const pitchDeg = pitchRef.current;
    const fovDeg = fovRef.current;

    // Equirectangular: horizontal 360° maps to full width, vertical 180° to full height
    // Visible region: yaw ± fov/2, pitch ± fovVert/2
    const aspect = cw / ch;
    const fovVert = fovDeg / aspect;

    const uCenter = ((yawDeg + 180) / 360) * imgW;
    const vCenter = ((90 - pitchDeg) / 180) * imgH;

    const viewW = (fovDeg / 360) * imgW;
    const viewH = (fovVert / 180) * imgH;

    let sx = uCenter - viewW / 2;
    const sy = Math.max(0, Math.min(imgH - viewH, vCenter - viewH / 2));

    // Horizontal wrap for equirectangular
    if (sx < 0) sx += imgW;
    if (sx + viewW > imgW) {
      const part1 = imgW - sx;
      ctx.drawImage(img, sx, sy, part1, viewH, 0, 0, (part1 / viewW) * cw, ch);
      ctx.drawImage(
        img,
        0,
        sy,
        viewW - part1,
        viewH,
        (part1 / viewW) * cw,
        0,
        cw - (part1 / viewW) * cw,
        ch
      );
    } else {
      ctx.drawImage(img, sx, sy, viewW, viewH, 0, 0, cw, ch);
    }
  }, []);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setIsLoading(false);
      draw();
    };
    img.onerror = () => setError('Failed to load panorama');
    img.src = src;
  }, [src, draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    yawRef.current += dx * 0.5;
    pitchRef.current = Math.max(-89, Math.min(89, pitchRef.current));
    draw();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    fovRef.current = Math.max(30, Math.min(120, fovRef.current - e.deltaY * 0.1));
    draw();
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      draw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  if (error) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative aspect-video overflow-hidden rounded-lg bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        style={{ display: isLoading ? 'none' : 'block' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white/90">
        <p className="text-sm">Drag to look around • Scroll to zoom</p>
        {sceneLabel && <span className="text-xs">{sceneLabel}</span>}
      </div>
      {(onPrev || onNext) && (
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 gap-1">
          {onPrev && (
            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={onPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {onNext && (
            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={onNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Immersive fullscreen-style gallery
 */
function ImmersiveGallery({
  images,
  currentIndex,
  onIndexChange,
  propertyName,
}: {
  images: string[];
  currentIndex: number;
  onIndexChange: (i: number) => void;
  propertyName: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (images.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-muted-foreground">
        No images available
      </div>
    );
  }

  const prev = () => onIndexChange((currentIndex - 1 + images.length) % images.length);
  const next = () => onIndexChange((currentIndex + 1) % images.length);

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
      <img
        src={images[currentIndex]}
        alt={`${propertyName} - Image ${currentIndex + 1}`}
        className="h-full w-full object-cover transition-opacity duration-300"
      />
      {images.length > 1 && (
        <>
          <Button
            size="icon"
            variant="secondary"
            className="absolute left-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full shadow-lg"
            onClick={prev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full shadow-lg"
            onClick={next}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="rounded bg-black/50 px-2 py-1 text-xs text-white">
          {currentIndex + 1} / {images.length}
        </span>
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full"
          onClick={() => setIsExpanded(true)}
        >
          <Maximize2 className="mr-1 h-4 w-4" />
          Expand
        </Button>
      </div>

      {isExpanded && (
        <ImmersiveGalleryModal
          images={images}
          currentIndex={currentIndex}
          onIndexChange={onIndexChange}
          onClose={() => setIsExpanded(false)}
          propertyName={propertyName}
        />
      )}
    </div>
  );
}

function ImmersiveGalleryModal({
  images,
  currentIndex,
  onIndexChange,
  onClose,
  propertyName,
}: {
  images: string[];
  currentIndex: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  propertyName: string;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onIndexChange((currentIndex - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') onIndexChange((currentIndex + 1) % images.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, images.length, onClose, onIndexChange]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt={`${propertyName} - ${currentIndex + 1}`}
          className="max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-4 top-4 text-white hover:bg-foreground/20"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
        {images.length > 1 && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="absolute left-4 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full"
              onClick={() => onIndexChange((currentIndex - 1 + images.length) % images.length)}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-4 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full"
              onClick={() => onIndexChange((currentIndex + 1) % images.length)}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
