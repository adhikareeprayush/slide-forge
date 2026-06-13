import { Worker } from 'bullmq';
import { eq, and } from 'drizzle-orm';
import { getBullConnection } from '../queues/connection';
import { resolveSlideImage } from '../services/image-resolve';
import { db } from '../db';
import { slides, imageJobs } from '../db/schema';
import { publishGenerationEvent } from '../ws/types';
import { IMAGE_QUEUE_NAME, type ImageJobData } from '../queues/image.queue';
import type { ImageStyle } from '@slideforge/schema';

export function startImageWorker(): Worker<ImageJobData> {
  const worker = new Worker<ImageJobData>(
    IMAGE_QUEUE_NAME,
    async (job) => {
      const data = job.data;
      const url = await resolveSlideImage(data.prompt, data.imageStyle as ImageStyle);

      const [slide] = await db.select().from(slides).where(eq(slides.id, data.slideId)).limit(1);
      if (slide) {
        const slotData = { ...(slide.slotData as Record<string, unknown>), [data.slotId]: url };
        await db.update(slides).set({ slotData, updatedAt: new Date() }).where(eq(slides.id, data.slideId));
      }

      await db
        .update(imageJobs)
        .set({ status: 'completed', resultUrl: url })
        .where(and(eq(imageJobs.slideId, data.slideId), eq(imageJobs.slotId, data.slotId)));

      if (data.jobId !== 'editor') {
        await publishGenerationEvent(data.jobId, {
          type: 'image_ready',
          slideIndex: data.slideIndex,
          slideId: data.slideId,
          slotId: data.slotId,
          url,
        });
      }

      return url;
    },
    {
      connection: getBullConnection(),
      concurrency: 4,
    },
  );

  worker.on('failed', async (job, err) => {
    if (!job) return;
    console.error(`Image job failed: ${err.message}`);
  });

  console.log('Image worker started (stock photos)');
  return worker;
}
