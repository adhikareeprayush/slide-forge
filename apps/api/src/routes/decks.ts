import { Router, type IRouter } from 'express';
import { eq, asc, inArray, and } from 'drizzle-orm';
import { z } from 'zod';
import { getLayout } from '../services/layout-registry';
import { db } from '../db';
import { decks, slides, generationJobs } from '../db/schema';
import { getExportQueue } from '../queues/export.queue';
import { createExportJob } from '../services/export/status';
import type { ExportFormat } from '../services/export/types';

export const decksRouter: IRouter = Router();

decksRouter.get('/:id/status', async (req, res) => {
  const { id } = req.params;

  const [deck] = await db.select().from(decks).where(eq(decks.id, id)).limit(1);
  if (!deck) {
    res.status(404).json({ error: 'Deck not found' });
    return;
  }

  const [job] = await db
    .select()
    .from(generationJobs)
    .where(eq(generationJobs.deckId, id))
    .limit(1);

  res.json({
    deckId: deck.id,
    status: deck.status,
    job: job
      ? {
          id: job.id,
          status: job.status,
          error: job.error,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
        }
      : null,
  });
});

decksRouter.get('/:id', async (req, res) => {
  const { id } = req.params;

  const [deck] = await db.select().from(decks).where(eq(decks.id, id)).limit(1);
  if (!deck) {
    res.status(404).json({ error: 'Deck not found' });
    return;
  }

  const deckSlides = await db
    .select()
    .from(slides)
    .where(eq(slides.deckId, id))
    .orderBy(asc(slides.position));

  const slidesWithLayouts = deckSlides.map((slide) => {
    const layout = getLayout(slide.layoutId);
    if (!layout) {
      return { ...slide, layout: null, layoutError: `Unknown layout: ${slide.layoutId}` };
    }
    return {
      id: slide.id,
      layoutId: slide.layoutId,
      position: slide.position,
      slotData: slide.slotData as Record<string, string | string[]>,
      layout,
    };
  });

  res.json({
    id: deck.id,
    title: deck.title,
    theme: deck.theme,
    status: deck.status,
    slides: slidesWithLayouts,
  });
});

decksRouter.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const body = z
    .object({ title: z.string().optional(), theme: z.string().optional() })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const updates: { updatedAt: Date; title?: string; theme?: string } = { updatedAt: new Date() };
  if (body.data.title !== undefined) updates.title = body.data.title;
  if (body.data.theme !== undefined) updates.theme = body.data.theme;

  const [updated] = await db
    .update(decks)
    .set(updates)
    .where(eq(decks.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: 'Deck not found' });
    return;
  }
  res.json(updated);
});

decksRouter.post('/:id/slides/reorder', async (req, res) => {
  const { id } = req.params;
  const body = z.object({ slideIds: z.array(z.string().uuid()) }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: 'slideIds array required' });
    return;
  }

  for (let i = 0; i < body.data.slideIds.length; i++) {
    const slideId = body.data.slideIds[i]!;
    await db
      .update(slides)
      .set({ position: i, updatedAt: new Date() })
      .where(and(eq(slides.id, slideId), eq(slides.deckId, id)));
  }

  const deckSlides = await db
    .select()
    .from(slides)
    .where(eq(slides.deckId, id))
    .orderBy(asc(slides.position));

  res.json({ slides: deckSlides });
});

decksRouter.post('/:id/export', async (req, res) => {
  const { id } = req.params;
  const body = z.object({ format: z.enum(['pptx', 'pdf', 'html']) }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: 'format must be pptx, pdf, or html' });
    return;
  }

  const [deck] = await db.select().from(decks).where(eq(decks.id, id)).limit(1);
  if (!deck) {
    res.status(404).json({ error: 'Deck not found' });
    return;
  }

  const format = body.data.format as ExportFormat;
  const job = await createExportJob(id, format);

  try {
    const queue = getExportQueue();
    await queue.add('export-deck', {
      exportJobId: job.id,
      deckId: id,
      format,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export queue unavailable';
    res.status(503).json({ error: message });
    return;
  }

  res.status(202).json({ exportJobId: job.id, status: job.status });
});
