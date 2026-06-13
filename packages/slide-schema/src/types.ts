export type SlotType =
  | 'heading'
  | 'subheading'
  | 'body'
  | 'list'
  | 'image'
  | 'quote'
  | 'chart'
  | 'icon'
  | 'divider';

export type ImageStyle =
  | 'photographic'
  | 'abstract'
  | 'diagram'
  | 'illustration'
  | 'icon';

export type SlideCategory =
  | 'title'
  | 'content'
  | 'media'
  | 'split'
  | 'data'
  | 'quote'
  | 'closing';

export interface SlotPosition {
  x: string;
  y: string;
  w: string;
  h: string;
}

export interface SlotDefinition {
  id: string;
  type: SlotType;
  required: boolean;
  maxLength?: number;
  imageStyle?: ImageStyle;
  position: SlotPosition;
  defaultValue?: string;
  /** Stacking order — backgrounds use 0, content defaults to 10. */
  zIndex?: number;
  /** Override slot padding. `none` removes padding; preset sizes use theme spacing. */
  padding?: 'none' | 'sm' | 'md' | 'lg' | string;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
}

export interface AIHintConfig {
  headingStyle?: 'concise' | 'descriptive' | 'question';
  bodyStyle?: 'paragraph' | 'bullet' | 'numbered';
  tone?: 'professional' | 'casual' | 'bold';
  imageKeywords?: string[];
}

export interface SlideDefinition {
  id: string;
  name: string;
  version: string;
  category: SlideCategory;
  author: string;
  slots: SlotDefinition[];
  aiHints: AIHintConfig;
  thumbnail: string;
  tags?: string[];
}

export interface ValidatedSlide extends SlideDefinition {
  _validated: true;
}