import { Worker } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { getBullConnection } from '../queues/connection';
import { EXPORT_QUEUE_NAME, type ExportJobData } from '../queues/export.queue';
import { runExport } from '../services/export';
import { uploadExport } from '../services/storage';
import { setExportJobStatus } from '../services/export/status';

const MIME: Record<string, string> = {
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pdf: 'application/pdf',
  html: 'text/html',
};

const EXT: Record<string, string> = {
  pptx: 'pptx',
  pdf: 'pdf',
  html: 'html',
};

export function startExportWorker(): Worker<ExportJobData> {
  const worker = new Worker<ExportJobData>(
    EXPORT_QUEUE_NAME,
    async (job) => {
      const { exportJobId, deckId, format } = job.data;
      await setExportJobStatus(exportJobId, { status: 'processing' });

      const buffer = await runExport(deckId, format);
      const filename = `${deckId}-${randomUUID()}.${EXT[format]}`;
      const downloadUrl = await uploadExport(buffer, filename, MIME[format]!);

      await setExportJobStatus(exportJobId, {
        status: 'completed',
        downloadUrl,
      });

      return downloadUrl;
    },
    {
      connection: getBullConnection(),
      concurrency: 2,
    },
  );

  worker.on('failed', async (job, err) => {
    if (!job) return;
    await setExportJobStatus(job.data.exportJobId, {
      status: 'failed',
      error: err.message,
    });
    console.error(`Export job failed: ${err.message}`);
  });

  console.log('Export worker started');
  return worker;
}
