import type { CSSProperties } from 'react';
import type { SlotDefinition } from '@slideforge/schema';
import { resolveZIndex } from '@slideforge/schema';

const PADDING_MAP = {
  none: '0',
  sm: '0.5rem',
  md: 'var(--sf-spacing, 1rem)',
  lg: '1.5rem',
} as const;

export function sortSlots(slots: SlotDefinition[]): SlotDefinition[] {
  return [...slots].sort((a, b) => resolveZIndex(a) - resolveZIndex(b));
}

export function resolveSlotPadding(slot: SlotDefinition): string {
  if (slot.type === 'image' || slot.type === 'divider') return '0';
  if (!slot.padding) return PADDING_MAP.md;
  if (slot.padding in PADDING_MAP) return PADDING_MAP[slot.padding as keyof typeof PADDING_MAP];
  return slot.padding;
}

export function buildSlotBoxStyle(slot: SlotDefinition): CSSProperties {
  const align = slot.align ?? 'left';
  const valign = slot.valign ?? (slot.type === 'quote' || slot.type === 'icon' ? 'middle' : 'top');

  return {
    position: 'absolute',
    left: slot.position.x,
    top: slot.position.y,
    width: slot.position.w,
    height: slot.position.h,
    zIndex: resolveZIndex(slot),
    padding: resolveSlotPadding(slot),
    boxSizing: 'border-box',
    overflow: 'hidden',
    containerType: 'size',
    display: 'flex',
    flexDirection: 'column',
    justifyContent:
      valign === 'middle' ? 'center' : valign === 'bottom' ? 'flex-end' : 'flex-start',
    alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
    textAlign: align,
  };
}

export function resolveTextContent(
  slot: SlotDefinition,
  content: string | string[] | undefined,
): string {
  if (typeof content === 'string' && content.trim()) return content;
  return slot.defaultValue ?? '';
}

export function resolveListContent(
  slot: SlotDefinition,
  content: string | string[] | undefined,
): string[] {
  if (Array.isArray(content) && content.length > 0) return content.filter(Boolean);
  if (typeof content === 'string' && content.trim()) {
    return content.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export function textClampStyle(maxLines: number): CSSProperties {
  return {
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: 'vertical',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  };
}

export function fluidFontSize(type: SlotDefinition['type'], itemCount = 1): string {
  switch (type) {
    case 'heading':
      return 'clamp(1.25rem, 9cqh, 3.25rem)';
    case 'subheading':
      return 'clamp(1rem, 6cqh, 2rem)';
    case 'quote':
      return 'clamp(1.1rem, 7cqh, 2.25rem)';
    case 'body':
      return 'clamp(0.8rem, 4.5cqh, 1.25rem)';
    case 'list':
      return itemCount > 6
        ? 'clamp(0.7rem, 3.2cqh, 1rem)'
        : 'clamp(0.8rem, 4cqh, 1.15rem)';
    case 'icon':
      return 'clamp(1.5rem, 12cqh, 4rem)';
    default:
      return '1rem';
  }
}

export function maxLinesForType(type: SlotDefinition['type'], itemCount = 1): number {
  switch (type) {
    case 'heading':
      return 3;
    case 'subheading':
      return 2;
    case 'body':
      return 12;
    case 'quote':
      return 6;
    case 'list':
      return Math.min(itemCount, 10);
    default:
      return 4;
  }
}

export function isOverlayText(slot: SlotDefinition): boolean {
  return resolveZIndex(slot) >= 10 && ['heading', 'subheading', 'body', 'quote'].includes(slot.type);
}

export const overlayTextStyle: CSSProperties = {
  textShadow: '0 2px 16px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.4)',
};
