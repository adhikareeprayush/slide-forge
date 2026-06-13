import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { SlotDefinition } from '@slideforge/schema';
import type { ExportDeck } from './types';
import { resolveTheme } from './types';
import { fetchImageAsDataUri, pctToInches, SLIDE_W_PT, SLIDE_H_PT } from './image-utils';

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return rgb(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  );
}

export async function exportToPdf(deck: ExportDeck): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const theme = resolveTheme(deck.theme);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  for (const slide of deck.slides) {
    const page = doc.addPage([SLIDE_W_PT, SLIDE_H_PT]);
    const { width, height } = page.getSize();
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: hexToRgb(theme.background),
    });

    for (const slot of slide.layout.slots) {
      const content = slide.slotData[slot.id];
      await drawSlot(page, doc, slot, content, theme, font, fontBold, width, height);
    }
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

async function drawSlot(
  page: ReturnType<PDFDocument['addPage']>,
  doc: PDFDocument,
  slot: SlotDefinition,
  content: string | string[] | undefined,
  theme: ReturnType<typeof resolveTheme>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  fontBold: Awaited<ReturnType<PDFDocument['embedFont']>>,
  pageW: number,
  pageH: number,
): Promise<void> {
  const x = pctToInches(slot.position.x, pageW);
  const y = pageH - pctToInches(slot.position.y, pageH) - pctToInches(slot.position.h, pageH);
  const w = pctToInches(slot.position.w, pageW);
  const h = pctToInches(slot.position.h, pageH);
  const color = hexToRgb(theme.color);

  if (slot.type === 'image' && typeof content === 'string' && content) {
    const dataUri = await fetchImageAsDataUri(content);
    if (dataUri) {
      const b64 = dataUri.split(',')[1];
      if (b64) {
        const imgBytes = Buffer.from(b64, 'base64');
        const isPng = dataUri.includes('image/png');
        const image = isPng ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);
        page.drawImage(image, { x, y, width: w, height: h });
      }
    }
    return;
  }

  if (slot.type === 'heading' || slot.type === 'subheading' || slot.type === 'body' || slot.type === 'quote') {
    const text = typeof content === 'string' ? content : slot.defaultValue ?? '';
    const size = slot.type === 'heading' ? 28 : slot.type === 'subheading' ? 18 : 12;
    const useFont = slot.type === 'heading' ? fontBold : font;
    const lines = wrapText(text, useFont, size, w - 8);
    let ty = y + h - size - 4;
    for (const line of lines.slice(0, 8)) {
      page.drawText(line, { x: x + 4, y: ty, size, font: useFont, color });
      ty -= size + 4;
    }
    return;
  }

  if (slot.type === 'list') {
    const items = Array.isArray(content) ? content : [];
    let ty = y + h - 14;
    for (const item of items.slice(0, 10)) {
      page.drawText(`• ${item}`, { x: x + 4, y: ty, size: 12, font, color });
      ty -= 16;
    }
  }
}

function wrapText(text: string, font: { widthOfTextAtSize: (t: string, s: number) => number }, size: number, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
