import { memo, useMemo, type ReactNode } from 'react';
import type { CSSProperties } from 'react';
import type { ValidatedSlide } from '@slideforge/schema';
import { resolveZIndex } from '@slideforge/schema';
import { SlotRenderer } from './SlotRenderer';
import { sortSlots } from './layout-utils';

export interface SlotData {
  [slotId: string]: string | string[] | undefined;
}

export interface SlideTheme {
  fontFamily?: string;
  displayFont?: string;
  background?: string;
  color?: string;
  primaryColor?: string;
  spacing?: string;
  borderRadius?: string;
}

interface SlideCanvasProps {
  layout: ValidatedSlide;
  slotData?: SlotData;
  theme?: SlideTheme;
  scale?: number;
}

const DEFAULT_THEME: SlideTheme = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  displayFont: "'Instrument Serif', Georgia, serif",
  background: '#f4efe6',
  color: '#1a1814',
  primaryColor: '#3d9b8f',
  spacing: '1rem',
  borderRadius: '0.25rem',
};

export const SlideCanvas = memo(function SlideCanvas({
  layout,
  slotData = {},
  theme = {},
  scale = 1,
}: SlideCanvasProps) {
  const mergedTheme = { ...DEFAULT_THEME, ...theme };
  const orderedSlots = useMemo(() => sortSlots(layout.slots), [layout.slots]);

  const hasBackgroundImage = useMemo(
    () =>
      layout.slots.some(
        (s) =>
          s.type === 'image' &&
          resolveZIndex(s) <= 5 &&
          s.position.w.includes('100') &&
          s.position.h.includes('100') &&
          !!slotData[s.id],
      ),
    [layout.slots, slotData],
  );

  const canvasStyle: CSSProperties = {
    width: 1280,
    height: 720,
    transform: scale !== 1 ? `scale(${scale})` : undefined,
    transformOrigin: 'top left',
    position: 'relative',
    background: mergedTheme.background,
    color: mergedTheme.color,
    fontFamily: mergedTheme.fontFamily,
    overflow: 'hidden',
    isolation: 'isolate',
    lineHeight: 1.4,
    '--sf-font-family': mergedTheme.fontFamily,
    '--sf-font-display': mergedTheme.displayFont ?? mergedTheme.fontFamily,
    '--sf-background': mergedTheme.background,
    '--sf-color': mergedTheme.color,
    '--sf-primary': mergedTheme.primaryColor,
    '--sf-spacing': mergedTheme.spacing,
    '--sf-radius': mergedTheme.borderRadius,
    '--sf-slot-image-bg': '#e8e0d4',
    '--sf-slot-muted': '#9a948c',
  } as CSSProperties;

  const slide = (
    <div style={canvasStyle} data-slide-id={layout.id}>
      {orderedSlots.map((slot) => (
        <SlotRenderer
          key={slot.id}
          slot={slot}
          content={slotData[slot.id]}
          hasBackgroundImage={hasBackgroundImage}
        />
      ))}
    </div>
  );

  if (scale !== 1) {
    const scaledW = 1280 * scale;
    const scaledH = 720 * scale;
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: scaledW,
            height: scaledH,
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {slide}
        </div>
      </div>
    );
  }

  return slide;
});

/** Wrapper that preserves 16:9 aspect ratio while scaling to fit a container. */
export function SlideCanvasFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        aspectRatio: '16 / 9',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}
