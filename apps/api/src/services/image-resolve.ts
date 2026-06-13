import { getImageSource, resolveStockImage } from './stock-image';
import { resolveAIProvider } from './ai/registry';
import type { ImageStyle } from '@slideforge/schema';

/** Resolve an image URL — stock photos by default, NVIDIA SDXL if IMAGE_SOURCE=nvidia. */
export async function resolveSlideImage(
  searchQuery: string,
  style: ImageStyle = 'photographic',
): Promise<string> {
  if (getImageSource() === 'nvidia') {
    try {
      const provider = resolveAIProvider();
      const buffer = await provider.generateImage(searchQuery, style);
      const { uploadImage } = await import('./storage');
      return uploadImage(buffer);
    } catch (err) {
      console.warn('NVIDIA image failed, using stock photo:', err);
    }
  }

  return resolveStockImage(searchQuery);
}
