export type GenerationEvent =
  | {
      type: 'outline_ready';
      slides: {
        layoutId: string;
        brief: string;
        title?: string;
        layout: import('@slideforge/schema').ValidatedSlide | null;
      }[];
    }
  | { type: 'slide_content_ready'; slideIndex: number; slideId: string; slots: Record<string, string | string[]> }
  | { type: 'image_ready'; slideIndex: number; slideId: string; slotId: string; url: string }
  | { type: 'generation_complete'; deckId: string }
  | { type: 'error'; message: string };

export const GENERATION_CHANNEL = (jobId: string) => `generation:${jobId}`;

export async function publishGenerationEvent(jobId: string, event: GenerationEvent): Promise<void> {
  const { getRedis } = await import('../services/cache');
  await getRedis().publish(GENERATION_CHANNEL(jobId), JSON.stringify(event));
}
