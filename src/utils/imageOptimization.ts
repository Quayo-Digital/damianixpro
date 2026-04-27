/**
 * Image Optimization Utility
 * Compresses and resizes images at upload time for faster uploads and lower storage.
 * Optimized for Nigerian networks - reduces file size while preserving acceptable quality.
 */

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MIN_SIZE_TO_OPTIMIZE = 100 * 1024; // 100KB - skip optimization for small images
const DEFAULT_MAX_WIDTH = 1920; // Full HD - good for property photos
const DEFAULT_MAX_HEIGHT = 1920;
const DEFAULT_QUALITY = 0.82; // Balance quality vs size
const MAX_FILE_SIZE_TARGET = 800 * 1024; // 800KB target for property images

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxFileSizeBytes?: number;
  preserveTransparency?: boolean; // Keep PNG for images with alpha
}

/**
 * Check if a file is an optimizable image type
 */
export function isOptimizableImage(file: File): boolean {
  return IMAGE_TYPES.includes(file.type);
}

/**
 * Optimize an image file before upload.
 * Resizes to fit within max dimensions, compresses quality, targets file size.
 * Returns original file if optimization fails or file is too small.
 */
export async function optimizeImageForUpload(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> {
  if (!isOptimizableImage(file)) {
    return file;
  }

  // Skip optimization for small images
  if (file.size < MIN_SIZE_TO_OPTIMIZE) {
    return file;
  }

  const {
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    quality = DEFAULT_QUALITY,
    maxFileSizeBytes = MAX_FILE_SIZE_TARGET,
    preserveTransparency = false,
  } = options;

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl); // Clean up to avoid memory leaks

      if (!ctx) {
        resolve(file);
        return;
      }

      const { width: imgWidth, height: imgHeight } = img;

      // Calculate new dimensions maintaining aspect ratio
      let width = imgWidth;
      let height = imgHeight;

      if (imgWidth > maxWidth || imgHeight > maxHeight) {
        const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);
        width = Math.round(imgWidth * ratio);
        height = Math.round(imgHeight * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      // Use JPEG for photos (better compression), PNG only if transparency needed
      const outputFormat =
        preserveTransparency && file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const outputQuality = outputFormat === 'image/png' ? Math.min(quality, 0.9) : quality;

      const tryCompress = (q: number, attempt: number): void => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const optimizedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, outputFormat === 'image/jpeg' ? '.jpg' : '.png'),
              {
                type: outputFormat,
                lastModified: Date.now(),
              }
            );

            // If still too large and we can reduce quality further, try again
            if (
              optimizedFile.size > maxFileSizeBytes &&
              q > 0.5 &&
              attempt < 3 &&
              outputFormat === 'image/jpeg'
            ) {
              tryCompress(q - 0.15, attempt + 1);
            } else {
              resolve(optimizedFile);
            }
          },
          outputFormat,
          q
        );
      };

      tryCompress(outputQuality, 1);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Optimize multiple image files. Processes in sequence to avoid overwhelming the browser.
 */
export async function optimizeImagesForUpload(
  files: File[],
  options?: ImageOptimizationOptions
): Promise<File[]> {
  const results: File[] = [];

  for (const file of files) {
    const optimized = await optimizeImageForUpload(file, options);
    results.push(optimized);
  }

  return results;
}
