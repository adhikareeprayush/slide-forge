import { spawnSync } from 'node:child_process';

function ghAuthToken() {
  // gh prefers GITHUB_TOKEN env over keyring — clear it to use `gh auth login` session.
  const env = { ...process.env };
  delete env.GITHUB_TOKEN;
  delete env.GH_TOKEN;

  const result = spawnSync('gh', ['auth', 'token'], { encoding: 'utf8', env });
  if (result.status === 0) {
    const token = result.stdout.trim();
    if (token) return token;
  }
  return null;
}

/** Resolve GitHub token — prefers `gh auth login`, then env vars (for CI). */
export function resolveGithubToken() {
  const fromGh = ghAuthToken();
  if (fromGh) return fromGh;

  const fromEnv = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (fromEnv?.trim()) return fromEnv.trim();

  return null;
}

export function requireGithubToken({ dryRun = false } = {}) {
  if (dryRun) return null;

  const token = resolveGithubToken();
  if (token) return token;

  console.error('No GitHub token found.');
  console.error('Either:');
  console.error('  1. Run: gh auth login');
  console.error('  2. Or set GITHUB_TOKEN / GH_TOKEN (CI)');
  console.error('If a broken token is exported, run: unset GITHUB_TOKEN');
  process.exit(1);
}
