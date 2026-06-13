import { describe, it, expect } from 'vitest';
import { validateSlide } from './validate';
import type { SlideDefinition } from './types';

const validSlide: SlideDefinition = {
  id: 'test-layout',
  name: 'Test Layout',
  version: '1.0.0',
  category: 'content',
  author: 'core',
  slots: [
    {
      id: 'heading',
      type: 'heading',
      required: true,
      maxLength: 60,
      position: { x: '5%', y: '5%', w: '90%', h: '15%' },
    },
  ],
  aiHints: { tone: 'professional' },
  thumbnail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9"/></svg>',
};

describe('validateSlide', () => {
  it('accepts a valid SlideDefinition', () => {
    const result = validateSlide(validSlide);
    expect(result._validated).toBe(true);
    expect(result.id).toBe('test-layout');
    expect(result.slots).toHaveLength(1);
  });

  it('rejects invalid id format', () => {
    expect(() => validateSlide({ ...validSlide, id: 'Invalid_ID' })).toThrow(
      /Invalid SlideDefinition/
    );
  });

  it('rejects invalid semver version', () => {
    expect(() => validateSlide({ ...validSlide, version: 'v1' })).toThrow(/version must be semver/);
  });

  it('rejects empty slots array', () => {
    expect(() => validateSlide({ ...validSlide, slots: [] })).toThrow(/Invalid SlideDefinition/);
  });

  it('rejects invalid slot id', () => {
    const bad = {
      ...validSlide,
      slots: [{ ...validSlide.slots[0]!, id: 'Bad Slot' }],
    };
    expect(() => validateSlide(bad)).toThrow(/kebab-case/);
  });

  it('rejects missing required fields', () => {
    const { name: _, ...incomplete } = validSlide;
    expect(() => validateSlide(incomplete)).toThrow(/Invalid SlideDefinition/);
  });

  it('rejects duplicate slot ids', () => {
    const dup = {
      ...validSlide,
      slots: [validSlide.slots[0]!, { ...validSlide.slots[0]!, id: 'heading' }],
    };
    expect(() => validateSlide(dup)).toThrow(/duplicate slot id/);
  });

  it('rejects slot positions that overflow canvas', () => {
    const overflow = {
      ...validSlide,
      slots: [
        {
          ...validSlide.slots[0]!,
          position: { x: '90%', y: '5%', w: '20%', h: '15%' },
        },
      ],
    };
    expect(() => validateSlide(overflow)).toThrow(/overflows right/);
  });

  it('rejects invalid position units', () => {
    const badUnit = {
      ...validSlide,
      slots: [
        {
          ...validSlide.slots[0]!,
          position: { x: '5em', y: '5%', w: '90%', h: '15%' },
        },
      ],
    };
    expect(() => validateSlide(badUnit)).toThrow(/must be a number with % or px/);
  });
});
