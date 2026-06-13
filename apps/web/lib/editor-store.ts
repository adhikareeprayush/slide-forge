import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ValidatedSlide } from '@slideforge/schema';
import type { Deck } from './api-client';

export interface EditorSlide {
  id: string;
  layoutId: string;
  position: number;
  slotData: Record<string, string | string[]>;
  layout: ValidatedSlide | null;
}

interface EditorSnapshot {
  title: string;
  theme: string;
  slides: EditorSlide[];
  activeIndex: number;
}

interface EditorState {
  deckId: string | null;
  title: string;
  theme: string;
  slides: EditorSlide[];
  activeIndex: number;
  past: EditorSnapshot[];
  future: EditorSnapshot[];
  dirty: boolean;
  loadDeck: (deck: Deck) => void;
  setActiveIndex: (index: number) => void;
  setTitle: (title: string) => void;
  setTheme: (theme: string) => void;
  updateSlot: (slideIndex: number, slotId: string, value: string | string[]) => void;
  setLayout: (slideIndex: number, layoutId: string, layout: ValidatedSlide) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  undo: () => void;
  redo: () => void;
  snapshot: () => void;
}

function capture(state: EditorState): EditorSnapshot {
  return {
    title: state.title,
    theme: state.theme,
    slides: structuredClone(state.slides),
    activeIndex: state.activeIndex,
  };
}

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    deckId: null,
    title: '',
    theme: 'default',
    slides: [],
    activeIndex: 0,
    past: [],
    future: [],
    dirty: false,

    loadDeck: (deck) =>
      set((s) => {
        s.deckId = deck.id;
        s.title = deck.title;
        s.theme = deck.theme;
        s.slides = deck.slides.map((sl) => ({
          id: sl.id,
          layoutId: sl.layoutId,
          position: sl.position,
          slotData: sl.slotData,
          layout: sl.layout,
        }));
        s.activeIndex = 0;
        s.past = [];
        s.future = [];
        s.dirty = false;
      }),

    setActiveIndex: (index) => set((s) => { s.activeIndex = index; }),

    setTitle: (title) =>
      set((s) => {
        s.past.push(capture(get()));
        s.future = [];
        s.title = title;
        s.dirty = true;
      }),

    setTheme: (theme) =>
      set((s) => {
        s.past.push(capture(get()));
        s.future = [];
        s.theme = theme;
        s.dirty = true;
      }),

    updateSlot: (slideIndex, slotId, value) =>
      set((s) => {
        const slide = s.slides[slideIndex];
        if (!slide) return;
        s.past.push(capture(get()));
        s.future = [];
        slide.slotData[slotId] = value;
        s.dirty = true;
      }),

    setLayout: (slideIndex, layoutId, layout) =>
      set((s) => {
        const slide = s.slides[slideIndex];
        if (!slide) return;
        s.past.push(capture(get()));
        s.future = [];
        slide.layoutId = layoutId;
        slide.layout = layout;
        s.dirty = true;
      }),

    reorderSlides: (fromIndex, toIndex) =>
      set((s) => {
        if (fromIndex === toIndex) return;
        s.past.push(capture(get()));
        s.future = [];
        const [moved] = s.slides.splice(fromIndex, 1);
        if (!moved) return;
        s.slides.splice(toIndex, 0, moved);
        s.slides.forEach((sl, i) => { sl.position = i; });
        s.activeIndex = toIndex;
        s.dirty = true;
      }),

    undo: () =>
      set((s) => {
        const prev = s.past.pop();
        if (!prev) return;
        s.future.push(capture(get()));
        s.title = prev.title;
        s.theme = prev.theme;
        s.slides = prev.slides;
        s.activeIndex = prev.activeIndex;
        s.dirty = true;
      }),

    redo: () =>
      set((s) => {
        const next = s.future.pop();
        if (!next) return;
        s.past.push(capture(get()));
        s.title = next.title;
        s.theme = next.theme;
        s.slides = next.slides;
        s.activeIndex = next.activeIndex;
        s.dirty = true;
      }),

    snapshot: () => set((s) => { s.dirty = false; }),
  })),
);
