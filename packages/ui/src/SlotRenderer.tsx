import { memo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { SlotDefinition } from '@slideforge/schema';
import {
  buildSlotBoxStyle,
  fluidFontSize,
  isOverlayText,
  maxLinesForType,
  overlayTextStyle,
  resolveListContent,
  resolveTextContent,
  textClampStyle,
} from './layout-utils';

interface SlotRendererProps {
  slot: SlotDefinition;
  content: string | string[] | undefined;
  hasBackgroundImage?: boolean;
}

interface ChartData {
  labels?: string[];
  values?: number[];
}

function parseChartData(content: string | string[] | undefined): ChartData {
  if (typeof content !== 'string' || !content) return {};
  try {
    const parsed = JSON.parse(content) as ChartData;
    return {
      labels: Array.isArray(parsed.labels) ? parsed.labels : [],
      values: Array.isArray(parsed.values) ? parsed.values.map(Number).filter((n) => !Number.isNaN(n)) : [],
    };
  } catch {
    return {};
  }
}

function isImageUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function picsumFallback(seedSource: string): string {
  let hash = 0;
  for (let i = 0; i < seedSource.length; i++) {
    hash = (hash * 31 + seedSource.charCodeAt(i)) >>> 0;
  }
  const seed = hash.toString(16).padStart(12, '0').slice(0, 12);
  return `https://picsum.photos/seed/${seed}/1280/720`;
}

function ImageSlot({ slot, content }: { slot: SlotDefinition; content: string | undefined }) {
  const [failed, setFailed] = useState(false);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);
  const boxStyle = buildSlotBoxStyle(slot);
  const primary = content && isImageUrl(content) ? content : undefined;
  const src = fallbackSrc ?? primary;

  return (
    <div
      style={{
        ...boxStyle,
        padding: 0,
        background: 'var(--sf-slot-image-bg, #e8e0d4)',
        borderRadius: 'var(--sf-radius, 0)',
      }}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          onError={() => {
            if (!fallbackSrc && content) {
              setFallbackSrc(picsumFallback(`${slot.id}:${content}`));
              return;
            }
            setFailed(true);
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span style={{ color: 'var(--sf-slot-muted, #9a948c)', fontSize: '0.875rem' }}>
          {primary && failed ? 'Image unavailable' : 'Image generating…'}
        </span>
      )}
    </div>
  );
}

export const SlotRenderer = memo(function SlotRenderer({
  slot,
  content,
  hasBackgroundImage = false,
}: SlotRendererProps) {
  const boxStyle = buildSlotBoxStyle(slot);
  const overlay = hasBackgroundImage && isOverlayText(slot);

  if (slot.type === 'image') {
    return <ImageSlot slot={slot} content={typeof content === 'string' ? content : undefined} />;
  }

  if (slot.type === 'heading' || slot.type === 'subheading') {
    const text = resolveTextContent(slot, content);
    const fontFamily =
      slot.type === 'heading'
        ? 'var(--sf-font-display, var(--sf-font-family, inherit))'
        : 'var(--sf-font-family, inherit)';

    return (
      <div style={boxStyle}>
        <h2
          style={{
            margin: 0,
            width: '100%',
            fontSize: fluidFontSize(slot.type),
            lineHeight: 1.15,
            fontWeight: slot.type === 'heading' ? 700 : 500,
            color: 'var(--sf-color, inherit)',
            fontFamily,
            ...(overlay ? overlayTextStyle : {}),
            ...textClampStyle(maxLinesForType(slot.type)),
          }}
        >
          {text || '\u00a0'}
        </h2>
      </div>
    );
  }

  if (slot.type === 'body') {
    const text = resolveTextContent(slot, content);
    return (
      <div style={boxStyle}>
        <p
          style={{
            margin: 0,
            width: '100%',
            lineHeight: 1.55,
            fontSize: fluidFontSize('body'),
            color: 'var(--sf-color, inherit)',
            fontFamily: 'var(--sf-font-family, inherit)',
            ...(overlay ? overlayTextStyle : {}),
            ...textClampStyle(maxLinesForType('body')),
          }}
        >
          {text || '\u00a0'}
        </p>
      </div>
    );
  }

  if (slot.type === 'list') {
    const items = resolveListContent(slot, content);
    const displayItems = items.slice(0, 10);

    return (
      <div style={boxStyle}>
        <ul
          style={{
            margin: 0,
            paddingLeft: '1.15em',
            width: '100%',
            lineHeight: 1.65,
            fontSize: fluidFontSize('list', displayItems.length),
            color: 'var(--sf-color, inherit)',
            fontFamily: 'var(--sf-font-family, inherit)',
            ...(overlay ? overlayTextStyle : {}),
            ...textClampStyle(maxLinesForType('list', displayItems.length)),
          }}
        >
          {displayItems.length > 0 ? (
            displayItems.map((item, i) => <li key={i}>{item}</li>)
          ) : (
            <li style={{ listStyle: 'none', marginLeft: '-1.15em', opacity: 0.5 }}>Add bullet points…</li>
          )}
        </ul>
      </div>
    );
  }

  if (slot.type === 'quote') {
    const text = resolveTextContent(slot, content);
    return (
      <div
        style={{
          ...boxStyle,
          borderLeft: '4px solid var(--sf-primary, currentColor)',
          paddingLeft: 'max(0.75rem, var(--sf-spacing, 1rem))',
        }}
      >
        <blockquote
          style={{
            margin: 0,
            width: '100%',
            fontStyle: 'italic',
            fontSize: fluidFontSize('quote'),
            lineHeight: 1.4,
            color: 'var(--sf-color, inherit)',
            fontFamily: 'var(--sf-font-display, var(--sf-font-family, inherit))',
            ...(overlay ? overlayTextStyle : {}),
            ...textClampStyle(maxLinesForType('quote')),
          }}
        >
          {text || '\u00a0'}
        </blockquote>
      </div>
    );
  }

  if (slot.type === 'chart') {
    const { labels = [], values = [] } = parseChartData(content);
    const max = Math.max(...values, 1);
    const pairs = values.map((value, i) => ({ value, label: labels[i] ?? '' }));

    return (
      <div style={{ ...boxStyle, gap: '0.5rem' }}>
        {pairs.length > 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.5rem',
              flex: 1,
              width: '100%',
              minHeight: 0,
            }}
          >
            {pairs.map(({ value, label }, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                  minWidth: 0,
                  gap: '0.25rem',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${Math.max((value / max) * 100, 4)}%`,
                    minHeight: 4,
                    maxHeight: '100%',
                    background: 'var(--sf-primary, #3d9b8f)',
                    borderRadius: 'var(--sf-radius, 4px) 4px 0 0',
                  }}
                />
                <span
                  style={{
                    fontSize: 'clamp(0.55rem, 2.5cqh, 0.75rem)',
                    opacity: 0.75,
                    textAlign: 'center',
                    ...textClampStyle(2),
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span style={{ opacity: 0.5, fontSize: '0.875rem' }}>Chart data loading…</span>
        )}
      </div>
    );
  }

  if (slot.type === 'icon') {
    const iconName = resolveTextContent(slot, content) || '★';
    return (
      <div style={boxStyle}>
        <span
          style={{
            fontSize: fluidFontSize('icon'),
            lineHeight: 1,
            color: 'var(--sf-primary, #3d9b8f)',
          }}
          aria-hidden
        >
          {iconName}
        </span>
      </div>
    );
  }

  if (slot.type === 'divider') {
    return (
      <div style={{ ...boxStyle, padding: 0, justifyContent: 'center' }}>
        <hr
          style={{
            width: '100%',
            border: 'none',
            borderTop: '2px solid var(--sf-primary, #d1d5db)',
            margin: 0,
          }}
        />
      </div>
    );
  }

  return <div style={boxStyle} />;
});
