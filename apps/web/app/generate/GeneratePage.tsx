'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SlideCanvas } from '@slideforge/ui';
import type { ValidatedSlide } from '@slideforge/schema';
import { Shell } from '../../components/Shell';
import {
  connectGenerationSocket,
  startGeneration,
  type GenerationEvent,
} from '../../lib/ws-client';
import {
  deckNeedsRefresh,
  fetchDeckClient,
  stashDeckForEditor,
  type Deck,
} from '../../lib/api-client';
import styles from './generate.module.css';

interface LiveSlide {
  id?: string;
  layoutId: string;
  layout: ValidatedSlide | null;
  slotData: Record<string, string | string[]>;
  status: 'pending' | 'content' | 'complete';
}

export function GeneratePage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'bold'>('professional');
  const [slideCount, setSlideCount] = useState(7);
  const [phase, setPhase] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [slides, setSlides] = useState<LiveSlide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scale, setScale] = useState(0.5);
  const deckIdRef = useRef<string | null>(null);
  const slidesRef = useRef<LiveSlide[]>([]);
  const topicRef = useRef('');
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  useEffect(() => {
    topicRef.current = topic;
  }, [topic]);

  const updateScale = useCallback(() => {
    if (!stageRef.current) return;
    const { width } = stageRef.current.getBoundingClientRect();
    setScale(Math.min(width / 1280, 1));
  }, []);

  useEffect(() => {
    if (phase !== 'generating' && phase !== 'done') return;
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [phase, updateScale, slides.length]);

  const buildDeckFromLiveSlides = useCallback((deckId: string): Deck => {
    const liveSlides = slidesRef.current;
    return {
      id: deckId,
      title: topicRef.current,
      theme: 'default',
      status: 'ready',
      slides: liveSlides.map((s, i) => ({
        id: s.id ?? `pending-${i}`,
        layoutId: s.layoutId,
        position: i,
        slotData: s.slotData,
        layout: s.layout,
      })),
    };
  }, []);

  const handleEvent = useCallback((event: GenerationEvent) => {
    if (event.type === 'outline_ready') {
      const next = event.slides.map((s) => ({
        layoutId: s.layoutId,
        layout: s.layout,
        slotData: {},
        status: 'pending' as const,
      }));
      slidesRef.current = next;
      setSlides(next);
    }

    if (event.type === 'slide_content_ready') {
      setSlides((prev) => {
        const next = prev.map((s, i) =>
          i === event.slideIndex
            ? { ...s, id: event.slideId, slotData: event.slots, status: 'content' as const }
            : s,
        );
        slidesRef.current = next;
        return next;
      });
      setActiveIndex(event.slideIndex);
    }

    if (event.type === 'image_ready') {
      setSlides((prev) => {
        const next = prev.map((s, i) =>
          i === event.slideIndex
            ? {
                ...s,
                slotData: { ...s.slotData, [event.slotId]: event.url },
                status: 'complete' as const,
              }
            : s,
        );
        slidesRef.current = next;
        return next;
      });
    }

    if (event.type === 'generation_complete') {
      deckIdRef.current = event.deckId;
      setPhase('done');

      void (async () => {
        let deck: Deck | null = null;
        for (let attempt = 0; attempt < 10; attempt++) {
          deck = await fetchDeckClient(event.deckId);
          if (deck?.slides.length && !deckNeedsRefresh(deck)) break;
          await new Promise((r) => setTimeout(r, 400));
        }

        stashDeckForEditor(deck ?? buildDeckFromLiveSlides(event.deckId));
        router.push(`/editor/${event.deckId}`);
      })();
    }

    if (event.type === 'error') {
      setError(event.message);
      setPhase('error');
    }
  }, [router, buildDeckFromLiveSlides]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setPhase('generating');
    setError('');
    setSlides([]);
    setActiveIndex(0);

    try {
      const { jobId, deckId } = await startGeneration({ topic, slideCount, tone });
      deckIdRef.current = deckId;
      connectGenerationSocket(jobId, handleEvent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start generation');
      setPhase('error');
    }
  };

  const activeSlide = slides[activeIndex];
  const readyCount = slides.filter((s) => s.status !== 'pending').length;

  return (
    <Shell badge="Generator">
      {phase === 'idle' && (
        <main className={styles.idle}>
          <p className={styles.eyebrow}>Step 1 — Describe</p>
          <h1 className={styles.title}>What&apos;s your presentation about?</h1>
          <p className={styles.subtitle}>
            We&apos;ll pick layouts, write copy, and queue images — streamed live to this page.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.fieldLabel} htmlFor="topic">
              Topic
            </label>
            <textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The future of open-source AI tools for developers"
              rows={4}
              className={styles.textarea}
              autoFocus
            />

            <div className={styles.options}>
              <label className={styles.fieldLabel}>
                Tone
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as typeof tone)}
                  className={styles.select}
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="bold">Bold</option>
                </select>
              </label>

              <label className={styles.fieldLabel}>
                Slides
                <select
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className={styles.select}
                >
                  {[5, 7, 8, 10, 12].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button type="submit" className={styles.submitBtn}>
              Generate deck →
            </button>
          </form>
        </main>
      )}

      {(phase === 'generating' || phase === 'done') && (
        <main className={styles.live}>
          <div className={styles.statusBar}>
            <span className={`${styles.dot} ${phase === 'done' ? styles.dotDone : ''}`} />
            <span>{phase === 'done' ? 'Complete' : 'Generating…'}</span>
            {slides.length > 0 && (
              <span className={styles.progress}>
                {readyCount} / {slides.length} slides
              </span>
            )}
          </div>

          <div ref={stageRef} className={styles.stage}>
            {activeSlide?.layout ? (
              <div className={styles.canvas}>
                <SlideCanvas
                  layout={activeSlide.layout}
                  slotData={activeSlide.slotData}
                  scale={scale}
                />
              </div>
            ) : (
              <div className={styles.placeholder}>
                <div className={styles.shimmerBar} />
                <p>Building outline…</p>
              </div>
            )}
          </div>

          <div className={styles.filmstrip}>
            {slides.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`${styles.thumb} ${i === activeIndex ? styles.thumbActive : ''} ${s.status !== 'pending' ? styles.thumbReady : ''}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </main>
      )}

      {phase === 'error' && (
        <main className={styles.idle}>
          <p className={styles.error}>{error}</p>
          <p className={styles.errorHint}>
            Make sure the API is running: <code>pnpm --filter api dev</code>
          </p>
          <button type="button" className={styles.submitBtn} onClick={() => setPhase('idle')}>
            Try again
          </button>
        </main>
      )}
    </Shell>
  );
}
