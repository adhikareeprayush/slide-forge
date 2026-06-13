import { defineSlide } from '@slideforge/sdk';
import { REGIONS } from '@slideforge/schema';

export default defineSlide({
  id: 'bullet-list',
  name: 'Bullet List',
  version: '1.0.0',
  category: 'content',
  author: 'core',
  slots: [
    {
      id: 'heading',
      type: 'heading',
      required: true,
      maxLength: 60,
      position: REGIONS.title,
      defaultValue: 'Key Points',
    },
    {
      id: 'bullets',
      type: 'list',
      required: true,
      position: REGIONS.body,
    },
  ],
  aiHints: {
    headingStyle: 'concise',
    bodyStyle: 'bullet',
    tone: 'professional',
  },
  thumbnail:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#fff"/><rect x="1.5" y="1.5" width="8" height="1" fill="#334155"/><circle cx="2" cy="3.5" r="0.3" fill="#6366f1"/><rect x="2.8" y="3.3" width="6" height="0.4" fill="#94a3b8"/><circle cx="2" cy="4.8" r="0.3" fill="#6366f1"/><rect x="2.8" y="4.6" width="5" height="0.4" fill="#94a3b8"/><circle cx="2" cy="6.1" r="0.3" fill="#6366f1"/><rect x="2.8" y="5.9" width="7" height="0.4" fill="#94a3b8"/></svg>',
  tags: ['content', 'list', 'bullets'],
});
