import { validateSlide } from '@slideforge/schema';
import type { SlideDefinition, ValidatedSlide } from '@slideforge/schema';

export function defineSlide(def: SlideDefinition): ValidatedSlide {
  return validateSlide(def);
}