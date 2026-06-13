import { defineSlide } from '@slideforge/sdk';
import { REGIONS } from '@slideforge/schema';

export default defineSlide({
  id: 'quote-full',
  name: 'Quote Full',
  version: '1.0.0',
  category: 'quote',
  author: 'core',
  slots: [
    {
      id: 'quote',
      type: 'quote',
      required: true,
      maxLength: 200,
      position: REGIONS.quote,
      align: 'center',
      valign: 'middle',
      defaultValue: '"The best way to predict the future is to invent it."',
    },
    {
      id: 'attribution',
      type: 'subheading',
      required: false,
      maxLength: 80,
      position: REGIONS.attribution,
      align: 'center',
      defaultValue: '— Alan Kay',
    },
  ],
  aiHints: {
    headingStyle: 'descriptive',
    tone: 'bold',
  },
  thumbnail:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#fafafa"/><rect x="2" y="3" width="0.3" height="3" fill="#6366f1"/><rect x="3" y="3.2" width="10" height="0.6" fill="#334155"/><rect x="3" y="4.2" width="8" height="0.6" fill="#334155"/><rect x="3" y="6.2" width="5" height="0.4" fill="#94a3b8"/></svg>',
  tags: ['quote', 'testimonial'],
});
