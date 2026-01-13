/**
 * Export utilities for platform-specific asset bundles
 *
 * Provides platform specifications, image resizing, and download functionality
 * for exporting assets to Google Ads, Meta, and TikTok formats.
 */

// Platform specification types
export interface PlatformFormat {
  name: string;
  width: number;
  height: number;
}

export interface PlatformSpec {
  name: string;
  formats: PlatformFormat[];
}

export type PlatformKey = 'google_ads' | 'meta' | 'tiktok';

// Platform specifications with required dimensions for each ad platform
export const PLATFORM_SPECS: Record<PlatformKey, PlatformSpec> = {
  google_ads: {
    name: 'Google Ads',
    formats: [
      { name: 'Landscape', width: 1200, height: 628 },
      { name: 'Square', width: 1080, height: 1080 },
      { name: 'Medium Rectangle', width: 300, height: 250 },
    ]
  },
  meta: {
    name: 'Meta (Facebook/Instagram)',
    formats: [
      { name: 'Feed Square', width: 1080, height: 1080 },
      { name: 'Story', width: 1080, height: 1920 },
      { name: 'Link Ad', width: 1200, height: 628 },
    ]
  },
  tiktok: {
    name: 'TikTok',
    formats: [
      { name: 'Vertical', width: 1080, height: 1920 },
      { name: 'Horizontal', width: 1920, height: 1080 },
    ]
  }
};

/**
 * Resize an image to the specified dimensions using Canvas API
 * Uses cover-fit logic: crops to fill, centered
 *
 * @param imageUrl - URL of the source image
 * @param width - Target width
 * @param height - Target height
 * @param outputFormat - 'png' or 'jpeg'
 * @param quality - Quality for JPEG (0-1), ignored for PNG
 * @returns Promise<Blob> - The resized image as a Blob
 */
export async function resizeImage(
  imageUrl: string,
  width: number,
  height: number,
  outputFormat: 'png' | 'jpeg' = 'png',
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate cover-fit dimensions (crop to fill, centered)
        const sourceAspect = img.width / img.height;
        const targetAspect = width / height;

        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;

        if (sourceAspect > targetAspect) {
          // Source is wider, crop horizontally
          sourceWidth = img.height * targetAspect;
          sourceX = (img.width - sourceWidth) / 2;
        } else if (sourceAspect < targetAspect) {
          // Source is taller, crop vertically
          sourceHeight = img.width / targetAspect;
          sourceY = (img.height - sourceHeight) / 2;
        }

        // Draw the cropped and scaled image
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          width,
          height
        );

        // Convert to blob
        const mimeType = outputFormat === 'png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create image blob'));
            }
          },
          mimeType,
          outputFormat === 'jpeg' ? quality : undefined
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };

    img.src = imageUrl;
  });
}

/**
 * Generate a consistent filename for exported assets
 * Format: {assetId}_{platform}_{formatName}.{extension}
 *
 * @param assetId - ID of the asset
 * @param platform - Platform key
 * @param formatName - Format name from platform spec
 * @param extension - File extension (png, jpg)
 * @returns string - Generated filename
 */
export function generateFilename(
  assetId: string,
  platform: PlatformKey,
  formatName: string,
  extension: 'png' | 'jpg'
): string {
  // Sanitize format name for filename (lowercase, replace spaces with underscores)
  const sanitizedFormat = formatName.toLowerCase().replace(/\s+/g, '_');
  // Use short asset ID (first 8 characters)
  const shortId = assetId.slice(0, 8);

  return `${shortId}_${platform}_${sanitizedFormat}.${extension}`;
}

/**
 * Trigger browser download of a blob
 *
 * @param blob - The blob to download
 * @param filename - Name for the downloaded file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Estimate file size for a resized image
 * This is a rough estimate based on dimensions and format
 *
 * @param width - Image width
 * @param height - Image height
 * @param format - 'png' or 'jpeg'
 * @param quality - Quality for JPEG (0-1)
 * @returns number - Estimated file size in bytes
 */
export function estimateFileSize(
  width: number,
  height: number,
  format: 'png' | 'jpeg',
  quality: number = 0.8
): number {
  const pixels = width * height;

  if (format === 'png') {
    // PNG is lossless, roughly 3 bytes per pixel after compression
    return Math.round(pixels * 3 * 0.3); // 30% compression estimate
  } else {
    // JPEG compression depends on quality
    return Math.round(pixels * 3 * quality * 0.15); // 15% of uncompressed at quality
  }
}

/**
 * Format bytes as human-readable string
 *
 * @param bytes - Number of bytes
 * @returns string - Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
