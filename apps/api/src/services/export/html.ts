import type { SlotDefinition } from '@slideforge/schema';
import type { ExportDeck } from './types';
import { resolveTheme } from './types';
import { fetchImageAsDataUri } from './image-utils';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slotStyle(slot: SlotDefinition): string {
  return `left:${slot.position.x};top:${slot.position.y};width:${slot.position.w};height:${slot.position.h}`;
}

async function renderSlot(
  slot: SlotDefinition,
  content: string | string[] | undefined,
): Promise<string> {
  const style = slotStyle(slot);

  if (slot.type === 'heading' || slot.type === 'subheading') {
    const text = typeof content === 'string' ? content : slot.defaultValue ?? '';
    const tag = slot.type === 'heading' ? 'h1' : 'h2';
    return `<${tag} class="slot ${slot.type}" style="${style}">${escapeHtml(text)}</${tag}>`;
  }

  if (slot.type === 'body') {
    const text = typeof content === 'string' ? content : slot.defaultValue ?? '';
    return `<p class="slot body" style="${style}">${escapeHtml(text)}</p>`;
  }

  if (slot.type === 'list') {
    const items = Array.isArray(content) ? content : [];
    const lis = items.map((i) => `<li>${escapeHtml(i)}</li>`).join('');
    return `<ul class="slot list" style="${style}">${lis}</ul>`;
  }

  if (slot.type === 'quote') {
    const text = typeof content === 'string' ? content : '';
    return `<blockquote class="slot quote" style="${style}">${escapeHtml(text)}</blockquote>`;
  }

  if (slot.type === 'image' && typeof content === 'string' && content) {
    const dataUri = await fetchImageAsDataUri(content);
    const src = dataUri ?? content;
    return `<img class="slot image" style="${style}" src="${src}" alt="" />`;
  }

  if (slot.type === 'chart' && typeof content === 'string') {
    try {
      const { labels = [], values = [] } = JSON.parse(content) as {
        labels?: string[];
        values?: number[];
      };
      const max = Math.max(...values, 1);
      const bars = values
        .map(
          (v, i) =>
            `<div class="bar-wrap"><div class="bar" style="height:${(v / max) * 100}%"></div><span>${escapeHtml(labels[i] ?? '')}</span></div>`,
        )
        .join('');
      return `<div class="slot chart" style="${style}"><div class="bars">${bars}</div></div>`;
    } catch {
      return '';
    }
  }

  if (slot.type === 'divider') {
    return `<hr class="slot divider" style="${style}" />`;
  }

  return '';
}

export async function exportToHtml(deck: ExportDeck): Promise<Buffer> {
  const theme = resolveTheme(deck.theme);
  const slidesHtml: string[] = [];

  for (let i = 0; i < deck.slides.length; i++) {
    const slide = deck.slides[i]!;
    const slots = await Promise.all(
      slide.layout.slots.map((slot) => renderSlot(slot, slide.slotData[slot.id])),
    );
    slidesHtml.push(
      `<section class="slide" data-index="${i}" aria-label="Slide ${i + 1}">${slots.join('')}</section>`,
    );
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(deck.title)} — SlideForge</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: ${theme.fontFamily}, system-ui, sans-serif; background: #111; color: ${theme.color}; overflow: hidden; }
    .deck { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
    .slide {
      display: none; position: relative; width: 1280px; height: 720px;
      background: ${theme.background}; color: ${theme.color};
      box-shadow: 0 24px 48px rgba(0,0,0,0.4); transform-origin: center;
    }
    .slide.active { display: block; }
    .slot { position: absolute; overflow: hidden; padding: 0.5rem; }
    .slot.heading { font-size: 2.5rem; font-weight: 700; }
    .slot.subheading { font-size: 1.5rem; }
    .slot.body { font-size: 1rem; line-height: 1.6; }
    .slot.list { padding-left: 1.5rem; line-height: 1.8; }
    .slot.quote { font-style: italic; border-left: 4px solid ${theme.primaryColor}; padding-left: 1rem; display: flex; align-items: center; }
    .slot.image { padding: 0; object-fit: cover; }
    .slot.divider { border: none; border-top: 2px solid ${theme.primaryColor}; padding: 0; }
    .bars { display: flex; align-items: flex-end; gap: 0.5rem; height: 100%; }
    .bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
    .bar { width: 100%; background: ${theme.primaryColor}; border-radius: 4px 4px 0 0; min-height: 4px; }
    .bar-wrap span { font-size: 0.75rem; margin-top: 0.25rem; }
    .hint { position: fixed; bottom: 1rem; left: 50%; transform: translateX(-50%); color: #888; font-size: 0.875rem; }
    @media (max-width: 1280px) {
      .slide { transform: scale(calc(100vw / 1280)); }
    }
  </style>
</head>
<body>
  <div class="deck" id="deck">${slidesHtml.join('')}</div>
  <p class="hint">← → navigate · F fullscreen</p>
  <script>
    const slides = document.querySelectorAll('.slide');
    let idx = 0;
    function show(i) {
      idx = Math.max(0, Math.min(slides.length - 1, i));
      slides.forEach((s, n) => s.classList.toggle('active', n === idx));
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); show(idx + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      }
    });
    show(0);
  </script>
</body>
</html>`;

  return Buffer.from(html, 'utf-8');
}
