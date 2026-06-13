import { Queue } from 'bullmq';
import { getBullConnection } from './connection';
import type { ExportFormat } from '../services/export/types';

export interface ExportJobData {
  exportJobId: string;
  deckId: string;
  format: ExportFormat;
}

export const EXPORT_QUEUE_NAME = 'export-deck';

export function getExportQueue(): Queue<ExportJobData> {
  return new Queue(EXPORT_QUEUE_NAME, { connection: getBullConnection() });
}
