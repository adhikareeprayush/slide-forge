import type { ValidatedSlide } from '@slideforge/schema';

export type ExportFormat = 'pptx' | 'pdf' | 'html';

export interface ExportSlide {
  id: string;
  layoutId: string;
  position: number;
  slotData: Record<string, string | string[]>;
  layout: ValidatedSlide;
}

export interface ExportDeck {
  id: string;
  title: string;
  theme: string;
  slides: ExportSlide[];
}

export interface ExportJobStatus {
  id: string;
  deckId: string;
  format: ExportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
  createdAt: string;
}

export interface ThemeColors {
  background: string;
  color: string;
  primaryColor: string;
  fontFamily: string;
}

export function resolveTheme(themeId: string): ThemeColors {
  const themes: Record<string, ThemeColors> = {
    default: { background: '#f4efe6', color: '#1a1814', primaryColor: '#3d9b8f', fontFamily: 'DM Sans' },
    minimal: { background: '#ffffff', color: '#111111', primaryColor: '#111111', fontFamily: 'DM Sans' },
    bold: { background: '#d4a054', color: '#0c0b0a', primaryColor: '#0c0b0a', fontFamily: 'DM Sans' },
    dark: { background: '#0c0b0a', color: '#f4efe6', primaryColor: '#d4a054', fontFamily: 'DM Sans' },
    corporate: { background: '#f0f4f8', color: '#1e293b', primaryColor: '#2563eb', fontFamily: 'DM Sans' },
  };
  return themes[themeId] ?? themes.default!;
}
