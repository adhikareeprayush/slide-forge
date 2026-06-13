#!/usr/bin/env node
/**
 * Create contribution issues on GitHub for SlideForge.
 *
 * Usage:
 *   gh auth login && node scripts/create-github-issues.mjs
 *   GITHUB_TOKEN=ghp_xxx node scripts/create-github-issues.mjs
 *   node scripts/create-github-issues.mjs --dry-run
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireGithubToken } from './github-auth.mjs';

const REPO = process.env.GITHUB_REPO ?? 'adhikareeprayush/slide-forge';
const DRY_RUN = process.argv.includes('--dry-run');
const TOKEN = requireGithubToken({ dryRun: DRY_RUN });

const [owner, repo] = REPO.split('/');

async function gh(path, { method = 'GET', body } = {}) {
  if (DRY_RUN) {
    console.log(`[dry-run] ${method} ${path}`);
    if (body) console.log(JSON.stringify(body, null, 2));
    return { number: 0, html_url: `https://github.com/${REPO}/issues/0` };
  }

  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'slideforge-issue-bootstrap',
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

const MAINTAINER = '[@adhikareeprayush](https://github.com/adhikareeprayush)';

/** @type {{ title: string; labels: string[]; body: string }[]} */
const ISSUES = [
  // ── Epics ──
  {
    title: '[Epic] OSS launch readiness',
    labels: ['epic', 'documentation', 'ci', 'help wanted'],
    body: `## Goal
Make the repository welcoming and safe for external contributors.

## Checklist
- [x] MIT LICENSE
- [x] CONTRIBUTING.md
- [x] SECURITY.md
- [x] Issue templates
- [x] Main CI workflow (\`.github/workflows/ci.yml\`)
- [ ] Enable GitHub Discussions
- [ ] Add CODEOWNERS (optional)

## Maintainer
${MAINTAINER}`,
  },
  {
    title: '[Epic] Community layout pipeline',
    labels: ['epic', 'community', 'layouts', 'help wanted'],
    body: `## Goal
End-to-end flow for contributors to add slide layouts via PR.

## Checklist
- [x] \`community/README.md\`
- [x] \`validate-layout.yml\` CI
- [ ] Complete exemplar layout (\`community/timeline-steps\`)
- [ ] Improve PR validation comments
- [ ] \`slideforge publish\` GitHub PR automation
- [ ] Publish registry to GitHub Pages
- [ ] Persist download counts in Postgres

## Maintainer
${MAINTAINER}`,
  },
  {
    title: '[Epic] Editor polish',
    labels: ['epic', 'editor', 'ux', 'design', 'help wanted'],
    body: `## Goal
Improve the slide editor experience to match the implementation plan.

## Checklist
- [ ] Filmstrip canvas thumbnails
- [ ] Chart slot inspector (JSON editor)
- [ ] Quote + attribution inspector
- [ ] Image shimmer during generation
- [ ] Inline canvas editing (contenteditable)
- [ ] Add/remove slides in editor

## Maintainer
${MAINTAINER}`,
  },
  {
    title: '[Epic] Multi-user and self-hosting',
    labels: ['epic', 'auth', 'infrastructure', 'self-hosting', 'help wanted'],
    body: `## Goal
Support multiple users and one-command production deployment.

## Checklist
- [ ] Auth.js + GitHub OAuth
- [ ] User dashboard (\`GET /api/decks\`)
- [ ] Docker Compose full stack (web + api + worker)
- [ ] Drizzle SQL migrations
- [ ] npm publish workflow for \`@slideforge/*\`

## Maintainer
${MAINTAINER}`,
  },

  // ── Good first issues ──
  {
    title: 'Complete community/timeline-steps layout scaffold',
    labels: ['good first issue', 'layouts', 'community', 'help wanted'],
    body: `## Summary
The \`community/timeline-steps\` layout is missing required scaffold files.

## Tasks
- [ ] Add \`thumbnail.svg\` (16:9 SVG preview)
- [ ] Polish \`README.md\` with usage notes
- [ ] Optionally add \`Slide.tsx\` custom renderer
- [ ] Run \`slideforge validate community/timeline-steps\`

## Files
- \`community/timeline-steps/\`
- \`packages/sdk/src/scaffold.ts\` (reference)

## Acceptance criteria
PR passes \`validate-layout.yml\` and serves as the reference community layout.`,
  },
  {
    title: 'Add theme picker to the generate form',
    labels: ['good first issue', 'frontend', 'ux', 'help wanted'],
    body: `## Summary
The API accepts \`theme\` on \`POST /api/generate\`, but the generate UI does not expose it.

## Tasks
- [ ] Add theme dropdown to \`apps/web/app/generate/GeneratePage.tsx\`
- [ ] Use presets from \`packages/ui/src/themes.ts\` (default, minimal, bold, dark, corporate)
- [ ] Pass selected theme into \`startGeneration()\`

## Files
- \`apps/web/app/generate/GeneratePage.tsx\`
- \`apps/api/src/routes/generate.ts\`
- \`packages/ui/src/themes.ts\``,
  },
  {
    title: 'Fix slide regenerate to use deck tone instead of hardcoded professional',
    labels: ['good first issue', 'bug', 'api', 'help wanted'],
    body: `## Summary
\`POST /api/slides/:slideId/regenerate\` always uses \`tone = 'professional'\`.

## Tasks
- [ ] Store generation tone on the deck or generation job record
- [ ] Read tone when regenerating a slide
- [ ] Fall back to \`professional\` if tone is unknown

## Files
- \`apps/api/src/routes/slides.ts\` (line ~58)
- \`apps/api/src/db/schema.ts\`
- \`apps/web/lib/editor-api.ts\``,
  },
  {
    title: 'Add unit tests for SlotRenderer',
    labels: ['good first issue', 'testing', 'help wanted'],
    body: `## Summary
Only \`@slideforge/schema\` has Vitest tests. \`SlotRenderer\` handles 9 slot types with no coverage.

## Tasks
- [ ] Add Vitest to \`packages/ui\`
- [ ] Test heading, body, list, image, quote, chart, icon, divider rendering
- [ ] Test chart JSON parsing edge cases
- [ ] Wire into root \`pnpm test\`

## Files
- \`packages/ui/src/SlotRenderer.tsx\`
- \`packages/ui/package.json\``,
  },
  {
    title: 'Add lint script to apps/api',
    labels: ['good first issue', 'api', 'ci', 'help wanted'],
    body: `## Summary
Root \`pnpm lint\` runs via Turborepo but \`apps/api\` has no lint script.

## Tasks
- [ ] Add ESLint config for \`apps/api\` (reuse \`@repo/eslint-config\`)
- [ ] Add \`"lint": "eslint src/"\` to \`apps/api/package.json\`
- [ ] Fix any lint errors in \`apps/api/src/\`

## Files
- \`apps/api/package.json\`
- \`turbo.json\``,
  },
  {
    title: 'Improve validate-layout PR comment with pass/fail details',
    labels: ['good first issue', 'ci', 'community', 'help wanted'],
    body: `## Summary
\`validate-layout.yml\` posts a generic PR comment. Contributors need field-level validation output.

## Tasks
- [ ] Capture \`slideforge validate\` stdout/stderr per layout
- [ ] Post a markdown table: layout ID, status, errors
- [ ] Only comment on failure, or always comment with summary

## Files
- \`.github/workflows/validate-layout.yml\`
- \`packages/sdk/src/validate.ts\``,
  },
  {
    title: 'Add layout tag search to /layouts browser',
    labels: ['good first issue', 'frontend', 'layouts', 'community', 'help wanted'],
    body: `## Summary
Built-in layouts define \`tags\` in \`slide.config.ts\`, but the layouts browser only filters by category.

## Tasks
- [ ] Add tag filter chips or search input on \`/layouts\`
- [ ] Include tags in API layout list response if not already exposed
- [ ] Sort/filter by tag match

## Files
- \`apps/web/app/layouts/LayoutsBrowser.tsx\`
- \`apps/api/src/routes/layouts.ts\`
- \`layouts/title-hero/slide.config.ts\` (example tags)`,
  },
  {
    title: 'Add second exemplar community layout',
    labels: ['good first issue', 'layouts', 'community', 'help wanted'],
    body: `## Summary
Only one community layout exists. A second complete example helps new contributors.

## Suggested layouts
- \`comparison-table\` — two columns with headings
- \`timeline-horizontal\` — steps across the slide
- \`team-grid\` — photo + name cards

## Requirements
Full bundle under \`community/<id>/\`:
- \`slide.config.ts\`
- \`thumbnail.svg\`
- \`README.md\`
- Optional \`Slide.tsx\`

## Files
- \`community/\` (new directory)
- \`community/README.md\``,
  },

  // ── Layouts / community ──
  {
    title: 'Implement slideforge publish GitHub PR automation',
    labels: ['feature', 'sdk', 'community', 'help wanted'],
    body: `## Summary
\`slideforge publish\` validates layouts but only prints manual PR steps. With \`GITHUB_TOKEN\` it should open a PR automatically.

## Tasks
- [ ] Use GitHub REST API to create a branch and PR
- [ ] Copy layout files to \`community/<layout-id>/\`
- [ ] Handle existing layout ID conflicts gracefully
- [ ] Document \`GITHUB_TOKEN\` scope requirements

## Files
- \`packages/sdk/src/publish.ts\`
- \`packages/sdk/src/cli.ts\`
- \`community/README.md\``,
  },
  {
    title: 'Persist layout download counts in PostgreSQL',
    labels: ['feature', 'api', 'database', 'community', 'help wanted'],
    body: `## Summary
\`POST /api/layouts/:id/use\` increments downloads in an in-memory \`Map\` — counts reset on API restart.

## Tasks
- [ ] Add \`layouts\` table (id, download_count, metadata) or extend schema
- [ ] Drizzle migration / push
- [ ] Replace in-memory \`incrementLayoutDownloads()\`
- [ ] Seed built-in layout rows on startup or in \`db:seed\`

## Files
- \`apps/api/src/services/layout-registry.ts\`
- \`apps/api/src/routes/layouts.ts\`
- \`apps/api/src/db/schema.ts\``,
  },
  {
    title: 'Publish layout registry to GitHub Pages',
    labels: ['feature', 'ci', 'community', 'infrastructure', 'help wanted'],
    body: `## Summary
\`release-layouts.yml\` builds \`registry.json\` as an artifact only. The plan calls for a public registry URL.

## Tasks
- [ ] Add GitHub Pages deploy step to \`release-layouts.yml\`
- [ ] Publish \`registry.json\` + thumbnails at \`https://adhikareeprayush.github.io/slide-forge/layouts/\`
- [ ] Document registry URL in README

## Files
- \`.github/workflows/release-layouts.yml\`
- \`apps/api/src/services/layout-registry.ts\``,
  },
  {
    title: 'Enforce reserved slot IDs in layout validation CI',
    labels: ['feature', 'layouts', 'ci', 'community', 'help wanted'],
    body: `## Summary
Community layouts should not use reserved slot IDs that conflict with built-in conventions.

## Tasks
- [ ] Define reserved ID list in \`@slideforge/schema\`
- [ ] Add validation rule in \`validateSlide()\`
- [ ] Fail CI when a community layout uses reserved IDs
- [ ] Document reserved IDs in \`community/README.md\`

## Files
- \`packages/slide-schema/src/validate.ts\`
- \`.github/workflows/validate-layout.yml\`
- \`implementation_plan.md\` (reference)`,
  },

  // ── Frontend / UX ──
  {
    title: 'Render SlideCanvas thumbnails in editor filmstrip',
    labels: ['design', 'editor', 'ux', 'help wanted'],
    body: `## Summary
The editor filmstrip shows slide numbers and layout names only. Scaled-down \`SlideCanvas\` previews would improve navigation.

## Tasks
- [ ] Render mini \`SlideCanvas\` per slide in filmstrip (scale ~0.12)
- [ ] Handle performance (memoize, only render visible thumbs)
- [ ] Match generate-page filmstrip style for consistency

## Files
- \`apps/web/app/editor/[id]/Editor.tsx\`
- \`apps/web/app/editor/[id]/editor.module.css\`
- \`packages/ui/src/SlideCanvas.tsx\``,
  },
  {
    title: 'Add chart slot editor in the inspector',
    labels: ['design', 'editor', 'ux', 'help wanted'],
    body: `## Summary
\`data-chart\` layouts store chart data as JSON \`{labels, values}\`. The inspector has no dedicated editor.

## Tasks
- [ ] Detect \`chart\` slot type in inspector
- [ ] Add simple label/value row editor (or JSON textarea with validation)
- [ ] Preview updates live on canvas

## Files
- \`apps/web/app/editor/[id]/Editor.tsx\`
- \`layouts/data-chart/slide.config.ts\`
- \`packages/ui/src/SlotRenderer.tsx\``,
  },
  {
    title: 'Add quote and attribution editors in the inspector',
    labels: ['design', 'editor', 'ux', 'help wanted'],
    body: `## Summary
\`quote-full\` layout has quote + attribution slots. Inspector treats them as generic textareas without context.

## Tasks
- [ ] Group quote + attribution fields visually
- [ ] Add character limits from slot \`maxLength\`
- [ ] Style preview hints (italic quote block)

## Files
- \`apps/web/app/editor/[id]/Editor.tsx\`
- \`layouts/quote-full/slide.config.ts\``,
  },
  {
    title: 'Add image shimmer placeholders during generation stream',
    labels: ['design', 'ux', 'frontend', 'help wanted'],
    body: `## Summary
During live generation, image slots show static "Image generating…" text. A shimmer/skeleton would feel more polished.

## Tasks
- [ ] Add shimmer CSS for image slots on generate page
- [ ] Transition to loaded image on \`image_ready\` WebSocket event
- [ ] Reuse styles in \`SlotRenderer\` where appropriate

## Files
- \`apps/web/app/generate/GeneratePage.tsx\`
- \`apps/web/app/generate/generate.module.css\`
- \`packages/ui/src/SlotRenderer.tsx\``,
  },

  // ── Features ──
  {
    title: 'User dashboard with GET /api/decks',
    labels: ['feature', 'api', 'frontend', 'help wanted'],
    body: `## Summary
There is no way to list decks. The home page links to generate and a hardcoded demo deck only.

## Tasks
- [ ] Add \`GET /api/decks\` (list recent decks, paginated)
- [ ] Add \`/dashboard\` page in \`apps/web\`
- [ ] Show deck title, status, slide count, updated date
- [ ] Link to editor and preview

## Files
- \`apps/api/src/routes/decks.ts\`
- \`apps/web/app/\` (new \`dashboard/\` route)
- \`apps/web/lib/api-client.ts\``,
  },
  {
    title: 'Add slide create and delete in API and editor',
    labels: ['feature', 'editor', 'api', 'help wanted'],
    body: `## Summary
Editor supports reorder but not add/remove slides. API lacks create/delete slide endpoints.

## Tasks
- [ ] \`POST /api/decks/:id/slides\` — create slide with layout + position
- [ ] \`DELETE /api/slides/:slideId\` — remove slide, reindex positions
- [ ] Editor UI: "Add slide" + delete button on filmstrip
- [ ] Update \`editor-store.ts\` and \`editor-api.ts\`

## Files
- \`apps/api/src/routes/decks.ts\`
- \`apps/api/src/routes/slides.ts\`
- \`apps/web/app/editor/[id]/Editor.tsx\`
- \`apps/web/lib/editor-store.ts\``,
  },
  {
    title: 'Implement Auth.js with GitHub OAuth',
    labels: ['feature', 'auth', 'api', 'frontend', 'help wanted'],
    body: `## Summary
Auth is planned but not implemented — no \`users\` table, no auth middleware, no login routes.

## Tasks
- [ ] Add \`users\` table and \`decks.user_id\` foreign key
- [ ] Auth.js in \`apps/web\` with GitHub provider
- [ ] JWT or session validation middleware in \`apps/api\`
- [ ] Scope deck CRUD to authenticated user
- [ ] Document \`AUTH_*\` env vars in \`.env.example\`

## Files
- \`apps/api/src/db/schema.ts\`
- \`apps/web/app/\`
- \`.env.example\`
- \`implementation_plan.md\` (reference)`,
  },
  {
    title: 'Integration tests for generation pipeline with mock AI',
    labels: ['feature', 'testing', 'api', 'help wanted'],
    body: `## Summary
Generation is only tested via manual scripts (\`test-generation.ts\`). Automated integration tests are needed.

## Tasks
- [ ] Add Vitest to \`apps/api\`
- [ ] Test \`runGenerationPipeline\` with \`AI_PROVIDER=mock\`
- [ ] Assert deck + slides persisted, events published
- [ ] Run in CI (no API keys required)

## Files
- \`apps/api/src/services/generation.ts\`
- \`apps/api/src/services/ai/mock.ts\`
- \`apps/api/package.json\``,
  },
  {
    title: 'Add OpenRouter AI provider',
    labels: ['feature', 'ai', 'self-hosting', 'help wanted'],
    body: `## Summary
Implementation plan includes OpenRouter as an AI provider option. Registry only supports nvidia, ollama, and mock.

## Tasks
- [ ] Add \`apps/api/src/services/ai/openrouter.ts\`
- [ ] Register in \`ai/registry.ts\` when \`AI_PROVIDER=openrouter\`
- [ ] Document \`OPENROUTER_API_KEY\` in \`.env.example\`
- [ ] Implement \`generateFullDeck\` compatible with existing pipeline

## Files
- \`apps/api/src/services/ai/registry.ts\`
- \`apps/api/src/services/ai/nvidia.ts\` (reference)
- \`.env.example\``,
  },
  {
    title: 'Wire custom community Slide.tsx renderers at runtime',
    labels: ['feature', 'sdk', 'layouts', 'help wanted'],
    body: `## Summary
SDK scaffold creates \`Slide.tsx\` per layout, but runtime always uses \`SlideCanvas\` from \`@slideforge/ui\`.

## Tasks
- [ ] Load optional \`Slide.tsx\` from \`community/<id>/\` at API startup or on demand
- [ ] Fallback to \`SlideCanvas\` when no custom renderer
- [ ] Document when custom renderers are appropriate vs slot-only layouts
- [ ] Preview command uses same loader

## Files
- \`packages/ui/src/SlideCanvas.tsx\`
- \`apps/api/src/services/layout-registry.ts\`
- \`packages/sdk/src/preview.ts\`
- \`community/README.md\``,
  },

  // ── Infrastructure ──
  {
    title: 'Docker Compose full stack for self-hosting',
    labels: ['infrastructure', 'self-hosting', 'help wanted'],
    body: `## Summary
\`docker-compose.yml\` runs Postgres, Redis, and MinIO only. No web, api, or worker services.

## Tasks
- [ ] Add Dockerfiles for \`apps/api\` and \`apps/web\`
- [ ] Add \`api\`, \`web\`, \`worker\` services to compose
- [ ] Environment wiring for production URLs
- [ ] Document one-command deploy in README

## Files
- \`docker-compose.yml\`
- \`apps/api/\` (new Dockerfile)
- \`apps/web/\` (new Dockerfile)
- \`apps/worker/src/index.ts\``,
  },
  {
    title: 'Add Drizzle SQL migrations',
    labels: ['infrastructure', 'database', 'self-hosting', 'help wanted'],
    body: `## Summary
Schema uses \`drizzle-kit push\` only. The \`migrations/\` folder is empty — not production-safe.

## Tasks
- [ ] Generate initial migration from current schema
- [ ] Add \`db:migrate\` script
- [ ] Update \`db:setup\` to use migrations in CI/production
- [ ] Document migration workflow in CONTRIBUTING.md

## Files
- \`apps/api/drizzle.config.ts\`
- \`apps/api/src/db/schema.ts\`
- \`apps/api/src/db/migrations/\`
- \`package.json\``,
  },
  {
    title: 'Replace apps/docs with SlideForge documentation site',
    labels: ['documentation', 'sdk', 'help wanted'],
    body: `## Summary
\`apps/docs\` is default create-next-app boilerplate. Plan calls for SDK tutorial, self-hosting, and API reference.

## Tasks
- [ ] Replace boilerplate with SlideForge branding
- [ ] SDK quickstart (defineSlide, CLI commands)
- [ ] Self-hosting guide (Docker, env vars)
- [ ] API endpoint reference
- [ ] Link from main README

## Files
- \`apps/docs/\`
- \`packages/sdk/README.md\` (new or expand)
- \`README.md\``,
  },
  {
    title: 'Add Playwright E2E test for generate to editor to export',
    labels: ['testing', 'ci', 'help wanted'],
    body: `## Summary
No browser E2E tests exist. A happy-path test would catch regressions in the core user flow.

## Tasks
- [ ] Add Playwright to \`apps/web\`
- [ ] Test: start generation (mock AI) → land in editor → slides visible
- [ ] Test: export PPTX or PDF (poll job status)
- [ ] Run in CI with \`AI_PROVIDER=mock\`

## Files
- \`apps/web/\`
- \`.github/workflows/ci.yml\`
- \`apps/api/src/services/ai/mock.ts\``,
  },
];

async function existingTitles() {
  const titles = new Set();
  let page = 1;
  while (true) {
    const issues = await gh(
      `/repos/${owner}/${repo}/issues?state=all&per_page=100&page=${page}`,
    );
    if (!issues.length) break;
    for (const issue of issues) {
      if (!issue.pull_request) titles.add(issue.title);
    }
    page++;
  }
  return titles;
}

console.log(`Repository: ${REPO}`);
if (DRY_RUN) console.log('DRY RUN — no issues will be created\n');

const seen = DRY_RUN ? new Set() : await existingTitles();
let created = 0;
let skipped = 0;

for (const issue of ISSUES) {
  if (seen.has(issue.title)) {
    console.log(`skip (exists): ${issue.title}`);
    skipped++;
    continue;
  }

  const result = await gh(`/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    body: {
      title: issue.title,
      body: issue.body,
      labels: issue.labels,
    },
  });
  console.log(`created #${result.number}: ${issue.title}`);
  console.log(`  ${result.html_url}`);
  created++;
  seen.add(issue.title);

  // GitHub secondary rate limit
  if (!DRY_RUN) await new Promise((r) => setTimeout(r, 1200));
}

console.log(`\nDone. Created: ${created}, skipped: ${skipped}`);
