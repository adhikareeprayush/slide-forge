import { defineSlide } from '@slideforge/sdk';
import { REGIONS } from '@slideforge/schema';

export default defineSlide({
  id: 'data-chart',
  name: 'Data Chart',
  version: '1.0.0',
  category: 'data',
  author: 'core',
  slots: [
    {
      id: 'heading',
      type: 'heading',
      required: true,
      maxLength: 60,
      position: REGIONS.title,
      defaultValue: 'Growth Metrics',
    },
    {
      id: 'chart',
      type: 'chart',
      required: true,
      position: REGIONS.chart,
    },
    {
      id: 'insight',
      type: 'body',
      required: false,
      maxLength: 200,
      position: REGIONS.chartInsight,
      defaultValue: 'Key insight: highlight the most important trend or takeaway from the data.',
    },
  ],
  aiHints: {
    headingStyle: 'concise',
    bodyStyle: 'paragraph',
    tone: 'professional',
  },
  thumbnail:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#fff"/><rect x="1" y="1" width="8" height="0.8" fill="#334155"/><rect x="1.5" y="6" width="1.5" height="2" fill="#6366f1"/><rect x="3.5" y="4.5" width="1.5" height="3.5" fill="#6366f1"/><rect x="5.5" y="3" width="1.5" height="5" fill="#6366f1"/><rect x="7.5" y="2" width="1.5" height="6" fill="#6366f1"/><rect x="10" y="2.5" width="5" height="5.5" fill="#f1f5f9"/></svg>',
  tags: ['data', 'chart', 'metrics'],
});
