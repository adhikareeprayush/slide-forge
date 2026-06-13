import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import react from '@vitejs/plugin-react';
import type { ValidatedSlide } from '@slideforge/schema';
import { loadSlideConfig } from './validate';

const SAMPLE_SLOT_DATA: Record<string, Record<string, string | string[]>> = {
  'title-hero': {
    title: 'SlideForge',
    subtitle: 'AI-powered presentations, open source',
  },
  'two-column': {
    heading: 'Compare & Contrast',
    'column-left': 'First perspective with supporting details and context.',
    'column-right': 'Second perspective with complementary information.',
  },
  'media-right': {
    heading: 'Visual Storytelling',
    body: 'Pair compelling copy with a contextual image for maximum impact.',
  },
  'bullet-list': {
    heading: 'Why SlideForge?',
    bullets: ['Open source', 'NVIDIA NIM powered', 'Extensible layouts', 'Self-hostable'],
  },
  'quote-full': {
    quote: '"Open source is not just a licensing model — it is a commitment to transparency."',
    attribution: '— SlideForge Team',
  },
  'data-chart': {
    heading: 'Quarterly Growth',
    chart: JSON.stringify({ labels: ['Q1', 'Q2', 'Q3', 'Q4'], values: [42, 58, 71, 89] }),
    insight: 'Consistent quarter-over-quarter growth driven by community adoption.',
  },
  'closing-cta': {
    statement: 'Start building today',
    cta: 'github.com/slideforge/slideforge',
    icon: '→',
  },
};

function getSampleSlotData(layout: ValidatedSlide): Record<string, string | string[]> {
  return SAMPLE_SLOT_DATA[layout.id] ?? buildDefaultSlotData(layout);
}

function buildDefaultSlotData(layout: ValidatedSlide): Record<string, string | string[]> {
  const data: Record<string, string | string[]> = {};
  for (const slot of layout.slots) {
    if (slot.type === 'list') {
      data[slot.id] = ['Item one', 'Item two', 'Item three'];
    } else if (slot.defaultValue) {
      data[slot.id] = slot.defaultValue;
    }
  }
  return data;
}

function buildPreviewHtml(layoutJson: string, slotDataJson: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SlideForge Preview</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #0f172a;
        font-family: Inter, system-ui, sans-serif;
        color: #e2e8f0;
        gap: 1.5rem;
        padding: 2rem;
      }
      header { text-align: center; }
      header h1 { font-size: 1rem; font-weight: 500; opacity: 0.7; }
      header p { font-size: 0.875rem; opacity: 0.5; margin-top: 0.25rem; }
      #slide-wrapper {
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        border-radius: 8px;
        overflow: hidden;
        line-height: 0;
      }
      .badge {
        display: inline-block;
        background: #6366f1;
        color: white;
        font-size: 0.75rem;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        margin-top: 0.5rem;
      }
    </style>
  </head>
  <body>
    <header>
      <h1>SlideForge Layout Preview</h1>
      <p id="layout-name"></p>
      <span class="badge">1280 × 720</span>
    </header>
    <div id="slide-wrapper"></div>
    <script type="module" src="/preview-entry.tsx"></script>
    <script>
      window.__SLIDEFORGE_LAYOUT__ = ${layoutJson};
      window.__SLIDEFORGE_SLOT_DATA__ = ${slotDataJson};
    </script>
  </body>
</html>`;
}

const PREVIEW_ENTRY = `import React from 'react';
import { createRoot } from 'react-dom/client';
import { SlideCanvas } from '@slideforge/ui';

const layout = window.__SLIDEFORGE_LAYOUT__;
const slotData = window.__SLIDEFORGE_SLOT_DATA__;

document.getElementById('layout-name').textContent = layout.name + ' (' + layout.id + ')';

const wrapper = document.getElementById('slide-wrapper');
const root = createRoot(wrapper);
root.render(<SlideCanvas layout={layout} slotData={slotData} scale={0.75} />);
`;

export interface PreviewOptions {
  path: string;
  port?: number;
  open?: boolean;
}

export async function previewSlide({ path, port = 4000 }: PreviewOptions): Promise<void> {
  const layout = await loadSlideConfig(path);
  const slotData = getSampleSlotData(layout);
  const tmpDir = await mkdtemp(join(tmpdir(), 'slideforge-preview-'));

  const indexHtml = buildPreviewHtml(JSON.stringify(layout), JSON.stringify(slotData));
  await writeFile(join(tmpDir, 'index.html'), indexHtml);
  await writeFile(join(tmpDir, 'preview-entry.tsx'), PREVIEW_ENTRY);

  const sdkDir = dirname(fileURLToPath(import.meta.url));

  const server = await createViteServer({
    root: tmpDir,
    plugins: [react()],
    server: { port, host: true },
    resolve: {
      alias: {
        '@slideforge/ui': join(sdkDir, '../../ui/src/index.ts'),
        '@slideforge/schema': join(sdkDir, '../../slide-schema/src/index.ts'),
      },
    },
  });

  await server.listen();

  const url = `http://localhost:${port}`;
  console.log(`\n  Preview running at ${url}\n`);

  const cleanup = async () => {
    await server.close();
    await rm(tmpDir, { recursive: true, force: true });
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
