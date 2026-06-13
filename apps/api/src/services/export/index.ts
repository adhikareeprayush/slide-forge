import { eq, asc } from 'drizzle-orm';
import { db } from '../../db';
import { decks, slides } from '../../db/schema';
import { getLayout } from '../layout-registry';
import type { ExportDeck, ExportFormat, ExportSlide } from './types';
import { exportToPptx } from './pptx';
import { exportToPdf } from './pdf';
import { exportToHtml } from './html';

export async function loadDeckForExport(deckId: string): Promise<ExportDeck | null> {
  const [deck] = await db.select().from(decks).where(eq(decks.id, deckId)).limit(1);
  if (!deck) return null;

  const deckSlides = await db
    .select()
    .from(slides)
    .where(eq(slides.deckId, deckId))
    .orderBy(asc(slides.position));

  const exportSlides: ExportSlide[] = [];
  for (const slide of deckSlides) {
    const layout = getLayout(slide.layoutId);
    if (!layout) continue;
    exportSlides.push({
      id: slide.id,
      layoutId: slide.layoutId,
      position: slide.position,
      slotData: slide.slotData as Record<string, string | string[]>,
      layout,
    });
  }

  return {
    id: deck.id,
    title: deck.title,
    theme: deck.theme,
    slides: exportSlides,
  };
}

export async function runExport(deckId: string, format: ExportFormat): Promise<Buffer> {
  const deck = await loadDeckForExport(deckId);
  if (!deck) throw new Error('Deck not found');
  if (deck.slides.length === 0) throw new Error('Deck has no slides');

  switch (format) {
    case 'pptx':
      return exportToPptx(deck);
    case 'pdf':
      return exportToPdf(deck);
    case 'html':
      return exportToHtml(deck);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
