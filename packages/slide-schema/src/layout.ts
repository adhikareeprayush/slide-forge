import type { SlotDefinition, SlotPosition } from './types';

/** Canonical slide dimensions — all layouts target this coordinate space. */
export const SLIDE = {
  width: 1280,
  height: 720,
  aspectRatio: 16 / 9,
} as const;

/**
 * Standard grid for template authors. All percentages are relative to the 1280×720 canvas.
 * Use these regions so imported templates stay aligned and never bleed past safe margins.
 */
export const GRID = {
  margin: 6,
  gutter: 4,
  titleHeight: 14,
  subtitleHeight: 10,
  bodyTop: 22,
  bodyHeight: 68,
} as const;

/** Pre-computed slot regions — copy into slide.config.ts positions. */
export const REGIONS = {
  full: { x: '0%', y: '0%', w: '100%', h: '100%' },
  safe: { x: '6%', y: '6%', w: '88%', h: '88%' },
  title: { x: '6%', y: '6%', w: '88%', h: '14%' },
  subtitle: { x: '6%', y: '20%', w: '88%', h: '10%' },
  body: { x: '6%', y: '22%', w: '88%', h: '68%' },
  colLeft: { x: '6%', y: '22%', w: '42%', h: '68%' },
  colRight: { x: '52%', y: '22%', w: '42%', h: '68%' },
  colDivider: { x: '49%', y: '22%', w: '0.4%', h: '68%' },
  textLeft: { x: '6%', y: '6%', w: '44%', h: '88%' },
  textLeftBody: { x: '6%', y: '24%', w: '44%', h: '70%' },
  mediaRight: { x: '52%', y: '6%', w: '42%', h: '88%' },
  mediaLeft: { x: '6%', y: '6%', w: '42%', h: '88%' },
  chart: { x: '6%', y: '22%', w: '54%', h: '68%' },
  chartInsight: { x: '63%', y: '22%', w: '31%', h: '68%' },
  quote: { x: '10%', y: '24%', w: '80%', h: '38%' },
  attribution: { x: '10%', y: '66%', w: '80%', h: '10%' },
  ctaTitle: { x: '10%', y: '28%', w: '80%', h: '20%' },
  ctaSub: { x: '10%', y: '52%', w: '80%', h: '12%' },
  ctaIcon: { x: '44%', y: '68%', w: '12%', h: '14%' },
  heroTitle: { x: '8%', y: '30%', w: '84%', h: '20%' },
  heroSubtitle: { x: '8%', y: '52%', w: '84%', h: '12%' },
} as const satisfies Record<string, SlotPosition>;

const POSITION_RE = /^(\d+(?:\.\d+)?)(%|px)$/;

export function parsePositionValue(value: string): { amount: number; unit: '%' | 'px' } {
  const match = POSITION_RE.exec(value.trim());
  if (!match) {
    throw new Error(`Position value "${value}" must be a number followed by % or px`);
  }
  return { amount: parseFloat(match[1]!), unit: match[2] as '%' | 'px' };
}

export function positionToPercent(value: string, axis: 'x' | 'y' | 'w' | 'h'): number {
  const { amount, unit } = parsePositionValue(value);
  if (unit === '%') return amount;
  const total = axis === 'x' || axis === 'w' ? SLIDE.width : SLIDE.height;
  return (amount / total) * 100;
}

export interface SlotBoundsIssue {
  slotId: string;
  field: string;
  message: string;
}

/** Validate a slot stays within the slide canvas (0–100% on each axis). */
export function validateSlotPosition(slot: Pick<SlotDefinition, 'id' | 'position'>): SlotBoundsIssue[] {
  const issues: SlotBoundsIssue[] = [];
  const { id, position } = slot;

  let x: number;
  let y: number;
  let w: number;
  let h: number;

  try {
    x = positionToPercent(position.x, 'x');
    y = positionToPercent(position.y, 'y');
    w = positionToPercent(position.w, 'w');
    h = positionToPercent(position.h, 'h');
  } catch (err) {
    issues.push({
      slotId: id,
      field: 'position',
      message: err instanceof Error ? err.message : 'Invalid position',
    });
    return issues;
  }

  if (w <= 0 || h <= 0) {
    issues.push({ slotId: id, field: 'position', message: 'width and height must be greater than 0' });
  }
  if (x < 0 || y < 0) {
    issues.push({ slotId: id, field: 'position', message: 'x and y cannot be negative' });
  }
  if (x + w > 100.5) {
    issues.push({
      slotId: id,
      field: 'position',
      message: `slot overflows right edge (x ${x}% + w ${w}% = ${x + w}%)`,
    });
  }
  if (y + h > 100.5) {
    issues.push({
      slotId: id,
      field: 'position',
      message: `slot overflows bottom edge (y ${y}% + h ${h}% = ${y + h}%)`,
    });
  }

  return issues;
}

/** Default stacking order so backgrounds render under text. */
export function defaultZIndex(type: SlotDefinition['type'], position: SlotPosition): number {
  if (type === 'image') {
    const w = positionToPercent(position.w, 'w');
    const h = positionToPercent(position.h, 'h');
    if (w >= 99 && h >= 99) return 0;
    return 5;
  }
  if (type === 'divider') return 8;
  return 10;
}

export function resolveZIndex(slot: SlotDefinition): number {
  return slot.zIndex ?? defaultZIndex(slot.type, slot.position);
}
