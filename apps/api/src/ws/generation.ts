import { WebSocketServer, type WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import type { Server } from 'node:http';
import { getRedis } from '../services/cache';
import { GENERATION_CHANNEL, type GenerationEvent } from './types';

const clients = new Map<string, Set<WebSocket>>();

export function attachGenerationWebSocket(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const url = req.url ?? '';
    const match = url.match(/^\/ws\/generate\/([^/?]+)/);
    if (!match) {
      socket.destroy();
      return;
    }

    const jobId = match[1]!;
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req, jobId);
    });
  });

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage, jobId: string) => {
    if (!clients.has(jobId)) clients.set(jobId, new Set());
    clients.get(jobId)!.add(ws);

    const redis = getRedis();
    const channel = GENERATION_CHANNEL(jobId);
    const subscriber = redis.duplicate();

    subscriber.subscribe(channel);
    subscriber.on('message', (_ch, message) => {
      if (ws.readyState === ws.OPEN) ws.send(message);
    });

    ws.on('close', () => {
      clients.get(jobId)?.delete(ws);
      subscriber.unsubscribe(channel);
      subscriber.disconnect();
    });
  });
}

export function broadcastToJob(jobId: string, event: GenerationEvent): void {
  const message = JSON.stringify(event);
  for (const ws of clients.get(jobId) ?? []) {
    if (ws.readyState === ws.OPEN) ws.send(message);
  }
}
