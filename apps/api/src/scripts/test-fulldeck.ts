import '../load-env';
import { generateFullDeck, hydrateImageSlots, sanitizeSlotContent } from '../services/prompt';
import { getLayout, loadLayoutRegistry } from '../services/layout-registry';

async function main() {
  await loadLayoutRegistry();
  const t0 = Date.now();
  console.log('Testing single-prompt generation...');

  const deck = await generateFullDeck('The future of open-source AI tools', 3, 'professional');
  console.log(`AI response in ${Date.now() - t0}ms`);
  console.log('Title:', deck.title);
  console.log('Slides:', deck.slides.length);

  for (const slide of deck.slides) {
    const layout = getLayout(slide.layoutId);
    if (!layout) {
      console.log('  - missing layout:', slide.layoutId);
      continue;
    }
    let slots = sanitizeSlotContent(layout, slide.slots);
    const t1 = Date.now();
    slots = await hydrateImageSlots(layout, slots, slide.brief);
    const imgSlots = layout.slots.filter((s) => s.type === 'image');
    for (const s of imgSlots) {
      console.log(`  - ${slide.layoutId} image [${s.id}]:`, (slots[s.id] as string)?.slice(0, 80));
    }
    console.log(`    images resolved in ${Date.now() - t1}ms`);
  }

  console.log(`\n✓ Total time: ${Date.now() - t0}ms`);
}

main().catch((err) => {
  console.error('✗ Failed:', err.message ?? err);
  process.exit(1);
});
