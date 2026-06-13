# Contributing to SlideForge

Thank you for your interest in contributing! SlideForge is an open-source AI presentation platform built by [@adhikareeprayush](https://github.com/adhikareeprayush).

## Ways to contribute

- **Bug fixes** — see [open issues](https://github.com/adhikareeprayush/slide-forge/issues)
- **New slide layouts** — add to `community/` (see [community/README.md](community/README.md))
- **Documentation** — README, SDK guides, self-hosting notes
- **Tests & CI** — Vitest, Playwright, GitHub Actions
- **Features** — editor UX, API endpoints, export improvements

Look for issues labeled [`good first issue`](https://github.com/adhikareeprayush/slide-forge/labels/good%20first%20issue) if you are new to the codebase.

## Development setup

```sh
git clone https://github.com/adhikareeprayush/slide-forge.git
cd slide-forge
pnpm install
cp .env.example .env
pnpm infra:up
pnpm db:setup
```

Run in separate terminals:

```sh
pnpm --filter api dev   # http://localhost:4000
pnpm --filter web dev   # http://localhost:3000
```

Set `AI_PROVIDER=mock` in `.env` for offline development (no API keys required).

## Pull request workflow

1. Fork the repository and create a branch from `main`
2. Make focused changes — one feature or fix per PR
3. Run checks locally:
   ```sh
   pnpm check-types
   pnpm lint
   pnpm test
   ```
4. Open a PR with a clear description and link to the issue (`Fixes #123`)
5. Wait for CI — layout PRs also trigger `validate-layout.yml`

## Contributing a layout

```sh
pnpm --filter @slideforge/sdk build
pnpm exec slideforge new my-layout -o community/my-layout
pnpm exec slideforge validate community/my-layout
pnpm exec slideforge preview community/my-layout
```

Each layout directory must include:

| File | Required |
|------|----------|
| `slide.config.ts` | Yes |
| `thumbnail.svg` | Yes (16:9 SVG) |
| `README.md` | Yes |
| `Slide.tsx` | Optional |

Open a PR adding your directory under `community/`. Maintainers review the thumbnail visually before merge.

## Code style

- TypeScript throughout; match existing patterns in the file you edit
- Run `pnpm format` before committing
- Keep PRs small and reviewable

## Questions

Open a [GitHub Discussion](https://github.com/adhikareeprayush/slide-forge/discussions) or comment on the relevant issue.

## Maintainer

**Prayush Adhikaree** — [@adhikareeprayush](https://github.com/adhikareeprayush) · adhikareeprayush@gmail.com
