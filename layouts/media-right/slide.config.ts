import { defineSlide } from '@slideforge/sdk';
import { REGIONS } from '@slideforge/schema';

export default defineSlide({
  id: 'media-right',
  name: 'Media Right',
  version: '1.0.0',
  category: 'media',
  author: 'core',
  slots: [
    {
      id: 'heading',
      type: 'heading',
      required: true,
      maxLength: 60,
      position: { x: '6%', y: '6%', w: '44%', h: '16%' },
      defaultValue: 'Key Message',
    },
    {
      id: 'body',
      type: 'body',
      required: true,
      maxLength: 300,
      position: REGIONS.textLeftBody,
      defaultValue: 'Supporting text that explains the visual on the right. Keep it focused and actionable.',
    },
    {
      id: 'image',
      type: 'image',
      required: false,
      imageStyle: 'photographic',
      position: REGIONS.mediaRight,
      zIndex: 5,
      padding: 'none',
    },
  ],
  aiHints: {
    headingStyle: 'concise',
    bodyStyle: 'paragraph',
    imageKeywords: ['professional', 'relevant to content'],
  },
  thumbnail:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#fff"/><rect x="1" y="1" width="6" height="1" fill="#334155"/><rect x="1" y="2.5" width="6" height="5" fill="#f1f5f9"/><rect x="8.5" y="1" width="6.5" height="7" fill="#c7d2fe" rx="0.3"/></svg>',
  tags: ['media', 'image', 'split'],
});
