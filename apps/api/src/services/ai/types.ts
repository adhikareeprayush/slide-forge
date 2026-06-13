import type { ImageStyle, SlotDefinition } from '@slideforge/schema';

export type SlotContent = Record<string, string | string[]>;

export interface OutlineSlide {
  layoutId: string;
  brief: string;
  title?: string;
}

export interface GeneratedSlide {
  layoutId: string;
  brief: string;
  title?: string;
  slots: SlotContent;
}

export interface FullDeckGeneration {
  title: string;
  slides: GeneratedSlide[];
}

export interface AIProvider {
  /** Single-call full deck generation (one LLM prompt per presentation). */
  generateFullDeck(
    topic: string,
    slideCount: number,
    tone: string,
    availableLayouts: LayoutForPrompt[],
  ): Promise<FullDeckGeneration>;

  generateOutline(
    topic: string,
    slideCount: number,
    tone: string,
    availableLayouts: { id: string; category: string; name: string }[],
  ): Promise<OutlineSlide[]>;

  generateSlotContent(
    brief: string,
    slots: SlotDefinition[],
    tone: string,
  ): Promise<SlotContent>;

  generateImagePrompt(
    slideContent: SlotContent,
    imageStyle: ImageStyle,
    brief: string,
  ): Promise<string>;

  generateImage(prompt: string, style: ImageStyle): Promise<Buffer>;
}

export interface LayoutForPrompt {
  id: string;
  category: string;
  name: string;
  slots: {
    id: string;
    type: string;
    required: boolean;
    maxLength?: number;
    imageStyle?: string;
  }[];
}

export interface GenerationOptions {
  slideCount?: number;
  tone?: 'professional' | 'casual' | 'bold';
  theme?: string;
}
