import { defineSlide } from '@slideforge/sdk';
import { REGIONS } from '@slideforge/schema';

export default defineSlide({
  id: 'closing-cta',
  name: 'Closing CTA',
  version: '1.0.0',
  category: 'closing',
  author: 'core',
  slots: [
    {
      id: 'statement',
      type: 'heading',
      required: true,
      maxLength: 80,
      position: REGIONS.ctaTitle,
      align: 'center',
      valign: 'middle',
      defaultValue: 'Ready to get started?',
    },
    {
      id: 'cta',
      type: 'subheading',
      required: true,
      maxLength: 120,
      position: REGIONS.ctaSub,
      align: 'center',
      defaultValue: 'Visit slideforge.dev to learn more',
    },
    {
      id: 'icon',
      type: 'icon',
      required: false,
      position: REGIONS.ctaIcon,
      align: 'center',
      valign: 'middle',
      defaultValue: '→',
    },
  ],
  aiHints: {
    headingStyle: 'question',
    tone: 'bold',
  },
  thumbnail:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#1e1b4b"/><rect x="3" y="2.5" width="10" height="1.2" fill="#e0e7ff"/><rect x="4" y="4.5" width="8" height="0.7" fill="#a5b4fc"/><circle cx="8" cy="6.8" r="0.6" fill="#6366f1"/></svg>',
  tags: ['closing', 'cta', 'ending'],
});
