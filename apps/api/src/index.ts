import './load-env';
import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import { decksRouter } from './routes/decks';
import { generateRouter } from './routes/generate';
import { layoutsRouter } from './routes/layouts';
import { slidesRouter } from './routes/slides';
import { exportRouter } from './routes/export';
import { attachGenerationWebSocket } from './ws/generation';
import { startImageWorker } from './workers/image.worker';
import { startExportWorker } from './workers/export.worker';
import { loadLayoutRegistry } from './services/layout-registry';

const app = express();
const port = Number(process.env.PORT ?? 4000);
const runWorker = process.env.RUN_IMAGE_WORKER !== 'false';

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', aiProvider: process.env.AI_PROVIDER ?? 'mock' });
});

app.use('/api/decks', decksRouter);
app.use('/api/generate', generateRouter);
app.use('/api/layouts', layoutsRouter);
app.use('/api/slides', slidesRouter);
app.use('/api/export', exportRouter);

const server = createServer(app);
attachGenerationWebSocket(server);

async function start() {
  await loadLayoutRegistry();
  if (runWorker) {
    startImageWorker();
    startExportWorker();
  }
  server.listen(port, () => {
    console.log(`SlideForge API listening on http://localhost:${port}`);
    console.log(`WebSocket: ws://localhost:${port}/ws/generate/:jobId`);
  });
}

start().catch(console.error);
