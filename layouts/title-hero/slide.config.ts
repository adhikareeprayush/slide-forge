import { defineSlide } from '@slideforge/sdk';
import { REGIONS } from '@slideforge/schema';

export default defineSlide({
  id: 'title-hero',
  name: 'Title Hero',
  version: '1.0.0',
  category: 'title',
  author: 'core',
  slots: [
    {
      id: 'background',
      type: 'image',
      required: false,
      imageStyle: 'photographic',
      position: REGIONS.full,
      zIndex: 0,
      padding: 'none',
    },
    {
      id: 'title',
      type: 'heading',
      required: true,
      maxLength: 80,
      position: REGIONS.heroTitle,
      zIndex: 10,
      align: 'center',
      valign: 'middle',
      defaultValue: 'Your Presentation Title',
    },
    {
      id: 'subtitle',
      type: 'subheading',
      required: false,
      maxLength: 120,
      position: REGIONS.heroSubtitle,
      zIndex: 10,
      align: 'center',
      defaultValue: 'A compelling subtitle goes here',
    },
  ],
  aiHints: {
    headingStyle: 'concise',
    tone: 'bold',
    imageKeywords: ['abstract', 'professional', 'gradient'],
  },
  thumbnail:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#1e1b4b"/><rect x="1" y="3" width="10" height="1.2" fill="#e0e7ff"/><rect x="1" y="4.5" width="7" height="0.6" fill="#a5b4fc" opacity="0.7"/></svg>',
  tags: ['title', 'hero', 'opening'],
});
