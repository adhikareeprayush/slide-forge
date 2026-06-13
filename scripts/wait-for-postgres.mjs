#!/usr/bin/env node
/**
 * Waits for Postgres to accept connections before db:push / db:seed.
 * Reads DATABASE_URL from the repo root .env (or uses the docker-compose default).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env');

const DEFAULT_URL = 'postgresql://slideforge:slideforge@localhost:5432/slideforge';

function loadDatabaseUrl() {
  if (!existsSync(envPath)) return DEFAULT_URL;
  const match = readFileSync(envPath, 'utf8').match(/^DATABASE_URL=(.+)$/m);
  return match?.[1]?.trim() ?? DEFAULT_URL;
}

function parseHostPort(url) {
  try {
    const parsed = new URL(url.replace(/^postgresql:/, 'http:'));
    return { host: parsed.hostname || 'localhost', port: Number(parsed.port) || 5432 };
  } catch {
    return { host: 'localhost', port: 5432 };
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

async function waitForPostgres(host, port, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    if (await tryConnect(host, port)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

const url = loadDatabaseUrl();
const { host, port } = parseHostPort(url);

console.log(`Waiting for Postgres at ${host}:${port}...`);

const ready = await waitForPostgres(host, port);

if (!ready) {
  console.error(`
Postgres is not reachable at ${host}:${port}.

Start it first:

  docker compose up -d

If you get "permission denied" on Docker, either:
  - Run:  sudo docker compose up -d
  - Or add your user to the docker group and re-login:
      sudo usermod -aG docker $USER

Then retry:

  pnpm db:setup
`);
  process.exit(1);
}

console.log('Postgres is ready.');
