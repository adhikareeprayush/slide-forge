#!/usr/bin/env node
/**
 * Sync GitHub labels for SlideForge.
 *
 * Usage:
 *   gh auth login && node scripts/sync-github-labels.mjs
 *   GITHUB_TOKEN=ghp_xxx node scripts/sync-github-labels.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireGithubToken } from './github-auth.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = process.env.GITHUB_REPO ?? 'adhikareeprayush/slide-forge';
const TOKEN = requireGithubToken();

const [owner, repo] = REPO.split('/');

async function gh(path, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'slideforge-label-sync',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${method} ${path} → ${res.status}: ${text}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

const labels = JSON.parse(readFileSync(resolve(ROOT, '.github/labels.json'), 'utf8'));

for (const label of labels) {
  try {
    await gh(`/repos/${owner}/${repo}/labels`, {
      method: 'POST',
      body: {
        name: label.name,
        color: label.color.replace('#', ''),
        description: label.description ?? '',
      },
    });
    console.log(`+ created label: ${label.name}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('already_exists')) {
      await gh(`/repos/${owner}/${repo}/labels/${encodeURIComponent(label.name)}`, {
        method: 'PATCH',
        body: {
          color: label.color.replace('#', ''),
          description: label.description ?? '',
        },
      });
      console.log(`~ updated label: ${label.name}`);
    } else {
      console.warn(`! label skipped (${label.name}): ${msg.slice(0, 120)}`);
    }
  }
}

console.log(`\nLabels synced for ${REPO}`);
