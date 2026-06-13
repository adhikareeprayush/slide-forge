import { eq } from 'drizzle-orm';
import { getLayout } from '../services/layout-registry';
import { resolveSlideLayout } from '../services/layout-resolve';
import { db } from '../db';
import { decks, slides, generationJobs } from '../db/schema';
import {
  generateFullDeck,
  hydrateImageSlots,
  sanitizeSlotContent,
} from './prompt';
import { publishGenerationEvent } from '../ws/types';
import type { GenerationOptions } from './ai/types';

export async function runGenerationPipeline(
  jobId: string,
  deckId: string,
  topic: string,
  options: GenerationOptions,
): Promise<void> {
  const tone = options.tone ?? 'professional';
  const slideCount = options.slideCount ?? Number(process.env.DEFAULT_SLIDE_COUNT ?? 8);

  try {
    await db
      .update(generationJobs)
      .set({ status: 'running', startedAt: new Date() })
      .where(eq(generationJobs.id, jobId));

    await db.update(decks).set({ status: 'generating' }).where(eq(decks.id, deckId));

    // ── Single NVIDIA prompt for entire presentation ──
    const fullDeck = await generateFullDeck(topic, slideCount, tone);

    await db
      .update(decks)
      .set({ title: fullDeck.title, updatedAt: new Date() })
      .where(eq(decks.id, deckId));

    await publishGenerationEvent(jobId, {
      type: 'outline_ready',
      slides: fullDeck.slides.map((item) => {
        const { id, layout } = resolveSlideLayout(item.layoutId);
        return {
          layoutId: id,
          brief: item.brief,
          ...(item.title !== undefined ? { title: item.title } : {}),
          layout: layout ?? null,
        };
      }),
    });

    // Process all slides — resolve stock images in parallel per slide
    const slideResults = await Promise.all(
      fullDeck.slides.map(async (item, index) => {
        const { id: layoutId, layout } = resolveSlideLayout(item.layoutId);
        if (!layout) {
          console.warn(`Skipping slide with unknown layout: ${item.layoutId}`);
          return null;
        }

        let slotData = sanitizeSlotContent(layout, item.slots);
        slotData = await hydrateImageSlots(layout, slotData, item.brief);

        const [slide] = await db
          .insert(slides)
          .values({
            deckId,
            layoutId,
            position: index,
            slotData,
          })
          .returning();

        return slide ? { slide, index, slotData, layoutId } : null;
      }),
    );

    for (const result of slideResults) {
      if (!result) continue;

      await publishGenerationEvent(jobId, {
        type: 'slide_content_ready',
        slideIndex: result.index,
        slideId: result.slide.id,
        slots: result.slotData,
      });

      const layout = getLayout(result.slide.layoutId);
      if (!layout) continue;

      for (const slot of layout.slots) {
        if (slot.type === 'image' && typeof result.slotData[slot.id] === 'string') {
          await publishGenerationEvent(jobId, {
            type: 'image_ready',
            slideIndex: result.index,
            slideId: result.slide.id,
            slotId: slot.id,
            url: result.slotData[slot.id] as string,
          });
        }
      }
    }

    await completeGeneration(jobId, deckId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    await db
      .update(generationJobs)
      .set({ status: 'failed', error: message, completedAt: new Date() })
      .where(eq(generationJobs.id, jobId));
    await db.update(decks).set({ status: 'draft' }).where(eq(decks.id, deckId));
    await publishGenerationEvent(jobId, { type: 'error', message });
  }
}

async function completeGeneration(jobId: string, deckId: string): Promise<void> {
  await db
    .update(generationJobs)
    .set({ status: 'completed', completedAt: new Date() })
    .where(eq(generationJobs.id, jobId));
  await db.update(decks).set({ status: 'ready', updatedAt: new Date() }).where(eq(decks.id, deckId));
  await publishGenerationEvent(jobId, { type: 'generation_complete', deckId });
}
