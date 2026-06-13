# Community Layouts

Contribute slide layouts to SlideForge by opening a pull request in this directory.

## Quick start

```bash
# From repo root
npx slideforge new my-layout -o community/my-layout
cd community/my-layout
slideforge validate .
slideforge preview .
slideforge publish .
```

## Requirements

Each layout directory must include:

| File | Purpose |
|------|---------|
| `slide.config.ts` | Layout definition (validated by Zod) |
| `Slide.tsx` | Optional custom renderer |
| `thumbnail.svg` | 16:9 preview SVG |
| `README.md` | Documentation |

## CI validation

Pull requests that touch `community/` trigger `validate-layout.yml`, which:

- Runs `slideforge validate` on each changed layout
- Verifies thumbnail is valid SVG
- Checks required schema fields

Maintainers review thumbnails visually before merge.
