'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { SlideCanvas, getDeckTheme, type SlideTheme } from '@slideforge/ui';
import type { Deck } from '../../../lib/api-client';

const THEMES: Record<string, SlideTheme> = {
  default: getDeckTheme('default'),
  minimal: getDeckTheme('minimal'),
  bold: getDeckTheme('bold'),
  dark: getDeckTheme('dark'),
  corporate: getDeckTheme('corporate'),
};

interface DeckPreviewProps {
  deck: Deck;
}

export function DeckPreview({ deck }: DeckPreviewProps) {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const slide = deck.slides[index];
  const theme = THEMES[deck.theme] ?? THEMES.default;

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const { width } = containerRef.current.getBoundingClientRect();
    setScale(Math.min(width / 1280, 1));
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setIndex((i) => Math.min(i + 1, deck.slides.length - 1));
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deck.slides.length]);

  if (!slide) {
    return <p style={{ padding: '2rem', color: '#94a3b8' }}>This deck has no slides.</p>;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#e2e8f0',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 2rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div>
          <p style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            SlideForge Preview
          </p>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '0.125rem' }}>{deck.title}</h1>
        </div>
        <span style={{ fontSize: '0.875rem', opacity: 0.6 }}>
          {index + 1} / {deck.slides.length}
        </span>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div ref={containerRef} style={{ width: '100%', maxWidth: 1280 }}>
          {slide.layout ? (
            <SlideCanvas
              layout={slide.layout}
              slotData={slide.slotData}
              theme={theme}
              scale={scale}
            />
          ) : (
            <div
              style={{
                width: 1280,
                height: 720,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                background: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
              }}
            >
              <p style={{ color: '#f87171' }}>{slide.layoutError ?? 'Layout not found'}</p>
            </div>
          )}
        </div>
      </main>

      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <button
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index === 0}
          style={navButtonStyle(index === 0)}
        >
          ← Previous
        </button>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {deck.slides.map((_slide, i: number) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                background: i === index ? '#818cf8' : 'rgba(255,255,255,0.2)',
                padding: 0,
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() => setIndex((i) => Math.min(i + 1, deck.slides.length - 1))}
          disabled={index === deck.slides.length - 1}
          style={navButtonStyle(index === deck.slides.length - 1)}
        >
          Next →
        </button>
      </footer>
    </div>
  );
}

function navButtonStyle(disabled: boolean): CSSProperties {
  return {
    background: disabled ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.2)',
    color: disabled ? 'rgba(255,255,255,0.3)' : '#c7d2fe',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 8,
    padding: '0.5rem 1.25rem',
    fontSize: '0.875rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
  };
}
