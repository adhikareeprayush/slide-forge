import type { ImageStyle, SlotDefinition } from '@slideforge/schema';
import type {
  AIProvider,
  FullDeckGeneration,
  LayoutForPrompt,
  OutlineSlide,
  SlotContent,
} from './types';

const MOCK_OUTLINE_LAYOUTS = [
  'title-hero',
  'bullet-list',
  'two-column',
  'media-right',
  'data-chart',
  'quote-full',
  'closing-cta',
];

const STOCK_QUERIES = [
  'technology abstract blue',
  'business team office',
  'data analytics charts',
  'nature landscape sunset',
  'innovation startup workspace',
  'global network connection',
  'creative design studio',
  'science research laboratory',
];

export class MockAIProvider implements AIProvider {
  async generateFullDeck(
    topic: string,
    slideCount: number,
    tone: string,
    layouts: LayoutForPrompt[],
  ): Promise<FullDeckGeneration> {
    await delay(600);
    const count = Math.min(Math.max(slideCount, 3), 10);
    const layoutIds = layouts.map((l) => l.id);
    const slides: FullDeckGeneration['slides'] = [];

    for (let i = 0; i < count; i++) {
      const preferred = MOCK_OUTLINE_LAYOUTS[i % MOCK_OUTLINE_LAYOUTS.length]!;
      const layoutId = layoutIds.includes(preferred)
        ? preferred
        : layoutIds[i % layoutIds.length]!;
      const layout = layouts.find((l) => l.id === layoutId);
      const brief = `Slide ${i + 1} about ${topic}`;
      const slots: SlotContent = {};

      for (const slot of layout?.slots ?? []) {
        if (slot.type === 'list') {
          slots[slot.id] = [
            `Key point about ${topic}`,
            `Supporting detail (${tone})`,
            `Actionable takeaway`,
          ];
        } else if (slot.type === 'chart') {
          slots[slot.id] = JSON.stringify({
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            values: [25, 40, 55, 72],
          });
        } else if (slot.type === 'image') {
          slots[slot.id] = STOCK_QUERIES[i % STOCK_QUERIES.length]!;
        } else if (slot.type === 'icon') {
          slots[slot.id] = '→';
        } else {
          slots[slot.id] =
            i === 0 && slot.id.includes('title')
              ? topic
              : `${brief} — ${slot.id} content`;
        }
      }

      slides.push({
        layoutId,
        brief,
        title: i === 0 ? topic : `${topic} — Part ${i + 1}`,
        slots,
      });
    }

    return { title: topic, slides };
  }

  async generateOutline(
    topic: string,
    slideCount: number,
    tone: string,
    availableLayouts: { id: string; category: string; name: string }[],
  ): Promise<OutlineSlide[]> {
    const deck = await this.generateFullDeck(
      topic,
      slideCount,
      tone,
      availableLayouts.map((l) => ({ ...l, slots: [] })),
    );
    return deck.slides.map((s) => ({
      layoutId: s.layoutId,
      brief: s.brief,
      ...(s.title !== undefined ? { title: s.title } : {}),
    }));
  }

  async generateSlotContent(
    brief: string,
    slots: SlotDefinition[],
    tone: string,
  ): Promise<SlotContent> {
    await delay(200);
    const content: SlotContent = {};

    for (const slot of slots) {
      if (slot.type === 'list') {
        content[slot.id] = [`Key point about ${brief}`, `Detail (${tone})`, `Takeaway`];
      } else if (slot.type === 'chart') {
        content[slot.id] = JSON.stringify({
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          values: [25, 40, 55, 72],
        });
      } else if (slot.type === 'image') {
        content[slot.id] = 'professional abstract technology';
      } else if (slot.type === 'icon') {
        content[slot.id] = '→';
      } else {
        content[slot.id] = slot.defaultValue ?? `${brief} — ${slot.id}`;
      }
    }
    return content;
  }

  async generateImagePrompt(
    slideContent: SlotContent,
    _imageStyle: string,
    brief: string,
  ): Promise<string> {
    const text = Object.values(slideContent)
      .filter((v) => typeof v === 'string')
      .join(' ');
    return `professional ${brief} ${text}`.slice(0, 60);
  }

  async generateImage(prompt: string, _style: ImageStyle): Promise<Buffer> {
    const { resolveStockImage } = await import('../stock-image');
    const url = await resolveStockImage(prompt);
    const res = await fetch(url);
    return Buffer.from(await res.arrayBuffer());
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
