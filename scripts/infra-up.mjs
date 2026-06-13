#!/usr/bin/env node
/**
 * Starts postgres + minio via Docker, then waits for postgres and redis.
 * If Docker needs sudo, tries to continue when containers are already running.
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: root, encoding: 'utf8' });
  return { ok: result.status === 0, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

console.log('Starting postgres + minio...');
const docker = run('docker', ['compose', 'up', '-d', 'postgres', 'minio']);

if (!docker.ok) {
  const msg = `${docker.stdout}${docker.stderr}`;
  if (msg.includes('permission denied') && msg.includes('docker.sock')) {
    console.warn(`
Docker permission denied. Either:

  1. Run once with sudo:
       sudo docker compose up -d postgres minio

  2. Or add your user to the docker group (recommended):
       sudo usermod -aG docker $USER
     Then log out and back in.

Continuing to check if services are already running...
`);
  } else {
    console.error(msg.trim() || 'docker compose failed');
    process.exit(1);
  }
} else {
  console.log('Docker containers started.');
}

function runNodeScript(name) {
  const result = spawnSync('node', [resolve(root, 'scripts', name)], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

runNodeScript('wait-for-postgres.mjs');
runNodeScript('wait-for-redis.mjs');

console.log('\nInfrastructure ready.');
