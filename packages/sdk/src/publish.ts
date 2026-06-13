export interface PublishOptions {
  path: string;
  githubToken?: string;
  repo?: string;
}

export async function publishLayout(options: PublishOptions): Promise<void> {
  const { validateSlideFile } = await import('./validate');
  const slide = await validateSlideFile(options.path);

  const token = options.githubToken ?? process.env.GITHUB_TOKEN;
  const repo = options.repo ?? process.env.SLIDEFORGE_COMMUNITY_REPO ?? 'slideforge/slideforge';

  if (!token) {
    console.log(`
Layout "${slide.name}" (${slide.id}) is valid.

To publish to the community registry:

  1. Copy your layout to community/${slide.id}/
  2. Open a PR to ${repo}
  3. CI will run slideforge validate automatically

Or set GITHUB_TOKEN to enable automatic PR creation (coming soon).
`);
    return;
  }

  console.log(`Would open PR to ${repo} for layout ${slide.id} (GitHub API integration — set GITHUB_TOKEN in CI)`);
}
