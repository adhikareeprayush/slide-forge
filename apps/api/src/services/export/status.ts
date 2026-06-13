import { randomUUID } from 'node:crypto';
import { getRedis } from '../cache';
import type { ExportFormat, ExportJobStatus } from './types';

const TTL_SEC = 3600;

function key(jobId: string): string {
  return `export:${jobId}`;
}

export async function createExportJob(deckId: string, format: ExportFormat): Promise<ExportJobStatus> {
  const id = randomUUID();
  const job: ExportJobStatus = {
    id,
    deckId,
    format,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  await getRedis().setex(key(id), TTL_SEC, JSON.stringify(job));
  return job;
}

export async function getExportJobStatus(jobId: string): Promise<ExportJobStatus | null> {
  const raw = await getRedis().get(key(jobId));
  if (!raw) return null;
  return JSON.parse(raw) as ExportJobStatus;
}

export async function setExportJobStatus(
  jobId: string,
  patch: Partial<Pick<ExportJobStatus, 'status' | 'downloadUrl' | 'error'>>,
): Promise<void> {
  const current = await getExportJobStatus(jobId);
  if (!current) return;
  const updated = { ...current, ...patch };
  await getRedis().setex(key(jobId), TTL_SEC, JSON.stringify(updated));
}
