import pptxgenModule from 'pptxgenjs';
import type { SlotDefinition } from '@slideforge/schema';
import type { ExportDeck } from './types';
import { resolveTheme } from './types';
import { fetchImageAsDataUri, pctToInches, SLIDE_W_IN, SLIDE_H_IN } from './image-utils';

type PptxConstructor = new () => {
  layout: string;
  addSlide: () => {
    addText: (text: unknown, opts: Record<string, unknown>) => void;
    addImage: (opts: Record<string, unknown>) => void;
    addChart: (type: string, data: unknown, opts: Record<string, unknown>) => void;
    addShape: (type: string, opts: Record<string, unknown>) => void;
    background: unknown;
  };
  write: (opts: { outputType: string }) => Promise<Buffer>;
};

const PptxGenJS = (
  typeof pptxgenModule === 'function'
    ? pptxgenModule
    : (pptxgenModule as { default: PptxConstructor }).default
) as PptxConstructor & {
  ChartType: { bar: string };
  ShapeType: { line: string };
};

export async function exportToPptx(deck: ExportDeck): Promise<Buffer> {
  const pptx = new PptxGenJS() as PptxInstance;
  pptx.layout = 'LAYOUT_16x9';
  const theme = resolveTheme(deck.theme);

  for (const slide of deck.slides) {
    const s = pptx.addSlide();
    s.background = { color: theme.background.replace('#', '') };

    for (const slot of slide.layout.slots) {
      const content = slide.slotData[slot.id];
      await addSlotToPptx(pptx, s, slot, content, theme);
    }
  }

  const output = await pptx.write({ outputType: 'nodebuffer' });
  return output as Buffer;
}

type PptxInstance = InstanceType<PptxConstructor> & {
  ChartType: { bar: string };
  ShapeType: { line: string };
};

async function addSlotToPptx(
  pptx: PptxInstance,
  slide: {
    addText: (text: unknown, opts: Record<string, unknown>) => void;
    addImage: (opts: Record<string, unknown>) => void;
    addChart: (type: string, data: unknown, opts: Record<string, unknown>) => void;
    addShape: (type: string, opts: Record<string, unknown>) => void;
  },
  slot: SlotDefinition,
  content: string | string[] | undefined,
  theme: ReturnType<typeof resolveTheme>,
): Promise<void> {
  const x = pctToInches(slot.position.x, SLIDE_W_IN);
  const y = pctToInches(slot.position.y, SLIDE_H_IN);
  const w = pctToInches(slot.position.w, SLIDE_W_IN);
  const h = pctToInches(slot.position.h, SLIDE_H_IN);

  if (slot.type === 'heading' || slot.type === 'subheading') {
    const text = typeof content === 'string' ? content : slot.defaultValue ?? '';
    slide.addText(text, {
      x,
      y,
      w,
      h,
      fontSize: slot.type === 'heading' ? 32 : 20,
      bold: slot.type === 'heading',
      color: theme.color.replace('#', ''),
      fontFace: theme.fontFamily,
      valign: 'top',
    });
    return;
  }

  if (slot.type === 'body') {
    const text = typeof content === 'string' ? content : slot.defaultValue ?? '';
    slide.addText(text, {
      x,
      y,
      w,
      h,
      fontSize: 14,
      color: theme.color.replace('#', ''),
      fontFace: theme.fontFamily,
      valign: 'top',
    });
    return;
  }

  if (slot.type === 'list') {
    const items = Array.isArray(content) ? content : [];
    slide.addText(
      items.map((item) => ({ text: item, options: { bullet: true, breakLine: true } })),
      {
        x,
        y,
        w,
        h,
        fontSize: 14,
        color: theme.color.replace('#', ''),
        fontFace: theme.fontFamily,
      },
    );
    return;
  }

  if (slot.type === 'quote') {
    const text = typeof content === 'string' ? content : '';
    slide.addText(text, {
      x,
      y,
      w,
      h,
      fontSize: 18,
      italic: true,
      color: theme.color.replace('#', ''),
      fontFace: theme.fontFamily,
    });
    return;
  }

  if (slot.type === 'image' && typeof content === 'string' && content) {
    const dataUri = await fetchImageAsDataUri(content);
    if (dataUri) {
      slide.addImage({ data: dataUri, x, y, w, h });
    }
    return;
  }

  if (slot.type === 'chart' && typeof content === 'string') {
    try {
      const { labels = [], values = [] } = JSON.parse(content) as {
        labels?: string[];
        values?: number[];
      };
      const chartData = [
        {
          name: 'Data',
          labels,
          values,
        },
      ];
      slide.addChart(pptx.ChartType.bar, chartData, {
        x,
        y,
        w,
        h,
        chartColors: [theme.primaryColor.replace('#', '')],
        showLegend: false,
        showTitle: false,
      });
    } catch {
      // skip invalid chart data
    }
    return;
  }

  if (slot.type === 'divider') {
    slide.addShape(pptx.ShapeType.line, {
      x,
      y: y + h / 2,
      w,
      h: 0,
      line: { color: theme.primaryColor.replace('#', ''), width: 2 },
    });
  }
}
