import { API_URL } from './ws-client';
import type { Deck } from './api-client';

export async function patchDeck(
  id: string,
  data: { title?: string; theme?: string },
): Promise<void> {
  await fetch(`${API_URL}/api/decks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function patchSlide(
  slideId: string,
  data: {
    layoutId?: string;
    slotData?: Record<string, string | string[]>;
    position?: number;
  },
): Promise<void> {
  await fetch(`${API_URL}/api/slides/${slideId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function reorderSlides(deckId: string, slideIds: string[]): Promise<void> {
  await fetch(`${API_URL}/api/decks/${deckId}/slides/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slideIds }),
  });
}

export async function regenerateSlide(slideId: string): Promise<Record<string, string | string[]>> {
  const res = await fetch(`${API_URL}/api/slides/${slideId}/regenerate`, { method: 'POST' });
  const data = (await res.json()) as { slotData: Record<string, string | string[]> };
  return data.slotData;
}

export async function regenerateImage(slideId: string, slotId: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/slides/${slideId}/regenerate-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slotId }),
  });
  const data = (await res.json()) as { url: string };
  return data.url;
}

export interface LayoutMeta {
  id: string;
  name: string;
  author: string;
  category: string;
  version: string;
  thumbnail: string;
  isBuiltin: boolean;
  downloads?: number;
}

export async function fetchLayouts(): Promise<LayoutMeta[]> {
  const res = await fetch(`${API_URL}/api/layouts`);
  const data = (await res.json()) as { layouts: LayoutMeta[] };
  return data.layouts;
}

export async function fetchLayout(id: string): Promise<import('@slideforge/schema').ValidatedSlide> {
  const res = await fetch(`${API_URL}/api/layouts/${id}`);
  return res.json();
}

export async function saveEditorState(deck: Deck): Promise<void> {
  await patchDeck(deck.id, { title: deck.title, theme: deck.theme });
  const slideIds = deck.slides.map((s) => s.id);
  await reorderSlides(deck.id, slideIds);
  for (const slide of deck.slides) {
    await patchSlide(slide.id, {
      layoutId: slide.layoutId,
      slotData: slide.slotData,
      position: slide.position,
    });
  }
}
