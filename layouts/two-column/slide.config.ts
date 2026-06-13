import { defineSlide } from '@slideforge/sdk';
import { REGIONS } from '@slideforge/schema';

export default defineSlide({
  id: 'two-column',
  name: 'Two Column',
  version: '1.0.0',
  category: 'split',
  author: 'core',
  slots: [
    {
      id: 'heading',
      type: 'heading',
      required: true,
      maxLength: 60,
      position: REGIONS.title,
      defaultValue: 'Section Heading',
    },
    {
      id: 'column-left',
      type: 'body',
      required: true,
      maxLength: 400,
      position: REGIONS.colLeft,
      defaultValue: 'Left column content. Explain the first key point in detail.',
    },
    {
      id: 'divider',
      type: 'divider',
      required: false,
      position: REGIONS.colDivider,
      zIndex: 8,
      padding: 'none',
    },
    {
      id: 'column-right',
      type: 'body',
      required: true,
      maxLength: 400,
      position: REGIONS.colRight,
      defaultValue: 'Right column content. Explain the second key point in detail.',
    },
  ],
  aiHints: {
    headingStyle: 'concise',
    bodyStyle: 'paragraph',
    tone: 'professional',
  },
  thumbnail:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#f8fafc"/><rect x="1" y="1" width="14" height="1" fill="#334155"/><rect x="1" y="2.5" width="6" height="5.5" fill="#e2e8f0"/><rect x="9" y="2.5" width="6" height="5.5" fill="#e2e8f0"/></svg>',
  tags: ['split', 'columns', 'comparison'],
});
