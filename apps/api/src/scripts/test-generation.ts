#!/usr/bin/env tsx
/**
 * End-to-end test: NVIDIA AI generation pipeline.
 * Usage: pnpm --filter api test:generation
 */
import '../load-env';

const API = process.env.API_URL ?? 'http://localhost:4000';
const WS = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000';

async function main() {
  console.log('AI provider:', process.env.AI_PROVIDER);
  console.log('NVIDIA key set:', !!process.env.NVIDIA_API_KEY);

  const health = await fetch(`${API}/health`).then((r) => r.json());
  console.log('API health:', health);

  const body = {
    topic: 'The future of open-source AI tools for developers',
    options: { tone: 'professional', slideCount: 3 },
  };

  console.log('\nStarting generation…', body);
  const startRes = await fetch(`${API}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Generate failed ${startRes.status}: ${err}`);
  }

  const { deckId, jobId } = (await startRes.json()) as { deckId: string; jobId: string };
  console.log('Job:', jobId, 'Deck:', deckId);

  await waitForCompletion(jobId, deckId);

  const deck = (await fetch(`${API}/api/decks/${deckId}`).then((r) => r.json())) as {
    title: string;
    slides?: { position: number; layoutId: string; slotData?: Record<string, unknown> }[];
  };
  console.log('\nDeck title:', deck.title);
  console.log('Slides:', deck.slides?.length);
  for (const slide of deck.slides ?? []) {
    const filled = Object.keys(slide.slotData ?? {}).length;
    const images = Object.entries(slide.slotData ?? {}).filter(
      ([, v]) => typeof v === 'string' && (v.startsWith('http') || v.includes('/images/')),
    );
    console.log(
      `  - slide ${slide.position + 1}: ${slide.layoutId} (${filled} slots, ${images.length} images)`,
    );
  }

  console.log('\n✓ Generation test passed');
}

async function waitForCompletion(jobId: string, deckId: string): Promise<void> {
  const maxWait = 180_000;
  const start = Date.now();

  const wsDone = new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(`${WS}/ws/generate/${jobId}`);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('ws-timeout'));
    }, maxWait);

    ws.onmessage = (ev) => {
      const event = JSON.parse(ev.data as string) as { type: string; message?: string };
      console.log('  event:', event.type, 'message' in event ? event.message : '');
      if (event.type === 'generation_complete') {
        clearTimeout(timeout);
        ws.close();
        resolve();
      }
      if (event.type === 'error') {
        clearTimeout(timeout);
        ws.close();
        reject(new Error(event.message ?? 'Generation error'));
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('ws-error'));
    };
  });

  try {
    await wsDone;
    return;
  } catch {
    console.log('  (WebSocket unavailable — polling status…)');
  }

  while (Date.now() - start < maxWait) {
    const status = (await fetch(`${API}/api/generate/${jobId}/status`).then((r) => r.json())) as {
      status: string;
      error?: string;
    };
    if (status.status === 'completed') return;
    if (status.status === 'failed') throw new Error(status.error ?? 'Generation failed');
    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error('Generation timed out after 180s');
}

main().catch((err) => {
  console.error('\n✗ Generation test failed:', err.message);
  process.exit(1);
});
