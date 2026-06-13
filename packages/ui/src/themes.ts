import type { SlideTheme } from './SlideCanvas';

export interface DeckThemePreset extends SlideTheme {
  id: string;
  name: string;
  displayFont?: string;
}

export const DECK_THEMES: Record<string, DeckThemePreset> = {
  default: {
    id: 'default',
    name: 'Default',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    displayFont: "'Instrument Serif', Georgia, serif",
    background: '#f4efe6',
    color: '#1a1814',
    primaryColor: '#3d9b8f',
    spacing: '1rem',
    borderRadius: '0.25rem',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    background: '#ffffff',
    color: '#111111',
    primaryColor: '#111111',
    spacing: '0.75rem',
    borderRadius: '0',
  },
  bold: {
    id: 'bold',
    name: 'Bold',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    displayFont: "'Instrument Serif', Georgia, serif",
    background: '#d4a054',
    color: '#0c0b0a',
    primaryColor: '#0c0b0a',
    spacing: '1.25rem',
    borderRadius: '0',
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    background: '#0c0b0a',
    color: '#f4efe6',
    primaryColor: '#d4a054',
    spacing: '1rem',
    borderRadius: '0.5rem',
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    background: '#f0f4f8',
    color: '#1e293b',
    primaryColor: '#2563eb',
    spacing: '1rem',
    borderRadius: '0.375rem',
  },
};

export function getDeckTheme(id: string): DeckThemePreset {
  return DECK_THEMES[id] ?? DECK_THEMES.default!;
}
