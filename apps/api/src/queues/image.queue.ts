import { Queue } from 'bullmq';
import { getBullConnection } from './connection';

export interface ImageJobData {
  jobId: string;
  deckId: string;
  slideIndex: number;
  slideId: string;
  slotId: string;
  prompt: string;
  imageStyle: string;
}

export const IMAGE_QUEUE_NAME = 'generate-image';

export function getImageQueue(): Queue<ImageJobData> {
  return new Queue(IMAGE_QUEUE_NAME, { connection: getBullConnection() });
}
