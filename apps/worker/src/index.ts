import '../../api/src/load-env';
import { startImageWorker } from '../../api/src/workers/image.worker';

const worker = startImageWorker();

process.on('SIGINT', async () => {
  await worker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});
