export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface DeckSlide {
  id: string;
  layoutId: string;
  position: number;
  slotData: Record<string, string | string[]>;
  layout: import('@slideforge/schema').ValidatedSlide | null;
  layoutError?: string;
}

export interface Deck {
  id: string;
  title: string;
  theme: string;
  status: string;
  slides: DeckSlide[];
}

export async function getDeck(id: string): Promise<Deck | null> {
  const res = await fetch(`${API_URL}/api/decks/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json() as Promise<Deck>;
}

/** Client-side fetch — always bypasses cache (for editor after generation). */
export async function fetchDeckClient(id: string): Promise<Deck | null> {
  const res = await fetch(`${API_URL}/api/decks/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json() as Promise<Deck>;
}

const PENDING_DECK_KEY = (id: string) => `slideforge:deck:${id}`;

function readStashedDeck(id: string): Deck | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(PENDING_DECK_KEY(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Deck;
  } catch {
    return null;
  }
}

/** True when the deck is missing layouts or image slots still hold search keywords. */
export function deckNeedsRefresh(deck: Deck): boolean {
  if (!deck.slides.length) return true;
  if (deck.slides.some((s) => !s.layout)) return true;
  return deck.slides.some((s) =>
    s.layout?.slots.some((slot) => {
      if (slot.type !== 'image') return false;
      const val = s.slotData[slot.id];
      return typeof val === 'string' && val.trim().length > 0 && !/^https?:\/\//i.test(val);
    }),
  );
}

export function stashDeckForEditor(deck: Deck): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(PENDING_DECK_KEY(deck.id), JSON.stringify(deck));
}

export function peekStashedDeck(id: string): Deck | null {
  return readStashedDeck(id);
}

export function clearStashedDeck(id: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(PENDING_DECK_KEY(id));
}

export function consumeStashedDeck(id: string): Deck | null {
  const deck = peekStashedDeck(id);
  if (deck) clearStashedDeck(id);
  return deck;
}
