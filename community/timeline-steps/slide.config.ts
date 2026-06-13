import { defineSlide } from '@slideforge/sdk';
import { REGIONS } from '@slideforge/schema';

export default defineSlide({
  id: 'timeline-steps',
  name: 'Timeline Steps',
  version: '1.0.0',
  category: 'content',
  author: 'community',
  slots: [
    {
      id: 'title',
      type: 'heading',
      required: true,
      maxLength: 60,
      position: REGIONS.title,
      defaultValue: 'Our Journey',
    },
    {
      id: 'divider',
      type: 'divider',
      required: false,
      position: { x: '6%', y: '20%', w: '88%', h: '0.4%' },
      zIndex: 8,
      padding: 'none',
    },
    {
      id: 'step1',
      type: 'subheading',
      required: true,
      maxLength: 40,
      position: { x: '6%', y: '24%', w: '27%', h: '10%' },
      defaultValue: 'Phase 1',
    },
    {
      id: 'detail1',
      type: 'body',
      required: false,
      maxLength: 120,
      position: { x: '6%', y: '36%', w: '27%', h: '52%' },
      defaultValue: 'Describe the first milestone.',
    },
    {
      id: 'step2',
      type: 'subheading',
      required: true,
      maxLength: 40,
      position: { x: '36.5%', y: '24%', w: '27%', h: '10%' },
      defaultValue: 'Phase 2',
    },
    {
      id: 'detail2',
      type: 'body',
      required: false,
      maxLength: 120,
      position: { x: '36.5%', y: '36%', w: '27%', h: '52%' },
      defaultValue: 'Describe the second milestone.',
    },
    {
      id: 'step3',
      type: 'subheading',
      required: true,
      maxLength: 40,
      position: { x: '67%', y: '24%', w: '27%', h: '10%' },
      defaultValue: 'Phase 3',
    },
    {
      id: 'detail3',
      type: 'body',
      required: false,
      maxLength: 120,
      position: { x: '67%', y: '36%', w: '27%', h: '52%' },
      defaultValue: 'Describe the third milestone.',
    },
  ],
  aiHints: {
    headingStyle: 'concise',
    tone: 'professional',
    imageKeywords: ['timeline', 'progress', 'milestones'],
  },
  thumbnail:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#f4efe6"/><rect x="1" y="1.5" width="6" height="0.8" fill="#0c0b0a"/><line x1="1" y1="4" x2="15" y2="4" stroke="#d4a054" stroke-width="0.15"/><rect x="1.5" y="5" width="3" height="0.5" fill="#3d9b8f"/><rect x="6.5" y="5" width="3" height="0.5" fill="#3d9b8f"/><rect x="11.5" y="5" width="3" height="0.5" fill="#3d9b8f"/></svg>',
  tags: ['timeline', 'steps', 'process'],
});
