import type { SlotDefinition, ValidatedSlide } from '@slideforge/schema';
import { getRegistry, getLayout } from './layout-registry';
import { resolveAIProvider } from './ai/registry';
import type { FullDeckGeneration, OutlineSlide, SlotContent } from './ai/types';
import { cacheKey, getCached, setCache } from './cache';
import { resolveSlideImage } from './image-resolve';

export type { OutlineSlide, SlotContent };

function layoutsForPrompt(): { id: string; category: string; name: string; slots: ValidatedSlide['slots'] }[] {
  return getRegistry()
    .map((entry) => {
      const layout = getLayout(entry.id);
      if (!layout) return null;
      return {
        id: layout.id,
        category: layout.category,
        name: layout.name,
        slots: layout.slots,
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);
}

/** Single NVIDIA prompt — returns title + all slides with slot content. */
export async function generateFullDeck(
  topic: string,
  slideCount: number,
  tone: string,
): Promise<FullDeckGeneration> {
  const key = cacheKey('fulldeck', topic, String(slideCount), tone);
  const cached = await getCached<FullDeckGeneration>(key);
  if (cached) return cached;

  const layouts = layoutsForPrompt().map((l) => ({
    id: l.id,
    category: l.category,
    name: l.name,
    slots: l.slots.map((s) => ({
      id: s.id,
      type: s.type,
      required: s.required,
      ...(s.maxLength !== undefined ? { maxLength: s.maxLength } : {}),
      ...(s.imageStyle !== undefined ? { imageStyle: s.imageStyle } : {}),
    })),
  }));

  const provider = resolveAIProvider();
  const deck = await provider.generateFullDeck(topic, slideCount, tone, layouts);
  await setCache(key, deck);
  return deck;
}

/** Resolve image slot keywords to real photo URLs (Unsplash / Picsum). */
export async function hydrateImageSlots(
  layout: ValidatedSlide,
  slots: SlotContent,
  brief: string,
): Promise<SlotContent> {
  const result = { ...slots };
  const imageSlots = layout.slots.filter((s) => s.type === 'image');

  await Promise.all(
    imageSlots.map(async (slot) => {
      const raw = result[slot.id];
      const query =
        typeof raw === 'string' && raw.trim()
          ? raw
          : `${brief} ${layout.aiHints.imageKeywords?.join(' ') ?? 'professional abstract'}`.trim();

      const url = await resolveSlideImage(query, slot.imageStyle ?? 'photographic');
      result[slot.id] = url;
    }),
  );

  return result;
}

export function sanitizeSlotContent(
  layout: ValidatedSlide,
  slots: SlotContent,
): SlotContent {
  const result: SlotContent = {};

  for (const slot of layout.slots) {
    const raw = slots[slot.id];

    if (slot.type === 'list') {
      const items = Array.isArray(raw)
        ? raw.filter((i) => typeof i === 'string' && i.trim())
        : typeof raw === 'string'
          ? raw.split('\n').map((s) => s.trim()).filter(Boolean)
          : [];
      result[slot.id] = items.length > 0 ? items : ['Key point'];
      continue;
    }

    if (slot.type === 'chart') {
      result[slot.id] =
        typeof raw === 'string' && raw.trim()
          ? raw
          : JSON.stringify({ labels: ['A', 'B', 'C'], values: [30, 50, 70] });
      continue;
    }

    if (slot.type === 'image') {
      result[slot.id] =
        typeof raw === 'string' && raw.trim()
          ? raw
          : layout.aiHints.imageKeywords?.join(' ') ?? 'professional abstract';
      continue;
    }

    let text =
      typeof raw === 'string'
        ? raw
        : Array.isArray(raw)
          ? raw.join(', ')
          : (slot.defaultValue ?? '');

    if (slot.maxLength && text.length > slot.maxLength) {
      text = text.slice(0, slot.maxLength - 1) + '…';
    }

    result[slot.id] = text || slot.defaultValue || '';
  }

  return result;
}

// Legacy helpers kept for single-slide regenerate
export async function generateOutline(
  topic: string,
  slideCount: number,
  tone: string,
): Promise<OutlineSlide[]> {
  const deck = await generateFullDeck(topic, slideCount, tone);
  return deck.slides.map((s) => ({
    layoutId: s.layoutId,
    brief: s.brief,
    ...(s.title !== undefined ? { title: s.title } : {}),
  }));
}

export async function generateSlotContent(
  brief: string,
  slots: SlotDefinition[],
  tone: string,
): Promise<SlotContent> {
  const provider = resolveAIProvider();
  return provider.generateSlotContent(brief, slots, tone);
}

export async function generateImagePrompt(
  slideContent: SlotContent,
  imageStyle: import('@slideforge/schema').ImageStyle,
  brief: string,
): Promise<string> {
  const provider = resolveAIProvider();
  return provider.generateImagePrompt(slideContent, imageStyle, brief);
}

export function getImageSlots(slots: SlotDefinition[]): SlotDefinition[] {
  return slots.filter((s) => s.type === 'image');
}
