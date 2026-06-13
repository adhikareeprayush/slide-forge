import { Router, type IRouter } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { decks, generationJobs } from '../db/schema';
import { runGenerationPipeline } from '../services/generation';
import { rateLimitGenerations } from '../middleware/rate-limit';
import type { GenerationOptions } from '../services/ai/types';

export const generateRouter: IRouter = Router();

const generateSchema = z.object({
  topic: z.string().min(3).max(500),
  slideCount: z.number().int().min(3).max(15).optional(),
  tone: z.enum(['professional', 'casual', 'bold']).optional(),
  theme: z.string().optional(),
});

generateRouter.post('/', rateLimitGenerations, async (req, res) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { topic, slideCount, tone, theme } = parsed.data;
  const options: GenerationOptions = {};
  if (slideCount !== undefined) options.slideCount = slideCount;
  if (tone !== undefined) options.tone = tone;
  if (theme !== undefined) options.theme = theme;

  const [deck] = await db
    .insert(decks)
    .values({
      title: topic,
      theme: theme ?? 'default',
      status: 'generating',
    })
    .returning();

  if (!deck) {
    res.status(500).json({ error: 'Failed to create deck' });
    return;
  }

  const [job] = await db
    .insert(generationJobs)
    .values({
      deckId: deck.id,
      prompt: topic,
      options,
      status: 'pending',
    })
    .returning();

  if (!job) {
    res.status(500).json({ error: 'Failed to create generation job' });
    return;
  }

  runGenerationPipeline(job.id, deck.id, topic, options).catch(console.error);

  res.status(202).json({
    deckId: deck.id,
    jobId: job.id,
    wsUrl: `/ws/generate/${job.id}`,
  });
});

generateRouter.get('/:jobId/status', async (req, res) => {
  const { jobId } = req.params;

  const [job] = await db
    .select()
    .from(generationJobs)
    .where(eq(generationJobs.id, jobId))
    .limit(1);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.json({
    jobId: job.id,
    deckId: job.deckId,
    status: job.status,
    error: job.error,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
  });
});
