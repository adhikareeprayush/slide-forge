# @slideforge/sdk

Developer toolkit for building SlideForge slide layouts.

## Install

```bash
pnpm add @slideforge/sdk
```

## Commands

```bash
# Scaffold a new layout
slideforge new my-layout

# Validate slide.config.ts
slideforge validate ./my-layout

# Preview at localhost:4000
slideforge preview ./my-layout

# Prepare for community submission
slideforge publish ./my-layout
```

## Define a layout

```typescript
import { defineSlide } from '@slideforge/sdk';

export default defineSlide({
  id: 'my-layout',
  name: 'My Layout',
  version: '1.0.0',
  category: 'content',
  author: 'your-github-username',
  slots: [
    {
      id: 'heading',
      type: 'heading',
      required: true,
      maxLength: 60,
      position: { x: '5%', y: '5%', w: '90%', h: '15%' },
    },
    {
      id: 'body',
      type: 'body',
      required: true,
      maxLength: 300,
      position: { x: '5%', y: '24%', w: '90%', h: '68%' },
    },
  ],
  aiHints: { tone: 'professional' },
  thumbnail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#f4efe6"/></svg>',
});
```

See `community/README.md` for contribution guidelines.
