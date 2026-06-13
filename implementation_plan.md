# SlideForge — Implementation Plan

> Open-source AI presentation platform powered by NVIDIA NIM free models.
> Extensible slide layout system for developers and community contributors.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Tech Stack](#3-tech-stack)
4. [Phase 0 — Foundation (Week 1–2)](#phase-0--foundation-week-12)
5. [Phase 1 — Core Engine (Week 3–5)](#phase-1--core-engine-week-35)
6. [Phase 2 — AI Pipeline (Week 6–8)](#phase-2--ai-pipeline-week-68)
7. [Phase 3 — Slide Layout System (Week 9–11)](#phase-3--slide-layout-system-week-911)
8. [Phase 4 — Editor & UX (Week 12–14)](#phase-4--editor--ux-week-1214)
9. [Phase 5 — Export & Community (Week 15–17)](#phase-5--export--community-week-1517)
10. [Phase 6 — OSS Launch (Week 18–20)](#phase-6--oss-launch-week-1820)
11. [Database Schema](#database-schema)
12. [API Surface](#api-surface)
13. [Slide Schema Specification](#slide-schema-specification)
14. [Community Contribution Flow](#community-contribution-flow)
15. [Environment Variables](#environment-variables)
16. [Self-Hosting Guide](#self-hosting-guide)
17. [OSS Milestone Checklist](#oss-milestone-checklist)

---

## 1. Project Overview

SlideForge is a fully open-source, AI-powered presentation generator. Users describe what they want; SlideForge generates a complete, styled slide deck using free NVIDIA NIM models for both text and image generation. Developers can define reusable slide layouts via a typed SDK. Community members can contribute layouts through a structured PR-based registry.

**Core principles:**

- Free to use, free to self-host, no vendor lock-in
- NVIDIA NIM as the default AI provider (free tier); swappable via a provider interface
- The slide layout system is the public API — not a black box
- One `docker compose up` gets you a full running instance
- Images are generated contextually (semantic, not decorative) in the style of Gamma

---

## 2. Repository Structure

```
slideforge/
├── apps/
│   ├── web/                        # Next.js 14 App Router frontend
│   │   ├── app/
│   │   │   ├── (auth)/             # Login, register
│   │   │   ├── (app)/
│   │   │   │   ├── dashboard/      # User's decks
│   │   │   │   ├── editor/[id]/    # Slide editor
│   │   │   │   └── preview/[id]/   # Full-screen preview
│   │   │   └── api/                # Next.js route handlers (auth, webhooks)
│   │   ├── components/
│   │   │   ├── editor/             # Editor UI components
│   │   │   ├── slides/             # Slide renderers
│   │   │   └── ui/                 # Shared primitives (shadcn/ui base)
│   │   └── lib/
│   │       ├── api-client.ts       # Typed client for Express API
│   │       └── ws-client.ts        # WebSocket client for streaming
│   │
│   ├── api/                        # Express API server
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── decks.ts        # CRUD for presentations
│   │   │   │   ├── slides.ts       # Slide operations
│   │   │   │   ├── generate.ts     # AI generation endpoints
│   │   │   │   ├── export.ts       # PPTX/PDF/HTML export
│   │   │   │   └── layouts.ts      # Layout registry endpoints
│   │   │   ├── services/
│   │   │   │   ├── nvidia.ts       # NVIDIA NIM client
│   │   │   │   ├── image-gen.ts    # Image generation + queuing
│   │   │   │   ├── prompt.ts       # Prompt pipeline
│   │   │   │   ├── export/
│   │   │   │   │   ├── pptx.ts     # pptxgenjs adapter
│   │   │   │   │   ├── pdf.ts      # Puppeteer PDF export
│   │   │   │   │   └── html.ts     # Static HTML export
│   │   │   │   └── storage.ts      # S3-compatible file storage
│   │   │   ├── workers/
│   │   │   │   └── image.worker.ts # BullMQ image generation worker
│   │   │   ├── ws/
│   │   │   │   └── generation.ts   # WebSocket for streaming slide output
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts         # JWT validation
│   │   │   │   └── rate-limit.ts   # Per-user rate limiting
│   │   │   └── db/
│   │   │       ├── schema.ts       # Drizzle ORM schema
│   │   │       └── migrations/     # SQL migrations
│   │   └── Dockerfile
│   │
│   └── worker/                     # Standalone BullMQ worker process
│       └── src/
│           └── index.ts
│
├── packages/
│   ├── slide-schema/               # Published: @slideforge/schema
│   │   ├── src/
│   │   │   ├── types.ts            # SlideDefinition, SlotDefinition, etc.
│   │   │   ├── validate.ts         # Zod schema validator
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── sdk/                        # Published: @slideforge/sdk
│   │   ├── src/
│   │   │   ├── defineSlide.ts      # Primary developer API
│   │   │   ├── preview.ts          # Local preview server
│   │   │   ├── cli.ts              # `slideforge` CLI commands
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── ui/                         # Published: @slideforge/ui
│       ├── src/
│       │   ├── SlideCanvas.tsx     # Renders any SlideDefinition
│       │   ├── SlotRenderer.tsx    # Renders individual slots
│       │   └── index.ts
│       └── package.json
│
├── layouts/                        # Built-in layout library
│   ├── title-hero/
│   │   ├── slide.config.ts
│   │   ├── Slide.tsx
│   │   └── thumbnail.svg
│   ├── two-column/
│   ├── media-right/
│   ├── bullet-list/
│   ├── quote-full/
│   ├── data-chart/
│   └── closing-cta/
│
├── community/                      # Community-contributed layouts (validated by CI)
│   └── README.md
│
├── docker-compose.yml              # Full stack: web + api + worker + postgres + redis
├── docker-compose.dev.yml          # Dev overrides with hot reload
├── turbo.json                      # Turborepo pipeline config
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint, typecheck, test
│       ├── validate-layout.yml     # Validates community layout PRs
│       └── release.yml             # Publish packages to npm
└── CONTRIBUTING.md
```

---

## 3. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR, streaming, file-based routing |
| API Server | Express 5 + TypeScript | Long-running tasks, independent scaling |
| Job Queue | BullMQ + Redis | Async image generation, retries |
| ORM | Drizzle ORM | Type-safe, lightweight, migration-friendly |
| Database | PostgreSQL 15 | Relational, proven, self-hostable |
| File Storage | MinIO (S3-compatible) | Self-hostable, swap to AWS S3 in prod |
| Auth | Auth.js (NextAuth v5) | GitHub + Google OAuth + magic link |
| AI — Text | NVIDIA NIM (Llama 3.1 70B) | Free tier, OpenAI-compatible API |
| AI — Images | NVIDIA NIM (SDXL) | Free tier, contextual slide images |
| Monorepo | Turborepo | Parallel builds, shared packages |
| Schema | Zod | Runtime validation of slide definitions |
| Export — PPTX | pptxgenjs | Battle-tested PPTX generation |
| Export — PDF | Puppeteer | Headless Chrome renders slides to PDF |
| WebSockets | ws + custom protocol | Streaming slide generation to editor |
| Styling | Tailwind CSS | Utility-first, consistent design tokens |
| Testing | Vitest + Playwright | Unit + E2E |
| CI/CD | GitHub Actions | OSS-friendly, free for public repos |
| Containerization | Docker + Compose | One-command self-hosting |

---

## Phase 0 — Foundation (Week 1–2)

**Goal:** Monorepo is running, all services boot, CI passes.

### Tasks

- [ ] Initialize Turborepo with `pnpm` workspaces
- [ ] Scaffold `apps/web` with Next.js 14 + Tailwind + shadcn/ui
- [ ] Scaffold `apps/api` with Express 5 + TypeScript + ts-node-dev
- [ ] Scaffold `apps/worker` as a standalone Node process
- [ ] Create `packages/slide-schema`, `packages/sdk`, `packages/ui` with tsconfig paths
- [ ] Set up Drizzle ORM with PostgreSQL, write initial migration
- [ ] Configure BullMQ connecting to Redis
- [ ] Write `docker-compose.yml` (postgres, redis, minio, web, api, worker)
- [ ] Set up GitHub Actions: lint (ESLint), typecheck, unit test pipeline
- [ ] Configure Turborepo remote cache (optional, speeds up CI)
- [ ] Add `CONTRIBUTING.md` and issue templates
- [ ] Set up Auth.js with GitHub OAuth on the Next.js app

### Deliverables

- `pnpm dev` starts all services with hot reload
- `docker compose up` starts the full production stack
- GitHub Actions CI is green on an empty codebase
- Auth flow works end to end (login → dashboard)

---

## Phase 1 — Core Engine (Week 3–5)

**Goal:** The slide schema and renderer work. A hardcoded deck can be displayed.

### Tasks

**`packages/slide-schema`**

- [ ] Define `SlideDefinition` TypeScript interface (see [Slide Schema Specification](#slide-schema-specification))
- [ ] Define `SlotDefinition` interface with all slot types
- [ ] Write Zod validator for `SlideDefinition`
- [ ] Write `validateSlide(def)` function with human-readable error messages
- [ ] Unit test: valid definitions pass, invalid ones fail with clear errors

**`packages/sdk`**

- [ ] Implement `defineSlide(def: SlideDefinition): ValidatedSlide`
- [ ] Implement `previewSlide(def)` — spins up a local Vite server showing the slide
- [ ] Implement `slideforge validate` CLI command
- [ ] Implement `slideforge new <layout-name>` — scaffolds a layout directory

**`packages/ui`**

- [ ] Build `<SlideCanvas>` — renders a `SlideDefinition` + slot data to a 16:9 div
- [ ] Build `<SlotRenderer>` — switches on slot type (heading, body, image, list, quote, chart)
- [ ] Support CSS variable theming (font, colors, spacing) injected at canvas level

**`layouts/` — built-in layouts**

- [ ] `title-hero` — full bleed title + subtitle + background image
- [ ] `two-column` — heading + two equal text columns
- [ ] `media-right` — text left, image right (50/50 split)
- [ ] `bullet-list` — heading + 4–6 bullet points
- [ ] `quote-full` — large pull quote + attribution
- [ ] `data-chart` — heading + chart slot + supporting text
- [ ] `closing-cta` — closing statement + call-to-action

**`apps/web`**

- [ ] `/preview/[id]` route — fetches a deck from DB, renders with `<SlideCanvas>`, paginated

### Deliverables

- A JSON deck definition stored in the DB can be fully rendered in the browser
- All 7 built-in layouts render correctly at 1280×720 and scale responsively
- `slideforge validate` correctly accepts and rejects layout definitions

---

## Phase 2 — AI Pipeline (Week 6–8)

**Goal:** AI generates a complete deck from a user prompt. Images stream in progressively.

### Tasks

**NVIDIA NIM Integration (`apps/api/src/services/nvidia.ts`)**

```typescript
// Provider interface — swap NVIDIA for any OpenAI-compatible API
interface AIProvider {
  generateContent(prompt: string, schema: SlotSchema[]): Promise<SlotContent>;
  generateImage(prompt: string, style: ImageStyle): Promise<string>; // returns URL
}

// NVIDIA NIM implementation
class NvidiaNimProvider implements AIProvider {
  private client: OpenAI; // @openai/openai with custom baseURL
  constructor() {
    this.client = new OpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey: process.env.NVIDIA_API_KEY,
    });
  }
}
```

- [ ] Implement `NvidiaNimProvider` for text generation (Llama 3.1 70B)
- [ ] Implement `NvidiaNimProvider` for image generation (SDXL 1.0)
- [ ] Implement `OllamaProvider` stub (for local model self-hosters)
- [ ] Add provider registry: `AI_PROVIDER=nvidia|ollama|openrouter` env var

**Prompt Pipeline (`apps/api/src/services/prompt.ts`)**

- [ ] `generateOutline(topic, slideCount, tone)` — returns JSON array of slide types + content briefs
- [ ] `generateSlotContent(brief, slotDefs)` — fills each slot with AI-generated content
- [ ] `generateImagePrompt(slideContent, imageStyle)` — creates a semantic image prompt from slide text
- [ ] System prompt engineering: enforce JSON output, slide length limits, tone consistency
- [ ] Add prompt caching layer (Redis, 24h TTL) to avoid regenerating identical requests

**Image Generation Queue (`apps/api/src/workers/image.worker.ts`)**

- [ ] BullMQ job: `generate-image` — calls NVIDIA SDXL, uploads to MinIO, returns public URL
- [ ] Retry logic: 3 attempts with exponential backoff
- [ ] Fallback: if image generation fails, use an Unsplash keyword search as placeholder
- [ ] Job completion triggers WebSocket event to frontend

**WebSocket Streaming (`apps/api/src/ws/generation.ts`)**

```typescript
// Event protocol
type GenerationEvent =
  | { type: 'outline_ready'; slides: OutlineSlide[] }
  | { type: 'slide_content_ready'; slideIndex: number; slots: SlotContent }
  | { type: 'image_ready'; slideIndex: number; slotId: string; url: string }
  | { type: 'generation_complete'; deckId: string }
  | { type: 'error'; message: string };
```

- [ ] WebSocket server on `apps/api`
- [ ] Frontend WebSocket client subscribes to generation events by `deckId`
- [ ] Editor UI updates slide-by-slide as events arrive (streaming effect)

**Generation API Route**

- [ ] `POST /api/generate` — accepts topic + options, returns `deckId`, kicks off pipeline
- [ ] `GET /api/decks/:id/status` — polling fallback for WebSocket-less clients
- [ ] Per-user rate limiting: 10 generations/hour on free tier (configurable)

### Deliverables

- User submits a topic → deck outline appears in ~3 seconds
- Slides fill in progressively over the next 10–20 seconds
- Images stream in as they complete (async, non-blocking)
- Complete generation pipeline works end-to-end with NVIDIA NIM free tier

---

## Phase 3 — Slide Layout System (Week 9–11)

**Goal:** Developer-facing SDK is polished. Community contribution pipeline works.

### Tasks

**SDK Polish (`packages/sdk`)**

- [ ] `slideforge new <name>` scaffolds: `slide.config.ts`, `Slide.tsx`, `thumbnail.svg`, `README.md`
- [ ] `slideforge preview` runs a hot-reloading preview server at `localhost:4000`
- [ ] `slideforge validate` outputs a clear pass/fail with field-level errors
- [ ] `slideforge publish` — opens a PR to `slideforge/community` automatically (via GitHub API)
- [ ] Write detailed SDK documentation with examples

**Layout Dev Kit (`slide.config.ts` format)**

```typescript
import { defineSlide } from '@slideforge/sdk';

export default defineSlide({
  id: 'media-right-v2',
  name: 'Media Right',
  version: '1.0.0',
  category: 'media',
  author: 'community-contributor',
  slots: [
    {
      id: 'heading',
      type: 'heading',
      required: true,
      maxLength: 60,
      position: { x: '0%', y: '0%', w: '48%', h: '20%' },
    },
    {
      id: 'body',
      type: 'body',
      required: true,
      maxLength: 300,
      position: { x: '0%', y: '22%', w: '48%', h: '68%' },
    },
    {
      id: 'image',
      type: 'image',
      required: false,
      imageStyle: 'photographic',
      position: { x: '52%', y: '0%', w: '48%', h: '100%' },
    },
  ],
  aiHints: {
    headingStyle: 'concise',         // tells AI to write short headings
    bodyStyle: 'paragraph',          // paragraph vs bullet
    imageKeywords: ['professional', 'relevant to content'],
  },
  thumbnail: '<svg>…</svg>',         // base64 inline SVG, 16:9
});
```

**Community Registry**

- [ ] `community/` directory in the repo — one subdirectory per layout
- [ ] GitHub Actions workflow `validate-layout.yml`: runs on every PR touching `community/`
  - Installs layout dependencies
  - Runs `slideforge validate` against the `slide.config.ts`
  - Renders thumbnail and checks it is a valid SVG
  - Checks required fields: `id`, `name`, `version`, `author`, `thumbnail`
  - Posts a bot comment with pass/fail details
- [ ] Maintainer approves PR after visual review of thumbnail
- [ ] On merge, `release.yml` publishes updated layout registry JSON to GitHub Pages
- [ ] `apps/api` fetches layout registry at startup and caches it

**Layout Registry JSON (hosted on GitHub Pages)**

```json
{
  "version": "2025-01-01",
  "layouts": [
    {
      "id": "media-right-v2",
      "name": "Media Right",
      "author": "community-contributor",
      "source": "community/media-right-v2",
      "thumbnail": "https://slideforge.github.io/layouts/media-right-v2/thumb.svg",
      "downloads": 142
    }
  ]
}
```

### Deliverables

- Developer can run `npx @slideforge/sdk new my-layout` and have a working layout in < 5 minutes
- Community PR is fully validated by CI with no human review of schema
- Layout registry updates automatically on merge

---

## Phase 4 — Editor & UX (Week 12–14)

**Goal:** The editor feels fast, intuitive, and Gamma-adjacent in quality.

### Tasks

**Editor (`apps/web/app/(app)/editor/[id]/`)**

- [ ] Left panel: slide filmstrip (thumbnail list, drag to reorder)
- [ ] Center: live slide canvas (16:9, editable slots)
- [ ] Right panel: slot editor (text inputs, image regen button, layout picker)
- [ ] Inline text editing directly on the canvas (contenteditable slots)
- [ ] Layout picker: grid of layout thumbnails, click to swap current slide's layout
- [ ] "Regenerate this slide" button — re-runs AI for just one slide
- [ ] "Regenerate image" button per image slot — queues a new SDXL job
- [ ] Undo/redo via Zustand + immer patch history
- [ ] Keyboard shortcuts: `←/→` navigate slides, `Cmd+Z` undo, `Cmd+Enter` regenerate

**Theme System**

- [ ] 5 built-in themes: Default, Minimal, Bold, Dark, Corporate
- [ ] Each theme defines: font pair, primary color, background, text color
- [ ] Theme is stored on the deck, applied as CSS variables at `<SlideCanvas>` level
- [ ] Theme switcher in editor toolbar — instant preview

**Generation UX (Gamma-style)**

- [ ] Onboarding: large text input "What's your presentation about?"
- [ ] Options: tone (professional / casual / creative), slide count (auto / 5 / 10 / 15), theme
- [ ] After submit: animated "Generating your deck…" screen with slide-by-slide reveal
- [ ] Each slide fades in as its content arrives via WebSocket
- [ ] Images fill in with a shimmer placeholder until ready
- [ ] "Edit" button appears on hover over each slide during generation

**Performance**

- [ ] `<SlideCanvas>` is a pure component — memo-ized, no unnecessary re-renders
- [ ] Slide thumbnails use a scaled-down canvas render (not a full re-render)
- [ ] Image slots use Next.js `<Image>` with blur placeholder

### Deliverables

- Complete editing flow from generation → edit → export in one session
- Editor feels responsive at 60fps during all interactions
- Generation UX matches the "streaming" feel of Gamma

---

## Phase 5 — Export & Community (Week 15–17)

**Goal:** PPTX/PDF/HTML export works reliably. Community portal is live.

### Tasks

**PPTX Export (`apps/api/src/services/export/pptx.ts`)**

- [ ] Use `pptxgenjs` to build slides programmatically
- [ ] Map each `SlotDefinition` type to a pptxgenjs element (text box, image, shape)
- [ ] Apply theme colors and fonts to the pptx master slide
- [ ] Handle image slots: download from MinIO, embed as base64
- [ ] Return a `.pptx` buffer, stream to client

**PDF Export (`apps/api/src/services/export/pdf.ts`)**

- [ ] Puppeteer opens the `/preview/[id]?export=true` page (no UI chrome)
- [ ] Iterates slides, screenshots each at 1280×720 → embeds in PDF
- [ ] Alternative: use `pdf-lib` for text-layer preservation
- [ ] Return a `.pdf` buffer

**HTML Export (`apps/api/src/services/export/html.ts`)**

- [ ] Render deck as a self-contained HTML file with inline CSS and base64 images
- [ ] Include a minimal presentation JS (arrow keys to navigate, fullscreen support)
- [ ] Zip and return as `.html` archive (no external dependencies)

**Export API**

- [ ] `POST /api/decks/:id/export` — body: `{ format: 'pptx' | 'pdf' | 'html' }`
- [ ] Returns a signed MinIO URL to download the export (valid 1 hour)
- [ ] Export jobs are queued via BullMQ (same pattern as image gen)

**Community Layout Portal (`apps/web/app/(app)/layouts/`)**

- [ ] Browse all available layouts (built-in + community) in a grid
- [ ] Filter by category, sort by popularity
- [ ] Layout detail page: preview, author, version, install instructions
- [ ] "Use this layout" — adds it to the user's preferred layouts list
- [ ] Link to GitHub for contribution instructions

### Deliverables

- PPTX export opens correctly in PowerPoint and Google Slides
- PDF export renders at print quality
- HTML export is fully self-contained (works offline)
- Community layout browser is live and searchable

---

## Phase 6 — OSS Launch (Week 18–20)

**Goal:** The project is ready for a public launch that attracts contributors.

### Tasks

**Documentation**

- [ ] `docs/` site (Nextra or Docusaurus) covering:
  - Getting started (cloud + self-hosted)
  - How to build a layout (SDK tutorial)
  - How to contribute a layout
  - API reference (OpenAPI spec, auto-generated)
  - Architecture overview
- [ ] `README.md` — compelling, with a GIF of generation, one-liner install, badges

**Self-Hosting**

- [ ] `docker-compose.yml` tested on a clean Ubuntu VM
- [ ] Environment variable documentation for all required secrets
- [ ] `./scripts/setup.sh` — interactive setup script (prompts for NVIDIA API key, domain)
- [ ] One-click Railway / Render / Fly.io deploy button in README

**OpenAPI Spec**

- [ ] Auto-generate from Express routes using `zod-openapi` or `tsoa`
- [ ] Publish spec to `docs/api`
- [ ] Generate typed client for `apps/web` from the spec

**Testing**

- [ ] Unit tests: slide schema validator, prompt pipeline, slot renderer
- [ ] Integration tests: generation flow with a mocked NVIDIA API
- [ ] E2E tests (Playwright): generate deck → edit → export PPTX
- [ ] Coverage threshold: 70% on `packages/`, 50% on `apps/`

**OSS Hygiene**

- [ ] `LICENSE` — MIT
- [ ] `CONTRIBUTING.md` — code of conduct, PR process, layout submission guide
- [ ] Issue templates: bug report, feature request, layout submission
- [ ] GitHub Discussions enabled for Q&A
- [ ] `SECURITY.md` — responsible disclosure policy
- [ ] Semantic versioning + `CHANGELOG.md`
- [ ] npm publish for `@slideforge/schema`, `@slideforge/sdk`, `@slideforge/ui`

**Launch**

- [ ] Product Hunt launch post
- [ ] Hacker News "Show HN" post
- [ ] Dev.to / Hashnode article: "How we built a free Gamma alternative with NVIDIA NIM"
- [ ] Twitter/X thread with GIF of the generation flow

### Deliverables

- Public GitHub repo with 5+ built-in layouts, full docs, and working self-host
- npm packages published
- First community layout accepted via PR

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  provider    TEXT NOT NULL,           -- 'github' | 'google' | 'email'
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Decks (presentations)
CREATE TABLE decks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  theme       TEXT NOT NULL DEFAULT 'default',
  status      TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'generating' | 'ready'
  is_public   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Slides
CREATE TABLE slides (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id      UUID REFERENCES decks(id) ON DELETE CASCADE,
  layout_id    TEXT NOT NULL,                 -- references layout registry
  position     INTEGER NOT NULL,
  slot_data    JSONB NOT NULL DEFAULT '{}',   -- { slotId: content }
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Generation jobs
CREATE TABLE generation_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id      UUID REFERENCES decks(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending',
  prompt       TEXT NOT NULL,
  options      JSONB NOT NULL DEFAULT '{}',
  error        TEXT,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Image generation jobs
CREATE TABLE image_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id     UUID REFERENCES slides(id) ON DELETE CASCADE,
  slot_id      TEXT NOT NULL,
  prompt       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  result_url   TEXT,
  error        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Community layout registry cache
CREATE TABLE layouts (
  id           TEXT PRIMARY KEY,              -- matches slide.config.ts id
  name         TEXT NOT NULL,
  author       TEXT NOT NULL,
  category     TEXT NOT NULL,
  version      TEXT NOT NULL,
  source_url   TEXT NOT NULL,
  thumbnail    TEXT NOT NULL,                 -- SVG string
  download_count INTEGER DEFAULT 0,
  is_builtin   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

---

## API Surface

```
POST   /api/auth/*                      Auth.js routes (handled by Next.js)

GET    /api/decks                       List user's decks
POST   /api/decks                       Create a new empty deck
GET    /api/decks/:id                   Get deck with slides
PATCH  /api/decks/:id                   Update deck (title, theme, is_public)
DELETE /api/decks/:id                   Delete deck

GET    /api/decks/:id/slides            List slides in order
POST   /api/decks/:id/slides            Add a slide
PATCH  /api/decks/:id/slides/:slideId   Update slide (slot_data, layout_id, position)
DELETE /api/decks/:id/slides/:slideId   Delete slide

POST   /api/generate                    Start AI generation → returns { deckId, jobId }
GET    /api/generate/:jobId/status      Poll generation status
WS     /ws/generate/:jobId             Stream generation events

POST   /api/decks/:id/export            Queue export → returns { exportJobId }
GET    /api/export/:exportJobId         Poll export → returns { downloadUrl }

GET    /api/layouts                     List all layouts (built-in + community)
GET    /api/layouts/:id                 Get layout detail
POST   /api/layouts/:id/use             Increment download count

POST   /api/slides/:id/regenerate-image Requeue image generation for a slot
```

---

## Slide Schema Specification

```typescript
// packages/slide-schema/src/types.ts

export type SlotType =
  | 'heading'    // Short title text (max 80 chars recommended)
  | 'subheading' // Secondary title
  | 'body'       // Longer paragraph text
  | 'list'       // Bullet point array
  | 'image'      // AI-generated or user-uploaded image
  | 'quote'      // Pull quote with optional attribution
  | 'chart'      // Data visualization (Chart.js config)
  | 'icon'       // Single icon (Lucide icon name)
  | 'divider';   // Visual separator

export type ImageStyle =
  | 'photographic'   // Realistic photo
  | 'abstract'       // Abstract / geometric art
  | 'diagram'        // Technical diagram style
  | 'illustration'   // Flat illustration style
  | 'icon';          // Simple icon / pictogram

export type SlideCategory =
  | 'title'      // Opening slide
  | 'content'    // Standard content slide
  | 'media'      // Image or video focused
  | 'split'      // Two-column or split layouts
  | 'data'       // Charts and data
  | 'quote'      // Pull quote
  | 'closing';   // End slide / CTA

export interface SlotPosition {
  x: string;   // CSS percentage or grid value, e.g. '0%' or '1 / 7'
  y: string;
  w: string;
  h: string;
}

export interface SlotDefinition {
  id: string;
  type: SlotType;
  required: boolean;
  maxLength?: number;         // Character limit for text slots
  imageStyle?: ImageStyle;    // For image slots
  position: SlotPosition;
  defaultValue?: string;      // Placeholder shown in editor
}

export interface AIHintConfig {
  headingStyle?: 'concise' | 'descriptive' | 'question';
  bodyStyle?: 'paragraph' | 'bullet' | 'numbered';
  tone?: 'professional' | 'casual' | 'bold';
  imageKeywords?: string[];   // Extra context for image generation
}

export interface SlideDefinition {
  id: string;                 // Unique, kebab-case, e.g. 'media-right-v2'
  name: string;               // Human-readable display name
  version: string;            // Semver, e.g. '1.0.0'
  category: SlideCategory;
  author: string;             // GitHub username or 'core'
  slots: SlotDefinition[];
  aiHints: AIHintConfig;
  thumbnail: string;          // Inline SVG string (16:9 aspect ratio)
  tags?: string[];
}
```

---

## Community Contribution Flow

A community member contributes a new slide layout by submitting a pull request to the `community/` directory. The process is fully automated up to a visual approval step.

```
Contributor runs:
  npx @slideforge/sdk new my-awesome-layout
  # Scaffolds: community/my-awesome-layout/
  #   slide.config.ts
  #   Slide.tsx
  #   thumbnail.svg
  #   README.md

Contributor runs:
  cd community/my-awesome-layout
  slideforge preview        # Hot-reload preview at localhost:4000
  slideforge validate       # Checks schema, thumbnail, required fields

Contributor opens a PR to slideforge/slideforge targeting community/

GitHub Actions (validate-layout.yml):
  1. Install dependencies
  2. Run `slideforge validate` on the config
  3. Render thumbnail, verify it is a valid 16:9 SVG
  4. Check no reserved slot IDs are overridden
  5. Post a PR comment: ✅ Schema valid / ❌ Errors (with field-level details)

Maintainer review:
  - Reviews thumbnail visually (does it look good?)
  - Checks Slide.tsx for any malicious code
  - Approves and merges

On merge:
  release.yml updates the layout registry JSON on GitHub Pages
  Apps pick up the new layout on next startup (registry is fetched and cached)
```

---

## Environment Variables

```bash
# apps/api/.env
DATABASE_URL=postgresql://user:pass@localhost:5432/slideforge
REDIS_URL=redis://localhost:6379

# NVIDIA NIM
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxx
AI_PROVIDER=nvidia              # nvidia | ollama | openrouter

# Storage (MinIO / S3)
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=slideforge

# Auth (shared with web)
AUTH_SECRET=your-secret-here
AUTH_URL=http://localhost:3000

# Feature flags
MAX_GENERATIONS_PER_HOUR=10    # Rate limit per user
DEFAULT_SLIDE_COUNT=8

# apps/web/.env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
AUTH_GITHUB_ID=your-github-oauth-app-id
AUTH_GITHUB_SECRET=your-github-oauth-app-secret
```

---

## Self-Hosting Guide

```bash
# 1. Clone the repository
git clone https://github.com/slideforge/slideforge
cd slideforge

# 2. Copy and fill in environment variables
cp .env.example .env
# Edit .env: add NVIDIA_API_KEY, AUTH_SECRET, GitHub OAuth credentials

# 3. Start the full stack
docker compose up -d

# 4. Run database migrations
docker compose exec api pnpm db:migrate

# 5. Open the app
open http://localhost:3000
```

The `docker-compose.yml` starts:

- `postgres` — PostgreSQL 15 on port 5432
- `redis` — Redis 7 on port 6379
- `minio` — MinIO object storage on port 9000 (console: 9001)
- `api` — Express API on port 4000
- `worker` — BullMQ image generation worker
- `web` — Next.js frontend on port 3000

---

## OSS Milestone Checklist

Before calling v1.0.0, every item below must be complete.

**Core product**
- [ ] Generation works end-to-end with NVIDIA NIM free tier
- [ ] At least 7 built-in layouts, all passing validation
- [ ] PPTX, PDF, and HTML export all work and open correctly
- [ ] Editor is functional for full edit flow
- [ ] Auth works with GitHub OAuth

**Developer experience**
- [ ] `@slideforge/sdk` is published to npm and documented
- [ ] `slideforge new`, `slideforge preview`, `slideforge validate` all work
- [ ] First community layout is merged via the contribution pipeline
- [ ] SDK tutorial produces a working layout in < 10 minutes

**Self-hosting**
- [ ] `docker compose up` works on a clean Ubuntu 22.04 machine
- [ ] All env vars documented in `.env.example`
- [ ] One-click deploy buttons for Railway and Render

**Quality**
- [ ] CI is green (lint + typecheck + tests)
- [ ] Test coverage ≥ 70% on packages
- [ ] No critical security vulnerabilities (run `pnpm audit`)
- [ ] OpenAPI spec generated and published

**Community**
- [ ] MIT license
- [ ] `CONTRIBUTING.md` covers code, layouts, and docs contributions
- [ ] Issue templates for bugs, features, and layout submissions
- [ ] GitHub Discussions enabled
- [ ] `SECURITY.md` with disclosure email

---

*SlideForge — built in the open, for everyone.*