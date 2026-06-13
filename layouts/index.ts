import type { ValidatedSlide } from '@slideforge/schema';
import titleHero from './title-hero/slide.config';
import twoColumn from './two-column/slide.config';
import mediaRight from './media-right/slide.config';
import bulletList from './bullet-list/slide.config';
import quoteFull from './quote-full/slide.config';
import dataChart from './data-chart/slide.config';
import closingCta from './closing-cta/slide.config';

export const builtinLayouts: Record<string, ValidatedSlide> = {
  'title-hero': titleHero,
  'two-column': twoColumn,
  'media-right': mediaRight,
  'bullet-list': bulletList,
  'quote-full': quoteFull,
  'data-chart': dataChart,
  'closing-cta': closingCta,
};

export const builtinLayoutList = Object.values(builtinLayouts);

export function getLayout(id: string): ValidatedSlide | undefined {
  return builtinLayouts[id];
}

export {
  titleHero,
  twoColumn,
  mediaRight,
  bulletList,
  quoteFull,
  dataChart,
  closingCta,
};
