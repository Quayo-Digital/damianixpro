// Advanced Image Optimization for Nigerian Property Management Platform
// Optimized for 2G/3G networks and low-end devices

export interface ImageOptimizationConfig {
  quality: number;
  format: 'webp' | 'jpeg' | 'png' | 'auto';
  maxWidth: number;
  maxHeight: number;
  lazy: boolean;
  placeholder: 'blur' | 'empty' | 'skeleton';
  nigerianOptimized: boolean;
}

export interface ResponsiveImageSizes {
  mobile: { width: number; height: number };
  tablet: { width: number; height: number };
  desktop: { width: number; height: number };
}

export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  }

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  // Nigerian market-specific optimization presets
  static readonly NIGERIAN_PRESETS = {
    property_thumbnail: {
      quality: 75,
      format: 'webp' as const,
      maxWidth: 400,
      maxHeight: 300,
      lazy: true,
      placeholder: 'blur' as const,
      nigerianOptimized: true
    },
    property_gallery: {
      quality: 80,
      format: 'webp' as const,
      maxWidth: 800,
      maxHeight: 600,
      lazy: true,
      placeholder: 'skeleton' as const,
      nigerianOptimized: true
    },
    profile_avatar: {
      quality: 85,
      format: 'webp' as const,
      maxWidth: 200,
      maxHeight: 200,
      lazy: false,
      placeholder: 'empty' as const,
      nigerianOptimized: true
    },
    hero_banner: {
      quality: 70,
      format: 'webp' as const,
      maxWidth: 1200,
      maxHeight: 600,
      lazy: false,
      placeholder: 'blur' as const,
      nigerianOptimized: true
    },
    document_preview: {
      quality: 90,
      format: 'jpeg' as const,
      maxWidth: 600,
      maxHeight: 800,
      lazy: true,
      placeholder: 'skeleton' as const,
      nigerianOptimized: true
    }
  };

  // Generate responsive image URLs with Nigerian network optimization
  generateResponsiveUrls(
    baseUrl: string, 
    preset: keyof typeof ImageOptimizer.NIGERIAN_PRESETS,
    sizes?: ResponsiveImageSizes
  ): {
    mobile: string;
    tablet: string;
    desktop: string;
    webp: string;
    fallback: string;
  } {
    const config = ImageOptimizer.NIGERIAN_PRESETS[preset];
    const defaultSizes: ResponsiveImageSizes = {
      mobile: { width: Math.min(config.maxWidth, 400), height: Math.min(config.maxHeight, 300) },
      tablet: { width: Math.min(config.maxWidth, 600), height: Math.min(config.maxHeight, 450) },
      desktop: { width: config.maxWidth, height: config.maxHeight }
    };

    const actualSizes = sizes || defaultSizes;

    // Nigerian network-optimized quality settings
    const nigerianQuality = config.nigerianOptimized ? Math.max(config.quality - 10, 60) : config.quality;

    return {
      mobile: this.buildImageUrl(baseUrl, {
        ...config,
        quality: nigerianQuality,
        maxWidth: actualSizes.mobile.width,
        maxHeight: actualSizes.mobile.height
      }),
      tablet: this.buildImageUrl(baseUrl, {
        ...config,
        quality: nigerianQuality + 5,
        maxWidth: actualSizes.tablet.width,
        maxHeight: actualSizes.tablet.height
      }),
      desktop: this.buildImageUrl(baseUrl, {
        ...config,
        maxWidth: actualSizes.desktop.width,
        maxHeight: actualSizes.desktop.height
      }),
      webp: this.buildImageUrl(baseUrl, { ...config, format: 'webp' }),
      fallback: this.buildImageUrl(baseUrl, { ...config, format: 'jpeg' })
    };
  }

  // Build optimized image URL with query parameters
  private buildImageUrl(baseUrl: string, config: ImageOptimizationConfig): string {
    const params = new URLSearchParams();
    
    params.set('q', config.quality.toString());
    params.set('f', config.format);
    params.set('w', config.maxWidth.toString());
    params.set('h', config.maxHeight.toString());
    
    if (config.nigerianOptimized) {
      params.set('ng', '1'); // Nigerian optimization flag
    }

    return `${baseUrl}?${params.toString()}`;
  }

  // Generate blur placeholder for Nigerian networks
  async generateBlurPlaceholder(imageUrl: string): Promise<string> {
    if (!this.canvas || !this.ctx) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=';
    }

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        img.onload = () => {
          // Create small blur placeholder (40x40 for Nigerian networks)
          this.canvas!.width = 40;
          this.canvas!.height = 40;
          
          this.ctx!.filter = 'blur(4px)';
          this.ctx!.drawImage(img, 0, 0, 40, 40);
          
          const blurDataUrl = this.canvas!.toDataURL('image/jpeg', 0.1);
          resolve(blurDataUrl);
        };
        
        img.onerror = () => {
          // Fallback placeholder
          resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=');
        };
        
        img.src = imageUrl;
      });
    } catch (error) {
      console.error('Failed to generate blur placeholder:', error);
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=';
    }
  }

  // Compress image for Nigerian networks
  async compressImage(file: File, preset: keyof typeof ImageOptimizer.NIGERIAN_PRESETS): Promise<File> {
    if (!this.canvas || !this.ctx) {
      return file;
    }

    const config = ImageOptimizer.NIGERIAN_PRESETS[preset];
    
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate optimal dimensions
        const { width, height } = this.calculateOptimalDimensions(
          img.width, 
          img.height, 
          config.maxWidth, 
          config.maxHeight
        );
        
        this.canvas!.width = width;
        this.canvas!.height = height;
        
        // Clear and draw
        this.ctx!.clearRect(0, 0, width, height);
        this.ctx!.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with Nigerian optimization
        const quality = config.nigerianOptimized ? config.quality / 100 * 0.8 : config.quality / 100;
        
        this.canvas!.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: config.format === 'webp' ? 'image/webp' : 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, config.format === 'webp' ? 'image/webp' : 'image/jpeg', quality);
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }

  // Calculate optimal dimensions maintaining aspect ratio
  private calculateOptimalDimensions(
    originalWidth: number, 
    originalHeight: number, 
    maxWidth: number, 
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;
    
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  }

  // Check if WebP is supported
  static supportsWebP(): boolean {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // Get Nigerian network-optimized format
  static getOptimalFormat(originalFormat?: string): 'webp' | 'jpeg' {
    if (this.supportsWebP()) {
      return 'webp';
    }
    return 'jpeg';
  }

  // Preload critical images for Nigerian networks
  static preloadCriticalImages(imageUrls: string[]): void {
    if (typeof window === 'undefined') return;

    imageUrls.forEach((url, index) => {
      // Stagger preloading to avoid overwhelming Nigerian networks
      setTimeout(() => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
      }, index * 100); // 100ms delay between each preload
    });
  }

  // Monitor image loading performance
  static monitorImagePerformance(imageUrl: string): Promise<{
    loadTime: number;
    size: number;
    success: boolean;
  }> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const img = new Image();
      
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        
        // Estimate size (approximate)
        const size = img.naturalWidth * img.naturalHeight * 3; // RGB estimate
        
        resolve({
          loadTime,
          size,
          success: true
        });
      };
      
      img.onerror = () => {
        const loadTime = performance.now() - startTime;
        resolve({
          loadTime,
          size: 0,
          success: false
        });
      };
      
      img.src = imageUrl;
    });
  }
}

// Export singleton instance
export const imageOptimizer = ImageOptimizer.getInstance();

// Utility functions for React components
export const getOptimizedImageProps = (
  src: string,
  preset: keyof typeof ImageOptimizer.NIGERIAN_PRESETS,
  alt: string
) => {
  const urls = imageOptimizer.generateResponsiveUrls(src, preset);
  const config = ImageOptimizer.NIGERIAN_PRESETS[preset];
  
  return {
    src: urls.fallback,
    srcSet: `${urls.mobile} 400w, ${urls.tablet} 600w, ${urls.desktop} 800w`,
    sizes: '(max-width: 400px) 400px, (max-width: 600px) 600px, 800px',
    alt,
    loading: config.lazy ? 'lazy' as const : 'eager' as const,
    decoding: 'async' as const,
    style: {
      aspectRatio: `${config.maxWidth}/${config.maxHeight}`
    }
  };
};

// Nigerian network-aware image loading hook
export const useNigerianImageLoading = () => {
  const [connectionType, setConnectionType] = React.useState<string>('unknown');
  const [shouldOptimize, setShouldOptimize] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection?.effectiveType || 'unknown');
      
      // Optimize aggressively for 2G/3G
      setShouldOptimize(['2g', '3g', 'slow-2g'].includes(connection?.effectiveType));
      
      const handleConnectionChange = () => {
        setConnectionType(connection?.effectiveType || 'unknown');
        setShouldOptimize(['2g', '3g', 'slow-2g'].includes(connection?.effectiveType));
      };
      
      connection?.addEventListener('change', handleConnectionChange);
      
      return () => {
        connection?.removeEventListener('change', handleConnectionChange);
      };
    }
  }, []);

  return {
    connectionType,
    shouldOptimize,
    isSlowConnection: ['2g', '3g', 'slow-2g'].includes(connectionType)
  };
};

export default ImageOptimizer;
