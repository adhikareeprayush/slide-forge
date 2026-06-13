import { Router, type IRouter } from 'express';
import { eq, asc, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { slides, decks } from '../db/schema';
import { getLayout } from '../services/layout-registry';
import { generateSlotContent, generateImagePrompt } from '../services/prompt';
import { resolveSlideImage } from '../services/image-resolve';
import { imageJobs } from '../db/schema';

export const slidesRouter: IRouter = Router();

slidesRouter.patch('/:slideId', async (req, res) => {
  const { slideId } = req.params;
  const body = z
    .object({
      layoutId: z.string().optional(),
      slotData: z.record(z.union([z.string(), z.array(z.string())])).optional(),
      position: z.number().int().optional(),
    })
    .safeParse(req.body);

  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const [slide] = await db.select().from(slides).where(eq(slides.id, slideId)).limit(1);
  if (!slide) {
    res.status(404).json({ error: 'Slide not found' });
    return;
  }

  const updates: Partial<typeof slides.$inferInsert> = { updatedAt: new Date() };
  if (body.data.layoutId) updates.layoutId = body.data.layoutId;
  if (body.data.slotData) updates.slotData = body.data.slotData;
  if (body.data.position !== undefined) updates.position = body.data.position;

  const [updated] = await db.update(slides).set(updates).where(eq(slides.id, slideId)).returning();
  res.json(updated);
});

slidesRouter.post('/:slideId/regenerate', async (req, res) => {
  const { slideId } = req.params;
  const [slide] = await db.select().from(slides).where(eq(slides.id, slideId)).limit(1);
  if (!slide) {
    res.status(404).json({ error: 'Slide not found' });
    return;
  }

  const layout = getLayout(slide.layoutId);
  if (!layout) {
    res.status(400).json({ error: 'Unknown layout' });
    return;
  }

  const [deck] = await db.select().from(decks).where(eq(decks.id, slide.deckId)).limit(1);
  const tone = 'professional';
  const brief = deck?.title ?? 'Regenerated slide';
  const slotContent = await generateSlotContent(brief, layout.slots, tone);

  const [updated] = await db
    .update(slides)
    .set({ slotData: slotContent, updatedAt: new Date() })
    .where(eq(slides.id, slideId))
    .returning();

  res.json({ slide: updated, slotData: slotContent });
});

slidesRouter.post('/:slideId/regenerate-image', async (req, res) => {
  const { slideId } = req.params;
  const body = z.object({ slotId: z.string() }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: 'slotId required' });
    return;
  }

  const [slide] = await db.select().from(slides).where(eq(slides.id, slideId)).limit(1);
  if (!slide) {
    res.status(404).json({ error: 'Slide not found' });
    return;
  }

  const layout = getLayout(slide.layoutId);
  const imgSlot = layout?.slots.find((s) => s.id === body.data.slotId && s.type === 'image');
  if (!imgSlot) {
    res.status(400).json({ error: 'Image slot not found' });
    return;
  }

  const slotData = slide.slotData as Record<string, string | string[]>;
  const keywords = await generateImagePrompt(
    slotData,
    imgSlot.imageStyle ?? 'photographic',
    'Regenerate image',
  );

  const url = await resolveSlideImage(keywords, imgSlot.imageStyle ?? 'photographic');

  const updatedSlotData = { ...slotData, [body.data.slotId]: url };
  await db
    .update(slides)
    .set({ slotData: updatedSlotData, updatedAt: new Date() })
    .where(eq(slides.id, slideId));

  await db.insert(imageJobs).values({
    slideId,
    slotId: body.data.slotId,
    prompt: keywords,
    status: 'completed',
    resultUrl: url,
  });

  res.json({ status: 'completed', url, slotId: body.data.slotId });
});
