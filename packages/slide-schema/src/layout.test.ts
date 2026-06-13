import { describe, it, expect } from 'vitest';
import { validateSlotPosition, REGIONS, defaultZIndex } from './layout';

describe('validateSlotPosition', () => {
  it('accepts slots within canvas bounds', () => {
    const issues = validateSlotPosition({ id: 'title', position: REGIONS.title });
    expect(issues).toHaveLength(0);
  });

  it('rejects slots that overflow the right edge', () => {
    const issues = validateSlotPosition({
      id: 'bad',
      position: { x: '80%', y: '10%', w: '30%', h: '20%' },
    });
    expect(issues.some((i) => i.message.includes('overflows right'))).toBe(true);
  });

  it('rejects slots that overflow the bottom edge', () => {
    const issues = validateSlotPosition({
      id: 'bad',
      position: { x: '10%', y: '85%', w: '20%', h: '20%' },
    });
    expect(issues.some((i) => i.message.includes('overflows bottom'))).toBe(true);
  });

  it('rejects zero-height slots', () => {
    const issues = validateSlotPosition({
      id: 'bad',
      position: { x: '10%', y: '10%', w: '20%', h: '0%' },
    });
    expect(issues.some((i) => i.message.includes('greater than 0'))).toBe(true);
  });
});

describe('defaultZIndex', () => {
  it('puts full-bleed images at z-index 0', () => {
    expect(defaultZIndex('image', REGIONS.full)).toBe(0);
  });

  it('puts text content at z-index 10', () => {
    expect(defaultZIndex('heading', REGIONS.title)).toBe(10);
  });
});
