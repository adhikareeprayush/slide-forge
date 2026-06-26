# SlideForge

Open-source AI presentation platform. Describe a topic, watch slides stream in live, then refine every slot in a full editor. Layouts are defined with a typed SDK — developers and community contributors can add new slide designs without touching the core app.

**Stack:** Next.js · Express · PostgreSQL · Redis · MinIO · NVIDIA NIM (optional)

---

## Features

- **AI generation** — One prompt produces a full deck: title, layout picks, copy, and images. Progress streams over WebSocket while you watch.
- **Slide editor** — Filmstrip, canvas preview, slot inspector, layout swap, themes, undo/redo, and save.
- **Export** — Download decks as PPTX, PDF, or static HTML.
- **Layout system** — Seven built-in layouts plus a community registry. Each layout is a typed `slide.config.ts` with grid-based slot positions.
- **Developer SDK** — `@slideforge/sdk` CLI to scaffold, validate, preview, and publish layouts.
- **Self-hostable** — Postgres + Redis + MinIO via Docker Compose. Mock AI works with no API keys.

---

## Quick start

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) 9
- Docker (for Postgres and MinIO)

### 1. Clone and install

```sh
git clone https://github.com/adhikareeprayush/slide-forge.git
cd slide-forge
pnpm install
```

### 2. Configure environment

```sh
cp .env.example .env
```

For local development without API keys, the defaults work:

```env
AI_PROVIDER=mock
IMAGE_SOURCE=stock
```

To use real NVIDIA generation, set `AI_PROVIDER=nvidia` and add your `NVIDIA_API_KEY` from [build.nvidia.com](https://build.nvidia.com/).

### 3. Start infrastructure

```sh
pnpm infra:up    # Postgres + MinIO (waits until ready)
pnpm db:setup    # Push schema + seed demo deck
```

Redis is required for export jobs and background workers. Use system Redis on port 6379, or start Docker Redis:

```sh
pnpm infra:redis   # Maps host 6380 → container 6379; set REDIS_URL=redis://localhost:6380
```

### 4. Run the apps

In separate terminals:

```sh
pnpm --filter api dev   # API + workers → http://localhost:4000
pnpm --filter web dev   # Frontend → http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) and click **Create a presentation**, or try the seeded demo deck in the editor/preview links on the home page.

---

## How it works

```
User topic
    ↓
POST /api/generate  →  generation job + deck row
    ↓
WebSocket /ws/generate/:jobId
    ├── outline_ready        (layouts chosen)
    ├── slide_content_ready  (copy per slide)
    ├── image_ready          (photo URLs per image slot)
    └── generation_complete  → redirect to /editor/:id
```

Generation uses a **single LLM call** for the whole deck. Image slots receive 2–5 word search keywords from the AI, then resolve to stock photos (Unsplash or Picsum) by default. After completion, the editor loads the full deck from the API.

---

## AI configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `mock` | `mock` for offline dev; `nvidia` for NVIDIA NIM text generation |
| `NVIDIA_API_KEY` | — | Required when `AI_PROVIDER=nvidia` |
| `IMAGE_SOURCE` | `stock` | `stock` (Unsplash/Picsum) or `nvidia` (SDXL, falls back to stock) |
| `IMAGE_UPLOAD` | `false` | Set `true` to store images in MinIO instead of direct URLs |
| `UNSPLASH_ACCESS_KEY` | — | Optional; improves photo relevance ([Unsplash Developers](https://unsplash.com/developers)) |
| `DEFAULT_SLIDE_COUNT` | `8` | Default slide count when not specified |
| `MAX_GENERATIONS_PER_HOUR` | `10` | Rate limit per IP |

**Mock mode** returns canned content instantly — useful for UI work and CI. **NVIDIA mode** calls Llama 3.1 70B for deck content; expect ~60s for a 7-slide deck.

---

## Repository structure

```
slideforge/
├── apps/
│   ├── web/          # Next.js frontend (generate, editor, preview, layouts browser)
│   ├── api/          # Express API, WebSocket, BullMQ workers
│   └── worker/       # Standalone worker process (optional split deployment)
├── packages/
│   ├── slide-schema/ # @slideforge/schema — types + Zod validation
│   ├── sdk/          # @slideforge/sdk — defineSlide() + CLI
│   └── ui/           # @slideforge/ui — SlideCanvas, SlotRenderer
├── layouts/          # Seven built-in layouts (title-hero, bullet-list, …)
├── community/        # Community-contributed layouts (loaded at API startup)
└── docker-compose.yml
```

### Built-in layouts

| ID | Category | Use |
|----|----------|-----|
| `title-hero` | title | Opening slide with full-bleed background |
| `bullet-list` | content | Heading + bullet points |
| `two-column` | split | Side-by-side content |
| `media-right` | media | Text left, image right |
| `quote-full` | quote | Full-width pull quote |
| `data-chart` | data | Bar chart + heading |
| `closing-cta` | closing | Closing statement + CTA |

Browse them at [http://localhost:3000/layouts](http://localhost:3000/layouts) when the web app is running.

---

## Layout SDK

Layouts are plain TypeScript files validated at load time.

```ts
// layouts/my-layout/slide.config.ts
import { defineSlide } from '@slideforge/sdk';
import { REGIONS } from '@slideforge/schema';

export default defineSlide({
  id: 'my-layout',
  name: 'My Layout',
  version: '1.0.0',
  category: 'content',
  author: 'you',
  slots: [
    {
      id: 'heading',
      type: 'heading',
      required: true,
      maxLength: 80,
      position: REGIONS.title,
      zIndex: 10,
    },
    // …
  ],
  aiHints: { tone: 'professional', imageKeywords: ['abstract', 'minimal'] },
  thumbnail: '<svg …></svg>',
});
```

### CLI commands

Build the SDK first, then use the CLI:

```sh
pnpm --filter @slideforge/sdk build

# Scaffold a new layout
pnpm exec slideforge new my-layout -o community/my-layout

# Validate
pnpm exec slideforge validate community/my-layout

# Live preview in browser
pnpm exec slideforge preview community/my-layout

# Prepare for community PR
pnpm exec slideforge publish community/my-layout
```

Community layouts go in `community/<name>/` and are picked up automatically when the API starts.

---

## API overview

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check + active AI provider |
| `POST` | `/api/generate` | Start deck generation |
| `GET` | `/api/decks/:id` | Fetch deck with resolved layouts |
| `PATCH` | `/api/decks/:id` | Update title / theme |
| `POST` | `/api/decks/:id/export` | Queue PPTX, PDF, or HTML export |
| `GET` | `/api/export/:jobId` | Poll export status + download URL |
| `GET` | `/api/layouts` | List registered layouts |
| `GET` | `/api/layouts/:id` | Fetch layout definition |
| `POST` | `/api/slides/:id/regenerate` | Regenerate slide copy |
| `POST` | `/api/slides/:id/regenerate-image` | Regenerate a single image slot |
| `WS` | `/ws/generate/:jobId` | Stream generation events |

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps via Turborepo |
| `pnpm build` | Build all packages and apps |
| `pnpm check-types` | Typecheck the monorepo |
| `pnpm lint` | Lint all packages |
| `pnpm db:up` | Start Postgres + MinIO only |
| `pnpm db:setup` | Push DB schema and seed demo deck |
| `pnpm infra:up` | Start infra and wait for readiness |
| `pnpm --filter api test:generation` | End-to-end generation test (needs NVIDIA key) |
| `pnpm --filter api test:export` | Export pipeline test |
| `pnpm github:labels` | Sync GitHub labels (`gh auth login` or `GITHUB_TOKEN`) |
| `pnpm github:issues` | Bootstrap 30 contribution issues (`gh auth login` recommended) |

---

## Export

From the editor toolbar, export to **PPTX** (pptxgenjs), **PDF** (pdf-lib), or **HTML** (static files). Exports run as background jobs via BullMQ; the download link opens when the job completes.

MinIO stores export files when storage is configured. With `IMAGE_UPLOAD=false`, slide images use direct public URLs and do not require MinIO to be running.

---

## Self-hosting

Minimum services:

1. **PostgreSQL** — deck and slide persistence
2. **Redis** — export and image job queues
3. **MinIO** (optional) — image/export file storage; skip if using direct image URLs

Production checklist:

- Set `CORS_ORIGIN` and `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` to your public URLs
- Set `AI_PROVIDER=nvidia` and `NVIDIA_API_KEY`, or keep `mock` for a demo instance
- Run `pnpm --filter api build && pnpm --filter web build`
- Use `pnpm --filter api start` and `pnpm --filter web start`, or deploy containers per app

## Self-Hosting with Docker

You can spin up the entire full-stack application (Web, API, Worker, Database, Cache, and Storage) using a single command:

```bash
docker-compose up --build -d
---

## Environment variables

See [`.env.example`](.env.example) for the full list. Phase 1 (preview only) needs just `DATABASE_URL` and the `NEXT_PUBLIC_*` URLs. Phase 2 adds Redis, storage, and AI keys.

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and PR guidelines.

- **Good first issues:** [github.com/adhikareeprayush/slide-forge/labels/good%20first%20issue](https://github.com/adhikareeprayush/slide-forge/labels/good%20first%20issue)
- **Layout submissions:** [community/README.md](community/README.md)
- **Security:** [SECURITY.md](SECURITY.md) — adhikareeprayush@gmail.com

Maintainer: [@adhikareeprayush](https://github.com/adhikareeprayush)

## License

[MIT](LICENSE) — Copyright (c) 2026 Prayush Adhikaree

For the full implementation roadmap and schema spec, see [`implementation_plan.md`](implementation_plan.md).
