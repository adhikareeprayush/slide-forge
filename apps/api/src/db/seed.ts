import '../load-env';
import { eq } from 'drizzle-orm';
import { db } from './index';
import { decks, slides } from './schema';

export const DEMO_DECK_ID = '00000000-0000-4000-a000-000000000001';

const demoSlides = [
  {
    layoutId: 'title-hero',
    position: 0,
    slotData: {
      title: 'SlideForge',
      subtitle: 'Open-source AI presentations powered by NVIDIA NIM',
    },
  },
  {
    layoutId: 'bullet-list',
    position: 1,
    slotData: {
      heading: 'Why SlideForge?',
      bullets: [
        'Free & open source — no vendor lock-in',
        'NVIDIA NIM for text and image generation',
        'Extensible slide layout SDK for developers',
        'One-command self-hosting with Docker',
        'Community-driven layout registry',
      ],
    },
  },
  {
    layoutId: 'two-column',
    position: 2,
    slotData: {
      heading: 'Built for Everyone',
      'column-left':
        'For presenters: describe your topic and get a polished deck in seconds. Edit inline, swap layouts, export to PPTX.',
      'column-right':
        'For developers: define reusable layouts with a typed SDK. Contribute to the community registry via pull request.',
    },
  },
  {
    layoutId: 'media-right',
    position: 3,
    slotData: {
      heading: 'Contextual Visuals',
      body: 'Images are generated semantically from slide content — not decorative stock photos. Each image slot understands the surrounding text.',
    },
  },
  {
    layoutId: 'data-chart',
    position: 4,
    slotData: {
      heading: 'Community Growth',
      chart: JSON.stringify({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        values: [120, 340, 580, 920, 1400],
      }),
      insight: 'Star count and contributor activity growing steadily since open-source launch.',
    },
  },
  {
    layoutId: 'quote-full',
    position: 5,
    slotData: {
      quote: '"The best presentations don\'t just inform — they inspire action."',
      attribution: '— SlideForge Design Principles',
    },
  },
  {
    layoutId: 'closing-cta',
    position: 6,
    slotData: {
      statement: 'Start building with SlideForge',
      cta: 'github.com/slideforge/slideforge',
      icon: '→',
    },
  },
];

export async function seedDemoDeck(): Promise<void> {
  const existing = await db.select().from(decks).where(eq(decks.id, DEMO_DECK_ID)).limit(1);

  if (existing.length > 0) {
    console.log('Demo deck already exists, skipping seed.');
    return;
  }

  await db.insert(decks).values({
    id: DEMO_DECK_ID,
    title: 'SlideForge Demo Deck',
    theme: 'default',
    status: 'ready',
  });

  await db.insert(slides).values(
    demoSlides.map((s) => ({
      deckId: DEMO_DECK_ID,
      layoutId: s.layoutId,
      position: s.position,
      slotData: s.slotData,
    }))
  );

  console.log(`Seeded demo deck: ${DEMO_DECK_ID}`);
  console.log(`Preview at: http://localhost:3000/preview/${DEMO_DECK_ID}`);
}

seedDemoDeck()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
