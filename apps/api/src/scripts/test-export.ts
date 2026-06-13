#!/usr/bin/env tsx
import '../load-env';
import { runExport } from '../services/export';

const DEMO_DECK_ID = '00000000-0000-4000-a000-000000000001';

async function main() {
  console.log('Testing export for demo deck:', DEMO_DECK_ID);

  for (const format of ['pptx', 'pdf', 'html'] as const) {
    const buffer = await runExport(DEMO_DECK_ID, format);
    console.log(`  ${format}: ${buffer.length} bytes`);
    if (buffer.length < 100) throw new Error(`${format} export too small`);
  }

  console.log('\n✓ Export test passed');
}

main().catch((err) => {
  console.error('\n✗ Export test failed:', err.message);
  process.exit(1);
});
