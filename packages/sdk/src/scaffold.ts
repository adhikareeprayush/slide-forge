import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function toKebabCase(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const SLIDE_CONFIG_TEMPLATE = (id: string, displayName: string) => `import { defineSlide } from '@slideforge/sdk';
import { REGIONS } from '@slideforge/schema';

export default defineSlide({
  id: '${id}',
  name: '${displayName}',
  version: '1.0.0',
  category: 'content',
  author: 'your-github-username',
  slots: [
    {
      id: 'heading',
      type: 'heading',
      required: true,
      maxLength: 60,
      position: REGIONS.title,
      defaultValue: 'Slide Heading',
    },
    {
      id: 'body',
      type: 'body',
      required: true,
      maxLength: 300,
      position: REGIONS.body,
      defaultValue: 'Your content goes here.',
    },
  ],
  aiHints: {
    headingStyle: 'concise',
    bodyStyle: 'paragraph',
    tone: 'professional',
  },
  thumbnail:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#f8fafc"/><rect x="1" y="1.5" width="10" height="1" fill="#334155"/><rect x="1" y="3.5" width="14" height="4" fill="#e2e8f0"/></svg>',
});
`;

const SLIDE_TSX_TEMPLATE = (displayName: string) => `import type { ValidatedSlide } from '@slideforge/schema';
import { SlideCanvas, type SlotData } from '@slideforge/ui';

interface SlideProps {
  layout: ValidatedSlide;
  slotData?: SlotData;
}

/** Custom renderer for ${displayName} — override default canvas behavior here. */
export function Slide({ layout, slotData }: SlideProps) {
  return <SlideCanvas layout={layout} slotData={slotData} />;
}
`;

const README_TEMPLATE = (id: string, displayName: string) => `# ${displayName}

SlideForge layout: \`${id}\`

## Development

\`\`\`bash
slideforge validate .
slideforge preview .
\`\`\`

## Slots

| ID | Type | Required |
|----|------|----------|
| heading | heading | yes |
| body | body | yes |
`;

const THUMBNAIL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
  <rect width="16" height="9" fill="#f8fafc"/>
  <rect x="1" y="1.5" width="10" height="1" fill="#334155"/>
  <rect x="1" y="3.5" width="14" height="4" fill="#e2e8f0"/>
</svg>
`;

export interface ScaffoldOptions {
  name: string;
  outputDir?: string;
}

export async function scaffoldLayout({ name, outputDir }: ScaffoldOptions): Promise<string> {
  const id = toKebabCase(name);
  if (!id) throw new Error('Layout name must contain at least one alphanumeric character');

  const displayName = name
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const dir = outputDir ?? join(process.cwd(), id);
  await mkdir(dir, { recursive: true });

  await writeFile(join(dir, 'slide.config.ts'), SLIDE_CONFIG_TEMPLATE(id, displayName));
  await writeFile(join(dir, 'Slide.tsx'), SLIDE_TSX_TEMPLATE(displayName));
  await writeFile(join(dir, 'thumbnail.svg'), THUMBNAIL_SVG);
  await writeFile(join(dir, 'README.md'), README_TEMPLATE(id, displayName));

  return dir;
}
