'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { SlideCanvas, getDeckTheme } from '@slideforge/ui';
import type { Deck } from '../../../lib/api-client';
import {
  clearStashedDeck,
  deckNeedsRefresh,
  fetchDeckClient,
  peekStashedDeck,
} from '../../../lib/api-client';
import { useEditorStore } from '../../../lib/editor-store';
import {
  fetchLayouts,
  fetchLayout,
  regenerateSlide,
  regenerateImage,
  patchDeck,
  patchSlide,
  reorderSlides,
  type LayoutMeta,
} from '../../../lib/editor-api';
import { startExport, waitForExport, type ExportFormat } from '../../../lib/export-api';
import styles from './editor.module.css';

interface EditorProps {
  initialDeck: Deck;
}

export function Editor({ initialDeck }: EditorProps) {
  const loadDeck = useEditorStore((s) => s.loadDeck);
  const deckId = useEditorStore((s) => s.deckId);
  const title = useEditorStore((s) => s.title);
  const theme = useEditorStore((s) => s.theme);
  const slides = useEditorStore((s) => s.slides);
  const activeIndex = useEditorStore((s) => s.activeIndex);
  const setActiveIndex = useEditorStore((s) => s.setActiveIndex);
  const setTitle = useEditorStore((s) => s.setTitle);
  const setTheme = useEditorStore((s) => s.setTheme);
  const updateSlot = useEditorStore((s) => s.updateSlot);
  const setLayout = useEditorStore((s) => s.setLayout);
  const reorderSlidesStore = useEditorStore((s) => s.reorderSlides);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const dirty = useEditorStore((s) => s.dirty);
  const snapshot = useEditorStore((s) => s.snapshot);

  const [layouts, setLayouts] = useState<LayoutMeta[]>([]);
  const [showLayouts, setShowLayouts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    let cancelled = false;

    async function hydrateDeck() {
      setLoading(true);

      const stashed = peekStashedDeck(initialDeck.id);
      const seed = stashed && !deckNeedsRefresh(stashed) ? stashed : initialDeck;
      loadDeck(seed);

      if (deckNeedsRefresh(seed)) {
        for (let attempt = 0; attempt < 15 && !cancelled; attempt++) {
          await new Promise((r) => setTimeout(r, attempt === 0 ? 0 : 600));
          const fresh = await fetchDeckClient(initialDeck.id);
          if (fresh?.slides.length && !deckNeedsRefresh(fresh)) {
            loadDeck(fresh);
            break;
          }
        }
      }

      clearStashedDeck(initialDeck.id);
      if (!cancelled) setLoading(false);
    }

    hydrateDeck();
    fetchLayouts().then(setLayouts).catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [initialDeck, loadDeck]);

  const updateScale = useCallback(() => {
    if (!canvasRef.current) return;
    const { width } = canvasRef.current.getBoundingClientRect();
    if (width > 0) setScale(Math.min(width / 1280, 1));
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale, slides.length, loading]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key === 'ArrowRight') setActiveIndex(Math.min(activeIndex + 1, slides.length - 1));
      if (e.key === 'ArrowLeft') setActiveIndex(Math.max(activeIndex - 1, 0));
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        const slide = slides[activeIndex];
        if (slide) handleRegenerateSlide(slide.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const activeSlide = slides[activeIndex];
  const themePreset = getDeckTheme(theme);

  async function handleSave() {
    if (!deckId) return;
    setSaving(true);
    try {
      await patchDeck(deckId, { title, theme });
      await reorderSlides(deckId, slides.map((s) => s.id));
      for (const slide of slides) {
        await patchSlide(slide.id, {
          layoutId: slide.layoutId,
          slotData: slide.slotData,
          position: slide.position,
        });
      }
      snapshot();
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerateSlide(slideId: string) {
    const slotData = await regenerateSlide(slideId);
    const idx = slides.findIndex((s) => s.id === slideId);
    if (idx >= 0) {
      for (const [slotId, value] of Object.entries(slotData)) {
        updateSlot(idx, slotId, value);
      }
    }
  }

  async function handleLayoutPick(layoutId: string) {
    const layout = await fetchLayout(layoutId);
    setLayout(activeIndex, layoutId, layout);
    setShowLayouts(false);
  }

  async function handleExport(format: ExportFormat) {
    if (!deckId) return;
    setExporting(format);
    setExportError(null);
    try {
      if (dirty) await handleSave();
      const { exportJobId } = await startExport(deckId, format);
      const job = await waitForExport(exportJobId);
      if (job.status === 'failed') throw new Error(job.error ?? 'Export failed');
      if (job.downloadUrl) window.open(job.downloadUrl, '_blank');
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    e.dataTransfer.setData('text/plain', String(index));
  }

  function handleDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData('text/plain'));
    reorderSlidesStore(fromIndex, toIndex);
  }

  return (
    <div className={styles.editor}>
      <header className={styles.toolbar}>
        <Link href="/" className={styles.brand}>SlideForge</Link>
        <input
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Deck title"
        />
        <select
          className={styles.themeSelect}
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          aria-label="Theme"
        >
          {['default', 'minimal', 'bold', 'dark', 'corporate'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button type="button" className={styles.toolBtn} onClick={undo} title="Undo (⌘Z)">Undo</button>
        <button type="button" className={styles.toolBtn} onClick={redo} title="Redo">Redo</button>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
        </button>
        {deckId && (
          <Link href={`/preview/${deckId}`} className={styles.previewLink}>
            Preview
          </Link>
        )}
        <div className={styles.exportGroup}>
          {(['pptx', 'pdf', 'html'] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              className={styles.toolBtn}
              disabled={!!exporting}
              onClick={() => handleExport(fmt)}
            >
              {exporting === fmt ? `Exporting ${fmt}…` : fmt.toUpperCase()}
            </button>
          ))}
        </div>
        {exportError && <span className={styles.exportError}>{exportError}</span>}
      </header>

      <div className={styles.workspace}>
        <aside className={styles.filmstrip}>
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, i)}
              className={`${styles.thumb} ${i === activeIndex ? styles.thumbActive : ''}`}
              onClick={() => setActiveIndex(i)}
            >
              <span className={styles.thumbNum}>{i + 1}</span>
              <span className={styles.thumbLabel}>{slide.layout?.name ?? slide.layoutId}</span>
            </button>
          ))}
        </aside>

        <main className={styles.stage}>
          <div className={styles.lightTable}>
            <div ref={canvasRef} className={styles.canvasWrap}>
              {loading ? (
                <div className={styles.empty}>Loading slides…</div>
              ) : activeSlide?.layout ? (
                <SlideCanvas
                  key={activeSlide.id}
                  layout={activeSlide.layout}
                  slotData={activeSlide.slotData}
                  theme={themePreset}
                  scale={scale}
                />
              ) : (
                <div className={styles.empty}>No slide to preview</div>
              )}
            </div>
          </div>
        </main>

        <aside className={styles.inspector}>
          <h3 className={styles.inspectorTitle}>Slide</h3>
          <p className={styles.layoutName}>{activeSlide?.layout?.name ?? '—'}</p>

          <button type="button" className={styles.actionBtn} onClick={() => setShowLayouts(!showLayouts)}>
            Change layout
          </button>

          {showLayouts && (
            <div className={styles.layoutGrid}>
              {layouts.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={styles.layoutCard}
                  onClick={() => handleLayoutPick(l.id)}
                >
                  <span className={styles.layoutCardName}>{l.name}</span>
                  <span className={styles.layoutCardCat}>{l.category}</span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => activeSlide && handleRegenerateSlide(activeSlide.id)}
          >
            Regenerate slide
          </button>

          <h3 className={styles.inspectorTitle}>Slots</h3>
          {activeSlide?.layout?.slots.map((slot) => {
            const val = activeSlide.slotData[slot.id];
            if (slot.type === 'list') {
              const items = Array.isArray(val) ? val : [];
              return (
                <label key={slot.id} className={styles.field}>
                  {slot.id}
                  <textarea
                    rows={4}
                    value={items.join('\n')}
                    onChange={(e) =>
                      updateSlot(activeIndex, slot.id, e.target.value.split('\n').filter(Boolean))
                    }
                  />
                </label>
              );
            }
            if (slot.type === 'image') {
              return (
                <div key={slot.id} className={styles.field}>
                  {slot.id}
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={async () => {
                      const url = await regenerateImage(activeSlide.id, slot.id);
                      updateSlot(activeIndex, slot.id, url);
                    }}
                  >
                    Regenerate image
                  </button>
                </div>
              );
            }
            return (
              <label key={slot.id} className={styles.field}>
                {slot.id}
                <textarea
                  rows={slot.type === 'body' ? 4 : 2}
                  value={typeof val === 'string' ? val : ''}
                  onChange={(e) => updateSlot(activeIndex, slot.id, e.target.value)}
                />
              </label>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
