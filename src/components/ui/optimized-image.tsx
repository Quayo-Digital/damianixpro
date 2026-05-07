/**
 * Deprecated compatibility module.
 * Prefer importing from `@/components/ui/OptimizedImage`.
 */
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { ImageOptimizer as RuntimeImageOptimizer } from '@/utils/image-optimizer';
export { OptimizedImage, PropertyImage } from '@/components/ui/OptimizedImage';
export { OptimizedImage as default } from '@/components/ui/OptimizedImage';

export const ImageOptimizer = RuntimeImageOptimizer;

export function useLazyLoading(threshold = 0.1) {
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
    return () => observer.unobserve(element);
  }, [hasLoaded, threshold]);

  return { ref, isIntersecting, hasLoaded };
}

export function PropertyImageGallery(_props: {
  images: string[];
  alt: string;
  className?: string;
}) {
  return null;
}

export function OptimizedAvatar(_props: {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}) {
  return null;
}

export function OptimizedImageUpload(_props: {
  onUpload: (files: unknown[]) => void;
  maxFiles?: number;
  accept?: string;
  className?: string;
}) {
  return null;
}
