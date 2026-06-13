#!/usr/bin/env node
/**
 * Waits for Redis to accept connections.
 * Reads host/port from REDIS_URL in the repo root .env (default localhost:6379).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env');
const DEFAULT_URL = 'redis://localhost:6379';

function loadRedisUrl() {
  if (!existsSync(envPath)) return DEFAULT_URL;
  const match = readFileSync(envPath, 'utf8').match(/^REDIS_URL=(.+)$/m);
  return match?.[1]?.trim() ?? DEFAULT_URL;
}

function parseHostPort(url) {
  try {
    const parsed = new URL(url);
    return { host: parsed.hostname || 'localhost', port: Number(parsed.port) || 6379 };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

function tryConnect(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    socket.setTimeout(2000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

const url = loadRedisUrl();
const { host, port } = parseHostPort(url);

console.log(`Waiting for Redis at ${host}:${port}...`);

let ready = false;
for (let i = 0; i < 30; i++) {
  if (await tryConnect(host, port)) {
    ready = true;
    break;
  }
  await new Promise((r) => setTimeout(r, 1000));
}

if (!ready) {
  console.error(`
Redis is not reachable at ${host}:${port}.

If port 6379 is already used by a system Redis, set in .env:
  REDIS_URL=redis://localhost:6379

If you need Docker Redis instead (maps to host port 6380):
  REDIS_URL=redis://localhost:6380
  sudo docker compose up -d redis

Or start postgres + minio only (skip redis container):
  sudo docker compose up -d postgres minio
`);
  process.exit(1);
}

console.log('Redis is ready.');
