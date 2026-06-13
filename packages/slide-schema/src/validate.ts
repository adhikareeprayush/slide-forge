import { z } from 'zod';
import type { SlideDefinition, ValidatedSlide } from './types';
import { validateSlotPosition } from './layout';

const SlotPositionSchema = z.object({
  x: z.string().regex(/^(\d+(?:\.\d+)?)(%|px)$/, 'must be a number with % or px unit'),
  y: z.string().regex(/^(\d+(?:\.\d+)?)(%|px)$/, 'must be a number with % or px unit'),
  w: z.string().regex(/^(\d+(?:\.\d+)?)(%|px)$/, 'must be a number with % or px unit'),
  h: z.string().regex(/^(\d+(?:\.\d+)?)(%|px)$/, 'must be a number with % or px unit'),
});

const SlotDefinitionSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slot id must be kebab-case'),
  type: z.enum(['heading','subheading','body','list','image','quote','chart','icon','divider']),
  required: z.boolean(),
  maxLength: z.number().optional(),
  imageStyle: z.enum(['photographic','abstract','diagram','illustration','icon']).optional(),
  position: SlotPositionSchema,
  defaultValue: z.string().optional(),
  zIndex: z.number().int().min(0).max(100).optional(),
  padding: z.union([z.enum(['none', 'sm', 'md', 'lg']), z.string()]).optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  valign: z.enum(['top', 'middle', 'bottom']).optional(),
});

const SlideDefinitionSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/, 'id must be kebab-case'),
  name: z.string().min(1).max(60),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'version must be semver'),
  category: z.enum(['title','content','media','split','data','quote','closing']),
  author: z.string().min(1),
  slots: z.array(SlotDefinitionSchema).min(1),
  aiHints: z.object({
    headingStyle: z.enum(['concise','descriptive','question']).optional(),
    bodyStyle: z.enum(['paragraph','bullet','numbered']).optional(),
    tone: z.enum(['professional','casual','bold']).optional(),
    imageKeywords: z.array(z.string()).optional(),
  }),
  thumbnail: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

export function validateSlide(def: unknown): ValidatedSlide {
  const result = SlideDefinitionSchema.safeParse(def);
  if (!result.success) {
    const messages = result.error.errors.map(
      (e) => `  ${e.path.join('.')}: ${e.message}`
    );
    throw new Error(`Invalid SlideDefinition:\n${messages.join('\n')}`);
  }

  const slide = result.data as SlideDefinition;
  const errors: string[] = [];

  const ids = new Set<string>();
  for (const slot of slide.slots) {
    if (ids.has(slot.id)) {
      errors.push(`  slots: duplicate slot id "${slot.id}"`);
    }
    ids.add(slot.id);

    for (const issue of validateSlotPosition(slot)) {
      errors.push(`  slots.${issue.slotId}.${issue.field}: ${issue.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid SlideDefinition:\n${errors.join('\n')}`);
  }

  return { ...slide, _validated: true };
}